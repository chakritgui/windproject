'use strict';
const OPEN_METEO   = 'https://api.open-meteo.com/v1/forecast';
const WIND_REFRESH = 60_000;
const MENU_LEVELS = {
    1: { title: 'PROJECT', lang: 'project', endpoint: `${BASE_URL}/api/project.get`, key: 'project_id', label: 'project_name'},
    2: { title: 'WIND MEASUREMENT EQUIPMENT', lang: 'pole_types', endpoint: `${BASE_URL}/api/type.get`, key: 'type_id', label: 'type_name'},
    3: { title: 'INSTALLATION', lang: 'installation', endpoint: `${BASE_URL}/api/installations.get`, key: 'installations_id', label: 'installations_name', isLast: true}
};
const COMPASS_DIRS = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
let map, windyAPI;
let poleLayerGroup;
let poleMarkers        = {}; 
let menuState          = {};
let areaVisibility     = {};
let areaLayers         = {};
let maskLayer          = null;
let geoDataGlobal      = null;
let labelStyleEl       = null;
let currentPolygonLayer  = null;
let customPickerMarker = null;
let customPicker       = null;
let windOn             = true;
let focusOn            = false;
let windRefreshTimer   = null;
let isRefreshing       = false; 
let windSummary = { max: 0, min: 0 };
let show_country_line  = 'hide';
let country_layers_data = null;
let initialBounds = null;
let initialPadding = { padding: [20, 20] };
const isMobile = () => window.innerWidth <= 768;
const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
function degToCompass(deg) {
    return COMPASS_DIRS[Math.round(deg / 22.5) % 16];
}
function getLocalBool(key, fallback = false) {
    const val = localStorage.getItem(key);
    if (val === 'true')  return true;
    if (val === 'false') return false;
    return fallback;
}
async function fetchJSON(url, body = {}) {
    const res = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
    return res.json();
}
function hideWindLoading() {
    const el = document.getElementById('wind-loading');
    if (!el) return;
    el.style.pointerEvents = 'none';
    el.style.transition    = 'opacity 0.3s ease-out';
    el.style.opacity       = 0;
    el.addEventListener('transitionend', () => el.remove(), { once: true });
}
function initMap() {
    windyInit(options, async api => {
        windyAPI = api;
        map      = api.map;
        const { store, picker } = api;
        poleLayerGroup = L.layerGroup().addTo(map);
        store.set('overlay', 'wind');
        store.set('level', DEFAULT_LEVEL);
        const [masterResult, windAreaResult] = await Promise.allSettled([
            fetchJSON(`${BASE_URL}/api/master`),
            fetchJSON(`${BASE_URL}/api/wind.boundary`)
        ]);
        const masterData   = masterResult.status   === 'fulfilled' ? masterResult.value   : null;
        const windAreaData = windAreaResult.status  === 'fulfilled' ? windAreaResult.value : null;
        if (masterData)   applyMasterSettings(masterData);
        if (windAreaData) await renderWindAreas(picker, windAreaData, masterData);
        show_country_line   = masterData?.show_country_line;
        country_layers_data = masterData?.country_layers_data;
        const winds = getLocalBool('winds', true);
        windOn = winds;
        $('#toggle-wind-values').prop('checked', winds);
        await loadPoles();
        initWindUnit();
        const labelsRaw = localStorage.getItem('labels');
        const labels    = labelsRaw !== null ? labelsRaw === 'true' : (masterData?.labels === 'yes');
        toggleLabel(labels);
        $('#toggle-label').prop('checked', labels !== false);
        if (show_country_line === 'show' && country_layers_data) {
            _drawCountryLines(country_layers_data);
            const focus = getLocalBool('focus', false);
            toggleFocus(focus);
            $('#toggle-focus').prop('checked', focus);
        }
        _applyWindState(windOn);
    });
}
function _drawCountryLines(rawData) {
    try {
        const geoData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
        geoDataGlobal = geoData;
        L.geoJSON(geoData, {
            style: { color: '#161616', weight: 1, fillOpacity: 0, interactive: false }
        }).addTo(map);
    } catch (err) {
        console.error('Error drawing country lines:', err);
    }
}
function applyMasterSettings(master) {
    if (!master?.center_lat || !master?.center_lng) return;
    const lat  = parseFloat(master.center_lat);
    const lng  = parseFloat(master.center_lng);
    const zoom = clamp((parseInt(master.zoom_level) || 10) + 1, 1, 13);
    const headerEl = document.querySelector('header');
    const footerEl = document.querySelector('footer, #footer, .footer');
    const headerH = headerEl ? headerEl.getBoundingClientRect().height : 60;
    const footerH = footerEl ? footerEl.getBoundingClientRect().height : 36;
    const mapH       = window.innerHeight - headerH - footerH;
    const offsetPx   = (footerH - headerH) / 2; 
    map.setView([lat, lng], zoom);
    map.setMinZoom(zoom);
    if (offsetPx !== 0) {
        const centerPx = map.latLngToContainerPoint([lat, lng]);
        const adjusted = map.containerPointToLatLng(
            L.point(centerPx.x, centerPx.y + offsetPx)
        );
        map.setView(adjusted, zoom, { animate: false });
    }
}
function _applyWindState(isOn) {
    windOn = isOn;
    if (windyAPI?.store) {
        windyAPI.store.set('overlay', isOn ? 'wind' : 'none');
    }
    Object.values(poleMarkers).forEach(p => {
        p.labelMarker?.setOpacity(isOn ? 1 : 0);
    });
    $('#wind-status-icon').toggleClass('spinning', isOn);
    $('.map-wind-label').stop().fadeTo(300, isOn ? 1 : 0);
    clearInterval(windRefreshTimer);
    windRefreshTimer = null;
    if (isOn) {
        refreshAllWindData();
        windRefreshTimer = setInterval(refreshAllWindData, WIND_REFRESH);
    }
}
function toggleWind(isOn) {
    _applyWindState(isOn);
    localStorage.setItem('winds', String(isOn));
}
async function refreshAllWindData() {
    if (!windOn || isRefreshing) return;
    const entries = Object.entries(poleMarkers);
    if (entries.length === 0) return;
    isRefreshing = true;
    try {
        const lats = entries.map(([, p]) => p.lat).join(',');
        const lngs = entries.map(([, p]) => p.lng).join(',');
        const url = `${OPEN_METEO}?latitude=${lats}&longitude=${lngs}` +
                    `&current=wind_speed_100m,wind_direction_100m&wind_speed_unit=ms`;
        const res  = await fetch(url);
        if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
        const data = await res.json();
        const results    = Array.isArray(data) ? data : [data];
        const windSpeeds = [];
        entries.forEach(([id, p], i) => {
            const weather = results[i];
            if (!weather?.current) return;
            const unit  = getCurrentUnit();
            const speed = weather.current.wind_speed_100m;
            const dir   = weather.current.wind_direction_100m;
            windSpeeds.push(speed);
            const elArrow = document.getElementById(p.arrowId);
            const elSpeed = document.getElementById(p.windId);
            if (elSpeed) {
                elSpeed.dataset.raw = speed; 
                elSpeed.textContent = `${(speed * unit.factor).toFixed(1)} ${unit.label}`;
            }
            if (elArrow) {
                const cx = elArrow.getAttribute('data-cx');
                const cy = elArrow.getAttribute('data-cy');
                elArrow.setAttribute('transform', `rotate(${dir - 90}, ${cx}, ${cy})`);
            }
        });
        if (windSpeeds.length > 0) {
            const sum = windSpeeds.reduce((a, b) => a + b, 0);
            windSummary.max = Math.max(...windSpeeds);
            windSummary.min = Math.min(...windSpeeds);
            windSummary.avg = sum / windSpeeds.length;
            updateWindDashboard(windSummary);
        }
    } catch (err) {
        console.error('Wind refresh error:', err);
    } finally {
        isRefreshing = false;
    }
}
function updateWindDashboard({ max, min, avg }) {
    const unit = getCurrentUnit();
    document.querySelectorAll('.stat-unit-label').forEach(el => {
        el.textContent = unit.label;
    });
    $('.stat-max-wind-val').text((max * unit.factor).toFixed(1));
    $('.stat-min-wind-val').text((min * unit.factor).toFixed(1));
    $('.stat-avg-wind-val').text((avg * unit.factor).toFixed(1));
}
async function loadPoles() {
    const poles = await fetchJSON(`${BASE_URL}/api/poles.get`).catch(err => {
        console.error('loadPoles error:', err);
        return null;
    });
    if (!Array.isArray(poles)) return;
    poleLayerGroup.clearLayers();
    poleMarkers = {};
    window._usedLabelBoxes = [];
    for (const pole of poles) {
        const lat = parseFloat(pole.poles_lat);
        const lng = parseFloat(pole.poles_lng);
        if (isNaN(lat) || isNaN(lng)) continue;
        const marker = L.marker([lat, lng], { icon: _buildPoleIcon(pole) }).addTo(poleLayerGroup);
        marker.on('click', () => openPoles(pole.poles_id));
        const windId  = `wind-auto-${pole.poles_id}`;
        const arrowId = `arrow-${pole.poles_id}`;
        const off = getSmartOffset(lat, lng, window._usedLabelBoxes, map);
        const anchorX = off.dx >= 0 ? 0 : Math.abs(off.dx);
        const anchorY = off.dy >= 0 ? 0 : Math.abs(off.dy);
        const { svgW, svgH, html } = buildWindLabelSVG({ anchorX, anchorY, labelDx: off.dx, labelDy: off.dy, windId, arrowId });
        const labelMarker = L.marker([lat, lng], {
            icon: L.divIcon({ className: '', iconSize: [svgW, svgH], iconAnchor: [anchorX, anchorY], html }),
            interactive:  false,
            zIndexOffset: -10
        }).addTo(poleLayerGroup);
        if (!windOn) labelMarker.setOpacity(0);
        poleMarkers[pole.poles_id] = { marker, labelMarker, lat, lng, windId, arrowId };
    }
    if (windOn) refreshAllWindData();
}
function _buildPoleIcon(pole) {
    if (pole.type_icon?.trim()) {
        return L.icon({
            iconUrl:     pole.type_icon,
            iconSize:    [36, 36],
            iconAnchor:  [18, 36],
            popupAnchor: [0, -36]
        });
    }
    const isEven = pole.type_id % 2 === 0;
    const color  = isEven ? '#5bb8f5' : '#f39c12';
    const color2 = isEven ? '#2d7fc1' : '#d68910';
    const extra  = !isEven
        ? `<line x1="3" y1="14" x2="-5" y2="14" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round"/>
           <circle cx="-5" cy="14" r="1.8" fill="${color2}" stroke="#ffffff" stroke-width="0.8"/>`
        : '';
    return L.divIcon({
        className:  '',
        iconSize:   [20, 52],
        iconAnchor: [3, 50],
        html: `
        <svg width="20" height="52" viewBox="0 0 20 52" xmlns="http://www.w3.org/2000/svg"
             style="overflow:visible;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">
            <circle cx="3" cy="49" r="3.5" fill="rgba(255,255,255,0.85)" stroke="${color}" stroke-width="1.5"/>
            <line x1="3" y1="46" x2="3" y2="3" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>
            <line x1="3" y1="5"  x2="15" y2="5"  stroke="#ffffff" stroke-width="1.4" stroke-linecap="round"/>
            <line x1="3" y1="14" x2="11" y2="14" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round"/>
            ${extra}
            <circle cx="15" cy="5"  r="2.2" fill="${color}"  stroke="#ffffff" stroke-width="0.8"/>
            <circle cx="11" cy="14" r="1.8" fill="${color2}" stroke="#ffffff" stroke-width="0.8"/>
        </svg>`
    });
}
function buildWindLabelSVG({ anchorX, anchorY, labelDx, labelDy, windId, arrowId }) {
    const svgW = Math.abs(labelDx) + 90;
    const svgH = Math.abs(labelDy) + 30;
    const tipX = anchorX + labelDx;
    const tipY = anchorY + labelDy;
    const BOX_W = 70, BOX_H = 20;
    const boxY    = tipY - BOX_H / 2;
    const boxX    = labelDx >= 0 ? tipX : tipX - BOX_W;
    const arrowCX = boxX + 12;
    const arrowCY = tipY;
    const textX   = boxX + 22;
    return {
        svgW, svgH,
        html: `
        <svg width="${svgW}" height="${svgH}" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;pointer-events:none;display:block">
            <line x1="${anchorX}" y1="${anchorY}" x2="${tipX}" y2="${tipY}" stroke="rgba(255,255,255,0.5)" stroke-width="1" stroke-dasharray="4 3"/>
            <circle cx="${anchorX}" cy="${anchorY}" r="3" fill="rgba(255,255,255,0.7)"/>
            <rect x="${boxX}" y="${boxY}" width="${BOX_W}" height="${BOX_H}" rx="10" fill="#1a2535" fill-opacity="0.92"/>
            <g id="${arrowId}" data-cx="${arrowCX}" data-cy="${arrowCY}" transform="rotate(0, ${arrowCX}, ${arrowCY})">
                <text x="${arrowCX}" y="${arrowCY}" font-size="9" fill="#5bb8f5" text-anchor="middle" dominant-baseline="central">➤</text>
            </g>
            <text id="${windId}" x="${textX}" y="${arrowCY}" font-size="9" font-weight="700" fill="#ffffff" text-anchor="start" dominant-baseline="central">...</text>
        </svg>`
    };
}
const BASE_OFFSETS = [
    { dx:  70, dy: -50 }, { dx: -70, dy: -50 },
    { dx:  70, dy:  40 }, { dx: -70, dy:  40 },
    { dx:   0, dy: -80 }, { dx: 120, dy:   0 },
    { dx:-120, dy:   0 }
];
const LABEL_W = 70, LABEL_H = 24;
function getSmartOffset(lat, lng, usedBoxes, map) {
    const point = map.latLngToContainerPoint([lat, lng]);
    for (let step = 0; step < 8; step++) {
        for (const base of BASE_OFFSETS) {
            const off = { dx: base.dx + step * 40, dy: base.dy + step * 30 };
            const box = {
                left:   point.x + off.dx,
                right:  point.x + off.dx + LABEL_W,
                top:    point.y + off.dy - LABEL_H / 2,
                bottom: point.y + off.dy + LABEL_H / 2
            };
            if (!usedBoxes.some(b => isOverlapping(box, b))) {
                usedBoxes.push(box);
                return off;
            }
        }
    }
    return { dx: 100 + Math.random() * 50, dy: (Math.random() - 0.5) * 100 };
}
function isOverlapping(a, b) {
    return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
}
function handlePickerOpening(latlng, picker, polygonLayer) {
    picker?.close?.();
    if (polygonLayer) currentPolygonLayer = polygonLayer;
    openCustomPicker(latlng);
}
async function openCustomPicker(latlng) {
    closeCustomPicker();
    const lat = Number(latlng.lat);
    const lng = Number(latlng.lng ?? latlng.lon);
    if (isNaN(lat) || isNaN(lng)) return;
    const pickerIcon = L.divIcon({
        className: 'popupTop',
        iconSize:   [24, 60],
        iconAnchor: [4, 58],
        html: `
        <svg width="24" height="60" viewBox="0 0 24 60" xmlns="http://www.w3.org/2000/svg"
             style="overflow:visible;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.5))">
            <circle cx="4" cy="57" r="4" fill="rgba(255,255,255,0.9)" stroke="#1a2535" stroke-width="1.5"/>
            <line x1="4" y1="53" x2="4" y2="4" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
            <line x1="4" y1="6"  x2="18" y2="6"  stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="4" y1="16" x2="14" y2="16" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
            <circle cx="18" cy="6"  r="2.5" fill="#5bb8f5" stroke="#ffffff" stroke-width="1"/>
            <circle cx="14" cy="16" r="2"   fill="#5bb8f5" stroke="#ffffff" stroke-width="1"/>
            <line x1="4" y1="4" x2="4" y2="0" stroke="rgba(255,255,255,0.6)" stroke-width="1" stroke-dasharray="2 2"/>
        </svg>`
    });
    customPickerMarker = L.marker([lat, lng], { icon: pickerIcon, draggable: true, zIndexOffset: 1000 }).addTo(map);
    await updateCustomPickerPopup(lat, lng);
    let dragTimer = null;
    customPickerMarker.on('drag', e => {
        const pos = e.latlng;
        if (currentPolygonLayer && !isInsidePolygon(pos, currentPolygonLayer)) {
            customPickerMarker.setLatLng(clampToPolygon(pos, currentPolygonLayer));
            return;
        }
        clearTimeout(dragTimer);
        dragTimer = setTimeout(async () => {
            const ll = customPickerMarker.getLatLng();
            await updateCustomPickerPopup(ll.lat, ll.lng);
        }, 400);
    });
    customPickerMarker.on('dragend', async () => {
        const ll = customPickerMarker.getLatLng();
        await updateCustomPickerPopup(ll.lat, ll.lng);
    });
}
async function updateCustomPickerPopup(lat, lng) {
    const windData = await fetchWindAtPoint(lat, lng);
    const content  = buildPickerPopupHTML(lat, lng, windData);
    if (!customPickerMarker) return;
    if (!map.getPane('popupTop')) {
        map.createPane('popupTop');
        map.getPane('popupTop').style.zIndex = 1000;
    }
    if (!customPickerMarker.getPopup()) {
        customPickerMarker.bindPopup(content, {
            pane:        'popupTop',
            className:   'custom-wind-popup',
            offset:      L.point(0, -52),
            closeButton: false,
            autoClose:   false,
            closeOnClick: false,
            maxWidth:    280,
            minWidth:    210
        });
        customPickerMarker.openPopup();
        customPickerMarker.setZIndexOffset(10000);
        customPickerMarker.getPopup().on('remove', closeCustomPicker);
    } else {
        customPickerMarker.getPopup().setContent(content);
    }
    customPicker = customPickerMarker.getPopup();
}
async function fetchWindAtPoint(lat, lng) {
    try {
        const url = `${OPEN_METEO}?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}` +
                    `&current=wind_speed_100m,wind_direction_100m,wind_gusts_10m&wind_speed_unit=ms`;
        const res  = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return {
            speed:     data.current?.wind_speed_100m     ?? null,
            direction: data.current?.wind_direction_100m ?? null,
            gusts:     data.current?.wind_gusts_10m      ?? null
        };
    } catch (err) {
        console.error('fetchWindAtPoint error:', err);
        return { speed: null, direction: null, gusts: null };
    }
}
function buildPickerPopupHTML(lat, lng, { speed, direction, gusts }) {
    const compassDir  = direction !== null ? degToCompass(direction) : '—';
    const arrowRotate = direction ?? 0;
    const speedColor  = speed === null  ? '#aaa'
                      : speed < 3      ? '#4fc3f7'
                      : speed < 7      ? '#81c784'
                      : speed < 12     ? '#ffb74d'
                      :                  '#ef5350';
    const tickLines = Array.from({ length: 8 }, (_, i) => {
        const a  = (i * 45) * Math.PI / 180;
        const x1 = (36 + 28 * Math.sin(a)).toFixed(1);
        const y1 = (36 - 28 * Math.cos(a)).toFixed(1);
        const x2 = (36 + 32 * Math.sin(a)).toFixed(1);
        const y2 = (36 - 32 * Math.cos(a)).toFixed(1);
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>`;
    }).join('');
    const gustHtml = gusts !== null
        ? `<div class="cpicker-gust">
               <i class="fa-solid fa-wind" style="font-size:9px"></i>
               <span data-i18n="gusts">${langData['gusts'] || 'Gusts'}</span>
               ${gusts.toFixed(1)} m/s
           </div>`
        : '';
    return `
    <div class="cpicker-wrap">
        <div class="cpicker-header">
            <span class="cpicker-coords">${lat.toFixed(4)}, ${lng.toFixed(4)}</span>
            <button class="cpicker-close" onclick="closeCustomPicker()">✕</button>
        </div>
        <div class="cpicker-body">
            <div class="cpicker-compass-wrap">
                <svg width="50" height="50" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="36" cy="36" r="34"
                            fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
                    ${tickLines}
                    <text x="36" y="7"  text-anchor="middle" dominant-baseline="central" font-size="9" fill="rgba(255,255,255,0.5)">N</text>
                    <text x="36" y="67" text-anchor="middle" dominant-baseline="central" font-size="9" fill="rgba(255,255,255,0.5)">S</text>
                    <text x="65" y="36" text-anchor="middle" dominant-baseline="central" font-size="9" fill="rgba(255,255,255,0.5)">E</text>
                    <text x="7"  y="36" text-anchor="middle" dominant-baseline="central" font-size="9" fill="rgba(255,255,255,0.5)">W</text>
                    <g transform="rotate(${arrowRotate}, 36, 36)">
                        <line x1="36" y1="52" x2="36" y2="20" stroke="${speedColor}" stroke-width="2" stroke-linecap="round"/>
                        <polygon points="36,14 31,24 41,24" fill="${speedColor}"/>
                        <circle cx="36" cy="36" r="3" fill="${speedColor}" stroke="rgba(0,0,0,0.3)" stroke-width="1"/>
                    </g>
                </svg>
            </div>
            <div class="cpicker-values">
                <div class="cpicker-speed" style="color:${speedColor}">
                    ${speed !== null ? speed.toFixed(1) : '—'}<span class="cpicker-unit">m/s</span>
                </div>
                <div class="cpicker-dir-text">
                    ${compassDir}
                    ${direction !== null ? `<span class="cpicker-deg">${Math.round(direction)}°</span>` : ''}
                </div>
                ${gustHtml}
            </div>
        </div>
    </div>`;
}
function closeCustomPicker() {
    if (customPickerMarker) {
        map.removeLayer(customPickerMarker);
        customPickerMarker = null;
    }
    customPicker = null;
}
function isInsidePolygon(latlng, polygonLayer) {
    let inside = false;
    polygonLayer.eachLayer(layer => {
        if (layer.getBounds?.().contains(latlng)) {
            const lls = layer.getLatLngs?.();
            if (lls) inside = pointInLatLngs(latlng, lls[0]);
        }
    });
    return inside;
}
function pointInLatLngs(point, polygon) {
    let inside = false;
    const n = polygon.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = polygon[i].lat, yi = polygon[i].lng;
        const xj = polygon[j].lat, yj = polygon[j].lng;
        const hit = ((yi > point.lng) !== (yj > point.lng)) &&
                    (point.lat < (xj - xi) * (point.lng - yi) / (yj - yi) + xi);
        if (hit) inside = !inside;
    }
    return inside;
}
function clampToPolygon(latlng, polygonLayer) {
    let closest = null, minDist = Infinity;
    polygonLayer.eachLayer(layer => {
        const ring = layer.getLatLngs?.()?.[0];
        if (!ring) return;
        for (let i = 0; i < ring.length; i++) {
            const c = closestPointOnSegment(latlng, ring[i], ring[(i + 1) % ring.length]);
            const d = map.distance(latlng, c);
            if (d < minDist) { minDist = d; closest = c; }
        }
    });
    return closest ?? latlng;
}
function closestPointOnSegment(p, a, b) {
    const dx = b.lat - a.lat, dy = b.lng - a.lng;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return a;
    const t = clamp(((p.lat - a.lat) * dx + (p.lng - a.lng) * dy) / lenSq, 0, 1);
    return L.latLng(a.lat + t * dx, a.lng + t * dy);
}
async function renderWindAreas(picker, areaData, masterData) {
    const { polygons = [] } = areaData;
    if (polygons.length === 0) return;
    map.eachLayer(layer => {
        if (layer instanceof L.GeoJSON || (layer instanceof L.Polygon && layer._isMask)) {
            map.removeLayer(layer);
        }
    });
    const isMaskMode   = masterData?.polygon_visibility === 'close';
    const featureGroup = L.featureGroup();
    const allHoles     = [];
    polygons.forEach((area, i) => {
        if (!area.geo_data) return;
        try {
            const geoJsonData = JSON.parse(area.geo_data);
            const styleData   = JSON.parse(area.custom_style || '{}');
            const geoLayer = L.geoJSON(geoJsonData, {
                style: () => ({
                    fillColor:    styleData.fillColor   || '#3388ff',
                    fillOpacity:  styleData.fillOpacity !== undefined ? parseFloat(styleData.fillOpacity) : 0.2,
                    color:        styleData.color       || '#3388ff',
                    weight:       styleData.weight      !== undefined ? parseFloat(styleData.weight) : 2,
                    stroke:       true,
                    opacity:      1,
                    interactive:  true
                })
            });
            areaLayers[i] = geoLayer;
            geoLayer.on('touchend click', function (e) {
                if (!e.latlng) return;
                e.originalEvent?.stopImmediatePropagation();
                e.originalEvent?.preventDefault();
                highlightAreaItem(i);
                if (e.target.getBounds) {
                    map.flyToBounds(e.target.getBounds(), { padding: [50, 50], duration: 0.8 });
                    map.once('moveend', () => handlePickerOpening(e.latlng, picker, e.target));
                }
            });
            geoLayer.addTo(featureGroup);
            if (isMaskMode) {
                geoLayer.eachLayer(layer => {
                    const lls = layer.getLatLngs?.();
                    if (!lls) return;
                    const rings = Array.isArray(lls[0]) && !(lls[0][0] instanceof L.LatLng)
                        ? lls.map(inner => inner[0])
                        : [lls[0]];
                    allHoles.push(...rings);
                });
            }
        } catch (err) {
            console.error('Area JSON parse error:', err);
        }
    });
    if (isMaskMode && allHoles.length > 0) {
        const world = [[90, -180], [90, 180], [-90, 180], [-90, -180]];
        L.polygon([world, ...allHoles], {
            fillColor:   '#C0C0C0',
            fillOpacity: 0.75,
            stroke:      false,
            interactive: false,
            _isMask:     true
        }).addTo(map).bringToBack();
    }
    featureGroup.addTo(map).bringToFront();
    const bounds = featureGroup.getBounds();
    if (bounds.isValid()) {
        const padded = bounds.pad(0.1);
        initialBounds  = bounds;
        initialPadding = { padding: [20, 20] };
        map.fitBounds(bounds, { padding: [20, 20] });
        map.options.minZoom = map.getBoundsZoom(bounds);
        map.setMaxBounds(padded);
        map.on('drag',    () => map.panInsideBounds(padded, { animate: false }));
        map.on('moveend', () => { if (!padded.contains(map.getCenter())) map.panInsideBounds(padded, { animate: true }); });
    }
    buildAreaPanel(polygons);
}
function resetView() {
    if (!initialBounds) return;
    map.flyToBounds(initialBounds, {
        ...initialPadding,
        duration: 0.8
    });
}
function buildAreaPanel(polygons) {
    const list = document.getElementById('ap-list');
    if (!list) return;
    if (!polygons?.length) {
        list.innerHTML = `
            <div class="p-4 text-center">
                <i class="fa-solid fa-folder-open d-block mb-2 opacity-20" style="font-size:24px"></i>
                <div class="small text-muted">${langData['no_data_found'] || 'No data available'}</div>
            </div>`;
        return;
    }
    list.innerHTML = polygons.map((area, i) => {
        const color     = area.area_status_color || '#3388ff';
        const hasStatus = !!area.area_status_color;
        areaVisibility[i] = true;
        return `
        <div class="ap-item animate__animated animate__fadeInUp" id="ap-item-${i}" data-index="${i}"
             style="animation-delay:${i * 0.05}s">
            <i class="fa-solid fa-circle-dot ${hasStatus ? 'status-pulse' : ''} me-2" style="color:${color}"></i>
            <span class="ap-name" title="${area.area_name}">${area.area_name}</span>
        </div>`;
    }).join('');
    list.querySelectorAll('.ap-item').forEach(el => {
        el.addEventListener('click', function () {
            const i = parseInt(this.dataset.index);
            if (!areaVisibility[i]) return;
            flyToArea(i, polygons[i]);
            highlightAreaItem(i);
        });
    });
}
function flyToArea(index, area) {
    const layer = areaLayers[index];
    if (!layer) return;
    const bounds = layer.getBounds();
    if (bounds.isValid()) {
        map.flyToBounds(bounds, { padding: [40, 40], duration: 1.2, easeLinearity: 0.1 });
        openProject(area.project_id);
    }
}
function highlightAreaItem(index) {
    document.querySelectorAll('.ap-item').forEach(el => el.classList.remove('active'));
    document.getElementById(`ap-item-${index}`)?.classList.add('active');
}
function toggleAreaPanel() {
    document.getElementById('area-panel')?.classList.toggle('collapsed');
}
document.getElementById('area-panel-toggle')?.addEventListener('click', toggleAreaPanel);
function createMaskLayer(geoData) {
    if (!geoData) return null;
    const world = [[-90, -180], [-90, 180], [90, 180], [90, -180]];
    const holes  = [];
    geoData.features.forEach(f => {
        const coords = f.geometry.coordinates;
        if (f.geometry.type === 'Polygon') {
            holes.push(coords[0].map(c => [c[1], c[0]]));
        } else if (f.geometry.type === 'MultiPolygon') {
            coords.forEach(poly => holes.push(poly[0].map(c => [c[1], c[0]])));
        }
    });
    return L.polygon([world, ...holes], {
        color:       'transparent',
        fillColor:   '#000',
        fillOpacity: 0.5,
        interactive: false
    });
}
function toggleFocus(isOn) {
    focusOn = isOn;
    if (maskLayer) { map.removeLayer(maskLayer); maskLayer = null; }
    if (isOn && geoDataGlobal) {
        maskLayer = createMaskLayer(geoDataGlobal);
        maskLayer.addTo(map);
    }
}
function toggleLabel(isOn) {
    if (!labelStyleEl) {
        labelStyleEl = document.getElementById('hide-labels-style') || (() => {
            const el = document.createElement('style');
            el.id = 'hide-labels-style';
            document.head.appendChild(el);
            return el;
        })();
    }
    labelStyleEl.innerHTML = isOn ? '' : `
        .leaflet-label-pane,.windy-layer-labels,.labels-layer {
            display:none!important;pointer-events:none!important;
        }
        canvas.vector-field-layer { display:block!important; }`;
}
async function loadMenuLevel(level) {
    const cfg = MENU_LEVELS[level];
    if (!cfg) return;
    for (let i = level; i <= 3; i++) $(`#menu-level-${i}`).removeClass('active').hide().empty();
    const data = await fetchJSON(cfg.endpoint, menuState).catch(() => []);
    if (!data.length) return;
    let html = `<div class="menu-header" data-i18n="${cfg.lang}">${langData[cfg.lang] || cfg.title}</div>`;
    data.forEach(item => {
        const label = item[cfg.label].replace(/\r\n|\n/g, '<br />');
        if (cfg.isLast) {
            html += `<div class="menu-item station-item" onclick="handleStationClick(${item.poles_lat},${item.poles_lng},${item.poles_id},this)">
                         <span>${label}</span>
                         <i class="fa-solid fa-location-dot text-info"></i>
                     </div>`;
        } else {
            html += `<div class="menu-item" onclick="selectItem(${level},${item[cfg.key]},this)">
                         <span>${label}</span>
                         <i class="fa-solid fa-chevron-right"></i>
                     </div>`;
        }
    });
    const panel = $(`#menu-level-${level}`);
    panel.html(html).addClass('active').fadeIn();
    if (isMobile()) panel[0].scrollIntoView({ behavior: 'smooth' });
}
function selectItem(level, id, el) {
    $(el).addClass('selected').siblings().removeClass('selected');
    menuState[MENU_LEVELS[level].key] = id;
    loadMenuLevel(level + 1);
}
function handleStationClick(lat, lng, id, el) {
    if (isNaN(lat) || isNaN(lng)) return;
    $('.station-item').removeClass('selected');
    $(el).addClass('selected');
    if (windyAPI?.picker) handlePickerOpening({ lat, lng }, windyAPI.picker);
    $('.menu-panel').fadeOut();
    openPoles(id);
}
$('#mapFilter').on('click', function (e) {
    e.stopPropagation();
    const firstPanel = $('#menu-level-1');
    if (firstPanel.is(':visible')) {
        $('.menu-panel').fadeOut();
    } else {
        menuState = {};
        loadMenuLevel(1);
    }
});
$(document).on('click', () => $('.menu-panel').fadeOut());
$('.menu-panel').on('click', e => e.stopPropagation());
async function openPoles(poleId) {
    const $modal  = $('#windModal');
    const $dialog = $modal.find('.modal-dialog');
    const $body   = $modal.find('.modal-body');
    const $header = $modal.find('.modal-header');
    const $footer = $modal.find('.modal-footer');
    $dialog.removeClass('modal-fullscreen');
    $header.html(`
        <h5 class="modal-title"></h5>
        <div class="ms-auto d-flex align-items-center gap-2">
            <button type="button" class="btn btn-sm poles-ctrl-btn" id="btn-fullscreen" title="Fullscreen">
                <i class="fa-regular fa-window-maximize"></i>
            </button>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>`);
    $body.html(`
        <div class="poles-skeleton">
            <div class="sk-cover"></div>
            <div style="padding:24px 20px">
                <div class="sk-line" style="width:55%;height:22px;margin-bottom:10px"></div>
                <div class="sk-line" style="width:28%;height:14px;margin-bottom:24px"></div>
                <div class="sk-line" style="height:12px;margin-bottom:8px"></div>
                <div class="sk-line" style="height:12px;margin-bottom:8px"></div>
                <div class="sk-line" style="width:80%;height:12px"></div>
            </div>
        </div>`);
    $footer.html(`
        <button type="button" class="poles-btn-primary" onclick="openFilterModal(${poleId})" data-i18n="view_report"></button>
        <button type="button" class="poles-btn-ghost" data-bs-dismiss="modal" data-i18n="close"></button>`);
    bootstrap.Modal.getOrCreateInstance($modal[0]).show();
    $modal.find('#btn-fullscreen').off('click').on('click', function () {
        $dialog.toggleClass('modal-fullscreen');
        $(this).find('i').toggleClass('fa-window-maximize fa-window-restore');
    });
    try {
        const res  = await fetch(`${BASE_URL}/api/poles.info`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ id: poleId })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const data = json.poles_id ? json : json.data;
        if (!data?.poles_id) {
            $body.html(renderErrorAlert('warning', langData['no_data_found'] || 'No data found'));
            return;
        }
        const lang     = typeof currentLang !== 'undefined' ? currentLang : 'th';
        const fullBase = BASE_URL.replace(/\/$/, '');
        const hasContent = !!data.content;
        const title      = hasContent ? (data.content.title[lang] || data.content.title['th']) : data.installations_name;
        let bodyContent = '';
        if (hasContent && data.content?.content) {
            const co  = data.content.content;
            const ord = [lang, ...['en', 'lo', 'th'].filter(l => l !== lang)];
            for (const l of ord) {
                if (co[l]?.trim()) { bodyContent = co[l]; break; }
            }
        }
        bodyContent = bodyContent.replace(/src="(?!(http|https|\/\/))/g, `src="${fullBase}/`);
        const bg       = data.project_bg || {};
        const projBg   = bg.project_background;
        const opacity  = bg.project_opacity > 0 ? bg.project_opacity / 100 : 1;
        const fadeVal  = 1 - opacity;
        const bgStyle  = projBg
            ? `background-image:linear-gradient(rgba(255,255,255,${fadeVal}),rgba(255,255,255,${fadeVal})),url('${fullBase}/${projBg}');background-size:cover;background-position:top center;background-repeat:no-repeat;`
            : '';
        const coverHtml = (hasContent && data.content?.cover && data.content?.cover_display === 'yes')
            ? `<div class="poles-cover-wrap">
                   <img src="${fullBase}/${data.content.cover}" alt="cover" loading="lazy" class="poles-cover-img">
                   <div class="poles-cover-overlay"></div>
               </div>`
            : '';
        const chip = (iconClass, color, labelKey, value) => `
            <div class="poles-chip">
                <div class="poles-chip-icon" style="color:${color}"><i class="${iconClass}"></i></div>
                <div>
                    <div class="poles-chip-label" data-i18n="${labelKey}"></div>
                    <div class="poles-chip-value">${value}</div>
                </div>
            </div>`;
        $body.html(`
        <div class="poles-detail animate__animated animate__fadeIn">
            <div class="poles-header-card">
                <div class="poles-header-left">
                    <div class="poles-avatar"><i class="fas fa-broadcast-tower"></i></div>
                    <div>
                        <div class="poles-name">
                            ${data.installations_name}
                            <span class="poles-code">#${data.poles_code}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="poles-chips">
                ${chip('fa-solid fa-diagram-project', '#2d7fc1', 'project',  data.project_name)}
                ${chip('fa-solid fa-arrows-alt-v',    '#0891b2', 'level',    data.height_name)}
                ${chip('fa-solid fa-map-marker-alt',  '#059669', 'location', `${data.poles_lat}, ${data.poles_lng}`)}
            </div>
            <div class="poles-content-section" style="${bgStyle}">
                ${data.content_id ? `
                    ${coverHtml}
                    ${data.content.presentation?.length ? renderPresentationShow(data.content.presentation) : ''}
                    <article class="poles-article">
                        <h4 class="poles-article-title">${title}</h4>
                        <div class="poles-article-meta">
                            <i class="fa-regular fa-calendar-check"></i>
                            ${data.updated_at || data.created_at || ''}
                        </div>
                        <div class="poles-article-body article-content">${bodyContent}</div>
                    </article>
                    <div class="multimedia-container px-1">${renderMultimedia(data.content, lang, fullBase)}</div>
                ` : `
                    ${!projBg ? `
                        <div class="poles-empty">
                            <i class="fa-regular fa-file-lines"></i>
                            <div class="poles-empty-title">${langData['no_content_available'] || 'No content available'}</div>
                            <div class="poles-empty-sub">${langData['content_nothing_hear'] || "It looks like there's nothing here."}</div>
                        </div>` : '<div style="padding:40px 0"></div>'}
                `}
            </div>
        </div>`);
        $header.find('.modal-title').html(`
            <span class="project-status">
                <i class="fa-solid fa-circle-dot status-pulse me-2"
                   style="color:${data.project_status_color || '#ccc'};font-size:0.8em"></i>
                <span class="fw-bold" style="font-size:0.9rem;color:#444">
                    ${data.project_status_name || '—'}
                </span>
            </span>`);
        if (typeof updateText === 'function') updateText($body[0]);
        $body.find('.article-content img').each(function () {
            const $img = $(this);
            const src  = $img.attr('src');
            if (!src) return;
            $img.removeAttr('width height');
            let style = ($img.attr('style') || '')
                .replace(/width\s*:\s*[^;]+;?/gi, '')
                .replace(/height\s*:\s*[^;]+;?/gi, '');
            $img.attr({ style: style.trim(), loading: 'lazy' });
            if (!$img.parent('a').length) {
                $img.wrap(`<a href="${src}" data-fancybox="content-images" class="content-img-link"></a>`);
            }
            $img.css({ cursor: 'zoom-in', transition: 'opacity 0.2s' }).addClass('hover-opacity');
        });
        if (typeof Fancybox !== 'undefined') {
            Fancybox.bind('[data-fancybox]', {
                Hash:    false,
                Toolbar: { display: { left: ['infobar'], right: ['close'] } }
            });
        }
    } catch (err) {
        console.error('openPoles error:', err);
        $body.html(renderErrorAlert('danger', langData['cannot_load'] || 'Failed to load data. Please try again later.'));
    }
}
function renderMultimedia(content, lang, baseUrl) {
    if (!content) return '';
    let html = '';
    if (content.images360?.length) {
        html += `
        <div class="mm-section">
            <div class="mm-section-header">
                <div class="mm-section-icon" style="background:rgba(6,182,212,0.12);color:#0891b2">
                    <i class="fa-solid fa-street-view"></i>
                </div>
                <span>${langData['vr_experience'] || '360° Experience'}</span>
            </div>
            <div class="mm-grid">
                ${content.images360.map(vr => `
                    <div class="mm-thumb" onclick="openVRModal('${baseUrl}/${vr.url}')">
                        <img src="${baseUrl}/${vr.url}" loading="lazy">
                        <div class="mm-vr-badge"><i class="fa-solid fa-rotate fa-spin"></i> 360°</div>
                        <div class="mm-thumb-overlay"><i class="fa-solid fa-expand"></i></div>
                    </div>`).join('')}
            </div>
        </div>`;
    }
    if (content.images?.length) {
        html += `
        <div class="mm-section">
            <div class="mm-section-header">
                <div class="mm-section-icon" style="background:rgba(45,127,193,0.12);color:#2d7fc1">
                    <i class="fa-solid fa-images"></i>
                </div>
                <span>${langData['gallery'] || 'Gallery'}</span>
            </div>
            <div class="mm-grid">
                ${content.images.map(img => `
                    <a href="${baseUrl}/${img.url}" data-fancybox="pole-gallery" class="mm-thumb">
                        <img src="${baseUrl}/${img.url}" loading="lazy">
                        <div class="mm-thumb-overlay"><i class="fa-solid fa-magnifying-glass-plus"></i></div>
                    </a>`).join('')}
            </div>
        </div>`;
    }
    if (content.attachments?.length) {
        html += `
        <div class="mm-section">
            <div class="mm-section-header">
                <div class="mm-section-icon" style="background:rgba(220,38,38,0.10);color:#dc2626">
                    <i class="fa-solid fa-paperclip"></i>
                </div>
                <span>${langData['attachments'] || 'Attachments'}</span>
            </div>
            <div class="mm-attachments">
                ${content.attachments.map(file => {
                    const isPdf = file.url.toLowerCase().endsWith('.pdf');
                    const ext   = file.url.split('.').pop().toUpperCase();
                    return `
                    <a href="${baseUrl}/${file.url}" download class="mm-att-item">
                        <div class="mm-att-icon ${isPdf ? 'mm-att-pdf' : 'mm-att-file'}">
                            <i class="fa-solid ${isPdf ? 'fa-file-pdf' : 'fa-file-lines'}"></i>
                        </div>
                        <div class="mm-att-info">
                            <div class="mm-att-name">${file.name}</div>
                            <div class="mm-att-ext">${ext} File</div>
                        </div>
                        <div class="mm-att-dl"><i class="fa-solid fa-download"></i></div>
                    </a>`;
                }).join('')}
            </div>
        </div>`;
    }
    return html;
}
async function openProject(project_id) {
    if (!project_id) return;
    try {
        const res  = await fetch(`${BASE_URL}/api/project.poles`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ project_id })
        });
        const data = await res.json();
        if (!data?.poles?.length) {
            console.warn('No poles data for project', project_id);
            return;
        }
        document.getElementById('pp-name').textContent  = data.project_name || 'Unknown Project';
        document.getElementById('pp-count').textContent = data.poles.length;
        const statusColor = data.status_color || '#ccc';
        const statusName  = (data.project_status || 'UNKNOWN').toUpperCase();
        const dot  = document.getElementById('pp-status-dot');
        const pill = document.getElementById('pp-status');
        dot.style.backgroundColor  = statusColor;
        pill.style.backgroundColor = statusColor;
        pill.style.color           = '#fff';
        pill.textContent           = statusName;
        document.getElementById('pp-body').innerHTML = data.poles.map(p => {
            const isEven = p.type_id % 2 === 0;
            const color  = isEven ? '#5bb8f5' : '#f39c12';
            const color2 = isEven ? '#2d7fc1' : '#d68910';
            const extra  = !isEven
                ? `<line x1="3" y1="14" x2="-5" y2="14" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round"/>
                   <circle cx="-5" cy="14" r="1.8" fill="${color2}" stroke="#ffffff" stroke-width="0.8"/>`
                : '';
            return `
            <div class="pole-row" onclick="openPoles(${p.poles_id})">
                <div class="pole-index">
                    <svg width="20" height="52" viewBox="0 0 20 52" xmlns="http://www.w3.org/2000/svg"
                         style="overflow:visible;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">
                        <circle cx="3" cy="49" r="3.5" fill="rgba(255,255,255,0.85)" stroke="${color}" stroke-width="1.5"/>
                        <line x1="3" y1="46" x2="3" y2="3"  stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>
                        <line x1="3" y1="5"  x2="15" y2="5"  stroke="#ffffff" stroke-width="1.4" stroke-linecap="round"/>
                        <line x1="3" y1="14" x2="11" y2="14" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round"/>
                        ${extra}
                        <circle cx="15" cy="5"  r="2.2" fill="${color}"  stroke="#ffffff" stroke-width="0.8"/>
                        <circle cx="11" cy="14" r="1.8" fill="${color2}" stroke="#ffffff" stroke-width="0.8"/>
                    </svg>
                </div>
                <div class="pole-info">
                    <div class="pole-title">
                        <strong>${p.type_name || 'N/A'}</strong>
                        <div class="small">${p.installations_name || 'N/A'}</div>
                    </div>
                    <div class="pole-coords"><i class="fa-solid fa-location-dot me-1"></i>${p.lat}° N, ${p.lng}° E</div>
                    <div class="pole-bar-wrap">
                        <div class="pole-bar" id="bar-${p.poles_id}"
                             style="width:0%;transition:width 0.6s ease,background-color 0.3s"></div>
                    </div>
                </div>
                <div class="pole-wind-box">
                    <i class="fa-solid fa-location-arrow wind-arrow" id="wind-arrow-${p.poles_id}"></i>
                    <span class="pole-wind" id="wind-val-${p.poles_id}">-- <small>m/s</small></span>
                </div>
            </div>`;
        }).join('');
        bootstrap.Offcanvas.getOrCreateInstance(document.getElementById('projectCanvas')).show();
        const lats       = data.poles.map(p => p.lat).join(',');
        const lngs       = data.poles.map(p => p.lng).join(',');
        const weatherRes = await fetch(`${OPEN_METEO}?latitude=${lats}&longitude=${lngs}&current=wind_speed_100m&wind_speed_unit=ms`);
        const weatherData = await weatherRes.json();
        const results     = Array.isArray(weatherData) ? weatherData : [weatherData];
        let totalWind = 0;
        data.poles.forEach((p, i) => {
            const speed = results[i]?.current?.wind_speed_100m || 0;
            totalWind  += speed;
            const elWind  = document.getElementById(`wind-val-${p.poles_id}`);
            const elArrow = document.getElementById(`wind-arrow-${p.poles_id}`);
            const elBar   = document.getElementById(`bar-${p.poles_id}`);
            if (!elWind || !elBar) return;
            const windClass = speed > 15 ? 'wind-high' : speed > 10 ? 'wind-warn' : 'wind-ok';
            const barColor  = speed > 15 ? '#dc3545'  : speed > 10 ? '#ffc107'  : '#28a745';
            elWind.className  = `pole-wind ${windClass}`;
            if (elArrow) elArrow.className = `wind-arrow ${windClass}`;
            elWind.innerHTML  = `${speed.toFixed(1)} <small>m/s</small>`;
            const pct = Math.min((speed / 25) * 100, 100);
            requestAnimationFrame(() => {
                elBar.style.width           = `${pct}%`;
                elBar.style.backgroundColor = barColor;
            });
        });
        document.getElementById('pp-avg-wind').textContent =
            `${(totalWind / data.poles.length).toFixed(1)} m/s`;
    } catch (err) {
        console.error('openProject error:', err);
    }
}
$(document).ready(function () {
    const $panel   = $('#sideControlPanel');
    const $fab     = $('#fabToggle');
    const $overlay = $('#panelOverlay');
    const toggleMobileMenu = (forceState = null) => {
        const open = forceState !== null ? forceState : !$panel.hasClass('active');
        $panel.toggleClass('active', open);
        $overlay.toggle(open);
        $('body').css('overflow', open ? 'hidden' : '');
    };
    $fab.on('click', e => { e.stopPropagation(); toggleMobileMenu(); });
    $overlay.on('click', () => toggleMobileMenu(false));
    $(document).on('click', e => {
        if ($(window).width() <= 768 && $panel.hasClass('active') &&
            !$panel.is(e.target) && !$panel.has(e.target).length && !$fab.is(e.target)) {
            toggleMobileMenu(false);
        }
    });
    let touchStartY = 0;
    $('.drag-handle')
        .on('touchstart', e => { touchStartY = e.originalEvent.touches[0].clientY; })
        .on('touchmove',  e => {
            if (e.originalEvent.touches[0].clientY - touchStartY > 50 && $panel.hasClass('active')) {
                toggleMobileMenu(false);
            }
        });
    const $expandBtn = $('#toggleExpandBtn');
    const toggleExpand = (force = null) => {
        const expanded = force !== null ? force : !$panel.hasClass('expanded');
        $panel.toggleClass('expanded', expanded);
    };
    $expandBtn.on('click', () => toggleExpand());
    toggleExpand(true);
    $('#toggle-wind-values').on('change', function () {
        toggleWind($(this).is(':checked'));
    });
    $('#toggle-focus').on('change', function () {
        const isOn = $(this).is(':checked');
        toggleFocus(isOn);
        localStorage.setItem('focus', isOn);
    });
    $('#toggle-label').on('change', function () {
        const isOn = $(this).is(':checked');
        toggleLabel(isOn);
        localStorage.setItem('labels', isOn ? 'true' : 'false');
    });
    $(window).on('resize', () => {
        if ($(window).width() > 768 && $panel.hasClass('active')) toggleMobileMenu(false);
    });
});
$(document).ready(function () {
    $('header, #ui, #sideControlPanel, #projectCanvas').hide();
    const $panel = $('#area-panel');
    $panel.addClass('collapsed').css('opacity', '0');
    setTimeout(initMap, 3500);
    setTimeout(() => {
        $('header, #ui, #sideControlPanel, #projectCanvas').fadeIn(400);
        $panel.show();
        requestAnimationFrame(() => {
            $panel.css({ opacity: '1', transition: 'all 0.6s cubic-bezier(0.34,1.56,0.64,1)' });
            if (!isMobile()) $panel.removeClass('collapsed');
        });
    }, 5000);
    setTimeout(hideWindLoading, 6000);
});
Fancybox.bind("[data-fancybox='gallery']", {
    Hash:    false,
    Thumbs:  { autoStart: false },
    Toolbar: {
        display: { left: ['infobar'], middle: [], right: ['iterateZoom', 'close'] }
    }
});
const WIND_UNITS = [
    { key: 'ms',   label: 'm/s',  factor: 1       },
    { key: 'kmh',  label: 'km/h', factor: 3.6     },
    { key: 'knot', label: 'kn',   factor: 1.94384 },
];
let currentUnitIdx = (() => {
    const saved = localStorage.getItem('windUnit');
    return saved !== null ? parseInt(saved) : 0;
})();
function getCurrentUnit() {
    return WIND_UNITS[currentUnitIdx];
}
function cycleWindUnit() {
    currentUnitIdx = (currentUnitIdx + 1) % WIND_UNITS.length;
    localStorage.setItem('windUnit', currentUnitIdx);
    const unit = getCurrentUnit();
    document.getElementById('btn-wind-unit').textContent     = unit.label;
    document.getElementById('legend-unit-label').textContent = unit.label;
    [0, 5, 10, 15, 20].forEach((ms, i) => {
        const id  = ['legend-0','legend-5','legend-10','legend-15','legend-20'][i];
        const el  = document.getElementById(id);
        if (!el) return;
        el.textContent = i === 4
            ? `${Math.round(ms * unit.factor)}+`
            : Math.round(ms * unit.factor);
    });
    updateWindDashboardUnit(unit);
    Object.values(poleMarkers).forEach(p => {
        const el = document.getElementById(p.windId);
        if (!el) return;
        const ms = parseFloat(el.dataset.raw);
        if (isNaN(ms)) return;
        el.textContent = `${(ms * unit.factor).toFixed(1)} ${unit.label}`;
    });
}
function initWindUnit() {
    document.getElementById('btn-wind-unit').textContent = getCurrentUnit().label;
}
function updateWindDashboardUnit(unit) {
    document.querySelectorAll('.stat-unit-label').forEach(el => {
        el.textContent = unit.label;
    });
    const max = windSummary.max ?? 0;
    const min = windSummary.min ?? 0;
    const avg = windSummary.avg ?? 0;
    $('.stat-max-wind-val').text((max * unit.factor).toFixed(1));
    $('.stat-min-wind-val').text((min * unit.factor).toFixed(1));
    $('.stat-avg-wind-val').text((avg * unit.factor).toFixed(1));
}