<?php
// ===============================
// Clean Windy-Style Wind Visualization
// White particles on light map with colored polygon
// ===============================

$cacheFile = __DIR__ . "/wind_grid_cache.json";
$cacheTTL = 3600; 

// function fetchWindGrid() {
//     $heights = [120, 100, 80, 10];
    
//     // Grid resolution สำหรับ smooth interpolation
//     $gridPoints = [];
//     for($lat = 13; $lat <= 23; $lat += 1) {
//         for($lon = 98; $lon <= 109; $lon += 1) {
//             $gridPoints[] = ['lat' => $lat, 'lon' => $lon];
//         }
//     }
    
//     $gridData = [];
    
//     foreach($gridPoints as $point) {
//         $lat = $point['lat'];
//         $lon = $point['lon'];
        
//         foreach($heights as $h) {
//             $url = "https://api.open-meteo.com/v1/forecast?"
//                  . "latitude=$lat&longitude=$lon"
//                  . "&hourly=wind_speed_{$h}m,wind_direction_{$h}m"
//                  . "&forecast_days=1&timezone=UTC";

//             $ch = curl_init();
//             curl_setopt($ch, CURLOPT_URL, $url);
//             curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
//             curl_setopt($ch, CURLOPT_TIMEOUT, 10);
//             curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
//             $response = curl_exec($ch);
//             $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
//             curl_close($ch);

//             if($httpCode == 200) {
//                 $data = json_decode($response, true);
//                 if(isset($data['hourly'])) {
//                     $speedKey = "wind_speed_{$h}m";
//                     $dirKey = "wind_direction_{$h}m";
                    
//                     if(isset($data['hourly'][$speedKey]) && 
//                        $data['hourly'][$speedKey][0] !== null) {
//                         $gridData[] = [
//                             'lat' => $data['latitude'],
//                             'lon' => $data['longitude'],
//                             'height' => $h,
//                             'hourly' => $data['hourly']
//                         ];
//                         break;
//                     }
//                 }
//             }
//             usleep(100000);
//         }
//     }
    
//     return $gridData;
// }

// $debugMode = isset($_GET['debug']);
// $debugInfo = [];

// if (isset($_GET['refresh'])) { 
//     @unlink($cacheFile);
//     $debugInfo[] = "Cache cleared";
// }

// if (!file_exists($cacheFile) || (time() - filemtime($cacheFile)) > $cacheTTL) {
//     $debugInfo[] = "Fetching from API...";
//     $data = fetchWindGrid();
//     if (!empty($data)) {
//         file_put_contents($cacheFile, json_encode($data));
//         $debugInfo[] = "✓ API Success: " . count($data) . " points";
//         $heights = array_unique(array_column($data, 'height'));
//         $debugInfo[] = "Heights: " . implode('m, ', $heights) . "m";
//     } else {
//         $debugInfo[] = "✗ API Failed: No data";
//         $data = [];
//     }
// } else {
    $debugInfo[] = "Using cached data";
    $data = json_decode(file_get_contents($cacheFile), true);
    if(!empty($data)) {
        $heights = array_unique(array_column($data, 'height'));
        $debugInfo[] = "Heights: " . implode('m, ', $heights) . "m";
    }
// }
?>

