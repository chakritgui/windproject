<link rel="stylesheet" href="<?=BASE_URL?>/vendor/leaflet/1.4.0/dist/leaflet.css">
<script src="<?=BASE_URL?>/vendor/leaflet/1.4.0/dist/leaflet.js"></script>
<link href="<?=BASE_URL?>/public/css/page.css?v=<?=time();?>" rel="stylesheet">
<script>
    let windyAPI, map, poleLayerGroup;
    let DEFAULT_LEVEL = '100m';
    let options = { 
        lat: 16.5, 
        lon: 106.0, 
        zoom: 8, 
        labels: false,
        zoomAnimation: true,
        fadeAnimation: false,
        markerZoomAnimation: true,
        keepBuffer: 100,
        updateWhenIdle: true,
        updateWhenZooming: false, 
        updateInterval: 500,
        zoomSnap: 1, 
        zoomDelta: 1,
        wheelPxPerZoomLevel: 120
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
                    loadScript(`<?=BASE_URL?>/public/js/user/map.js?v=<?=time();?>`),
                    loadScript(`<?=BASE_URL?>/public/js/user/report.js?v=<?=time();?>`)
                ]); 
                console.log("System initialized with Config:", config);
            }
        } catch (err) {
            console.error("Initialization error:", err);
        }
    })();
</script>
<link rel="stylesheet" href="<?=BASE_URL?>/public/css/map.css?v=<?=time();?>">
<link rel="stylesheet" href="<?=BASE_URL?>/public/css/pole.css?v=<?=time();?>">
<style>
    #globe-intro {
        position: fixed;
        inset: 0;
        z-index: 9999;
        background: radial-gradient(circle at 50% 40%, rgba(10,15,44,0.85) 0%, rgba(5,7,15,0.9) 40%, rgba(0,0,0,0.95) 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        transition: opacity 1.2s ease;
    }
    #globe-intro::before {
        content: "";
        position: absolute;
        inset: 0;
        background:
            radial-gradient(circle at 30% 30%, rgba(80,120,255,0.25), transparent 50%),
            radial-gradient(circle at 70% 60%, rgba(140,80,255,0.2), transparent 50%);
        filter: blur(80px);
        opacity: 0.8;
        animation: glowMove 12s ease-in-out infinite alternate;
    }
    @keyframes glowMove {
        0% {
            transform: translate(0,0) scale(1);
        }
        100% {
            transform: translate(-5%,5%) scale(1.1);
        }
    }
    #globe-intro.fade-out {
        opacity: 0;
        pointer-events: none;
    }
    #globe-canvas {
        width: 100vw;
        height: 100vh;
    }
    #globe-intro-text {
        position: absolute;
        bottom: 10%;
        left: 50%;
        transform: translateX(-50%);
        font-size: 12px;
        color: rgba(180, 210, 255, 0.7);
        text-shadow:
            0 0 10px rgba(100,150,255,0.6),
            0 0 20px rgba(80,120,255,0.4);
        animation: pulse 2.5s infinite;
    }
    @keyframes pulse {
        0%,100% { opacity: 0.4; transform: translateX(-50%) scale(1); }
        50% { opacity: 1; transform: translateX(-50%) scale(1.05); }
    }
    #globe-intro::after {
        content: "";
        position: absolute;
        inset: 0;
        background: radial-gradient(circle, transparent 60%, rgba(0,0,0,0.8) 100%);
        pointer-events: none;
    }
