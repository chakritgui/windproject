<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wind Monitoring - Windy Smooth Style</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { height: 100%; background: #0b0f1a; font-family: -apple-system, sans-serif; overflow: hidden; }
        #map { width: 100%; height: 100%; position: absolute; background: #0b0f1a; }
        
        #ui-panel {
            position: absolute; top: 20px; left: 20px; z-index: 1001; width: 320px;
            background: rgba(15, 23, 42, 0.85); padding: 20px; border-radius: 16px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5); backdrop-filter: blur(12px);
            border: 1px solid rgba(255,255,255,0.1); color: #f8fafc;
        }
        .slider-container { margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); }
        input[type=range] { width: 100%; cursor: pointer; accent-color: #3b82f6; margin-top: 10px; }
        
        #loading {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 9999;
            background: #0b0f1a; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white;
        }
        .loader { width: 40px; height: 40px; border: 4px solid #1e293b; border-top: 4px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
    </style>
</head>
<body>

<div id="loading">
    <div class="loader"></div>
    <p style="margin-top:15px; letter-spacing: 1px;">OPTIMIZING FLOW FIELD...</p>
</div>

<div id="map"></div>

<div id="ui-panel">
    <h2 style="font-size: 18px; font-weight: 600;">Wind Flow Dashboard</h2>
    <p style="font-size: 11px; color: #94a3b8; margin-bottom: 10px;">Smooth Vector Field | 150m Target</p>
    
    <div class="slider-container">
        <div style="display:flex; justify-content: space-between; font-size: 13px;">
            <span>พยากรณ์เวลา: <b id="time-display">00:00</b></span>
            <span style="color:#3b82f6">H: <span id="idx-display">0</span></span>
        </div>
        <input type="range" id="time-slider" min="0" max="23" value="0" oninput="updateTime(this.value)">
    </div>
</div>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
// --- CONFIGURATION ---
const CONFIG = { 
    HEIGHT_TARGET: 150, 
    HEIGHT_REF: 120, 
    ALPHA: 0.143, 
    PARTICLE_COUNT: 600,    // จำนวนที่พอดี ไม่รกตา
    MAX_PARTICLE_AGE: 150,  // เส้นยาวขึ้นเพื่อให้เห็นความโค้ง
    VELOCITY_SCALE: 0.015,  // สเกลความเร็วสัมพันธ์กับพิกัด
    SMOOTHING: 0.1,        // ค่าการเลี้ยว (ยิ่งน้อยยิ่งโค้งมน)
    LINE_WIDTH: 1.2
};

let map, canvas, ctx, windCache = [], geoLayer, currentTimeIndex = 0;
let particles = [];
let isMapMoving = false;

// --- DATA ENGINE ---
function getWindColor(speed) {
    if (speed < 4) return '#3b82f6';
    if (speed < 8) return '#10b981';
    if (speed < 12) return '#fbbf24';
    return '#ef4444';
}

function getWindFromCache(lat, lon) {
    if (!windCache.length) return { speed: 0, deg: 0 };
    let closest = windCache[0], minDist = Infinity;
    windCache.forEach(p => {
        const d = Math.hypot(lat - p.lat, lon - p.lon);
        if (d < minDist) { minDist = d; closest = p; }
    });
    const s = closest.hourly.wind_speed_120m[currentTimeIndex] * Math.pow((CONFIG.HEIGHT_TARGET/CONFIG.HEIGHT_REF), CONFIG.ALPHA);
    const d = closest.hourly.wind_direction_120m[currentTimeIndex];
    return { speed: s, deg: d };
}

// --- OPTIMIZED PARTICLE ENGINE ---
class Particle {
    constructor() { this.reset(); }
    
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        // สุ่มอายุเริ่มต้นเพื่อให้จังหวะการเกิด/ตายกระจายตัว ไม่หายไปพร้อมกันทั้งหน้าจอ
        this.age = Math.floor(Math.random() * CONFIG.MAX_PARTICLE_AGE);
        this.vx = 0; 
        this.vy = 0;
    }

    draw() {
        if (isMapMoving) return;

        // 1. อ่านค่าจาก Cache ตามตำแหน่งจริงของเม็ดลม (Real-time Flow)
        const latlng = map.containerPointToLatLng([this.x, this.y]);
        const wind = getWindFromCache(latlng.lat, latlng.lng);
        
        // 2. คำนวณ Target Velocity (Vector)
        const angle = (wind.deg - 90) * (Math.PI / 180);
        const targetVx = Math.cos(angle) * wind.speed;
        const targetVy = Math.sin(angle) * wind.speed;

        // 3. ปรับการเลี้ยวให้สมูทด้วย Linear Interpolation (ทำให้เส้นโค้งมน)
        this.vx += (targetVx - this.vx) * CONFIG.SMOOTHING;
        this.vy += (targetVy - this.vy) * CONFIG.SMOOTHING;

        const prevX = this.x;
        const prevY = this.y;
        
        // 4. อัปเดตตำแหน่งสัมพันธ์กับ Zoom
        const zoomFactor = Math.pow(2, map.getZoom() - 10);
        this.x += this.vx * CONFIG.VELOCITY_SCALE * zoomFactor;
        this.y += this.vy * CONFIG.VELOCITY_SCALE * zoomFactor;

        // 5. คำนวณความโปร่งใสแบบ Sinusoidal (ค่อยๆ สว่างตอนเกิด และจางตอนตาย)
        const alpha = Math.sin((this.age / CONFIG.MAX_PARTICLE_AGE) * Math.PI) * 0.6;
        
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = CONFIG.LINE_WIDTH;
        ctx.lineCap = 'round';
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(this.x, this.y);
        ctx.stroke();

        this.age++;
        
        // ตรวจสอบขอบจอและอายุ
        if (this.age > CONFIG.MAX_PARTICLE_AGE || 
            this.x < 0 || this.x > canvas.width || 
            this.y < 0 || this.y > canvas.height) {
            this.reset();
        }
    }
}

