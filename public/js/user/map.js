'use strict';
function initMap() {
    windyInit(options, async api => {
        const { store, picker, map: windyMap } = api;
        windyAPI = api;
        map = windyMap;
        if (typeof restoreMapSettings === 'function') {
            restoreMapSettings();
        }
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
            if (windAreaData) {
                await renderWindAreas(picker, windAreaData, masterData);
            }
            if (masterData) {
                applyMasterSettings(masterData);
                show_country_line = masterData.show_country_line;
                country_layers_data = masterData.country_layers_data;
                const map_viewsVal = localStorage.getItem('map_views') || DEFAULT_MODE;
                toggleSatellite(map_viewsVal);
                $('#mapModeWind').toggleClass('active', map_viewsVal === 'wind');
                $('#mapModeSat').toggleClass('active',   map_viewsVal === 'satellite');
                const labelsRaw = localStorage.getItem('labels');
                const labels = labelsRaw !== null ? (labelsRaw === 'true') : (masterData.labels === 'yes');
                toggleLabel(labels);
                $('#toggle-label').prop('checked', labels);
                const windturbineRaw = localStorage.getItem('windturbine');
                const windturbines = windturbineRaw !== null ? (windturbineRaw === 'true') : windturbine;
                toggleWindTurbine(windturbines);
                $('#toggle-windturbine').prop('checked', windturbines);
                const animationRaw = localStorage.getItem('animation');
                const animationVal = animationRaw !== null ? (animationRaw === 'true') : animation;
                toggleAnimation(animationVal);
                $('#toggle-animation').prop('checked', animationVal);
                const equipmentRaw = localStorage.getItem('equipment');
                const equipments = equipmentRaw !== null ? (equipmentRaw === 'true') : equipment;
                toggleEquipment(equipments);
                $('#toggle-equipment').prop('checked', equipments);
                if (show_country_line === 'show' && country_layers_data) {
                    _drawCountryLines(country_layers_data);
                }
                const focus = getLocalBool('focus', false);
                toggleFocus(focus);
                $('#toggle-focus').prop('checked', focus);
                const winds = getLocalBool('winds', true);
                windOn = winds;
                $('#toggle-wind-values').prop('checked', winds);
                toggleWind(winds);
            }
            await loadPoles();
            await loadWindTurbines();
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
        if (countryLayer) {
            map.removeLayer(countryLayer);
        }
        countryLayer = L.geoJSON(geoData, {
            style: { 
                color: '#161616', 
                weight: 1.5,
                fillOpacity: 0, 
                interactive: false 
            }
        });
        countryLayer.addTo(map);
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
    const headerH  = headerEl ? headerEl.getBoundingClientRect().height : 60;
    const footerH  = footerEl ? footerEl.getBoundingClientRect().height : 36;
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
async function refreshAllWindData() {
    if (!windOn || isRefreshing) return;
    const entries = Object.entries(poleMarkers);
    if (entries.length === 0) return;
    isRefreshing = true;
    try {
        const lats = entries.map(([, p]) => p.lat).join(',');
        const lngs = entries.map(([, p]) => p.lng).join(',');
        const url = `${OPEN_METEO}?latitude=${lats}&longitude=${lngs}` + `&current=wind_speed_100m,wind_direction_100m&wind_speed_unit=ms`;
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
                elArrow.dataset.dir = dir;
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
    const { label, factor } = unit;
    $('.stat-unit-label').text(label);
    const updateStat = (selectorId, value, defaultClass) => {
        const calculatedValue = (value * factor).toFixed(1);
        const color = getWindColor(value);
        $(`${selectorId}-val`).text(calculatedValue);
        $(selectorId).removeClass(defaultClass).css('color', color);
    };
    updateStat('#stat-max-wind', max, 'text-warning');
    updateStat('#stat-min-wind', min, 'text-info');
    updateStat('#stat-avg-wind', avg, 'text-success');
}
let turbineMarkers = {};
async function loadWindTurbines() {
    try {
        const turbines = await fetchJSON(`${BASE_URL}/api/windturbines.get`);
        if (!Array.isArray(turbines)) return;
        Object.values(turbineMarkers).forEach(({ marker }) => {
            if (marker && poleLayerGroup.hasLayer(marker)) {
                poleLayerGroup.removeLayer(marker);
            }
        });
        turbineMarkers = {};
        const isVisible = localStorage.getItem('windturbine') === 'true';
        const zoom = map.getZoom();
        const initSize = Math.max(3, Math.min(12, (zoom - 10) * 1.5 + 3));
        const opacity = zoom < 10 ? 0.6 : 1;
        turbines.forEach((turbine, index) => {
            const lat = parseFloat(turbine.windturbine_lat);
            const lng = parseFloat(turbine.windturbine_lng);
            if (isNaN(lat) || isNaN(lng)) return;
            const marker = L.marker([lat, lng], {
                icon: _buildTurbineIcon(turbine, initSize),
                zIndexOffset: 900,
                opacity: opacity
            });
            marker._turbineData = turbine;
            if (turbine.windturbine_name) {
                marker.bindTooltip(turbine.windturbine_name, {
                    permanent: false,
                    direction: 'top'
                });
            }
            turbineMarkers[index] = { marker, turbine };
            if (isVisible) marker.addTo(poleLayerGroup);
        });
        if (!map._turbineZoomBound) {
            map._turbineZoomBound = true;
            map.on('zoomend', () => {
                if (typeof resizeLabel === 'function') {
                    resizeLabel();
                }
            });
        }
    } catch (err) {
        console.error('loadWindTurbines error:', err);
    }
}
(function injectPoleStyles() {
    if (document.getElementById('pole-map-styles')) return;
    const s = document.createElement('style');
    s.id = 'pole-map-styles';
    s.textContent = `
        .pole-label-wrap svg   { transition: opacity 0.25s ease; }
        .pole-icon-wrap  svg   { transition: width 0.2s ease, height 0.2s ease; }
        .leaflet-marker-icon,
        .leaflet-marker-shadow { transition: transform 0.18s ease, opacity 0.18s ease; }
    `;
    document.head.appendChild(s);
})();
const POLE_LABEL = {
    W: 80,
    H: 26, 
    POLE_EXCL_R: 28,
};
const OFFSET_DIRS = [
    { dx:  1.00, dy: -0.55 }, 
    { dx: -1.00, dy: -0.55 },
    { dx:  1.00, dy:  0.55 },
    { dx: -1.00, dy:  0.55 },
    { dx:  0.10, dy: -1.10 },
    { dx:  0.10, dy:  1.10 },
    { dx:  1.40, dy:  0.00 },
    { dx: -1.40, dy:  0.00 },
];
function _calcOffsetDist(zoom) {
    const MIN_ZOOM = 8,  MAX_ZOOM = 19;
    const MIN_DIST = 42, MAX_DIST = 110;
    const t = Math.max(0, Math.min(1, (zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)));
    const ease = 1 - Math.pow(1 - t, 2);
    return MIN_DIST + (MAX_DIST - MIN_DIST) * ease;
}
function _calcLabelScale(zoom) {
    const MIN_ZOOM = 8, MAX_ZOOM = maxZoomLevel;
    const t = Math.max(0, Math.min(1, (zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)));
    return 0.52 + 0.68 * t;
}
function _calcIconSize(zoom) {
    const MIN_ZOOM = 8,  MAX_ZOOM = maxZoomLevel;
    const MIN_SIZE = 24, MAX_SIZE = 120;
    const t    = Math.max(0, Math.min(1, (zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)));
    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    return Math.round(MIN_SIZE + (MAX_SIZE - MIN_SIZE) * ease);
}
function getSmartOffset(lat, lng, usedBoxes, map, zoom, polePoints) {
    const dist  = _calcOffsetDist(zoom);
    const point = map.latLngToContainerPoint([lat, lng]);
    const poleBox = {
        left:   point.x - POLE_LABEL.POLE_EXCL_R,
        right:  point.x + POLE_LABEL.POLE_EXCL_R,
        top:    point.y - POLE_LABEL.POLE_EXCL_R * 2,
        bottom: point.y + POLE_LABEL.POLE_EXCL_R * 0.5,
    };
    for (let expansion = 0; expansion < 5; expansion++) {
        for (const dir of OFFSET_DIRS) {
            const dx = Math.round(dir.dx * dist + expansion * 30 * Math.sign(dir.dx || 1));
            const dy = Math.round(dir.dy * dist + expansion * 20 * Math.sign(dir.dy || 1));
            const labelCX = point.x + dx;
            const labelCY = point.y + dy;
            const box = {
                left:   labelCX - POLE_LABEL.W / 2,
                right:  labelCX + POLE_LABEL.W / 2,
                top:    labelCY - POLE_LABEL.H / 2,
                bottom: labelCY + POLE_LABEL.H / 2,
            };
            if (usedBoxes.some(b => _overlaps(box, b))) continue;
            if (_overlaps(box, poleBox)) continue;
            const tooCloseToPole = (polePoints || []).some(p => {
                const ddx = p.x - labelCX, ddy = p.y - labelCY;
                return Math.sqrt(ddx * ddx + ddy * ddy) < POLE_LABEL.POLE_EXCL_R * 1.4;
            });
            if (tooCloseToPole) continue;
            usedBoxes.push(box);
            return { dx, dy };
        }
    }
    const dx = Math.round(dist * 1.6);
    const dy = Math.round((Math.random() - 0.5) * dist * 0.6);
    return { dx, dy };
}
function _overlaps(a, b) {
    return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
}
function buildWindLabelSVG({ anchorX, anchorY, labelDx, labelDy, windId, arrowId, windSpeed = 0, windDir = 0, scale = 1 }) {
    const BOX_H = Math.round(28 * scale);
    const PADDING = Math.round(10 * scale);
    const fs1 = Math.max(8,  Math.round(14 * scale));
    const fs2 = Math.max(7,  Math.round(11 * scale));
    const fs3 = Math.max(8,  Math.round(13 * scale)); 
    const rx = Math.round(BOX_H / 2);
    const dotR = Math.max(2.5, 3.5 * scale);
    const lw = Math.max(0.8, 1.2 * scale);
    const unit = getCurrentUnit();
    const displayVal = (windSpeed * unit.factor).toFixed(1);
    const label = unit.label;
    const arrowW = Math.round(fs3 * 1.2);
    const textW = Math.round(displayVal.length * fs1 * 0.62 + label.length * fs2 * 0.6 + 2);
    const BOX_W = PADDING + arrowW + Math.round(PADDING * 0.5) + textW + PADDING;
    const svgW  = Math.abs(labelDx) + BOX_W + 13;
    const svgH  = Math.abs(labelDy) + BOX_H + 12;
    const tipX  = anchorX + labelDx;
    const tipY  = anchorY + labelDy;
    const boxX  = labelDx >= 0 ? tipX : tipX - BOX_W;
    const boxY  = tipY - BOX_H / 2;
    const lineStartX = labelDx >= 0 ? boxX : boxX + BOX_W;
    const lineStartY = tipY;
    const arrowCX = boxX + PADDING + Math.round(arrowW / 2);
    const arrowCY = tipY;
    const textX   = boxX + PADDING + arrowW + Math.round(PADDING * 0.5);
    const activeColor  = getWindColor(windSpeed);
    const glowColor    = activeColor;
    const lgId   = `lg-${windId}`;
    const shId   = `sh-${windId}`;
    const glowId = `gw-${windId}`;
    return {
        svgW, svgH,
        html: `
            <svg width="${svgW}" height="${svgH}" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;pointer-events:none;display:block">
            <defs>
                <linearGradient id="${lgId}" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stop-color="#1e2228"/>
                    <stop offset="100%" stop-color="#0d0f12"/>
                </linearGradient>
                <filter id="${shId}" x="-30%" y="-40%" width="160%" height="180%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.55"/>
                </filter>
                <filter id="${glowId}" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2.5" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
            </defs>
            <line x1="${anchorX}" y1="${anchorY}" x2="${lineStartX}" y2="${lineStartY}" stroke="rgba(255,255,255,0.18)" stroke-width="${lw}" stroke-dasharray="${Math.round(3 * scale)},${Math.round(2.5 * scale)}" stroke-linecap="round"/>
            <circle cx="${anchorX}" cy="${anchorY}" r="${dotR + 2}" fill="${glowColor}" fill-opacity="0.15"/>
            <circle cx="${anchorX}" cy="${anchorY}" r="${dotR}" fill="${glowColor}" fill-opacity="0.7" stroke="rgba(255,255,255,0.35)" stroke-width="0.8"/>
            <rect id="rect-${windId}" x="${boxX}" y="${boxY}" width="${BOX_W}" height="${BOX_H}" rx="${rx}" fill="url(#${lgId})" fill-opacity="0.96" stroke="${glowColor}" stroke-width="0.65" stroke-opacity="0.45" filter="url(#${shId})"/>
            <rect x="${boxX + 1}" y="${boxY + 1}" width="${BOX_W - 2}" height="${Math.round(BOX_H * 0.45)}" rx="${rx}" fill="rgba(255,255,255,0.04)"/>
            <g id="${arrowId}" data-cx="${arrowCX}" data-cy="${arrowCY}" data-dir="${windDir}" transform="rotate(${windDir - 90}, ${arrowCX}, ${arrowCY})">
                <text x="${arrowCX}" y="${arrowCY}" font-size="${fs3}" fill="${activeColor}" text-anchor="middle" dominant-baseline="central" filter="url(#${glowId})">➤</text>
            </g>
            <text id="${windId}" data-raw="${windSpeed}" x="${textX}" y="${arrowCY}" font-size="${fs1}" font-weight="700" fill="${activeColor}" text-anchor="start" dominant-baseline="central" style="paint-order:stroke; stroke:rgba(0,0,0,0.4); stroke-width:1.2px; stroke-linejoin:round"> 
                ${displayVal}
                <tspan class="wind-unit-label" font-weight="400" font-size="${fs2}" dx="${Math.round(2 * scale)}"> 
                    ${label}
                </tspan>
            </text>
        </svg>`
    };
}
function _buildPoleIcon(pole, size = 30) {
    if (pole.type_icon?.trim()) {
        return L.icon({
            iconUrl:     pole.type_icon,
            iconSize:    [size, size],
            iconAnchor:  [size / 2, size],
            popupAnchor: [0, -size]
        });
    }
    const isEven  = pole.type_id % 2 === 0;
    const color   = isEven ? '#f5a623' : '#5bb8f5';
    const color2  = isEven ? '#d4821e' : '#1e90d4';
    const glowCol = isEven ? 'rgba(91,184,245,0.6)' : 'rgba(245,166,35,0.6)';
    const extraY = 30;
    const extra = `
        <line x1="3" y1="${extraY}" x2="-5" y2="${extraY}" stroke="rgba(255,255,255,0.85)" stroke-width="1.3" stroke-linecap="round"/>
        <circle cx="-5" cy="${extraY}" r="1.8" fill="${color}" stroke="rgba(255,255,255,0.9)" stroke-width="0.7"/>
    `;
    const w = size * 0.7;
    const h = size * 1.9;
    return L.divIcon({
        className:  'pole-icon-wrap',
        iconSize:   [w, h],
        iconAnchor: [w * 0.18, h],
        html: `
            <svg width="${w}" height="${h}" viewBox="0 0 20 52" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;display:block">
            <defs>
                <filter id="pglow-${pole.poles_id}" x="-80%" y="-40%" width="260%" height="180%">
                    <feGaussianBlur stdDeviation="2" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
            </defs>
            <ellipse cx="3" cy="49" rx="5" ry="2" fill="${glowCol}" filter="url(#pglow-${pole.poles_id})"/>
            <circle cx="3" cy="49" r="3.5" fill="rgba(20,22,26,0.9)" stroke="${color}" stroke-width="1.5"/> 
            <line x1="3" y1="46" x2="3" y2="3" stroke="rgba(255,255,255,0.82)" stroke-width="1.7" stroke-linecap="round"/>  
            <line x1="3" y1="5" x2="15" y2="5" stroke="rgba(255,255,255,0.82)" stroke-width="1.3" stroke-linecap="round"/>
            <circle cx="15" cy="5" r="2.5" fill="${color}" stroke="rgba(255,255,255,0.85)" stroke-width="0.7" filter="url(#pglow-${pole.poles_id})"/>
            <line x1="3" y1="15" x2="11" y2="15" stroke="rgba(255,255,255,0.82)" stroke-width="1.3" stroke-linecap="round"/>
            <circle cx="11" cy="15" r="2" fill="${color2}" stroke="rgba(255,255,255,0.85)" stroke-width="0.7"/>
            ${extra}
        </svg>`
    });
}
async function loadPoles() {
    if (poleLayerGroup && poleLayerGroup.getLayers().length > 0) {
        if (windOn) refreshAllWindData();
        return;
    }
    const poles = await fetchJSON(`${BASE_URL}/api/poles.get`).catch(err => {
        console.error('loadPoles error:', err);
        return null;
    });
    if (!Array.isArray(poles)) return;
    window._usedLabelBoxes = [];
    const zoom       = map.getZoom();
    const initSize   = _calcIconSize(zoom);
    const initScale  = _calcLabelScale(zoom);
    const totalPoles = poles.length;
    const chunkSize  = 40;
    let   currentIndex = 0;
    function _getAllPolePoints() {
        return poles.map(p => {
            const lat = parseFloat(p.poles_lat);
            const lng = parseFloat(p.poles_lng);
            if (isNaN(lat) || isNaN(lng)) return null;
            return map.latLngToContainerPoint([lat, lng]);
        }).filter(Boolean);
    }
    function renderChunk() {
        const polePoints = _getAllPolePoints();
        const end = Math.min(currentIndex + chunkSize, totalPoles);
        for (let i = currentIndex; i < end; i++) {
            const pole = poles[i];
            const lat  = parseFloat(pole.poles_lat);
            const lng  = parseFloat(pole.poles_lng);
            if (isNaN(lat) || isNaN(lng)) continue;
            if (poleMarkers[pole.poles_id]) continue;
            const marker = L.marker([lat, lng], {
                icon:         _buildPoleIcon(pole, initSize),
                zIndexOffset: 1000
            }).addTo(poleLayerGroup);
            marker._poleData = pole;
            marker.on('click', () => openPoles(pole.poles_id));
            const windId  = `wind-auto-${pole.poles_id}`;
            const arrowId = `arrow-${pole.poles_id}`;
            const otherPolePoints = polePoints.filter(p => {
                const pt = map.latLngToContainerPoint([lat, lng]);
                return !(Math.abs(p.x - pt.x) < 1 && Math.abs(p.y - pt.y) < 1);
            });
            const off = getSmartOffset(lat, lng, window._usedLabelBoxes, map, map.getZoom(), otherPolePoints);
            const anchorX = off.dx >= 0 ? 0 : Math.abs(off.dx);
            const anchorY = off.dy >= 0 ? 0 : Math.abs(off.dy);
            const { svgW, svgH, html } = buildWindLabelSVG({
                anchorX, anchorY,
                labelDx: off.dx,
                labelDy: off.dy,
                windId, arrowId,
                scale: initScale
            });
            const labelMarker = L.marker([lat, lng], {
                icon: L.divIcon({
                    className:  'pole-label-wrap',
                    iconSize:   [svgW, svgH],
                    iconAnchor: [anchorX, anchorY],
                    html
                }),
                interactive:  false,
                zIndexOffset: 500
            }).addTo(poleLayerGroup);
            if (!windOn) labelMarker.setOpacity(0);
            poleMarkers[pole.poles_id] = { marker, labelMarker, lat, lng, windId, arrowId };
        }
        currentIndex = end;
        if (currentIndex < totalPoles) {
            setTimeout(renderChunk, 1);
        } else {
            if (windOn) refreshAllWindData();
        }
    }
    renderChunk();
    if (!map._poleZoomBound) {
        map._poleZoomBound = true;
        let _zoomTimer = null;
        map.on('zoom', () => {
            const size = _calcIconSize(map.getZoom());
            const entries = Object.values(poleMarkers);
            entries.forEach(({ marker }) => {
                const pd = marker._poleData;
                if (!pd) {
                    console.warn('no _poleData on marker');
                    return;
                }
                const newIcon = _buildPoleIcon(pd, size);
                marker.setIcon(newIcon);
                const el = marker.getElement();
            });
        });
        map.on('zoomend', () => {
            clearTimeout(_zoomTimer);
            _zoomTimer = setTimeout(() => {
                resizeLabel();
            }, 80);
        });
    }
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
            <line x1="4" y1="6"  x2="18" y2="6" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="4" y1="16" x2="14" y2="16" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
            <circle cx="18" cy="6" r="2.5" fill="#5bb8f5" stroke="#ffffff" stroke-width="1"/>
            <circle cx="14" cy="16" r="2" fill="#5bb8f5" stroke="#ffffff" stroke-width="1"/>
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
        const url = `${OPEN_METEO}?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}` + `&current=wind_speed_100m,wind_direction_100m,wind_gusts_10m&wind_speed_unit=ms`;
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
        ? `<div class="cpicker-gust" id="picker-gust-wrap">
               <i class="fa-solid fa-wind" style="font-size:9px"></i>
               <span data-i18n="gusts">${langData['gusts'] || 'Gusts'}</span>
                <span id="picker-gust-value" data-raw="${gusts}">${(gusts * unit.factor).toFixed(1)} ${unit.label}</span>
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
        const hit = ((yi > point.lng) !== (yj > point.lng)) && (point.lat < (xj - xi) * (point.lng - yi) / (yj - yi) + xi);
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
    isMaskMode = masterData?.polygon_visibility === 'close';
    const featureGroup = L.featureGroup();
    const overlapGroups = {};
    polygons.forEach((area, i) => {
        const key = area.overlap_group ?? 'single_' + i;
        if (!overlapGroups[key]) overlapGroups[key] = [];
        overlapGroups[key].push({ index: i, area });
    });
    Object.entries(overlapGroups).forEach(([groupKey, group]) => {
        const styleGroups = new Map();
        group.forEach(({ index, area }) => {
            if (!area.geo_data) return;
            try {
                const geoJsonData = JSON.parse(area.geo_data);
                const styleData   = JSON.parse(area.custom_style || '{}');
                const styleKey = JSON.stringify({
                    fillColor:   styleData.fillColor   || '#3388ff',
                    fillOpacity: styleData.fillOpacity !== undefined ? parseFloat(styleData.fillOpacity) : 0.2,
                    color:       styleData.color       || '#3388ff',
                    weight:      styleData.weight      !== undefined ? parseFloat(styleData.weight) : 2,
                });
                if (!styleGroups.has(styleKey)) {
                    styleGroups.set(styleKey, { styleData, areas: [] });
                }
                styleGroups.get(styleKey).areas.push({ index, geoJsonData, area });
            } catch (err) {
                console.error('Area JSON parse error:', err);
            }
        });
        styleGroups.forEach(({ styleData, areas }) => {
            const fillColor   = styleData.fillColor   || '#3388ff';
            const fillOpacity = styleData.fillOpacity !== undefined ? parseFloat(styleData.fillOpacity) : 0.2;
            const color       = styleData.color       || '#3388ff';
            const weight      = styleData.weight      || 2;
            const allGeoJsons = areas.map(a => a.geoJsonData);
            const unionGeo    = _mergePolygonsToUnion(allGeoJsons);
            if (unionGeo) {
                L.geoJSON(unionGeo, {
                    style: () => ({
                        fillColor,
                        fillOpacity,
                        stroke:      false,
                        interactive: false,
                    })
                }).addTo(featureGroup);
            }
            areas.forEach(({ index, geoJsonData, area }, posInGroup) => {
                const tempLayer = L.geoJSON(geoJsonData);
                try {
                    const b = tempLayer.getBounds();
                    if (b.isValid()) {
                        areaBounds[index] = b;
                    }
                } catch (_) {}
                const isRepresentative = posInGroup === 0;
                const strokeLayer = L.geoJSON(geoJsonData, {
                    style: () => ({
                        fill:        true,
                        fillColor: 'rgba(0,0,0,0)',
                        fillOpacity: 0,
                        color,
                        weight:      isRepresentative ? weight : 0,  
                        stroke:      isRepresentative ? (weight !== 0) : false,
                        opacity:     isRepresentative ? 1 : 0,
                        interactive: true,
                    }),
                });
                areaLayers[index] = strokeLayer;
                strokeLayer.on('click', function (e) {
                    highlightAreaItem(index);
                    flyToArea(index, area, true, false, e.latlng);
                });
                strokeLayer.addTo(featureGroup);
                if (isMaskMode && isRepresentative) {
                    strokeLayer.eachLayer(layer => {
                        const lls = layer.getLatLngs?.();
                        if (!lls) return;
                        const rings = Array.isArray(lls[0]) && !(lls[0][0] instanceof L.LatLng)
                            ? lls.map(inner => inner[0])
                            : [lls[0]];
                        allHoles.push(...rings);
                    });
                }
            });
        });
    });
    featureGroup.addTo(map).bringToFront();
    const bounds = featureGroup.getBounds();
    if (bounds.isValid()) {
        const padded   = bounds.pad(0.1);
        initialBounds  = bounds;
        initialPadding = { padding: [20, 20] };
        const fitZoom = map.getBoundsZoom(bounds, false, [20, 20]);
        map.fitBounds(bounds, { padding: [20, 20] });
        map.options.minZoom = map.getBoundsZoom(bounds);
        map.setMinZoom(fitZoom);
        map.setMaxBounds(padded);
        map.on('drag',    () => map.panInsideBounds(padded, { animate: false }));
        map.on('moveend', () => {
            if (!map._flyToFrame && !padded.contains(map.getCenter())) {
                map.panInsideBounds(padded, { animate: true });
            }
        });
    }
    buildAreaPanel(polygons);
}
function _mergePolygonsToUnion(geoJsonArray) {
    if (!geoJsonArray?.length) return null;
    if (geoJsonArray.length === 1) return _toFeatureCollection(geoJsonArray[0]);
    if (typeof turf === 'undefined') {
        console.warn('[_mergePolygonsToUnion] turf not loaded');
        return { type: 'FeatureCollection', features: geoJsonArray.map(g => _toFeature(g)) };
    }
    try {
        const features = geoJsonArray.flatMap(g => _toFeatureCollection(g).features).filter(f => f?.geometry);
        if (!features.length) return null;
        let merged = features[0];
        for (let i = 1; i < features.length; i++) {
            try {
                merged = turf.union(merged, features[i]);
            } catch (e) {
                console.warn('[_mergePolygonsToUnion] union failed at index', i, e);
            }
        }
        return merged;
    } catch (err) {
        console.error('[_mergePolygonsToUnion] error:', err);
        return _toFeatureCollection(geoJsonArray[0]);
    }
}
function _mergePolygonsNoOverlap(geoJsonArray) {
    if (typeof turf === 'undefined') {
        console.warn('[renderWindAreas] Turf.js not loaded');
        return { type: 'FeatureCollection', features: geoJsonArray.map(g => _toFeature(g)) };
    }
    try {
        const features = geoJsonArray.flatMap(g => {
            const fc = _toFeatureCollection(g);
            return fc.features;
        }).filter(f => f?.geometry);
        let resultFeatures = [];
        let accumulated = null;
        features.forEach((feature, i) => {
            try {
                let cleanFeature = feature;
                if (accumulated) {
                    try {
                        cleanFeature = turf.difference(feature, accumulated);
                    } catch (err) {
                        console.warn('difference error', err);
                    }
                }
                if (cleanFeature) {
                    resultFeatures.push(cleanFeature);
                    accumulated = accumulated ? turf.union(accumulated, feature) : feature;
                }
            } catch (err) {
                console.warn('process feature error', err);
            }
        });
        return {
            type: 'FeatureCollection',
            features: resultFeatures
        };
    } catch (err) {
        console.error('[renderWindAreas] _mergePolygonsNoOverlap error:', err);
        return { type: 'FeatureCollection', features: geoJsonArray.map(g => _toFeature(g)) };
    }
}
function _toFeatureCollection(g) { 
    if (g?.type === 'FeatureCollection') return g; 
    if (g?.type === 'Feature') return { type: 'FeatureCollection', features: [g] }; 
    return { 
        type: 'FeatureCollection', 
        features: [{ 
            type: 'Feature', 
            geometry: g, 
            properties: {} 
        }] 
    }; 
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
        <div class="ap-item animate__animated animate__fadeInUp" id="ap-item-${i}" data-index="${i}" style="animation-delay:${i * 0.05}s">
            <i class="fa-solid fa-circle-dot ${hasStatus ? 'status-pulse' : ''} me-2" style="color:${color}"></i>
            <span class="ap-name" title="${area.area_name}">${area.area_name}</span>
        </div>`;
    }).join('');
    list.querySelectorAll('.ap-item').forEach(el => {
        el.addEventListener('click', function () {
            const i = parseInt(this.dataset.index);
            if (!areaVisibility[i]) return;
            flyToArea(i, polygons[i], false, true, null);
            highlightAreaItem(i);
        });
    });
}
function flyToArea(areaIndex, areaObj, openPicker = false, openProject = false, clickLatLng = null) {
    let targetBounds = areaBounds?.[areaIndex];
    if (!targetBounds?.isValid()) {
        const geoLayer = areaLayers[areaIndex];
        if (!geoLayer) return;
        targetBounds = geoLayer.getBounds();
    }
    if (!targetBounds?.isValid()) return;
    const groupKey   = areaObj?.overlap_group ?? 'single_' + areaIndex;
    const geoLayer   = areaLayers[areaIndex];
    const focusZoom  = map.getBoundsZoom(targetBounds, false, [25, 25]);
    const currentMax = map.options.maxBounds;
    const needsRelax = currentMax && !currentMax.contains(targetBounds);
    const fromCenter  = map.getCenter();
    const toCenter    = targetBounds.getCenter();
    const distDeg     = Math.hypot(toCenter.lat - fromCenter.lat, toCenter.lng - fromCenter.lng);
    const zoomDiff    = Math.abs((map.getZoom() || 10) - focusZoom);
    const rawDuration = 1.2 + distDeg * 2.2 + zoomDiff * 0.18;
    const duration    = Math.min(3.0, Math.max(1.2, rawDuration));
    if (needsRelax) {
        const relaxed = currentMax.extend(targetBounds).pad(0.08);
        map.setMaxBounds(relaxed);
    }
    try {
        if (windyAPI?.map?.stop)  windyAPI.map.stop();
        if (windyAPI?.store?.set) windyAPI.store.set('overlay', windyAPI.store.get('overlay'));
    } catch (_) {}
    const targetCenter = targetBounds.getCenter();
    map.options.zoomAnimation = false;
    map.setView(targetCenter, focusZoom, {
        animate: true,
        duration,
        easeLinearity: 0.08,
        noMoveStart: true,
    });
    map.once('moveend', () => {
        map.options.zoomAnimation = true;
        if (needsRelax && currentMax) {
            setTimeout(() => {
                map.setMaxBounds(currentMax);
                if (!currentMax.contains(map.getCenter())) {
                    map.panInsideBounds(currentMax, { animate: true, duration: 0.5 });
                }
            }, 120);
        }
        if (openPicker) {
            const pickerLatLng = clickLatLng || targetBounds.getCenter();
            setTimeout(() => {
                handlePickerOpening(pickerLatLng, windyAPI.picker, geoLayer);
            }, 200);
        }
        if (openProject) {
            const projectId = areaObj?.project_id;
            if (projectId) openProjectDetail(projectId);
        }
    });
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
    const toggleMobilePanel = (forceState = null) => {
        const open = forceState !== null ? forceState : !$panel.hasClass('mobile-open');
        $panel.toggleClass('mobile-open', open);
        $overlay.toggle(open);
        $('body').css('overflow', open ? 'hidden' : '');
    };
    $fab.on('click', e => { e.stopPropagation(); toggleMobilePanel(); });
    $overlay.on('click', () => toggleMobilePanel(false));
    $(document).on('click', e => {
        if ($(window).width() <= 768 && $panel.hasClass('mobile-open') && !$panel.is(e.target) && !$panel.has(e.target).length && !$fab.is(e.target)) {
            toggleMobilePanel(false);
        }
    });
    let touchStartY = 0;
    $('.drag-handle').on('touchstart', e => { touchStartY = e.originalEvent.touches[0].clientY; }).on('touchmove', e => {
        if (e.originalEvent.touches[0].clientY - touchStartY > 50 && $panel.hasClass('mobile-open')) {
            toggleMobilePanel(false);
        }
    });
    $(window).on('resize', () => {
        if ($(window).width() > 768 && $panel.hasClass('mobile-open')) {
            toggleMobilePanel(false);
        }
    });
    const togglePanelCollapse = (force = null) => {
        const collapsed = force !== null ? force : !$panel.hasClass('collapsed');
        $panel.toggleClass('collapsed', collapsed);
    };
    $('#toggleExpandBtn').on('click', () => togglePanelCollapse());
    const setMapMode = (mode) => {
        $('#mapModeWind').toggleClass('active', mode === 'wind');
        $('#mapModeSat').toggleClass('active',  mode === 'satellite');
        toggleSatellite(mode);
        localStorage.setItem('map_views', mode);
    };
    window.setMapMode = setMapMode;
    $('#toggle-wind-values').on('change', function () {
        const isOn = $(this).is(':checked');
        toggleWind(isOn);
        localStorage.setItem('winds', isOn ? 'true' : 'false');
    });
    $('#toggle-focus').on('change', function () {
        const isOn = $(this).is(':checked');
        toggleFocus(isOn);
        localStorage.setItem('focus', isOn ? 'true' : 'false');
    });
    $('#toggle-label').on('change', function () {
        const isOn = $(this).is(':checked');
        toggleLabel(isOn);
        localStorage.setItem('labels', isOn ? 'true' : 'false');
    });
    $('#toggle-windturbine').on('change', function () {
        const isOn = $(this).is(':checked');
        toggleWindTurbine(isOn);
        localStorage.setItem('windturbine', isOn ? 'true' : 'false');
    });
    $('#toggle-animation').on('change', function () {
        const isOn = $(this).is(':checked');
        toggleAnimation(isOn);
        localStorage.setItem('animation', isOn ? 'true' : 'false');
    });
    $('#toggle-equipment').on('change', function () {
        const isOn = $(this).is(':checked');
        toggleEquipment(isOn);
        localStorage.setItem('equipment', isOn ? 'true' : 'false');
    });
    window.restoreMapSettings = function() {
        const restore = (key, $el, fn) => {
        const val = localStorage.getItem(key);
        if (val === null) return;
        const isOn = val === 'true';
        $el.prop('checked', isOn);
        if (typeof map !== 'undefined' && map !== null) {
            fn(isOn);
        }
        };
        restore('winds', $('#toggle-wind-values'), toggleWind);
        restore('focus', $('#toggle-focus'), toggleFocus);
        restore('labels', $('#toggle-label'), toggleLabel);
        restore('windturbine', $('#toggle-windturbine'), toggleWindTurbine);
        restore('animation', $('#toggle-animation'), toggleAnimation);
        restore('equipment', $('#toggle-equipment'), toggleEquipment);
    };
});
$(document).ready(function () {
    if (!document.getElementById('_init-transitions')) {
        const style = document.createElement('style');
        style.id = '_init-transitions';
        style.textContent = `
            header, #ui, #sideControlPanel, #projectCanvas {
                transition: opacity 0.5s ease, transform 0.5s ease;
            }
            header.ui-hidden, #ui.ui-hidden,
            #sideControlPanel.ui-hidden, #projectCanvas.ui-hidden {
                opacity: 0;
                pointer-events: none;
                transform: translateY(8px);
            }
            #area-panel {
                transition: opacity 0.55s cubic-bezier(0.34, 1.56, 0.64, 1),
                            transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
            }
            #area-panel.panel-pre-anim {
                opacity: 0 !important;
                transform: translateX(-16px);
            }
            #wind-loading {
                transition: opacity 0.6s ease;
            }
            #wind-loading.fading {
                opacity: 0;
                pointer-events: none;
            }
        `;
        document.head.appendChild(style);
    }
    function revealUI(animate) {
        const $ui    = $('header, #ui, #sideControlPanel, #projectCanvas');
        const $panel = $('#area-panel');
        if (animate) {
            requestAnimationFrame(() => $ui.removeClass('ui-hidden'));
            $panel.show().addClass('panel-pre-anim');
            requestAnimationFrame(() => requestAnimationFrame(() => {
                $panel.removeClass('panel-pre-anim');
                if (!isMobile()) $panel.removeClass('collapsed');
            }));
        } else {
            $ui.removeClass('ui-hidden').css({ opacity: '', transform: '' });
            $panel.show().css({ opacity: '', transform: '' });
            if (!isMobile()) $panel.removeClass('collapsed');
        }
    }
    function bindWindLoadingHide() {
        let attempts = 0;
        const poll = setInterval(() => {
            attempts++;
            if ((typeof map !== 'undefined' && map !== null) || attempts > 50) {
                clearInterval(poll);
                setTimeout(hideWindLoading, 500);
            }
        }, 200);
    }
    function startMapAfterGlobe() {
        if (typeof window.disposeThreeJS === 'function') {
            window.disposeThreeJS();
        } else {
            const intro = document.getElementById('globe-intro');
            if (intro) {
                intro.classList.add('fade-out');
                setTimeout(() => intro.remove(), 800);
            }
        }
        requestAnimationFrame(() => {
            initMap();
            revealUI(true);
            bindWindLoadingHide();
            $('#area-panel').css('opacity', '1');
        });
    }
    const hasSeenGlobe = sessionStorage.getItem('globe_shown');
    if (!hasSeenGlobe) {
        sessionStorage.setItem('globe_shown', '1');
        $('header, #ui, #sideControlPanel, #projectCanvas').addClass('ui-hidden');
        $('#area-panel').addClass('collapsed').css('opacity', '0');
        let started = false;
        function onGlobeDone() {
            if (started) return;
            started = true;
            clearTimeout(fallbackTimer); 
            startMapAfterGlobe();
        }
        document.addEventListener('globe:done', onGlobeDone, { once: true });
        const fallbackTimer = setTimeout(onGlobeDone, 9000);

    } else {
        const intro = document.getElementById('globe-intro');
        if (intro) intro.remove();
        initMap();
        revealUI(false);
        bindWindLoadingHide();
    }
    $('.scrolling').removeClass('d-none');
});