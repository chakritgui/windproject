<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.4.0/leaflet.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.4.0/leaflet.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/Turf.js/6.5.0/turf.min.js"></script>
<link href="<?=asset('public/css/page.css')?>" rel="stylesheet">
<script src="<?=asset('public/js/user/mapConfig.js')?>"></script>
<script src="<?=asset('public/js/user/mapHelper.js')?>"></script>
<script>
    let windyAPI, map, poleLayerGroup;
    let DEFAULT_LEVEL = '100m';
    let options = { 
        lat: 16.5, 
        lon: 106.0, 
        zoom: 13, 
        preferCanvas: true,
        updateWhenZooming: true,
        updateWhenIdle: false,
        updateInterval: 16, 
        zoomAnimation: true,
        fadeAnimation: true,
        markerZoomAnimation: true,
        keepBuffer: 2, 
        zoomSnap: 0.25,
        zoomDelta: 0.5,
        wheelPxPerZoomLevel: 120,
        labels: false, 
        maxZoom: 14,
    };
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = src;
            s.async = true;
            s.onload = resolve;
            s.onerror = reject;
            document.body.appendChild(s);
        });
    }
    (async function initSystem() {
        try {
            const response = await fetch(`${BASE_URL}/api/configs.get`);
            const base64Data = await response.text();
            const config = JSON.parse(atob(base64Data));
            if (config.WINDY_KEY) {
                options.key = config.WINDY_KEY;
                DEFAULT_LEVEL = config.DEFAULT_LEVEL || '100m';
                await loadScript("https://api.windy.com/assets/map-forecast/libBoot.js");
                await Promise.all([
                    loadScript(`<?=asset('public/js/user/map.js')?>`),
                    loadScript(`<?=asset('public/js/user/report.js')?>`)
                ]); 
            }
        } catch (err) {
            console.error("Initialization error:", err);
        }
    })();
</script>
<link rel="stylesheet" href="<?=asset('public/css/map.css')?>">
<link rel="stylesheet" href="<?=asset('public/css/pole.css')?>">
<div id="globe-intro">
    <canvas id="globe-canvas"></canvas>
    <div id="globe-intro-text" data-i18n="initializing"></div>
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
    (function () {
        const canvas = document.getElementById('globe-canvas');
        const intro  = document.getElementById('globe-intro');
        if (!canvas || !intro) return;
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputEncoding = THREE.sRGBEncoding;
        const scene  = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 4;
        const sun = new THREE.DirectionalLight(0xffffff, 2);
        sun.position.set(5, 0, 5);
        scene.add(sun);
        scene.add(new THREE.AmbientLight(0x333333));
        const manager = new THREE.LoadingManager();
        const loader = new THREE.TextureLoader(manager);
        manager.onLoad = function () {
            intro.style.opacity = '1';
            requestAnimationFrame(animate);
        };
        const earthTex = loader.load(`${BASE_URL}/public/images/land_ocean_ice_cloud_2048_11zon.jpg`);
        earthTex.minFilter = THREE.LinearFilter; 
        const globe = new THREE.Mesh(
            new THREE.SphereGeometry(1, 32, 32),
            new THREE.MeshPhongMaterial({ map: earthTex })
        );
        scene.add(globe);
        const atmos = new THREE.Mesh(
            new THREE.SphereGeometry(1.1, 32, 32), 
            new THREE.ShaderMaterial({
                vertexShader: `
                    varying vec3 vNormal;
                    void main(){
                        vNormal = normalize(normalMatrix * normal);
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
                    }
                `,
                fragmentShader: `
                    varying vec3 vNormal;
                    void main(){
                        float intensity = pow(0.6 - dot(vNormal, vec3(0,0,1.0)), 3.0);
                        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0) * intensity;
                    }
                `,
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide,
                transparent: true
            })
        );
        scene.add(atmos);
        const createStarTexture = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 64; canvas.height = 64;
            const ctx = canvas.getContext('2d');
            const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
            grad.addColorStop(0, 'rgba(255,255,255,1)');
            grad.addColorStop(0.2, 'rgba(255,255,255,0.8)');
            grad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 64, 64);
            return new THREE.CanvasTexture(canvas);
        };
        function createStarField(count) {
            const geo = new THREE.BufferGeometry();
            const pos = new Float32Array(count * 3);
            for (let i = 0; i < count; i++) {
                const r = 80 + Math.random() * 120;
                const theta = Math.random() * 2 * Math.PI;
                const phi = Math.acos((Math.random() * 2) - 1);
                pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
                pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
                pos[i * 3 + 2] = r * Math.cos(phi);
            }
            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            return new THREE.Points(geo, new THREE.PointsMaterial({
                size: 0.7, map: createStarTexture(), transparent: true,
                blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
            }));
        }
        scene.add(createStarField(4000));
        const LAO_LAT = 18.2; const LAO_LON = 104.8;
        const targetRotY = (LAO_LON * Math.PI / 180) - (Math.PI / 2);
        const targetRotX = -(LAO_LAT * Math.PI / 180) * 0.85;
        const startRotY = targetRotY - Math.PI;
        globe.rotation.y = atmos.rotation.y = startRotY;
        let start = null, raf;
        const delayBeforeStart = 1000;
        function easeInOut(t) { return t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3) / 2; }
        function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
        function animate(ts) {
            if (!start) { start = ts + delayBeforeStart; }
            const t = (ts - start) / 1000;
            if (t > 4.2) {
                cleanup();
                return;
            }
            if (t >= 0 && t <= 3.2) {
                const pe = easeInOut(Math.min(t / 3.2, 1));
                const ry = startRotY + ((-targetRotY) - startRotY) * pe;
                const rx = targetRotX * pe;
                globe.rotation.y = atmos.rotation.y = ry;
                globe.rotation.x = atmos.rotation.x = rx;
                camera.position.z = 4 + (0.85 - 4) * pe;
            } else if (t > 3.2) {
                const pe = easeOut(Math.min((t - 3.2) / 1.0, 1));
                camera.position.z = 0.85 - (pe * 0.4);
                if (t > 3.7 && !intro.classList.contains('fade-out')) {
                    intro.classList.add('fade-out');
                }
            }
            renderer.render(scene, camera);
            raf = requestAnimationFrame(animate);
        }
        function cleanup() {
            cancelAnimationFrame(raf);
            document.dispatchEvent(new CustomEvent('globe:done'));
            intro.classList.add('fade-out');
            setTimeout(() => {
                if (window.disposeThreeJS) window.disposeThreeJS();
            }, 800);
        }
        window.disposeThreeJS = function () {
            cancelAnimationFrame(raf);
            scene.traverse(obj => {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) {
                    if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
                    else obj.material.dispose();
                }
            });
            renderer.dispose();
            if (canvas.parentNode) canvas.remove();
            window.disposeThreeJS = null;
        };
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    })();
</script>
<div id="wind-loading">
    <div class="wind-grid">
        <div class="wind-spacer"></div>
        <?php for($i=0; $i<120; $i++): ?>
            <?php if($i % 2 == 0): ?>
                <img src="<?=BASE_URL?>/public/images/logo.png" alt="logo">
            <?php else: ?>
                <img src="<?=BASE_URL?>/public/images/iwind.png" alt="wind">
            <?php endif; ?>
        <?php endfor; ?>
    </div>
