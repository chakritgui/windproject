<style>
    #globe-intro {
        position: fixed;
        inset: 0;
        z-index: 10002;
        background: radial-gradient(circle at 50% 40%, rgba(10,15,44,1) 0%, rgba(5,7,15,1) 40%, rgba(0,0,0,1) 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }
    #globe-intro.fade-out {
        opacity: 0 !important;
        pointer-events: none;
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
        0% { transform: translate(0,0) scale(1); }
        100% { transform: translate(-5%,5%) scale(1.1); }
    }
    #globe-canvas {
        width: 100vw;
        height: 100vh;
        display: block;
    }
    #globe-intro-text {
        position: absolute;
        bottom: 12%;
        left: 50%;
        transform: translateX(-50%);
        font-size: 12px;
        letter-spacing: 3px;
        color: rgba(180, 210, 255, 0.9);
        text-transform: uppercase;
        text-shadow: 0 0 15px rgba(100,150,255,0.8);
        animation: pulse 2.5s infinite;
        z-index: 10;
    }
    @keyframes pulse {
        0%, 100% { opacity: 0.4; transform: translateX(-50%) scale(1); }
        50% { opacity: 1; transform: translateX(-50%) scale(1.05); }
    }
    header, .footer { display: none !important; }
</style>
<div id="globe-intro">
    <canvas id="globe-canvas"></canvas>
    <div id="globe-intro-text">Initializing System...</div>
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
    (function () {
        const MAP_URL = `${BASE_URL}/map`;
        const hasSeenGlobe = sessionStorage.getItem('globe_shown');
        if (hasSeenGlobe) {
            window.location.replace(MAP_URL);
            return;
        }
        const canvas = document.getElementById('globe-canvas');
        const intro  = document.getElementById('globe-intro');
        if (!canvas || !intro) return;
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputEncoding = THREE.sRGBEncoding;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 4;
        scene.add(new THREE.AmbientLight(0x444444));
        const sun = new THREE.DirectionalLight(0xffffff, 1.5);
        sun.position.set(5, 3, 5);
        scene.add(sun);
        const manager = new THREE.LoadingManager();
        const loader = new THREE.TextureLoader(manager);
        manager.onLoad = () => {
            requestAnimationFrame(animate);
        };
        const earthTex = loader.load(`${BASE_URL}/public/images/land_ocean_ice_cloud_2048_11zon.jpg`);
        const globe = new THREE.Mesh(
            new THREE.SphereGeometry(1, 48, 48),
            new THREE.MeshPhongMaterial({ map: earthTex, shininess: 5 })
        );
        scene.add(globe);
        const atmos = new THREE.Mesh(
            new THREE.SphereGeometry(1.1, 48, 48),
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
                        gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
                    }
                `,
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide,
                transparent: true
            })
        );
        scene.add(atmos);
        const createStarTex = () => {
            const c = document.createElement('canvas');
            c.width = c.height = 64;
            const ctx = c.getContext('2d');
            const g = ctx.createRadialGradient(32,32,0,32,32,32);
            g.addColorStop(0,'#ffffff'); g.addColorStop(0.2,'#ffffff'); g.addColorStop(1,'transparent');
            ctx.fillStyle = g; ctx.fillRect(0,0,64,64);
            return new THREE.CanvasTexture(c);
        };
        const starGeo = new THREE.BufferGeometry();
        const starPos = new Float32Array(4000 * 3);
        for(let i=0; i<4000*3; i++) starPos[i] = (Math.random()-0.5) * 200;
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({size: 0.6, map: createStarTex(), transparent: true, blending: THREE.AdditiveBlending})));
        const LAO_LAT = 18.2, LAO_LON = 104.8;
        const targetRotY = (LAO_LON * Math.PI / 180) - (Math.PI / 2);
        const targetRotX = -(LAO_LAT * Math.PI / 180) * 0.85;
        const startRotY = targetRotY - Math.PI;
        globe.rotation.y = atmos.rotation.y = startRotY;
        let start = null, raf;
        const easeInOut = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3) / 2;
        const easeOut = t => 1 - Math.pow(1 - t, 3);
        function animate(ts) {
            if (!start) start = ts + 1000;
            const t = (ts - start) / 1000;
            if (t > 4.5) {
                finish();
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
                camera.position.z = 0.85 - (pe * 0.3);
                if (t > 3.6) intro.classList.add('fade-out');
            }
            renderer.render(scene, camera);
            raf = requestAnimationFrame(animate);
        }
        function finish() {
            cancelAnimationFrame(raf);
            sessionStorage.setItem('globe_shown', 'true');
            setTimeout(() => {
                if (window.disposeThreeJS) window.disposeThreeJS();
                window.location.href = MAP_URL;
            }, 600);
        }
        window.disposeThreeJS = function () {
            scene.traverse(obj => {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) {
                    if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
                    else obj.material.dispose();
                }
            });
            renderer.dispose();
            canvas.remove();
        };
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    })();
</script>