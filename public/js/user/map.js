let map, windyAPI;
let poleLayerGroup;
let windOn = true;
let poleMarkers = {};
let windUpdateFunctions = {};
let menuState = {};
let show_country_line = 'hide';
let map_labels = 'yes';
let country_layers_data = null;
const isMobile = () => window.innerWidth <= 768;
function initMap() {
    windyInit(options, async api => {
        windyAPI = api;
        map = api.map;
        const { store, picker } = api;
        poleLayerGroup = L.layerGroup().addTo(map);
        store.set('overlay', 'wind');
        store.set('level', DEFAULT_LEVEL);
        try {
            const results = await Promise.allSettled([
                fetchData(`${BASE_URL}/api/master`),
                fetchData(`${BASE_URL}/api/wind.boundary`),
                loadPoles()
            ]);
            const masterData = results[0].status === 'fulfilled' ? results[0].value : null;
            const windAreaData = results[1].status === 'fulfilled' ? results[1].value : null;
            if (masterData) applyMasterSettings(map, masterData);
            if (windAreaData) await renderWindAreas(map, picker, windAreaData, masterData);
            show_country_line = masterData?.show_country_line;
            country_layers_data = masterData?.country_layers_data;
            map_labels = masterData?.map_labels;
            if (show_country_line === 'show' && country_layers_data) {
                try {
                    const geoData = typeof country_layers_data === 'string' ? JSON.parse(country_layers_data) : country_layers_data;
                    L.geoJSON(geoData, {
                        style: {
                            color: "#161616",
                            weight: 1,
                            fillOpacity: 0,
                            interactive: false
                        }
                    }).addTo(map);
                } catch (error) {
                    console.error("Error drawing country lines:", error);
                }
            }
            if (map_labels === 'no') {
                const style = document.createElement('style');
                style.id = 'hide-labels-style'; 
                style.innerHTML = `
                    .leaflet-label-pane,
                    .windy-layer-labels,
                    .labels-layer {
                        display: none !important;
                        pointer-events: none !important;
                    }
                    canvas.vector-field-layer {
                        display: block !important;
                    }
                `;
                document.head.appendChild(style);
            }
        } catch (error) {
            console.error("Initialization Error:", error);
        } finally {
            // hideWindLoading();
        }
        const windSwitch = document.getElementById('windSwitch');
        if (windSwitch) {
            windSwitch.addEventListener('change', e => toggleWind(e.target.checked));
        }
    });
}
function applyMasterSettings(map, master) {
    if (!master?.center_lat || !master?.center_lng) return;
    const lat = parseFloat(master.center_lat);
    const lng = parseFloat(master.center_lng);
    const defaultZoom = Math.min((parseInt(master.zoom_level) || 10) + 1, 13);
    map.setView([lat, lng], defaultZoom);
    map.setMinZoom(defaultZoom);
}
const areaVisibility = {};
const areaLayers = {};
async function renderWindAreas(map, picker, areaData, masterData) {
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
    polygons.forEach((area, areaIndex) => {
        if (!area.geo_data) return;
        try {
            const geoJsonData = JSON.parse(area.geo_data);
            const styleData   = JSON.parse(area.custom_style || '{}');
            const geoLayer = L.geoJSON(geoJsonData, {
                style: () => ({
                    fillColor: styleData.fillColor   || '#3388ff',
                    fillOpacity: styleData.fillOpacity !== undefined ? parseFloat(styleData.fillOpacity) : 0.2,
                    color: styleData.color  || '#3388ff',
                    weight: styleData.weight !== undefined ? parseFloat(styleData.weight) : 2,
                    stroke: true,
                    opacity: 1,
                    interactive: true
                })
            });
            const projectId   = area.project_id || null;
            areaLayers[areaIndex] = geoLayer;
            geoLayer.on('touchend click', function (e) {
                if (!e.latlng) return;
                if (e.originalEvent) {
                    e.originalEvent.stopImmediatePropagation();
                    e.originalEvent.preventDefault();
                }
                highlightAreaItem(areaIndex);
                if (e.target.getBounds) {
                    map.flyToBounds(e.target.getBounds(), {
                        padding: [50, 50],
                        duration: 0.8
                    });
                    map.once('moveend', () => {
                        handlePickerOpening(e.latlng, picker, e.target);
                    });
                    openProject(projectId);
                }
            });
            geoLayer.addTo(featureGroup);
            if (isMaskMode) {
                geoLayer.eachLayer(layer => {
                    if (!layer.getLatLngs) return;
                    const latlngs = layer.getLatLngs();
                    const rings = Array.isArray(latlngs[0]) && !(latlngs[0][0] instanceof L.LatLng) ? latlngs.map(inner => inner[0]) : [latlngs[0]];
                    allHoles.push(...rings);
                });
            }
        } catch (err) {
            console.error('JSON Parse Error:', err);
        }
    });
    if (isMaskMode && allHoles.length > 0) {
        const world = [[90, -180], [90, 180], [-90, 180], [-90, -180]];
        const mask  = L.polygon([world, ...allHoles], {
            fillColor: '#C0C0C0',
            fillOpacity: 0.75,
            stroke: false,
            interactive: false
        });
        mask._isMask = true;
        mask.addTo(map);
        mask.bringToBack();
    }
    featureGroup.addTo(map);
    featureGroup.bringToFront();
    if (featureGroup.getBounds().isValid()) {
        const bounds = featureGroup.getBounds();
        const padded = bounds.pad(0.05);
        map.fitBounds(bounds, { padding: [20, 20] });
        map.options.minZoom = map.getBoundsZoom(bounds);
        map.setMaxBounds(padded);
        map.on('drag', () => {
            map.panInsideBounds(padded, { animate: false });
        });
        map.on('moveend', () => {
            if (!padded.contains(map.getCenter())) {
                map.panInsideBounds(padded, { animate: true });
            }
        });
    }
    buildAreaPanel(polygons);
}
function buildAreaPanel(polygons) {
    const list = document.getElementById('ap-list');
    if (!list) return;
    if (!polygons || polygons.length === 0) {
        list.innerHTML = `
            <div class="p-4 text-center">
                <i class="fa-solid fa-folder-open d-block mb-2 opacity-20" style="font-size: 24px;"></i>
                <div class="small text-muted">${langData['no_data_found'] || 'No data available'}</div>
            </div>`;
        return;
    }
    list.innerHTML = polygons.map((area, i) => {
        let color = area.area_status_color || '#3388ff';
        const hasStatus = !!area.area_status_color;
        areaVisibility[i] = true;
        return `
        <div class="ap-item animate__animated animate__fadeInUp" id="ap-item-${i}" data-index="${i}" style="animation-delay: ${i * 0.05}s">
            <i class="fa-solid fa-circle-dot ${hasStatus ? 'status-pulse' : ''} me-2" style="color:${color}"></i>
            <span class="ap-name" title="${area.area_name}">${area.area_name}</span>
        </div>`;
    }).join('');
    list.querySelectorAll('.ap-item').forEach(el => {
        el.addEventListener('click', function () {
            const i = parseInt(this.dataset.index);
            if (!areaVisibility[i]) return;
            const area = polygons[i];
            flyToArea(i, area);
            highlightAreaItem(i);
        });
    });
}
function flyToArea(index, area) {
    const layer = areaLayers[index];
    if (!layer) return;
    const bounds = layer.getBounds();
    if (bounds.isValid()) {
        map.flyToBounds(bounds, {
            padding:       [40, 40],
            duration:      1.2, 
            easeLinearity: 0.1,
        });
        openProject(area.project_id);
    }
}
function highlightAreaItem(index) {
    document.querySelectorAll('.ap-item').forEach(el => el.classList.remove('active'));
    document.getElementById(`ap-item-${index}`) ?.classList.add('active');
}
function toggleAreaPanel() {
    const panel = document.getElementById('area-panel');
    if (!panel) return;
    panel.classList.toggle('collapsed');
}
document.getElementById('area-panel-toggle') ?.addEventListener('click', toggleAreaPanel);
let customPicker = null;
let customPickerMarker = null;
let currentPolygonBounds = null;
let currentPolygonLayer = null;
function handlePickerOpening(latlng, picker, polygonLayer) {
    if (picker && picker.close) picker.close();
    if (polygonLayer) {
        currentPolygonLayer  = polygonLayer;
        currentPolygonBounds = polygonLayer.getBounds();
    }
    openCustomPicker(latlng);
}
async function openCustomPicker(latlng) {
    closeCustomPicker();
    const lat = Number(latlng.lat);
    const lng = Number(latlng.lng ?? latlng.lon);
    if (isNaN(lat) || isNaN(lng)) return;
    const pickerIcon = L.divIcon({
        className: '',
        iconSize:   [24, 60],
        iconAnchor: [4, 58],  
        html: `
        <svg width="24" height="60" viewBox="0 0 24 60" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.5))">
            <circle cx="4" cy="57" r="4" fill="rgba(255,255,255,0.9)" stroke="#1a2535" stroke-width="1.5"/>
            <line x1="4" y1="53" x2="4" y2="4" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
            <line x1="4" y1="6" x2="18" y2="6" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="4" y1="16" x2="14" y2="16" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
            <circle cx="18" cy="6" r="2.5" fill="#5bb8f5" stroke="#ffffff" stroke-width="1"/>
            <circle cx="14" cy="16" r="2" fill="#5bb8f5" stroke="#ffffff" stroke-width="1"/>
            <line x1="4" y1="4" x2="4" y2="0" stroke="rgba(255,255,255,0.6)" stroke-width="1" stroke-dasharray="2 2"/>
        </svg>`
    });
    customPickerMarker = L.marker([lat, lng], {
        icon: pickerIcon,
        draggable: true,
        zIndexOffset: 1000
    }).addTo(map);
    await updateCustomPickerPopup(lat, lng);
    customPickerMarker.on('drag', function (e) {
        const pos = e.latlng;
        if (currentPolygonLayer && !isInsidePolygon(pos, currentPolygonLayer)) {
            const clamped = clampToPolygon(pos, currentPolygonLayer);
            customPickerMarker.setLatLng(clamped);
            return;
        }
        clearTimeout(customPicker?._dragTimer);
        if (customPicker) {
            customPicker._dragTimer = setTimeout(async () => {
                const ll = customPickerMarker.getLatLng();
                await updateCustomPickerPopup(ll.lat, ll.lng);
            }, 400);
        }
    });
    customPickerMarker.on('dragend', async function () {
        const ll = customPickerMarker.getLatLng();
        await updateCustomPickerPopup(ll.lat, ll.lng);
    });
}
async function updateCustomPickerPopup(lat, lng) {
    const windData = await fetchWindAtPoint(lat, lng);
    const content  = buildPickerPopupHTML(lat, lng, windData);
    if (!customPickerMarker) return;
    if (!customPickerMarker.getPopup()) {
        customPickerMarker.bindPopup(content, {
            className: 'custom-wind-popup', 
            offset: L.point(0, -52),
            closeButton: false,  
            autoClose: false,
            closeOnClick: false,
            maxWidth: 280,
            minWidth: 210,
        });
        customPickerMarker.openPopup();
        customPickerMarker.getPopup().on('remove', closeCustomPicker);
    } else {
        customPickerMarker.getPopup().setContent(content);
    }
    customPicker = customPickerMarker.getPopup();
}
async function fetchWindAtPoint(lat, lng) {
    try {
        const url = `https://api.open-meteo.com/v1/forecast` + `?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}` + `&current=wind_speed_100m,wind_direction_100m,wind_gusts_10m` + `&wind_speed_unit=ms`;
        const res  = await fetch(url);
        const data = await res.json();
        return {
            speed: data.current?.wind_speed_100m     ?? null,
            direction: data.current?.wind_direction_100m ?? null,
            gusts: data.current?.wind_gusts_10m     ?? null,
        };
    } catch (e) {
        console.error("fetchWindAtPoint error:", e);
        return { speed: null, direction: null, gusts: null };
    }
}
function buildPickerPopupHTML(lat, lng, wind) {
    const { speed, direction, gusts } = wind;
    const compassDir = direction !== null ? degToCompass(direction) : '—';
    const speedColor = speed === null ? '#aaa' : speed < 3  ? '#4fc3f7' : speed < 7  ? '#81c784' : speed < 12 ? '#ffb74d' : '#ef5350';
    const arrowRotate = direction ?? 0;
    return `
    <div class="cpicker-wrap">
        <div class="cpicker-header">
            <span class="cpicker-coords">${lat.toFixed(4)}, ${lng.toFixed(4)}</span>
            <button class="cpicker-close" onclick="closeCustomPicker()">✕</button>
        </div>
        <div class="cpicker-body">
            <div class="cpicker-compass-wrap">
                <svg width="50" height="50" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="36" cy="36" r="34" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
                    ${Array.from({length: 8}, (_, i) => {
                        const a = (i * 45) * Math.PI / 180;
                        const x1 = 36 + 28 * Math.sin(a);
                        const y1 = 36 - 28 * Math.cos(a);
                        const x2 = 36 + 32 * Math.sin(a);
                        const y2 = 36 - 32 * Math.cos(a);
                        return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>`;
                    }).join('')}
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
                    ${speed !== null ? speed.toFixed(1) : '—'}
                    <span class="cpicker-unit">m/s</span>
                </div>
                <div class="cpicker-dir-text">
                    ${compassDir}
                    ${direction !== null ? `<span class="cpicker-deg">${Math.round(direction)}°</span>` : ''}
                </div>
                ${gusts !== null ? `<div class="cpicker-gust"><i class="fa-solid fa-wind" style="font-size:9px"></i> <span data-i18n="gusts">${langData['gusts'] || 'Gusts'}</span> ${gusts.toFixed(1)} m/s</div>` : ''}
            </div>
        </div>
    </div>`;
}
function isInsidePolygon(latlng, polygonLayer) {
    let inside = false;
    polygonLayer.eachLayer(layer => {
        if (layer.getBounds && layer.getBounds().contains(latlng)) {
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
        const intersect = ((yi > point.lng) !== (yj > point.lng))
            && (point.lat < (xj - xi) * (point.lng - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}
function clampToPolygon(latlng, polygonLayer) {
    let closest = null;
    let minDist  = Infinity;
    polygonLayer.eachLayer(layer => {
        const lls = layer.getLatLngs?.();
        if (!lls) return;
        const ring = lls[0];
        for (let i = 0; i < ring.length; i++) {
            const a = ring[i];
            const b = ring[(i + 1) % ring.length];
            const c = closestPointOnSegment(latlng, a, b);
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
    let t = ((p.lat - a.lat) * dx + (p.lng - a.lng) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    return L.latLng(a.lat + t * dx, a.lng + t * dy);
}
function degToCompass(deg) {
    const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
    return dirs[Math.round(deg / 22.5) % 16];
}
function closeCustomPicker() {
    if (customPickerMarker) {
        map.removeLayer(customPickerMarker);
        customPickerMarker = null;
    }
    customPicker = null;
}
let windRefreshInterval = null;
let windSummary = {
    max: 0,
    min: 0
};
const refreshAllWindData = async () => {
    const poleIds = Object.keys(poleMarkers);
    if (!windOn || poleIds.length === 0) return;
    const lats = poleIds.map(id => poleMarkers[id].lat).join(',');
    const lngs = poleIds.map(id => poleMarkers[id].lng).join(',');
    try {
        const url = `https://api.open-meteo.com/v1/forecast`+ `?latitude=${lats}&longitude=${lngs}`+ `&current=wind_speed_100m,wind_direction_100m&wind_speed_unit=ms`;
        const res = await fetch(url);
        const data = await res.json();
        const results = Array.isArray(data) ? data : [data];
        let windSpeeds = []; 
        poleIds.forEach((id, i) => {
            const weather = results[i];
            const p = poleMarkers[id];
            if (!weather?.current) return;
            const speed = weather.current.wind_speed_100m;
            const dir = weather.current.wind_direction_100m;
            windSpeeds.push(speed);
            const elSpeed = document.getElementById(p.windId);
            const elArrow = document.getElementById(p.arrowId);
            if (elSpeed) elSpeed.textContent = `${speed.toFixed(1)} m/s`;
            if (elArrow) {
                const cx = elArrow.getAttribute('data-cx');
                const cy = elArrow.getAttribute('data-cy');
                elArrow.setAttribute('transform', `rotate(${dir - 90}, ${cx}, ${cy})`);
            }
        });
        if (windSpeeds.length > 0) {
            windSummary.max = Math.max(...windSpeeds);
            windSummary.min = Math.min(...windSpeeds);
            updateWindDashboard(windSummary);
        }
    } catch (e) {
        console.error("Wind refresh error:", e);
    }
};
function buildWindLabelSVG({ anchorX, anchorY, labelDx, labelDy, windId, arrowId }) {
    const svgW = Math.abs(labelDx) + 90;
    const svgH = Math.abs(labelDy) + 30;
    const tipX = anchorX + labelDx;
    const tipY = anchorY + labelDy;
    const BOX_W = 65, BOX_H = 20;
    const boxY  = tipY - BOX_H / 2;
    const boxX  = labelDx >= 0 ? tipX : tipX - BOX_W;
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
            <g id="${arrowId}" data-cx="${arrowCX}" data-cy="${arrowCY}" transform="rotate(0, ${arrowCX}, ${arrowCY})"><text x="${arrowCX}" y="${arrowCY}" font-size="9" fill="#5bb8f5" text-anchor="middle" dominant-baseline="central">➤</text></g>
            <text id="${windId}" x="${textX}" y="${arrowCY}" font-size="9" font-weight="700" fill="#ffffff" text-anchor="start" dominant-baseline="central">...</text>
        </svg>`
    };
}
async function loadPoles() {
    try {
        const poles = await fetchData(`${BASE_URL}/api/poles.get`);
        if (!Array.isArray(poles)) return;
        poleLayerGroup.clearLayers();
        poleMarkers = {};
        const offsets = [
            { dx:  50, dy: -40 },
            { dx: -50, dy: -40 },
            { dx:  50, dy:  25 },
            { dx: -50, dy:  25 },
            { dx:   0, dy: -55 },
        ];
        for (let i = 0; i < poles.length; i++) {
            const pole = poles[i];
            const lat  = parseFloat(pole.poles_lat);
            const lng  = parseFloat(pole.poles_lng);
            if (isNaN(lat) || isNaN(lng)) continue;
            const markerIcon = (() => {
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
                return L.divIcon({
                    className:  '',
                    iconSize:   [20, 52],
                    iconAnchor: [3, 50],
                    html: `
                    <svg width="20" height="52" viewBox="0 0 20 52" xmlns="http://www.w3.org/2000/svg" style="overflow:visible; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">
                        <circle cx="3" cy="49" r="3.5" fill="rgba(255,255,255,0.85)" stroke="${color}" stroke-width="1.5"/>
                        <line x1="3" y1="46" x2="3" y2="3" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>
                        <line x1="3" y1="5" x2="15" y2="5" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round"/>
                        <line x1="3" y1="14" x2="11" y2="14" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round"/>
                        ${!isEven ? `
                        <line x1="3" y1="14" x2="-5" y2="14" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round"/>
                        ` : ''}
                        <circle cx="15" cy="5" r="2.2" fill="${color}" stroke="#ffffff" stroke-width="0.8"/>
                        <circle cx="11" cy="14" r="1.8" fill="${color2}" stroke="#ffffff" stroke-width="0.8"/>
                        ${!isEven ? `
                        <circle cx="-5" cy="14" r="1.8" fill="${color2}" stroke="#ffffff" stroke-width="0.8"/>
                        ` : ''}
                    </svg>`
                });
            })();
            const marker = L.marker([lat, lng], { icon: markerIcon }).addTo(poleLayerGroup);
            marker.on('click', () => openPoles(pole.poles_id));
            const windId  = `wind-auto-${pole.poles_id}`;
            const arrowId = `arrow-${pole.poles_id}`;
            const off     = offsets[i % offsets.length];
            const anchorX = off.dx >= 0 ? 0 : Math.abs(off.dx);
            const anchorY = off.dy >= 0 ? 0 : Math.abs(off.dy);
            const { svgW, svgH, html } = buildWindLabelSVG({
                anchorX, anchorY,
                labelDx: off.dx,
                labelDy: off.dy,
                windId, arrowId
            });
            const labelIcon = L.divIcon({
                className:  '',
                iconSize:   [svgW, svgH],
                iconAnchor: [anchorX, anchorY],
                html
            });
            const labelMarker = L.marker([lat, lng], {
                icon:         labelIcon,
                interactive:  false,
                zIndexOffset: -10
            }).addTo(poleLayerGroup);
            poleMarkers[pole.poles_id] = {
                marker, labelMarker,
                lat, lng,
                windId, arrowId
            };
            if (!windOn) labelMarker.setOpacity(0);
        }
        if (windOn) refreshAllWindData();
    } catch (err) {
        console.error("LoadPoles Error:", err);
    }
}
function toggleWind(isOn) {
    windOn = isOn;
    if (windyAPI?.store) {
        windyAPI.store.set('overlay', windOn ? 'wind' : 'none');
    }
    Object.values(poleMarkers).forEach(p => {
        p.labelMarker?.setOpacity(windOn ? 1 : 0);
    });
    clearInterval(windRefreshInterval);
    windRefreshInterval = null;
    if (windOn) {
        refreshAllWindData();
        windRefreshInterval = setInterval(refreshAllWindData, 60_000);
    }
}
async function fetchData(url, bodyData = {}) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData)
        });
        return await response.json();
    } catch (err) { return {}; }
}
function hideWindLoading() {
    const loader = document.getElementById('wind-loading');
    if (!loader) return;
    loader.style.pointerEvents = 'none';
    loader.style.transition = 'opacity 0.3s ease-out';
    loader.style.opacity = 0;
    loader.addEventListener('transitionend', () => loader.remove(), { once: true });
}
const MENU_LEVELS = {
    1: { title: 'PROJECT', lang: 'project', endpoint: `${BASE_URL}/api/project.get`, key: 'project_id', label: 'project_name' },
    2: { title: 'WIND MEASUREMENT EQUIPMENT', lang: 'pole_types', endpoint: `${BASE_URL}/api/type.get`, key: 'type_id', label: 'type_name' },
    3: { title: 'INSTALLATION', lang: 'installation', endpoint: `${BASE_URL}/api/installations.get`, key: 'installations_id', label: 'installations_name', isLast: true }
};
async function loadMenuLevel(level) {
    const cfg = MENU_LEVELS[level];
    if (!cfg) return;
    for (let i = level; i <= 3; i++) $(`#menu-level-${i}`).removeClass('active').hide().empty();
    const data = await fetchData(cfg.endpoint, menuState);
    if (!data.length) return;
    let html = `<div class="menu-header" data-i18n="${cfg.lang}">${langData[cfg.lang] || cfg.title}</div>`;
    data.forEach(item => {
        if (cfg.isLast) {
            html += `<div class="menu-item station-item" onclick="handleStationClick(${item.poles_lat}, ${item.poles_lng}, ${item.poles_id}, this)"><span>${item[cfg.label].replace(/\r\n|\n/g, '<br />')}</span><i class="fa-solid fa-location-dot text-info"></i></div>`;
        } else {
            html += `<div class="menu-item" onclick="selectItem(${level}, ${item[cfg.key]}, this)"><span>${item[cfg.label].replace(/\r\n|\n/g, '<br />')}</span><i class="fa-solid fa-chevron-right"></i></div>`;
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
    if (windyAPI && windyAPI.picker) {
        handlePickerOpening({ lat, lng }, windyAPI.picker);
    }
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
$(document).on('click', function () { $('.menu-panel').fadeOut(); });
$('.menu-panel').on('click', e => e.stopPropagation());
async function openPoles(poleId) {
    const $modal   = $('#windModal');
    const $dialog  = $modal.find('.modal-dialog');
    const $body    = $modal.find('.modal-body');
    const $header  = $modal.find('.modal-header');
    const $footer  = $modal.find('.modal-footer');
    $dialog.removeClass('modal-fullscreen');
    $header.html(`
        <h5 class="modal-title"></h5>
        <div class="ms-auto d-flex align-items-center gap-2">
            <button type="button" class="btn btn-sm poles-ctrl-btn" id="btn-fullscreen" title="Fullscreen"><i class="fa-regular fa-window-maximize"></i></button>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
    `);
    $body.html(`
        <div class="poles-skeleton">
            <div class="sk-cover"></div>
            <div style="padding:24px 20px;">
                <div class="sk-line" style="width:55%;height:22px;margin-bottom:10px;"></div>
                <div class="sk-line" style="width:28%;height:14px;margin-bottom:24px;"></div>
                <div class="sk-line" style="height:12px;margin-bottom:8px;"></div>
                <div class="sk-line" style="height:12px;margin-bottom:8px;"></div>
                <div class="sk-line" style="width:80%;height:12px;"></div>
            </div>
        </div>
    `);
    $footer.html(`
        <button type="button" class="poles-btn-primary" onclick="openFilterModal(${poleId});" data-i18n="view_report"></button>
        <button type="button" class="poles-btn-ghost" data-bs-dismiss="modal" data-i18n="close"></button>
    `);
    bootstrap.Modal.getOrCreateInstance($modal[0]).show();
    $modal.find('#btn-fullscreen').off('click').on('click', function () {
        $dialog.toggleClass('modal-fullscreen');
        $(this).find('i').toggleClass('fa-window-maximize fa-window-restore');
    });
    try {
        const res  = await fetch(`${BASE_URL}/api/poles.info`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: poleId }),
        });
        if (!res.ok) throw new Error('Network error');
        const json = await res.json();
        const data = json.poles_id ? json : json.data;
        if (!data?.poles_id) {
            $body.html(renderErrorAlert('warning', langData['no_data_found'] || 'No data found'));
            return;
        }
        const lang = typeof currentLang !== 'undefined' ? currentLang : 'th';
        const fullBase = BASE_URL.replace(/\/$/, '');
        const hasContent = !!data.content;
        const title = hasContent ? (data.content.title[lang] || data.content.title['th']) : data.installations_name;
        let bodyContent = '';
        if (hasContent && data.content?.content) {
            const co  = data.content.content;
            const ord = [lang, ...['en','lo','th'].filter(l => l !== lang)];
            for (const l of ord) {
                if (co[l]?.trim()) { bodyContent = co[l]; break; }
            }
        }
        bodyContent = bodyContent.replace(
            /src="(?!(http|https|\/\/))/g,
            `src="${fullBase}/`
        );
        const bg = data.project_bg || {};
        const projBg = bg.project_background;
        const opacityVal = bg.project_opacity > 0 ? bg.project_opacity / 100 : 1;
        const bgStyle = projBg ? `background-image:linear-gradient(rgba(255,255,255,${1 - opacityVal}),rgba(255,255,255,${1 - opacityVal})),url('${fullBase}/${projBg}');background-size:cover;background-position:top center;background-repeat:no-repeat;` : '';
        const coverHtml = (hasContent && data.content?.cover && data.content?.cover_display === 'yes')
            ? `<div class="poles-cover-wrap">
                   <img src="${fullBase}/${data.content.cover}" alt="cover" loading="lazy" class="poles-cover-img">
                   <div class="poles-cover-overlay"></div>
               </div>`
            : '';
        const chip = (iconClass, colorVar, labelKey, value) => `
            <div class="poles-chip">
                <div class="poles-chip-icon" style="color:${colorVar};"><i class="${iconClass}"></i></div>
                <div>
                    <div class="poles-chip-label" data-i18n="${labelKey}"></div>
                    <div class="poles-chip-value">${value}</div>
                </div>
            </div>`;
        const html = `
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
                    ${(data.content.presentation && data.content.presentation.length > 0) ? 
                        renderPresentationShow(data.content.presentation) : 
                        ``
                    }
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
                        </div>
                    ` : '<div style="padding:40px 0;"></div>'}
                `}
            </div>
        </div>`;
        $body.html(html);
        $header.find('.modal-title').html(`
            <span class="project-status">
                <i class="fa-solid fa-circle-dot status-pulse me-2" style="color:${data.project_status_color || '#ccc'}; font-size: 0.8em;"></i>
                <span class="fw-bold" style="font-size: 0.9rem; color: #444;">
                    ${data.project_status_name || '—'}
                </span>
            </span>
        `);
        if (typeof updateText === 'function') updateText($body[0]);
        $body.find('.article-content img').each(function () {
            const $img = $(this);
            const src  = $img.attr('src');
            if (!src) return;
            $img.removeAttr('width height');
            let style = ($img.attr('style') || '').replace(/width\s*:\s*[^;]+;?/gi, '').replace(/height\s*:\s*[^;]+;?/gi, '');
            $img.attr('style', style.trim()).attr('loading', 'lazy');
            if (!$img.parent('a').length) {
                $img.wrap(`<a href="${src}" data-fancybox="content-images" class="content-img-link"></a>`);
            }
            $img.css({ cursor: 'zoom-in', transition: 'opacity 0.2s' }).addClass('hover-opacity');
        });
        if (typeof Fancybox !== 'undefined') {
            Fancybox.bind('[data-fancybox]', {
                Hash: false,
                Toolbar: { display: { left: ['infobar'], right: ['close'] } },
            });
        }
    } catch (err) {
        console.error('OpenPoles Error:', err);
        $body.html(renderErrorAlert('danger', langData['cannot_load'] || 'Failed to load data. Please try again later.'));
    }
}
function renderMultimedia(content, lang, baseUrl) {
    if (!content) return '';
    let html = '';
    if (content.images360?.length > 0) {
        html += `
        <div class="mm-section">
            <div class="mm-section-header">
                <div class="mm-section-icon" style="background:rgba(6,182,212,0.12);color:#0891b2;"><i class="fa-solid fa-street-view"></i></div>
                <span>${langData['vr_experience'] || '360° Experience'}</span>
            </div>
            <div class="mm-grid">
                ${content.images360.map(vr => `
                    <div class="mm-thumb" onclick="openVRModal('${baseUrl}/${vr.url}')">
                        <img src="${baseUrl}/${vr.url}" loading="lazy">
                        <div class="mm-vr-badge"><i class="fa-solid fa-rotate fa-spin"></i> 360°</div>
                        <div class="mm-thumb-overlay"><i class="fa-solid fa-expand"></i></div>
                    </div>
                `).join('')}
            </div>
        </div>`;
    }
    if (content.images?.length > 0) {
        html += `
        <div class="mm-section">
            <div class="mm-section-header">
                <div class="mm-section-icon" style="background:rgba(45,127,193,0.12);color:#2d7fc1;"><i class="fa-solid fa-images"></i></div>
                <span>${langData['gallery'] || 'Gallery'}</span>
            </div>
            <div class="mm-grid">
                ${content.images.map(img => `
                    <a href="${baseUrl}/${img.url}" data-fancybox="pole-gallery" class="mm-thumb">
                        <img src="${baseUrl}/${img.url}" loading="lazy">
                        <div class="mm-thumb-overlay"><i class="fa-solid fa-magnifying-glass-plus"></i></div>
                    </a>
                `).join('')}
            </div>
        </div>`;
    }
    if (content.attachments?.length > 0) {
        html += `
        <div class="mm-section">
            <div class="mm-section-header">
                <div class="mm-section-icon" style="background:rgba(220,38,38,0.10);color:#dc2626;">
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
$(document).ready(function () {
    $("header, #ui, #sideControlPanel, #projectCanvas").hide();
    const $panel = $('#area-panel');
    $panel.addClass('collapsed').css('opacity', '0');
    setTimeout(() => {
        initMap();
    }, 3500);
    setTimeout(() => {
        $("header, #ui, #sideControlPanel, #projectCanvas").fadeIn(400);
        $panel.show();
        requestAnimationFrame(() => {
            $panel.css({
                'opacity': '1',
                'transition': 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
            });
            if (!isMobile()) {
                $panel.removeClass('collapsed');
            }
        });
    }, 5000);
    setTimeout(() => {
        hideWindLoading();
    }, 6000);
});
Fancybox.bind("[data-fancybox='gallery']", {
    Hash: false,
    Thumbs: { autoStart: false },
    Toolbar: {
        display: {
            left: ["infobar"],
            middle: [],
            right: ["iterateZoom", "close"],
        },
    },
});
async function openProject(project_id) {
    if (!project_id) return;
    try {
        const res = await fetch(`${BASE_URL}/api/project.poles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project_id })
        });
        const data = await res.json();
        if (!data || !data.poles || data.poles.length === 0) {
            console.warn("No poles data found for this project.");
            return;
        }
        document.getElementById('pp-name').textContent = data.project_name || 'Unknown Project';
        document.getElementById('pp-count').textContent = data.poles.length;  
        const dot = document.getElementById('pp-status-dot');
        const pill = document.getElementById('pp-status');
        const statusColor = data.status_color || '#ccc';
        const statusName = data.project_status || 'UNKNOWN';
        dot.style.backgroundColor = statusColor;
        pill.style.backgroundColor = statusColor;
        pill.style.color = '#fff'; 
        pill.textContent = statusName.toUpperCase();
        const body = document.getElementById('pp-body');
        body.innerHTML = data.poles.map((p, i) => {
            const isEven = p.type_id % 2 === 0;
            const color  = isEven ? '#5bb8f5' : '#f39c12';
            const color2 = isEven ? '#2d7fc1' : '#d68910';
            return `
                <div class="pole-row" onclick="openPoles(${p.poles_id});">
                    <div class="pole-index">
                        <svg width="20" height="52" viewBox="0 0 20 52" xmlns="http://www.w3.org/2000/svg" style="overflow:visible; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">
                            <circle cx="3" cy="49" r="3.5" fill="rgba(255,255,255,0.85)" stroke="${color}" stroke-width="1.5"/>
                            <line x1="3" y1="46" x2="3" y2="3" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>
                            <line x1="3" y1="5" x2="15" y2="5" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round"/>
                            <line x1="3" y1="14" x2="11" y2="14" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round"/>
                            ${!isEven ? `
                            <line x1="3" y1="14" x2="-5" y2="14" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round"/>
                            ` : ''}
                            <circle cx="15" cy="5" r="2.2" fill="${color}" stroke="#ffffff" stroke-width="0.8"/>
                            <circle cx="11" cy="14" r="1.8" fill="${color2}" stroke="#ffffff" stroke-width="0.8"/>
                            ${!isEven ? `
                            <circle cx="-5" cy="14" r="1.8" fill="${color2}" stroke="#ffffff" stroke-width="0.8"/>
                            ` : ''}
                        </svg>
                    </div>
                    <div class="pole-info">
                        <div class="pole-title">
                            <strong>${p.type_name || 'N/A'}</strong> 
                            <div class="small">${p.installations_name || 'N/A'}</div>
                        </div>
                        <div class="pole-coords"><i class="fa-solid fa-location-dot me-1"></i>${p.lat}° N, ${p.lng}° E</div>
                        <div class="pole-bar-wrap">
                            <div class="pole-bar" id="bar-${p.poles_id}" style="width: 0%; transition: width 0.6s ease, background-color 0.3s;"></div>
                        </div>
                    </div>
                    <div class="pole-wind-box">
                        <i class="fa-solid fa-location-arrow wind-arrow" id="wind-arrow-${p.poles_id}"></i>
                        <span class="pole-wind" id="wind-val-${p.poles_id}">-- <small>m/s</small></span>
                    </div>
                </div>`;
        }).join('');
        const el = document.getElementById('projectCanvas');
        const offcanvas = bootstrap.Offcanvas.getOrCreateInstance(el);
        offcanvas.show();
        const lats = data.poles.map(p => p.lat).join(',');
        const lngs = data.poles.map(p => p.lng).join(',');
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&current=wind_speed_100m&wind_speed_unit=ms`;
        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();
        const weatherResults = Array.isArray(weatherData) ? weatherData : [weatherData];
        let totalWind = 0;
        data.poles.forEach((p, i) => {
            const speed = weatherResults[i]?.current?.wind_speed_100m || 0;
            totalWind += speed;
            const elWind = document.getElementById(`wind-val-${p.poles_id}`);
            const elWind2 = document.getElementById(`wind-arrow-${p.poles_id}`);
            const elBar = document.getElementById(`bar-${p.poles_id}`);
            if (elWind && elBar) {
                let windClass = 'wind-ok', barColor = '#28a745'; 
                if (speed > 15) { windClass = 'wind-high'; barColor = '#dc3545'; }
                else if (speed > 10) { windClass = 'wind-warn'; barColor = '#ffc107'; }
                elWind.className = `pole-wind ${windClass}`;
                elWind2.className = `wind-arrow ${windClass}`;
                elWind.innerHTML = `${speed.toFixed(1)} <small>m/s</small>`;
                const pct = Math.min((speed / 25) * 100, 100);
                requestAnimationFrame(() => {
                    elBar.style.width = `${pct}%`;
                    elBar.style.backgroundColor = barColor;
                });
            }
        });
        const avgWind = (totalWind / data.poles.length).toFixed(1);
        document.getElementById('pp-avg-wind').textContent = `${avgWind} m/s`;
    } catch (error) {
        console.error("Error fetching project details:", error);
    }
}
$(document).ready(function() {
    const $panel = $('#sideControlPanel');
    const $fab = $('#fabToggle');
    const $overlay = $('#panelOverlay');
    const $toggleExpandBtn = $('#toggleExpandBtn');
    const $windSwitch = $('#toggle-wind-values');
    const $windIcon = $('#wind-status-icon');
    const toggleMobileMenu = (forceState = null) => {
        const isMenuOpen = (forceState !== null) ? forceState : !$panel.hasClass('active');
        $panel.toggleClass('active', isMenuOpen);
        $overlay.toggle(isMenuOpen);
        $('body').css('overflow', isMenuOpen ? 'hidden' : '');
    };
    $fab.on('click', (e) => { e.stopPropagation(); toggleMobileMenu(); });
    $overlay.on('click', () => toggleMobileMenu(false));
    $(document).on('click', (e) => {
        if ($(window).width() <= 768 && $panel.hasClass('active')) {
            if (!$panel.is(e.target) && $panel.has(e.target).length === 0 && !$fab.is(e.target)) {
                toggleMobileMenu(false);
            }
        }
    });
    let touchStartY = 0;
    $('.drag-handle').on('touchstart', (e) => {
        touchStartY = e.originalEvent.touches[0].clientY;
    }).on('touchmove', (e) => {
        const touchY = e.originalEvent.touches[0].clientY;
        if (touchY - touchStartY > 50 && $panel.hasClass('active')) {
            toggleMobileMenu(false);
        }
    });
    const toggleExpand = (forceState = null) => {
        const isExpanded = (forceState !== null) ? forceState : !$panel.hasClass('expanded');
        $panel.toggleClass('expanded', isExpanded);
    };
    $toggleExpandBtn.on('click', () => toggleExpand());
    toggleExpand(true);
    const updateWindStatus = (isOn) => {
        $windIcon.toggleClass('spinning', isOn);
        $('.map-wind-label').stop().fadeTo(300, isOn ? 1 : 0);
        if (typeof toggleWind === 'function') {
            toggleWind(isOn);
        }
    };
    $windSwitch.on('change', function() {
        updateWindStatus($(this).is(':checked'));
    });
    setTimeout(() => updateWindStatus($windSwitch.is(':checked')), 500);
    $(window).on('resize', () => {
        if ($(window).width() > 768 && $panel.hasClass('active')) {
            toggleMobileMenu(false);
        }
    });
});
function updateWindDashboard({ max, min }) {
    const maxEl = document.getElementById('maxWind');
    const minEl = document.getElementById('minWind');
    const maxText = max.toFixed(1);
    const minText = min.toFixed(1);
    if (maxEl) maxEl.textContent = maxText;
    if (minEl) minEl.textContent = minText;
    $(".stat-max-wind-val").text(maxText);
    $(".stat-min-wind-val").text(minText);
}