'use strict';
function initMap() {
    windyInit(options, async api => {
        const { store, picker, map: windyMap } = api;
        windyAPI = api;
        map = windyMap;
        poleLayerGroup = L.layerGroup().addTo(map);
        store.set('overlay', 'wind');
        store.set('level', DEFAULT_LEVEL);
        try {
            const [masterResult, windAreaResult] = await Promise.allSettled([
                fetchJSON(`${BASE_URL}/api/master`),
                fetchJSON(`${BASE_URL}/api/wind.boundary`)
            ]);
            const masterData = masterResult.status === 'fulfilled' ? masterResult.value : null;
            const windAreaData = windAreaResult.status === 'fulfilled' ? windAreaResult.value : null;
            if (!masterData) {
                console.error("Master data is required but failed to load.");
            }
            if (masterData) {
                applyMasterSettings(masterData);
                show_country_line = masterData.show_country_line;
                country_layers_data = masterData.country_layers_data;
                if (show_country_line === 'show' && country_layers_data) {
                    _drawCountryLines(country_layers_data);
                    const focus = getLocalBool('focus', false);
                    toggleFocus(focus);
                    $('#toggle-focus').prop('checked', focus);
                }
                const labelsRaw = localStorage.getItem('labels');
                const labels = labelsRaw !== null ? (labelsRaw === 'true') : (masterData.labels === 'yes');
                toggleLabel(labels);
                $('#toggle-label').prop('checked', labels);
            }
            if (windAreaData) {
                await renderWindAreas(picker, windAreaData, masterData);
            }
            const winds = getLocalBool('winds', true);
            windOn = winds;
            $('#toggle-wind-values').prop('checked', winds);
            _applyWindState(windOn);
            await loadPoles();
            initWindUnit();
        } catch (error) {
            console.error("Initialization Error:", error);
        }
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
    const lat = parseFloat(master.center_lat);
    const lng  = parseFloat(master.center_lng);
    const zoom = clamp((parseInt(master.zoom_level) || 10) + 1, 1, 13);
    const headerEl = document.querySelector('header');
    const footerEl = document.querySelector('footer, #footer, .footer');
    const headerH = headerEl ? headerEl.getBoundingClientRect().height : 60;
    const footerH = footerEl ? footerEl.getBoundingClientRect().height : 36;
    const mapH = window.innerHeight - headerH - footerH;
    const offsetPx = (footerH - headerH) / 2; 
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
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
        const data = await res.json();
        const results = Array.isArray(data) ? data : [data];
        const windSpeeds = [];
        const unit = getCurrentUnit();
        entries.forEach(([id, p], i) => {
            const weather = results[i];
            if (!weather?.current) return;
            const speed = weather.current.wind_speed_100m;
            const dir   = weather.current.wind_direction_100m;
            windSpeeds.push(speed);
            const activeColor = getWindColor(speed);
            const elSpeed = document.getElementById(p.windId);
            const elArrow = document.getElementById(p.arrowId);
            if (elSpeed) {
                elSpeed.dataset.raw = speed;
                elSpeed.textContent = `${(speed * unit.factor).toFixed(1)} ${unit.label}`;
                elSpeed.setAttribute('fill', activeColor);
            }
            if (elArrow) {
                const cx = elArrow.getAttribute('data-cx');
                const cy = elArrow.getAttribute('data-cy');
                elArrow.setAttribute('transform', `rotate(${dir - 90}, ${cx}, ${cy})`);
                const arrowIcon = elArrow.querySelector('text');
                if (arrowIcon) {
                    arrowIcon.setAttribute('fill', activeColor);
                }
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
    const maxVal = (max * unit.factor).toFixed(1);
    $('.stat-max-wind-val').text(maxVal);
    $('#stat-max-wind').removeClass('text-warning').css('color', getWindColor(max));
    const minVal = (min * unit.factor).toFixed(1);
    $('.stat-min-wind-val').text(minVal);
    $('#stat-min-wind').removeClass('text-info').css('color', getWindColor(min));
    const avgVal = (avg * unit.factor).toFixed(1);
    $('.stat-avg-wind-val').text(avgVal);
    $('#stat-avg-wind').removeClass('text-success').css('color', getWindColor(avg));
}
async function loadPoles() {
    if (poleLayerGroup && poleLayerGroup.getLayers().length > 0) {
        console.log("Poles already rendered on map.");
        if (windOn) refreshAllWindData();
        return;
    }
    const poles = await fetchJSON(`${BASE_URL}/api/poles.get`).catch(err => {
        console.error('loadPoles error:', err);
        return null;
    });
    if (!Array.isArray(poles)) return;
    window._usedLabelBoxes = [];
    const totalPoles = poles.length;
    const chunkSize = 40; 
    let currentIndex = 0;
    function renderChunk() {
        const end = Math.min(currentIndex + chunkSize, totalPoles);
        for (let i = currentIndex; i < end; i++) {
            const pole = poles[i];
            const lat = parseFloat(pole.poles_lat);
            const lng = parseFloat(pole.poles_lng);
            if (isNaN(lat) || isNaN(lng)) continue;
            if (poleMarkers[pole.poles_id]) continue;
            const marker = L.marker([lat, lng], { 
                icon: _buildPoleIcon(pole),
                zIndexOffset: 1000 
            }).addTo(poleLayerGroup);
            marker.on('click', () => openPoles(pole.poles_id));
            const windId  = `wind-auto-${pole.poles_id}`;
            const arrowId = `arrow-${pole.poles_id}`; 
            const off = getSmartOffset(lat, lng, window._usedLabelBoxes, map);
            const anchorX = off.dx >= 0 ? 0 : Math.abs(off.dx);
            const anchorY = off.dy >= 0 ? 0 : Math.abs(off.dy);
            const { svgW, svgH, html } = buildWindLabelSVG({ 
                anchorX, anchorY, labelDx: off.dx, labelDy: off.dy, windId, arrowId 
            });
            const labelMarker = L.marker([lat, lng], {
                icon: L.divIcon({ 
                    className: 'pole-label-wrap',
                    iconSize: [svgW, svgH], 
                    iconAnchor: [anchorX, anchorY], 
                    html 
                }),
                interactive: false,
                zIndexOffset: 500 
            }).addTo(poleLayerGroup);
            if (!windOn) labelMarker.setOpacity(0);
            poleMarkers[pole.poles_id] = { marker, labelMarker, lat, lng, windId, arrowId };
        }
        currentIndex = end;
        if (currentIndex < totalPoles) {
            setTimeout(renderChunk, 1);
        } else {
            console.log(`Poles loading finished.`);
            if (windOn) refreshAllWindData();
        }
    }
    renderChunk();
}
function _buildPoleIcon(pole) {
    if (pole.type_icon?.trim()) {
        return L.icon({
            iconUrl: pole.type_icon,
            iconSize: [36, 36],
            iconAnchor: [18, 36],
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
function buildWindLabelSVG({ anchorX, anchorY, labelDx, labelDy, windId, arrowId, windSpeed = 0 }) {
    const svgW = Math.abs(labelDx) + 100;
    const svgH = Math.abs(labelDy) + 40;
    const tipX = anchorX + labelDx;
    const tipY = anchorY + labelDy;
    const BOX_W = 75, BOX_H = 22;
    const boxY = tipY - BOX_H / 2;
    const boxX = labelDx >= 0 ? tipX : tipX - BOX_W;
    const arrowCX = boxX + 14;
    const arrowCY = tipY;
    const textX   = boxX + 26;
    const activeColor = getWindColor(windSpeed);
    const unit = getCurrentUnit(); 
    const displayValue = (windSpeed * unit.factor).toFixed(1);
    return {
        svgW, svgH,
        html: `
        <svg width="${svgW}" height="${svgH}" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;pointer-events:none;display:block">
            <line x1="${anchorX}" y1="${anchorY}" x2="${tipX}" y2="${tipY}" stroke="rgba(255,255,255,0.4)" stroke-width="1.2" stroke-dasharray="4 3"/>
            <circle cx="${anchorX}" cy="${anchorY}" r="3.5" fill="#fff" stroke="rgba(0,0,0,0.2)" stroke-width="1"/>
            <defs>
                <linearGradient id="labelGradient-${windId}" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#24272b"/>
                    <stop offset="100%" stop-color="#121417"/>
                </linearGradient>
                <filter id="shadow-${windId}" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="#000" flood-opacity="0.5"/>
                </filter>
            </defs>
            <rect x="${boxX}" y="${boxY}" width="${BOX_W}" height="${BOX_H}" rx="11" fill="url(#labelGradient-${windId})" fill-opacity="0.98" stroke="rgba(255,255,255,0.25)" stroke-width="0.8" filter="url(#shadow-${windId})"/>
            <g id="${arrowId}" 
               transform="rotate(0, ${arrowCX}, ${arrowCY})"
               style="filter: drop-shadow(0px 0px 1px rgba(0,0,0,0.5));">
                <text x="${arrowCX}" y="${arrowCY}" font-size="11" fill="${activeColor}" text-anchor="middle" dominant-baseline="central">➤</text>
            </g>
            <text id="${windId}" data-raw="${windSpeed}" x="${textX}" y="${arrowCY}" font-family="sans-serif" font-size="9" font-weight="700"  fill="#FFFFFF" text-anchor="start" dominant-baseline="central" style="paint-order: stroke; stroke: rgba(0,0,0,0.3); stroke-width: 1px;">
                ${displayValue} <tspan font-weight="400" font-size="9" fill="rgba(255,255,255,0.7)">${unit.label}</tspan>
            </text>
        </svg>`
    };
}
const BASE_OFFSETS = [
    { dx: 70, dy: -50 }, { dx: -70, dy: -50 },
    { dx: 70, dy:  40 }, { dx: -70, dy: 40 },
    { dx: 0, dy: -80 }, { dx: 120, dy: 0 },
    { dx:-120, dy: 0 }
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
        <svg width="24" height="60" viewBox="0 0 24 60" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.5))">
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
    const unit = getCurrentUnit();
    const compassDir = direction !== null ? degToCompass(direction) : '—';
    const arrowRotate = direction ?? 0;
    const speedColor = speed !== null ? getWindColor(speed) : '#aaa';
    const tickLines = Array.from({ length: 8 }, (_, i) => {
        const a  = (i * 45) * Math.PI / 180;
        const x1 = (36 + 28 * Math.sin(a)).toFixed(1);
        const y1 = (36 - 28 * Math.cos(a)).toFixed(1);
        const x2 = (36 + 32 * Math.sin(a)).toFixed(1);
        const y2 = (36 - 32 * Math.cos(a)).toFixed(1);
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>`;
    }).join('');
    const gustHtml = gusts !== null
        ? `<div class="cpicker-gust" id="picker-gust-wrap" style="color:${getWindColor(gusts)}">
               <i class="fa-solid fa-wind" style="font-size:9px"></i>
               <span data-i18n="gusts">${langData['gusts'] || 'Gusts'}</span>
               <span id="picker-gust-value" data-raw="${gusts}">
                  ${(gusts * unit.factor).toFixed(1)} ${unit.label}
               </span>
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
                    <circle cx="36" cy="36" r="34" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
                    ${tickLines}
                    <text x="36" y="7"  text-anchor="middle" dominant-baseline="central" font-size="9" fill="rgba(255,255,255,0.5)">N</text>
                    <text x="36" y="67" text-anchor="middle" dominant-baseline="central" font-size="9" fill="rgba(255,255,255,0.5)">S</text>
                    <text x="65" y="36" text-anchor="middle" dominant-baseline="central" font-size="9" fill="rgba(255,255,255,0.5)">E</text>
                    <text x="7"  y="36" text-anchor="middle" dominant-baseline="central" font-size="9" fill="rgba(255,255,255,0.5)">W</text>
                    <g id="picker-arrow-g" transform="rotate(${arrowRotate}, 36, 36)">
                        <line x1="36" y1="52" x2="36" y2="20" stroke="${speedColor}" stroke-width="2" stroke-linecap="round"/>
                        <polygon points="36,14 31,24 41,24" fill="${speedColor}"/>
                        <circle cx="36" cy="36" r="3" fill="${speedColor}" stroke="rgba(0,0,0,0.3)" stroke-width="1"/>
                    </g>
                </svg>
            </div>
            <div class="cpicker-values">
                <div class="cpicker-speed" id="picker-speed-wrap" style="color:${speedColor}">
                    <span id="picker-wind-value" data-raw="${speed}">
                        ${speed !== null ? (speed * unit.factor).toFixed(1) : '—'}
                    </span>
                    <span class="cpicker-unit" id="picker-unit-label">${unit.label}</span>
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
                    map.flyToBounds(e.target.getBounds(), { 
                        padding: [50, 50], 
                        duration: 1.25, 
                        easeLinearity: 0.25,
                        animate: true
                    });
                    map.once('moveend', () => {
                        setTimeout(() => {
                            handlePickerOpening(e.latlng, windyAPI.picker, e.target);
                            console.log("Zoom finished, picker opened.");
                        }, 200);
                    });
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
        const world = [
            [90, -180],
            [90, 180],
            [-90, 180],
            [-90, -180]
        ];
        const maskLayer = L.polygon([world, ...allHoles], {
            fillColor:   '#C0C0C0',
            fillOpacity: 0.75,
            stroke:      false,
            interactive: false, 
            pane:        'overlayPane',
            smoothFactor: 0.1,
            noClip:       true  
        }).addTo(map);
        maskLayer.bringToBack();
        map.on('zoomend', () => {
            maskLayer.bringToBack();
        });
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
        duration: 1.25,
        easeLinearity: 0.25,
        noMoveStart: true,
        animate: true
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
        const onFlyEnd = () => {
            openProject(area.project_id);
            map.off('moveend', onFlyEnd); 
        };
        map.on('moveend', onFlyEnd);
        map.flyToBounds(bounds, { 
            padding: [50, 50], 
            duration: 1.25, 
            easeLinearity: 0.25, 
            maxZoom: 17, 
            animate: true
        });
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
        color: 'transparent',
        fillColor: '#000',
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
        let extraInfo = '';
        if(cfg.title === 'PROJECT') {
            extraInfo = item.project_status_color ? `<i class="fa-solid fa-circle-dot status-pulse me-2" style="color:${item.project_status_color};margin-right:6px"></i>` : '';
        }
        if (cfg.isLast) {
            html += `<div class="menu-item station-item" onclick="handleStationClick(${item.poles_lat},${item.poles_lng},${item.poles_id},this)">
                <span>${extraInfo}${label}</span>
                <i class="fa-solid fa-location-dot text-info"></i>
            </div>`;
        } else {
            html += `<div class="menu-item" onclick="selectItem(${level},${item[cfg.key]},this)">
                <span>${extraInfo}${label}</span>
                <i class="fa-solid fa-chevron-right"></i>
            </div>`;
        }
    });
    const panel = $(`#menu-level-${level}`);
    panel.html(html).addClass('active').fadeIn();
    if (isMobile()) panel[0].scrollIntoView({ behavior: 'smooth' });
}
$(document).on('click', () => $('.menu-panel').fadeOut());
$('.menu-panel').on('click', e => e.stopPropagation());
$(document).ready(function () {
    const $panel = $('#sideControlPanel');
    const $fab = $('#fabToggle');
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
    $('.drag-handle').on('touchstart', e => { touchStartY = e.originalEvent.touches[0].clientY; }).on('touchmove',  e => {
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
    setTimeout(initMap, 4000);
    setTimeout(() => {
        if (typeof disposeThreeJS === 'function') disposeThreeJS();
        $('header, #ui, #sideControlPanel, #projectCanvas').fadeIn(400);
        $panel.show();
        requestAnimationFrame(() => {
            $panel.css({ opacity: '1', transition: 'all 0.6s cubic-bezier(0.34,1.56,0.64,1)' });
            if (!isMobile()) $panel.removeClass('collapsed');
        });
    }, 7500);
    setTimeout(hideWindLoading, 8500);
});