<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Clean Wind Visualization</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body, #map { 
            height: 100%; 
            background: #e8f4f8; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            overflow: hidden;
        }
        
        canvas { 
            position: absolute; 
            top: 0; 
            left: 0; 
            pointer-events: none; 
            z-index: 450;
        }
        
        #ui { 
            position: absolute; 
            top: 20px; 
            left: 20px; 
            z-index: 1000; 
            background: rgba(255,255,255,0.95); 
            padding: 16px; 
            border-radius: 12px; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            backdrop-filter: blur(10px);
            min-width: 220px;
        }
        
        #time-control { 
            position: absolute; 
            bottom: 40px; 
            left: 50%; 
            transform: translateX(-50%); 
            z-index: 1000; 
            background: rgba(255,255,255,0.95); 
            padding: 12px 24px; 
            border-radius: 50px; 
            display: flex; 
            align-items: center; 
            gap: 12px; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            backdrop-filter: blur(10px);
        }
        
        #particle-control {
            position: absolute;
            top: 20px;
            right: 20px;
            z-index: 1000;
            background: rgba(255,255,255,0.95);
            padding: 16px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            backdrop-filter: blur(10px);
            min-width: 220px;
        }
        
        .debug-box { 
            position: absolute; 
            bottom: 120px; 
            right: 20px; 
            z-index: 1000; 
            background: rgba(0,0,0,0.85); 
            color: #0f0; 
            padding: 14px; 
            font-family: 'Courier New', monospace; 
            font-size: 11px; 
            max-width: 280px; 
            border-radius: 8px; 
            line-height: 1.6;
            border: 1px solid #333;
        }
        
        button { 
            cursor: pointer; 
            border: none; 
            background: #3b82f6; 
            color: white; 
            padding: 8px 14px; 
            border-radius: 6px; 
            font-size: 12px; 
            font-weight: 500;
            transition: all 0.2s;
        }
        
        button:hover { 
            background: #2563eb; 
            transform: translateY(-1px);
        }
        
        button.active {
            background: #10b981;
        }
        
        .status-ok { color: #10b981; font-weight: bold; }
        .status-error { color: #ef4444; font-weight: bold; }
        
        .legend { 
            margin-top: 12px; 
            padding: 10px; 
            background: #f8fafc; 
            border-radius: 6px; 
            font-size: 11px; 
        }
        
        .color-info {
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 8px 0;
            font-size: 11px;
        }
        
        .color-sample {
            width: 40px;
            height: 16px;
            border-radius: 3px;
            border: 1px solid #ddd;
        }
        
        input[type="range"] {
            width: 100%;
            height: 6px;
            -webkit-appearance: none;
            background: #e5e7eb;
            border-radius: 3px;
            outline: none;
            margin: 8px 0;
        }
        
        input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 18px;
            height: 18px;
            background: #3b82f6;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        input[type="range"]::-moz-range-thumb {
            width: 18px;
            height: 18px;
            background: #3b82f6;
            border-radius: 50%;
            cursor: pointer;
            border: none;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        #timeSlider {
            width: 220px;
        }
        
        h3 { 
            font-size: 14px; 
            margin-bottom: 8px; 
            color: #1e293b;
            font-weight: 600;
        }
        
        .control-group {
            margin-bottom: 12px;
        }
        
        .control-group label {
            display: block;
            font-size: 11px;
            color: #64748b;
            margin-bottom: 4px;
            font-weight: 500;
        }
        
        .control-group .value {
            font-size: 12px;
            color: #1e293b;
            font-weight: 600;
        }
        
        .toggle-group {
            display: flex;
            gap: 8px;
            margin-bottom: 12px;
        }
        
        .toggle-group button {
            flex: 1;
            font-size: 11px;
            padding: 6px 10px;
        }
        
        .preset-group {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-bottom: 12px;
        }
        
        .preset-btn {
            font-size: 10px;
            padding: 6px 8px;
        }
    </style>
</head>
<body>

<div class="debug-box" id="debug" style="display: none;">
    <b>🔍 System Status:</b><br>
    <?php 
    echo "Data Points: <span class='" . (count($data) > 0 ? "status-ok" : "status-error") . "'>" . count($data) . "</span><br>";
    foreach($debugInfo as $info) {
        echo "• $info<br>";
    }
    ?>
    <div id="liveStats" style="margin-top: 8px; border-top: 1px solid #333; padding-top: 8px;">
        <span style="color: #fff;">Zoom: <b id="zoomLevel">6</b></span><br>
        <span style="color: #fff;">Particles: <b id="activeParticles">0</b></span><br>
        <span style="color: #fff;">FPS: <b id="fpsDisplay">0</b></span>
    </div>
    <div style="margin-top: 10px;">
        <button onclick="location.href='?refresh=1'">🔄 Refresh</button>
        <button onclick="toggleDebug()">✕ Hide</button>
    </div>
</div>

<div id="ui">
    <h3>🌬️ Wind Field</h3>
    <div id="status">
        Speed: <b>--</b> m/s<br>
        Direction: <b>--</b>°<br>
        Height: <b>--</b>m
    </div>
    <div class="color-info">
        <div class="color-sample" style="background: white;"></div>
        <span>Wind Particles</span>
    </div>
    <div class="color-info">
        <div class="color-sample" style="background: linear-gradient(90deg, #3b82f6, #10b981, #fbbf24);"></div>
        <span>Project Area</span>
    </div>
    <div class="legend">
        <b>Grid:</b> <span id="dataPoints">0</span> points<br>
        <b>Style:</b> Clean & Minimal
    </div>
</div>

<div id="particle-control">
    <h3>⚙️ Wind Controls</h3>
    
    <div class="preset-group">
        <button class="preset-btn active" onclick="applyPreset('light')">🪶 Light</button>
        <button class="preset-btn" onclick="applyPreset('classic')">🌬️ Classic</button>
        <button class="preset-btn" onclick="applyPreset('dense')">💨 Dense</button>
        <button class="preset-btn" onclick="applyPreset('minimal')">✨ Minimal</button>
    </div>
    
    <div class="control-group">
        <label>Particle Density: <span class="value" id="particleValue">2000</span></label>
        <input type="range" id="particleSlider" min="500" max="5000" step="100" value="2000">
    </div>
    
    <div class="control-group">
        <label>Trail Length: <span class="value" id="trailValue">70</span></label>
        <input type="range" id="trailSlider" min="30" max="120" step="5" value="70">
    </div>
    
    <div class="control-group">
        <label>Line Thickness: <span class="value" id="lineWidthValue">1.5</span></label>
        <input type="range" id="lineWidthSlider" min="0.5" max="2.5" step="0.1" value="1.5">
    </div>
    
    <div class="control-group">
        <label>Opacity: <span class="value" id="opacityValue">50%</span></label>
        <input type="range" id="opacitySlider" min="10" max="80" step="5" value="50">
    </div>
    
    <div class="toggle-group">
        <button onclick="toggleDebug()" id="debugBtn">📊 Debug</button>
    </div>
</div>

<div id="time-control">
    <button onclick="togglePlay()" id="playBtn">▶</button>
    <input type="range" id="timeSlider" min="0" max="23" value="0">
    <span id="timeDisplay" style="font-weight: 600; min-width: 70px;">00:00 UTC</span>
</div>

<div id="map"></div>
<canvas id="windCanvas"></canvas>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
const windGrid = <?php echo json_encode($data); ?>;

console.log("🌬️ Wind Grid:", windGrid.length, "points");

const map = L.map('map', {
    zoomControl: false,
    preferCanvas: true,
    zoomAnimation: true,
    fadeAnimation: true,
    markerZoomAnimation: true
}).setView([15.5, 101], 6);

L.control.zoom({ position: 'bottomright' }).addTo(map);

// Light basemap for visibility
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: 'Wind: Open-Meteo | Map: CartoDB',
    maxZoom: 12
}).addTo(map);