</div>
<div id="area-panel" class="collapsed">
    <button id="area-panel-tab" onclick="toggleAreaPanel()">
        <span class="tab-arrow">
            <i class="fa fa-chevron-right"></i>
        </span>
    </button>
    <div class="ap-inner">
        <div class="ap-header"><i class="fa-solid fa-diagram-project me-2"></i><span data-i18n="project"></span></div>
        <div class="ap-list" id="ap-list">
            <div class="p-4 text-center">
                <div class="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
                <div class="small text-muted" data-i18n="loading"></div>
            </div>
        </div>
    </div>
</div>
<div id="windy"></div>
<div class="side-control-panel" id="sideControlPanel">
    <div class="scp-header">
        <div class="scp-title">
            <i class="fa-solid fa-sliders"></i>
            <span data-i18n="map_controls"></span>
        </div>
        <button class="btn-collapse d-none d-md-flex" id="toggleExpandBtn" onclick="togglePanelCollapse()">
            <i class="fa-solid fa-chevron-down"></i>
        </button>
    </div>
    <div class="scp-body" id="scpBody">
        <div class="scp-section">
            <div class="control-row">
                <div class="ctrl-label">
                    <i class="fa-solid fa-fan wind-icon-anim" id="wind-status-icon"></i>
                    <span data-i18n="show_wind_values"></span>
                </div>
                <label class="tog">
                    <input type="checkbox" id="toggle-wind-values">
                    <span class="tog-track"></span>
                </label>
            </div>
            <div class="control-row">
                <div class="ctrl-label">
                    <i class="fa-solid fa-crosshairs"></i>
                    <span data-i18n="focus_mode"></span>
                </div>
                <label class="tog">
                    <input type="checkbox" id="toggle-focus">
                    <span class="tog-track"></span>
                </label>
            </div>
            <div class="control-row">
                <div class="ctrl-label">
                    <i class="fa-solid fa-up-right-and-down-left-from-center"></i>
                    <span data-i18n="reset_view"></span>
                </div>
                <button class="btn-reset-view" onclick="resetView()">
                    <i class="fa-solid fa-up-right-and-down-left-from-center"></i>
                </button>
            </div>
        </div>
        <div class="scp-section">
            <div class="control-row">
                <div class="ctrl-label">
                    <i class="fas fa-broadcast-tower"></i>
                    <span data-i18n="wind_measurement_equipment"></span>
                </div>
                <label class="tog">
                    <input class="equipment-switch" type="checkbox" id="toggle-equipment">
                    <span class="tog-track"></span>
                </label>
            </div>
            <div class="control-row">
                <div class="ctrl-label">
                    <i class="bi bi-fan"></i>
                    <span data-i18n="windturbine"></span>
                </div>
                <label class="tog">
                    <input class="windturbine-switch" type="checkbox" id="toggle-windturbine">
                    <span class="tog-track"></span>
                </label>
            </div>
            <div class="control-row">
                <div class="ctrl-label">
                    <i class="fa-solid fa-wind"></i>
                    <span data-i18n="wind_animation"></span>
                </div>
                <label class="tog">
                    <input class="animation-switch" type="checkbox" id="toggle-animation">
                    <span class="tog-track"></span>
                </label>
            </div>
            <div class="control-row">
                <div class="ctrl-label">
                    <i class="fa-solid fa-location-dot"></i>
                    <span data-i18n="show_place_label"></span>
                </div>
                <label class="tog">
                    <input class="custom-switch" type="checkbox" id="toggle-label">
                    <span class="tog-track"></span>
                </label>
            </div>
        </div>
        <div class="scp-section">
            <div class="map-mode-wrap">
                <div class="map-mode-card" id="mapModeWind" onclick="setMapMode('wind')">
                    <img src="<?=BASE_URL?>/public/images/wind-thumb.jpg" alt="Satellite view" class="thumb-sat">
                    <div class="mode-check"><i class="fa-solid fa-check"></i></div>
                    <div class="mode-label">
                        <i class="fa-solid fa-wind"></i> <span data-i18n="wind"></span>
                    </div>
                </div>
                <div class="map-mode-card" id="mapModeSat" onclick="setMapMode('satellite')">
                    <img src="<?=BASE_URL?>/public/images/satellite-thumb.jpg" alt="Satellite view" class="thumb-sat">
                    <div class="mode-check"><i class="fa-solid fa-check"></i></div>
                    <div class="mode-label">
                        <i class="fa-solid fa-earth-asia"></i> <span data-i18n="satellite"></span>
                    </div>
                </div>
            </div>
        </div>
        <div class="scp-section">
            <div class="control-row" style="margin-bottom:0">
                <div class="ctrl-label">
                    <i class="fa-solid fa-gauge"></i>
                    <span data-i18n="wind_speed"></span>
                </div>
                <div class="unit-group">
                    <button class="btn-unit-select" onclick="setWindUnit(0)">m/s</button>
                    <button class="btn-unit-select" onclick="setWindUnit(1)">km/h</button>
                    <button class="btn-unit-select" onclick="setWindUnit(2)">kt</button>
                </div>
            </div>
            <div class="legend-bar"></div>
            <div class="legend-labels">
                <span id="legend-0">0</span>
                <span id="legend-5">5</span>
                <span id="legend-10">10</span>
                <span id="legend-15">15</span>
                <span id="legend-20">20+</span>
            </div>
        </div>
        <div class="scp-section" style="border-bottom:none">
            <div class="mini-card-grid-3">
                <div class="mini-card">
                    <div class="mini-card-label" data-i18n="max_wind_speed">Max speed</div>
                    <div class="mini-card-value text-warning" id="stat-max-wind">
                        <span class="stat-max-wind-val">0.0</span>
                        <small class="stat-unit-label">m/s</small>
                    </div>
                </div>
                <div class="mini-card">
                    <div class="mini-card-label" data-i18n="avg_wind_speed">Avg speed</div>
                    <div class="mini-card-value text-success" id="stat-avg-wind">
                        <span class="stat-avg-wind-val">0.0</span>
                        <small class="stat-unit-label">m/s</small>
                    </div>
                </div>
                <div class="mini-card">
                    <div class="mini-card-label" data-i18n="min_wind_speed">Min speed</div>
                    <div class="mini-card-value text-info" id="stat-min-wind">
                        <span class="stat-min-wind-val">0.0</span>
                        <small class="stat-unit-label">m/s</small>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<button class="mobile-fab btn" id="fabToggle"><i class="fa-solid fa-layer-group"></i></button>
<div class="panel-overlay" id="panelOverlay"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js"></script>
<script src="<?=asset('public/js/user/pole.js')?>" defer></script>