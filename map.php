<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wind Monitoring Dashboard - Professional</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { height: 100%; background: #f8fafc; font-family: -apple-system, sans-serif; overflow: hidden; }
        #map { width: 100%; height: 100%; position: absolute; background: #e2e8f0; }
        
        /* UI Panel */
        #ui-panel {
            position: absolute; top: 20px; left: 20px; z-index: 1001; width: 280px;
            background: rgba(255, 255, 255, 0.95); padding: 20px; border-radius: 16px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1); backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
        }
        .toggle-btn {
            width: 100%; padding: 12px; margin-top: 15px; border: none; border-radius: 8px;
            background: #4f46e5; color: white; cursor: pointer; font-weight: 600;
            transition: all 0.2s; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2);
        }
        .toggle-btn.off { background: #64748b; box-shadow: none; }
        
        /* Real-time Label */
        .live-label {
            background: white; padding: 6px 12px; border-radius: 20px;
            border: 2px solid #4f46e5; font-weight: bold; font-size: 13px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15); color: #1e293b; white-space: nowrap;
        }

        /* Loading Screen */
        #loading {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 9999;
            background: #ffffff; display: flex; flex-direction: column; align-items: center; justify-content: center;
        }
        .loader { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #4f46e5; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
    </style>
</head>
<body>

<div id="loading">
    <div class="loader"></div>
    <p style="margin-top:15px; color: #475569; font-weight: 500;">กำลังจัดเตรียมข้อมูลแผนที่และลม...</p>
</div>

<div id="map"></div>

<div id="ui-panel">
    <h2 style="font-size: 18px; color: #1e293b;">Wind Dashboard</h2>
    <p style="font-size: 12px; color: #64748b; margin-bottom: 10px;">ระดับความสูงใบพัด 150 เมตร</p>
    <hr>
    <button id="toggle-masts" class="toggle-btn" onclick="toggleMastLayer()">แสดง/ซ่อน เสาวัดลม</button>
</div>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
// --- 1. CONFIGURATION ---
const CONFIG = {
    API_KEY: '1301fbd9b839ad2bd35b22e8974cb432',
    HEIGHT_TARGET: 150,
    HEIGHT_REF: 10,
    ALPHA: 0.143,
    PARTICLE_COUNT: 400
};

let map, canvas, ctx;
let particles = [];
let avgWindSpeed = 5, avgWindDeg = 0;
let mastLayer = L.layerGroup();
let liveMarker = null;
let liveInterval = null;

// --- 2. CLASS PARTICLE ---
class Particle {
    constructor() { this.reset(); }
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.life = Math.random() * 80 + 40;
        this.angle = (avgWindDeg - 90) * (Math.PI / 180);
        this.spin = (Math.random() - 0.5) * 0.05; // ลมมีความโค้ง
    }
    draw() {
        this.angle += this.spin;
        const speed = avgWindSpeed * 0.1;
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 1.8;
        ctx.lineCap = 'round';
        ctx.moveTo(this.x, this.y);
        this.x += Math.cos(this.angle) * speed;
        this.y += Math.sin(this.angle) * speed;
        ctx.lineTo(this.x, this.y);
        ctx.stroke();
        this.life--;
        if (this.life <= 0 || this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.reset();
    }
}
async function getWindData(lat, lon) {
    try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}&units=metric`);
        const data = await res.json();
        return {
            speed: data.wind.speed * Math.pow((CONFIG.HEIGHT_TARGET / CONFIG.HEIGHT_REF), CONFIG.ALPHA),
            deg: data.wind.deg || 0
        };
    } catch { return { speed: 5, deg: 45 }; }
}

function initParticles() {
    particles = [];
    if (!canvas) return;
    for (let i = 0; i < CONFIG.PARTICLE_COUNT; i++) particles.push(new Particle());
}

function animate() {
    if (!ctx) return;
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.94)'; // หางยาวพริ้วพอดี
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';
    particles.forEach(p => p.draw());
    requestAnimationFrame(animate);
}

function toggleMastLayer() {
    const btn = document.getElementById('toggle-masts');
    if (map.hasLayer(mastLayer)) {
        map.removeLayer(mastLayer);
        btn.classList.add('off');
    } else {
        map.addLayer(mastLayer);
        btn.classList.remove('off');
    }
}

// คลิกเพื่อดูค่าลมแบบสด (ข้อ 7)
async function handleMapClick(latlng) {
    if (liveMarker) map.removeLayer(liveMarker);
    if (liveInterval) clearInterval(liveInterval);

    liveMarker = L.marker(latlng, {
        icon: L.divIcon({ className: '', html: `<div id="live-box" class="live-label">กำลังโหลด...</div>`, iconAnchor: [50, 45] })
    }).addTo(map);

    const updateLive = async () => {
        const data = await getWindData(latlng.lat, latlng.lng);
        const el = document.getElementById('live-box');
        if (el) el.innerText = `สด: ${data.speed.toFixed(2)} m/s`;
        avgWindSpeed = data.speed; // ปรับความเร็วลม Animation ตามจุดที่กด
        avgWindDeg = data.deg;
    };

    updateLive();
    liveInterval = setInterval(updateLive, 30000); // อัปเดตทุก 30 วินาที
}
function getColorByLocation(lat, lng) {
    // ในสถานการณ์จริง คุณควรดึงค่าจาก API รายพิกัด 
    // แต่เพื่อประสิทธิภาพ เราจะใช้สูตรคำนวณจากค่าลมหลัก + ความแปรปรวนตามพิกัด
    const localWind = avgWindSpeed + (Math.sin(lat * 50) * 1.5) + (Math.cos(lng * 50) * 1.5);
    
    // กำหนดช่วงสี (Scale)
    if (localWind < 3) return '#60a5fa'; // ฟ้า
    if (localWind < 6) return '#34d399'; // เขียว
    if (localWind < 9) return '#fbbf24'; // เหลือง
    return '#f87171'; // แดง
}
// --- 4. MAIN ENGINE ---
async function init() {
    // 4.1 Initialize Map
    map = L.map('map', { zoomControl: false }).setView([17.9, 103.2], 11);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);
    mastLayer.addTo(map);

    // 4.2 Load Polygon & Setting Constraints (ข้อ 1, 2, 4)
    const response = await fetch('Boundary_of_project_GCS.json');
    const geoData = await response.json();

    const geoLayer = L.geoJSON(geoData);
    const bounds = geoLayer.getBounds();
    
  const laosBounds = L.latLngBounds(
    [13.9, 100.1], // มุมซ้ายล่าง (South West)
    [22.5, 107.7]  // มุมขวาบน (North East)
);

// 2. ให้แผนที่เริ่มที่จุด Polygon ของเราก่อน (ตามโจทย์ข้อ 2)
map.fitBounds(bounds, { padding: [100, 100] });

// 3. ตั้งค่าการล็อกการเลื่อน (MaxBounds) ให้เลื่อนได้ไม่เกินพื้นที่ลาว
map.setMaxBounds(laosBounds);

// 4. ตั้งค่าระดับการซูมออกที่ต่ำที่สุด (ซูมออกได้แค่ไหน)
// ปกติระดับ 6-7 จะเห็นพื้นที่ประมาณ 1 ประเทศ
map.options.minZoom = 6; 

// ป้องกันการหลุดขอบหากซูมออกกว้างเกินไป
map.on('zoomend', function() {
    if (map.getZoom() < 6) map.setZoom(6);
});

    // 4.3 Outer Mask (พื้นที่รอบนอกจาง - ข้อ 4)
    const world = [[-90, -180], [-90, 180], [90, 180], [90, -180], [-90, -180]];
    const holes = geoData.features.map(f => f.geometry.coordinates[0].map(c => [c[1], c[0]]));
    L.polygon([world, ...holes], { fillColor: '#CCCCCC', fillOpacity: 0.5, stroke: false, interactive: false }).addTo(map);

    // 4.4 Polygon Styling (ข้อ 3)
    L.geoJSON(geoData, {
        style: { fillColor: '#4f46e5', fillOpacity: 0.25, stroke: true, color: '#FFFFFF', weight: 1 },
        onEachFeature: (feature, layer) => {
            layer.on('click', (e) => handleMapClick(e.latlng));
        }
    }).addTo(map);

    // 4.5 Canvas Setup
    canvas = document.createElement('canvas');
    canvas.style.position = 'absolute'; canvas.style.top = 0; canvas.style.left = 0;
    canvas.style.pointerEvents = 'none'; canvas.style.zIndex = 450;
    document.getElementById('map').appendChild(canvas);
    ctx = canvas.getContext('2d');

    const handleResize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initParticles();
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    animate();

    // 4.6 Map Interaction Events (ข้อ 8)
    map.on('movestart', () => { particles = []; });
    map.on('moveend', () => { initParticles(); });

    // 4.7 Initial Wind Setup
    const center = bounds.getCenter();
    const startData = await getWindData(center.lat, center.lng);
    avgWindSpeed = startData.speed;
    avgWindDeg = startData.deg;

    // 4.8 Mock Masts (สร้างเสาตัวอย่างที่มุม Polygon - ข้อ 5)
    holes.forEach((h, i) => {
        const mastPos = h[Math.floor(Math.random() * h.length)];
        L.marker(mastPos, {
            icon: L.divIcon({ className: '', html: `<div class="live-label">เสาที่ ${i+1}: ${avgWindSpeed.toFixed(1)} m/s</div>`, iconSize: [120, 25] })
        }).addTo(mastLayer);
    });

    document.getElementById('loading').style.display = 'none';
}

// Start Application
init();
</script>
</body>
</html>