</style>
<div id="globe-intro">
    <canvas id="globe-canvas"></canvas>
    <div id="globe-intro-text" data-i18n="initializing"></div>
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
    (function () {
        const canvas  = document.getElementById('globe-canvas');
        const intro   = document.getElementById('globe-intro');
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha:true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.physicallyCorrectLights = true;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 1000);
        camera.position.z = 4;
        const sun = new THREE.DirectionalLight(0xffffff, 2);
        sun.position.set(5,0,5);
        scene.add(sun);
        const ambient = new THREE.AmbientLight(0x222222);
        scene.add(ambient);
        const loader = new THREE.TextureLoader();
        const earthTex = loader.load('https://threejs.org/examples/textures/land_ocean_ice_cloud_2048.jpg');
        const bumpMap  = loader.load('https://threejs.org/examples/textures/earthbump1k.jpg');
        const specMap  = loader.load('https://threejs.org/examples/textures/earthspec1k.jpg');
        const nightTex = loader.load('https://threejs.org/examples/textures/earthlights1k.jpg');
        const cloudTex = loader.load('https://threejs.org/examples/textures/earthcloudmap.jpg');
        const geo = new THREE.SphereGeometry(1,64,64);
        const mat = new THREE.MeshPhongMaterial({
            map: earthTex,
            bumpMap: bumpMap,
            bumpScale: 0.05,
            specularMap: specMap,
            specular: new THREE.Color(0x333333),
            shininess: 15,
            emissiveMap: nightTex,
            emissive: new THREE.Color(0xffffff),
            emissiveIntensity: 0.4
        });
        const globe = new THREE.Mesh(geo, mat);
        scene.add(globe);
        const cloudGeo = new THREE.SphereGeometry(1.01,64,64);
        const cloudMat = new THREE.MeshPhongMaterial({
            map: cloudTex,
            transparent:true,
            opacity:0.4,
            depthWrite:false
        });
        const clouds = new THREE.Mesh(cloudGeo, cloudMat);
        scene.add(clouds);
        const atmosMat = new THREE.ShaderMaterial({
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
            transparent:true
        });
        const atmos = new THREE.Mesh(new THREE.SphereGeometry(1.1,64,64), atmosMat);
        scene.add(atmos);
        const starTexture = new THREE.TextureLoader().load(
            'https://threejs.org/examples/textures/sprites/circle.png'
        );
        function createStarField(count, radius, size, opacity) {
            const geo = new THREE.BufferGeometry();
            const positions = new Float32Array(count * 3);
            for (let i = 0; i < count; i++) {
                const r = radius * (0.7 + Math.random() * 0.3);
                const theta = Math.random() * 2 * Math.PI;
                const phi = Math.acos((Math.random() * 2) - 1);
                positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
                positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
                positions[i * 3 + 2] = r * Math.cos(phi);
            }
            geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            const mat = new THREE.PointsMaterial({
                size: size,
                map: starTexture,
                transparent: true,
                opacity: opacity,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });
            return new THREE.Points(geo, mat);
        }
        const starsFar  = createStarField(2000, 200, 0.6, 0.6);
        const starsMid  = createStarField(1500, 120, 0.8, 0.8);
        const starsNear = createStarField(800,  80,  1.2, 1.0);
        scene.add(starsFar);
        scene.add(starsMid);
        scene.add(starsNear);
        let start = null;
        let raf;
        function ease(t){
            return t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
        }
        function animate(ts){
            raf = requestAnimationFrame(animate);
            if(!start) start = ts;
            let t = (ts-start)/1000;
            const time = ts * 0.001;
            globe.rotation.y += 0.002;
            clouds.rotation.y += 0.0025;
            atmos.rotation.y = globe.rotation.y;
            starsFar.rotation.y += 0.0001;
            starsMid.rotation.y += 0.0002;
            starsNear.rotation.y += 0.0003;
            starsFar.material.opacity  = 0.5 + Math.sin(time * 0.5) * 0.1;
            starsMid.material.opacity  = 0.7 + Math.sin(time * 0.8) * 0.15;
            starsNear.material.opacity = 0.9 + Math.sin(time * 1.2) * 0.2;
            if(t > 2 && t < 5){
                let p = ease((t-2)/3);
                camera.position.z = 4 + (0.6-4)*p;
                globe.rotation.x = p*0.2;
            }
            if(t > 5){
                intro.style.opacity = 1-(t-5)/1;
            }
            if(t > 6){
                cleanup();
                return;
            }
            renderer.render(scene,camera);
        }
        function cleanup(){
            cancelAnimationFrame(raf);
            intro.classList.add('fade-out');
            setTimeout(()=>{
                intro.remove();
                renderer.dispose();
            },1000);
        }
        window.addEventListener('resize', ()=>{
            camera.aspect = window.innerWidth/window.innerHeight;
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
<div id="area-panel">
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
    <div class="panel-section">
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="section-title mb-0"><i class="fa-solid fa-sliders me-2"></i><span data-i18n="map_controls"></span></h6>
            <button class="btn-toggle-expand d-none d-md-flex" id="toggleExpandBtn">
                <i class="fa-solid fa-chevron-down"></i>
            </button>
        </div>
        <div class="control-grid-wrapper">
            <div class="control-row">
                <div class="d-flex align-items-center gap-2">
                    <i class="fa-solid fa-fan wind-icon-anim" id="wind-status-icon"></i>
                    <span data-i18n="show_wind_values"></span>
                </div>
                <div class="form-check form-switch">
                    <input class="form-check-input custom-switch" type="checkbox" id="toggle-wind-values">
                </div>
            </div>
            <div class="control-row">
                <div class="d-flex align-items-center gap-2">
                    <i class="fa-solid fa-crosshairs"></i>
                    <span data-i18n="focus_mode"></span>
                </div>
                <div class="form-check form-switch">
                    <input class="form-check-input custom-switch" type="checkbox" id="toggle-focus">
                </div>
            </div>
            <div class="control-row">
                <div class="d-flex align-items-center gap-2">
                    <i class="fa-solid fa-expand"></i>
                    <span data-i18n="reset_view"></span>
                </div>
                <button class="btn-reset-view" onclick="resetView()" title="Reset View">
                    <i class="fa-solid fa-arrow-rotate-left"></i>
                </button>
            </div>
        </div>
    </div>
    <div class="panel-expandable-content" id="expandableContent">
        <div class="panel-section">
            <div class="control-grid-wrapper">
                <div class="control-row">
                    <div class="d-flex align-items-center gap-2">
                        <i class="fa-solid fa-layer-group"></i>
                        <span data-i18n="show_place_label"></span>
                    </div>
                    <div class="form-check form-switch">
                        <input class="form-check-input custom-switch" type="checkbox" id="toggle-label">
                    </div>
                </div>
                <div class="control-row">
                    <div class="d-flex align-items-center gap-2">
                        <i class="fa-solid fa-gauge"></i>
                        <span data-i18n="wind_unit"></span>
                    </div>
                    <button class="btn-unit-toggle" onclick="cycleWindUnit()" id="btn-wind-unit">m/s</button>
                </div>
            </div>
        </div>
        <div class="panel-section">
            <h6 class="section-title">
                <i class="fa-solid fa-wind me-2"></i>
                <span data-i18n="wind_speed"></span>
                (<span id="legend-unit-label">m/s</span>)
            </h6>
            <div class="legend-bar"></div>
            <div class="legend-labels">
                <span id="legend-0">0</span>
                <span id="legend-5">5</span>
                <span id="legend-10">10</span>
                <span id="legend-15">15</span>
                <span id="legend-20">20+</span>
            </div>
        </div>
        <div class="panel-section border-0">
            <div class="mini-card-grid-3">
                <div class="mini-card">
                    <div class="mini-card-label" data-i18n="max_wind"></div>
                    <div class="mini-card-value text-warning" id="stat-max-wind">
                        <span class="stat-max-wind-val">0.0</span>
                        <small class="stat-unit-label">m/s</small>
                    </div>
                </div>
                <div class="mini-card">
                    <div class="mini-card-label" data-i18n="avg_wind"></div>
                    <div class="mini-card-value text-success" id="stat-avg-wind">
                        <span class="stat-avg-wind-val">0.0</span>
                        <small class="stat-unit-label">m/s</small>
                    </div>
                </div>
                <div class="mini-card">
                    <div class="mini-card-label" data-i18n="min_wind"></div>
                    <div class="mini-card-value text-info" id="stat-min-wind">
                        <span class="stat-min-wind-val">0.0</span>
                        <small class="stat-unit-label">m/s</small>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<button class="mobile-fab btn btn-dark" id="fabToggle">
    <i class="fa-solid fa-layer-group"></i>
</button>
<div class="panel-overlay" id="panelOverlay"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js"></script>
<script src="<?=BASE_URL?>/public/js/user/pole.js?v=<?=time();?>" defer></script>