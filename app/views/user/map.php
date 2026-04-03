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
        renderer.physicallyCorrectLights = true;
        const scene  = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 4;
        const sun = new THREE.DirectionalLight(0xffffff, 2);
        sun.position.set(5, 0, 5);
        scene.add(sun);
        const ambient = new THREE.AmbientLight(0x222222);
        scene.add(ambient);
        const loader = new THREE.TextureLoader();
        const earthTex = loader.load('https://threejs.org/examples/textures/land_ocean_ice_cloud_2048.jpg');
        const cloudTex = loader.load('https://threejs.org/examples/textures/earthcloudmap.jpg');
        const globe = new THREE.Mesh(
            new THREE.SphereGeometry(1, 48, 48),
            new THREE.MeshPhongMaterial({
                map: earthTex
            })
        );
        const clouds = new THREE.Mesh(
            new THREE.SphereGeometry(1.01, 32, 32),
            new THREE.MeshPhongMaterial({
                map: cloudTex,
                transparent: true,
                opacity: 0.3,
                depthWrite: false
            })
        );

        scene.add(globe);
        scene.add(clouds);
        const atmos = new THREE.Mesh(
            new THREE.SphereGeometry(1.1, 64, 64),
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
        const starTexture = new THREE.TextureLoader().load(
            'https://threejs.org/examples/textures/sprites/circle.png'
        );
        function createStarField(count, radius, size, opacity) {
            const geo       = new THREE.BufferGeometry();
            const positions = new Float32Array(count * 3);
            for (let i = 0; i < count; i++) {
                const r     = radius * (0.7 + Math.random() * 0.3);
                const theta = Math.random() * 2 * Math.PI;
                const phi   = Math.acos((Math.random() * 2) - 1);
                positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
                positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
                positions[i * 3 + 2] = r * Math.cos(phi);
            }
            geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            return new THREE.Points(geo, new THREE.PointsMaterial({
                size, map: starTexture, transparent: true, opacity,
                depthWrite: false, blending: THREE.AdditiveBlending
            }));
        }
        const starsFar  = createStarField(2000, 200, 0.6, 0.6);
        const starsMid  = createStarField(1500, 120, 0.8, 0.8);
        const starsNear = createStarField(800,   80, 1.2, 1.0);
        scene.add(starsFar, starsMid, starsNear);
        const flagCanvas  = document.createElement('canvas');
        flagCanvas.width  = 192; flagCanvas.height = 120;
        const fc = flagCanvas.getContext('2d');
        fc.fillStyle = '#CE1126'; fc.fillRect(0, 0, 192, 120);
        fc.fillStyle = '#002868'; fc.fillRect(0, 27, 192, 66);
        fc.fillStyle = '#FFFFFF';
        fc.beginPath(); fc.arc(96, 60, 22, 0, Math.PI * 2); fc.fill();
        const flagTex = new THREE.CanvasTexture(flagCanvas);
        const globePivot = new THREE.Group();
        scene.add(globePivot);
        const pinGroup = new THREE.Group();
        const poleMesh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.004, 0.004, 0.22, 8),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        poleMesh.position.y = 0.11;
        pinGroup.add(poleMesh);
        const flagMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(0.14, 0.088),
            new THREE.MeshBasicMaterial({ map: flagTex, side: THREE.DoubleSide, transparent: true })
        );
        flagMesh.position.set(0.072, 0.2, 0);
        pinGroup.add(flagMesh);
        const pinLat = 18  * Math.PI / 180;
        const pinLon = 103 * Math.PI / 180;
        const pinPos = new THREE.Vector3(
            Math.cos(pinLat) * Math.sin(pinLon),
            Math.sin(pinLat),
            Math.cos(pinLat) * Math.cos(pinLon)
        );
        pinGroup.position.copy(pinPos);
        pinGroup.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            pinPos.clone().normalize()
        );
        pinGroup.scale.setScalar(0);
        globePivot.add(pinGroup);
        const LAO_LAT = 18.2;
        const LAO_LON = 104.8;
        const targetRotY = (LAO_LON * Math.PI / 180) - (Math.PI / 2);
        const targetRotX = -(LAO_LAT * Math.PI / 180) * 0.85;
        const startRotY = targetRotY - Math.PI; 
        const startRotX = 0;
        globe.rotation.y      = startRotY; globe.rotation.x      = startRotX;
        clouds.rotation.y     = startRotY; clouds.rotation.x     = startRotX;
        atmos.rotation.y      = startRotY; atmos.rotation.x      = startRotX;
        globePivot.rotation.y = startRotY; globePivot.rotation.x = startRotX;
        let start = null, raf;
        const delayBeforeStart = 1500;
        function easeIn(t)    { return t * t * t * t; }
        function easeOut(t)   { return 1 - Math.pow(1 - t, 3); }
        function easeInOut(t) { return t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3) / 2; }
        function animate(ts) {
            raf = requestAnimationFrame(animate);
            if (!start) { start = ts + delayBeforeStart; return; }
            if (ts < start) { renderer.render(scene, camera); return; }
            const t = (ts - start) / 1000;
            const time = ts * 0.001;
            if (t <= 3.2) {
                const pe = easeInOut(Math.min(t / 3.2, 1));
                const ry = startRotY + ((-targetRotY) - startRotY) * pe;
                const rx = startRotX + (targetRotX - startRotX) * pe;
                globe.rotation.y = ry;
                globe.rotation.x = rx;
                clouds.rotation.y = ry + 0.05;
                clouds.rotation.x = rx;
                atmos.rotation.y = ry;
                atmos.rotation.x = rx;
                globePivot.rotation.y = ry;
                globePivot.rotation.x = rx;
                camera.position.z = 4 + (0.85 - 4) * pe;
            }
            if (t > 3.2 && t <= 4.2) {
                const p = (t - 3.2) / 1.0;
                const pe = easeOut(p);
                const bounce = pe < 0.7 ? easeOut(pe / 0.7) : 1 + Math.sin(((pe - 0.7) / 0.3) * Math.PI) * 0.1;
                pinGroup.scale.setScalar(bounce);
                camera.position.z = 0.85 - (pe * 0.4);
                if (t > 3.7 && !intro.classList.contains('fade-out')) {
                    intro.classList.add('fade-out');
                    document.dispatchEvent(new CustomEvent('globe:done'));
                }
            }
            if (t > 4.2) {
                cleanup();
                return;
            }
            starsFar.rotation.y  += 0.0001;
            starsMid.rotation.y  += 0.0002;
            starsNear.rotation.y += 0.0003;
            renderer.render(scene, camera);
        }
        function disposeMaterial(material) {
            material.dispose();
            for (const key of Object.keys(material)) {
                const value = material[key];
                if (value && typeof value.dispose === 'function' && value.isTexture) {
                    value.dispose();
                }
            }
        }
        window.disposeThreeJS = function () {
            cancelAnimationFrame(raf);
            scene.traverse(object => {
                if (!object.isMesh) return;
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    Array.isArray(object.material)
                        ? object.material.forEach(disposeMaterial)
                        : disposeMaterial(object.material);
                }
            });
            renderer.dispose();
            canvas.remove();
            window.disposeThreeJS = null;
        };
        function cleanup() {
    cancelAnimationFrame(raf);
    document.dispatchEvent(new CustomEvent('globe:done'));
    
    const intro = document.getElementById('globe-intro');
    intro.classList.add('fade-out');

    // รอให้จางหายสนิท (ตามเวลา CSS 0.6s) ค่อยสั่งลบ Three.js ทิ้ง
    setTimeout(() => {
        if (typeof window.disposeThreeJS === 'function') {
            window.disposeThreeJS();
        }
        $(intro).remove();
    }, 700); 
}
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
        animate();
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