function animate() {
    if (!isMapMoving && ctx) {
        // ใช้ Trail Effect ที่จางช้าลง (0.97) เพื่อให้หางนุ่มและยาวสม่ำเสมอ
        ctx.globalCompositeOperation = 'destination-in';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.97)'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.globalCompositeOperation = 'source-over';
        particles.forEach(p => p.draw());
    }
    requestAnimationFrame(animate);
}

// --- APP CONTROL ---
function updatePolygonStyles() {
    if (!geoLayer) return;
    geoLayer.eachLayer(layer => {
        const center = layer.getBounds().getCenter();
        const data = getWindFromCache(center.lat, center.lng);
        layer.setStyle({
            fillColor: getWindColor(data.speed),
            fillOpacity: 0.35,
            color: 'rgba(255,255,255,0.2)',
            weight: 1
        });
    });
}

function updateTime(val) {
    currentTimeIndex = parseInt(val);
    document.getElementById('time-display').innerText = `${val.padStart(2, '0')}:00`;
    document.getElementById('idx-display').innerText = val;
    updatePolygonStyles();
}

function handleResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particles = Array.from({length: CONFIG.PARTICLE_COUNT}, () => new Particle());
}

async function init() {
    try {
        const [boundRes, windRes] = await Promise.all([
            fetch('Boundary_of_project_GCS.json'),
            fetch('wind_grid_cache.json')
        ]);
        const geoData = await boundRes.json();
        windCache = await windRes.json();

        // Initialize Leaflet Map
        map = L.map('map', { zoomControl: false, fadeAnimation: true }).setView([17.9, 103.2], 10);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);

        // Load Polygon with Initial Dynamic Style
        geoLayer = L.geoJSON(geoData).addTo(map);
        map.fitBounds(geoLayer.getBounds());

        // Setup Canvas Layer
        canvas = document.createElement('canvas');
        canvas.style.position = 'absolute'; canvas.style.top = 0; canvas.style.left = 0;
        canvas.style.pointerEvents = 'none'; canvas.style.zIndex = 450;
        document.getElementById('map').appendChild(canvas);
        ctx = canvas.getContext('2d');

        // Syncing Canvas with Map Movements
        map.on('movestart', () => { 
            isMapMoving = true; 
            ctx.clearRect(0,0,canvas.width,canvas.height); 
        });
        map.on('moveend', () => { 
            isMapMoving = false; 
        });
        map.on('zoomend', handleResize);

        window.addEventListener('resize', handleResize);
        handleResize();
        updateTime("0");
        animate();

        document.getElementById('loading').style.display = 'none';
    } catch (e) {
        alert("กรุณาเปิดผ่าน Web Server เพื่อโหลดไฟล์ JSON (เช่น VS Code Live Server)");
    }
}

init();
</script>
</body>
</html>