const canvas = document.getElementById('windCanvas');
const ctx = canvas.getContext('2d', { 
    alpha: true,
    desynchronized: true,
    willReadFrequently: false
});

let currentIndex = 0;
let playTimer = null;
let particles = [];
let particleCount = 2000;
let maxAge = 70;
let globalOpacity = 0.5;
let baseLineWidth = 1.5;

// Performance tracking
let lastFrameTime = Date.now();
let fps = 60;
let frameCount = 0;
let deltaTime = 0;

function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    
    ctx.scale(dpr, dpr);
    
    particles.forEach(p => {
        p.x = Math.random() * width;
        p.y = Math.random() * height;
        p.age = Math.random() * p.maxAge;
    });
}

window.addEventListener('resize', resize);
resize();

document.getElementById('dataPoints').innerText = windGrid.length;

// Wind interpolation
const windCache = new Map();
const CACHE_SIZE = 3000;

function getWindAt(lat, lng) {
    if (!windGrid || windGrid.length === 0) return { u: 0, v: 0, speed: 0, dir: 0, height: 0 };
    
    const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)},${currentIndex}`;
    if (windCache.has(cacheKey)) {
        return windCache.get(cacheKey);
    }
    
    let points = windGrid.map(p => {
        const dlat = lat - p.lat;
        const dlon = lng - p.lon;
        return {
            ...p,
            dist: Math.sqrt(dlat * dlat + dlon * dlon)
        };
    }).sort((a, b) => a.dist - b.dist).slice(0, 4);
    
    if(points.length === 0) return { u: 0, v: 0, speed: 0, dir: 0, height: 0 };
    
    let totalWeight = 0;
    let u = 0, v = 0, speed = 0, height = 0;
    
    points.forEach(p => {
        if(!p.hourly) return;
        
        const h = p.height;
        const speedKey = `wind_speed_${h}m`;
        const dirKey = `wind_direction_${h}m`;
        
        const s = p.hourly[speedKey]?.[currentIndex] || 0;
        const d = p.hourly[dirKey]?.[currentIndex] || 0;
        
        const weight = p.dist < 0.01 ? 1000 : 1 / Math.pow(p.dist, 2);
        const rad = (d - 90) * Math.PI / 180;
        
        u += Math.cos(rad) * s * weight;
        v += Math.sin(rad) * s * weight;
        speed += s * weight;
        height += h * weight;
        totalWeight += weight;
    });
    
    if(totalWeight > 0) {
        u /= totalWeight;
        v /= totalWeight;
        speed /= totalWeight;
        height /= totalWeight;
    }
    
    const dir = (Math.atan2(v, u) * 180 / Math.PI + 90 + 360) % 360;
    const result = { u, v, speed, dir, height };
    
    if (windCache.size > CACHE_SIZE) {
        const firstKey = windCache.keys().next().value;
        windCache.delete(firstKey);
    }
    windCache.set(cacheKey, result);
    
    return result;
}

// White particles (speed only affects opacity slightly)
function getParticleColor(speed) {
    const baseOpacity = 0.4;
    const speedBoost = Math.min(speed / 15, 0.3);
    return [255, 255, 255, baseOpacity + speedBoost];
}

function colorToRgba(color) {
    return `rgba(${Math.round(color[0])}, ${Math.round(color[1])}, ${Math.round(color[2])}, ${color[3] * globalOpacity})`;
}

// White particle class
class Particle {
    constructor() { 
        this.reset();
        this.vx = 0;
        this.vy = 0;
    }
    
    reset() {
        this.x = Math.random() * window.innerWidth;
        this.y = Math.random() * window.innerHeight;
        this.age = Math.random() * maxAge * 0.5;
        this.maxAge = maxAge;
        this.speed = 0;
        this.color = [255, 255, 255, 0.5];
        this.prevX = this.x;
        this.prevY = this.y;
        this.vx = 0;
        this.vy = 0;
    }
    
    update(dt) {
        const latlng = map.containerPointToLatLng([this.x, this.y]);
        const wind = getWindAt(latlng.lat, latlng.lng);
        
        if (wind.speed < 0.1) {
            this.age += 3 * dt;
            return;
        }
        
        const zoom = map.getZoom();
        const baseScale = Math.pow(2, zoom - 6);
        const speedScale = Math.min(wind.speed / 5, 1.5);
        const scale = baseScale * speedScale * 0.5;
        
        this.prevX = this.x;
        this.prevY = this.y;
        
        const targetVx = wind.u * scale;
        const targetVy = -wind.v * scale;
        const smoothing = 0.25;
        
        this.vx += (targetVx - this.vx) * smoothing;
        this.vy += (targetVy - this.vy) * smoothing;
        
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        this.speed = wind.speed;
        this.color = getParticleColor(wind.speed);
        
        const lifeRatio = this.age / this.maxAge;
        const fadeIn = Math.min(this.age / 10, 1);
        const fadeOut = 1 - Math.pow(lifeRatio, 2);
        const opacity = fadeIn * fadeOut;
        
        const lineWidth = baseLineWidth * (0.8 + (wind.speed / 25));
        
        ctx.strokeStyle = colorToRgba([
            this.color[0],
            this.color[1],
            this.color[2],
            this.color[3] * opacity
        ]);
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(this.prevX, this.prevY);
        ctx.lineTo(this.x, this.y);
        ctx.stroke();
        
        this.age += dt;
        
        if (this.age >= this.maxAge || 
            this.x < -100 || this.x > window.innerWidth + 100 || 
            this.y < -100 || this.y > window.innerHeight + 100) {
            this.reset();
        }
    }
}

function initParticles(count) {
    particles = Array.from({ length: count }, (_, i) => {
        const p = new Particle();
        p.age = (i / count) * maxAge;
        return p;
    });
}

initParticles(particleCount);

let animationId;
let isAnimating = true;
let lastTime = performance.now();

function animate(currentTime) {
    if (!isAnimating) {
        animationId = requestAnimationFrame(animate);
        return;
    }
    
    deltaTime = Math.min((currentTime - lastTime) / 16.67, 2);
    lastTime = currentTime;
    
    // Clear with slight transparency for trail effect
    ctx.fillStyle = 'rgba(232, 244, 248, 0.05)';
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    
    particles.forEach(p => p.update(deltaTime));
    
    frameCount++;
    const now = Date.now();
    if (now - lastFrameTime >= 1000) {
        fps = frameCount;
        frameCount = 0;
        lastFrameTime = now;
        document.getElementById('fpsDisplay').innerText = fps;
        document.getElementById('activeParticles').innerText = particles.length;
    }
    
    animationId = requestAnimationFrame(animate);
}

// Colored GeoJSON Layer
fetch('Boundary_of_project_GCS.json').then(r => r.json()).then(geo => {
    L.geoJSON(geo, {
        style: { 
            color: '#3b82f6',
            weight: 3, 
            fillOpacity: 0.15,
            fillColor: '#10b981',
            opacity: 0.8
        },
        onEachFeature: (f, l) => {
            l.on('click', (e) => {
                const wind = getWindAt(e.latlng.lat, e.latlng.lng);
                L.popup().setLatLng(e.latlng)
                    .setContent(`
                        <b>🌬️ Wind Data</b><br>
                        Speed: <b>${wind.speed.toFixed(2)}</b> m/s<br>
                        Direction: <b>${Math.round(wind.dir)}</b>°<br>
                        Height: <b>${Math.round(wind.height)}</b>m<br>
                        Time: ${currentIndex.toString().padStart(2, '0')}:00 UTC
                    `)
                    .openOn(map);
            });
        }
    }).addTo(map);
}).catch(() => console.log("GeoJSON optional"));

function updateUI() {
    const center = map.getCenter();
    const wind = getWindAt(center.lat, center.lng);
    document.getElementById('status').innerHTML = 
        `Speed: <b>${wind.speed.toFixed(1)}</b> m/s<br>Direction: <b>${Math.round(wind.dir)}</b>°<br>Height: <b>${Math.round(wind.height)}</b>m`;
}

function setTime(val) {
    currentIndex = parseInt(val);
    document.getElementById('timeDisplay').innerText = 
        currentIndex.toString().padStart(2, '0') + ":00 UTC";
    windCache.clear();
    updateUI();
}

document.getElementById('timeSlider').oninput = (e) => setTime(e.target.value);

// Presets
function applyPreset(type) {
    document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    switch(type) {
        case 'minimal':
            particleCount = 1000;
            maxAge = 50;
            baseLineWidth = 1.2;
            globalOpacity = 0.4;
            break;
        case 'light':
            particleCount = 2000;
            maxAge = 70;
            baseLineWidth = 1.5;
            globalOpacity = 0.5;
            break;
        case 'classic':
            particleCount = 3000;
            maxAge = 90;
            baseLineWidth = 1.7;
            globalOpacity = 0.6;
            break;
        case 'dense':
            particleCount = 4500;
            maxAge = 110;
            baseLineWidth = 1.9;
            globalOpacity = 0.65;
            break;
    }
    
    document.getElementById('particleSlider').value = particleCount;
    document.getElementById('particleValue').innerText = particleCount;
    document.getElementById('trailSlider').value = maxAge;
    document.getElementById('trailValue').innerText = maxAge;
    document.getElementById('lineWidthSlider').value = baseLineWidth;
    document.getElementById('lineWidthValue').innerText = baseLineWidth;
    document.getElementById('opacitySlider').value = Math.round(globalOpacity * 100);
    document.getElementById('opacityValue').innerText = Math.round(globalOpacity * 100) + '%';
    
    initParticles(particleCount);
    particles.forEach(p => p.maxAge = maxAge);
}

// Control handlers
document.getElementById('particleSlider').oninput = (e) => {
    particleCount = parseInt(e.target.value);
    document.getElementById('particleValue').innerText = particleCount;
    initParticles(particleCount);
};

document.getElementById('trailSlider').oninput = (e) => {
    maxAge = parseInt(e.target.value);
    document.getElementById('trailValue').innerText = maxAge;
    particles.forEach(p => p.maxAge = maxAge);
};

document.getElementById('lineWidthSlider').oninput = (e) => {
    baseLineWidth = parseFloat(e.target.value);
    document.getElementById('lineWidthValue').innerText = e.target.value;
};

document.getElementById('opacitySlider').oninput = (e) => {
    globalOpacity = parseInt(e.target.value) / 100;
    document.getElementById('opacityValue').innerText = e.target.value + '%';
};

function togglePlay() {
    if(playTimer) { 
        clearInterval(playTimer); 
        playTimer = null; 
        document.getElementById('playBtn').innerText = "▶"; 
    } else {
        document.getElementById('playBtn').innerText = "⏸";
        playTimer = setInterval(() => {
            currentIndex = (currentIndex + 1) % 24;
            document.getElementById('timeSlider').value = currentIndex;
            setTime(currentIndex);
        }, 1500);
    }
}

function toggleDebug() {
    const box = document.getElementById('debug');
    const btn = document.getElementById('debugBtn');
    if(box.style.display === 'none') {
        box.style.display = 'block';
        btn.innerText = '📊 Hide';
        btn.classList.add('active');
    } else {
        box.style.display = 'none';
        btn.innerText = '📊 Debug';
        btn.classList.remove('active');
    }
}

// Smooth zoom
let zoomTimeout;
map.on('zoomstart', () => {
    canvas.style.transition = 'opacity 0.2s';
    canvas.style.opacity = '0.4';
});

map.on('zoomend', () => {
    const zoom = map.getZoom();
    document.getElementById('zoomLevel').innerText = zoom.toFixed(1);
    windCache.clear();
    
    clearTimeout(zoomTimeout);
    zoomTimeout = setTimeout(() => {
        canvas.style.opacity = '1';
        particles.forEach(p => p.reset());
    }, 100);
});

// Smooth pan
map.on('movestart', () => {
    canvas.style.opacity = '0.6';
});

map.on('moveend', () => {
    canvas.style.opacity = '1';
    windCache.clear();
    updateUI();
});

// Start
requestAnimationFrame(animate);
setTime(0);

console.log("✓ Clean wind visualization ready - White particles on light map");
</script>
</body>
</html>