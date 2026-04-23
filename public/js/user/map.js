'use strict';
function initMap() {
    windyInit(options, async api => {
        const { store, picker, map: windyMap } = api;
        windyAPI = api;
        map      = windyMap;
        if (typeof restoreMapSettings === 'function') restoreMapSettings();
        poleLayerGroup = L.layerGroup().addTo(map);
        store.set('overlay', 'wind');
        store.set('level', DEFAULT_LEVEL);
        try {
            const [masterResult, windAreaResult] = await Promise.allSettled([
                fetchJSON(`${BASE_URL}/api/master`),
                fetchJSON(`${BASE_URL}/api/wind.boundary`),
            ]);
            const masterData   = masterResult.status   === 'fulfilled' ? masterResult.value   : null;
            const windAreaData = windAreaResult.status === 'fulfilled' ? windAreaResult.value : null;
            if (!masterData) {
                console.error('Master data is required but failed to load.');
            }
            if (windAreaData) {
                await renderWindAreas(picker, windAreaData, masterData);
            }
            if (masterData) {
                applyMasterSettings(masterData);
                show_country_line   = masterData.show_country_line;
                country_layers_data = masterData.country_layers_data;
            }
            await loadPoles();
            await loadWindTurbines();
            const mode = localStorage.getItem('map_views') || DEFAULT_MODE;
            $('#mapModeWind').toggleClass('active', mode === 'wind');
            $('#mapModeSat').toggleClass('active',  mode === 'satellite');
            if (show_country_line === 'show' && country_layers_data) {
                _drawCountryLines(country_layers_data);
            }
            toggleMapControls(mode);
        } catch (error) {
            console.error('Initialization Error:', error);
        }
    });
}
function applyMasterSettings(master) {
    if (!master?.center_lat || !master?.center_lng) return;
    globalWindturbineIcon = master.windturbine_icon || '';
    globalPoleIcon        = master.pole_icon        || '';
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
function _drawCountryLines(rawData) {
    try {
        const geoData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
        geoDataGlobal = geoData;
        if (countryLayer) map.removeLayer(countryLayer);
        countryLayer = L.geoJSON(geoData, {
            style: {
                color:       '#161616',
                weight:      1.5,
                fillOpacity: 0,
                interactive: false,
            },
        });
        countryLayer.addTo(map);
    } catch (err) {
        console.error('Error drawing country lines:', err);
    }
}
async function refreshAllWindData() {
    if (!windOn || isRefreshing) return;
    const entries = Object.entries(poleMarkers);
    if (entries.length === 0) return;
    isRefreshing = true;
    try {
        const unit = getCurrentUnit();
        const currentLevel = DEFAULT_LEVEL || '100m'; 
        const res  = await fetch(`${BASE_URL}/api/wind/latest`);
        const json = await res.json();
        const data = json.data;
        const windSpeeds = [];
        entries.forEach(([id, p]) => {
            const stationData = data[id];
            if (!stationData) return;
            let levelKey = currentLevel;
            if (levelKey !== '100m' && !levelKey.endsWith('Pa')) {
                levelKey += 'Pa';
            }
            const weather = stationData[levelKey];
            if (!weather) return;
            const speed = parseFloat(weather.s);
            const dir   = parseFloat(weather.d); 
            windSpeeds.push(speed);
            const activeColor = getWindColor(speed);
            const elSpeed     = document.getElementById(p.windId);
            const elArrow     = document.getElementById(p.arrowId);
            if (elSpeed) {
                elSpeed.dataset.raw  = speed;
                elSpeed.textContent  = `${(speed * unit.factor).toFixed(1)} ${unit.label}`;
                elSpeed.setAttribute('fill', activeColor);
            }
            if (elArrow) {
                const cx = elArrow.getAttribute('data-cx');
                const cy = elArrow.getAttribute('data-cy');
                elArrow.setAttribute('transform', `rotate(${dir - 90}, ${cx}, ${cy})`);
                elArrow.dataset.dir = dir;
                const arrowIcon = elArrow.querySelector('text');
                if (arrowIcon) arrowIcon.setAttribute('fill', activeColor);
            }
        });
        if (windSpeeds.length > 0) {
            const sum       = windSpeeds.reduce((a, b) => a + b, 0);
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
function startWindAutoRefresh() {
    if (windInterval) return;
    windInterval = setInterval(() => {
        if (windOn && !isRefreshing) refreshAllWindData();
    }, 5 * 60 * 1000);
}
function stopWindAutoRefresh() {
    if (windInterval) {
        clearInterval(windInterval);
        windInterval = null;
    }
}
function updateWindDashboard({ max, min, avg }) {
    const { label, factor } = getCurrentUnit();
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
    initWindUnit();
}
function updateWindDashboardUnit(unit) {
    document.querySelectorAll('.stat-unit-label').forEach(el => {
        el.textContent = unit.label;
    });
    const max = windSummary.max ?? 0;
    const min = windSummary.min ?? 0;
    const avg = windSummary.avg ?? 0;
    if (max === 0 && min === 0 && avg === 0) return;
    $('.stat-max-wind-val').text((max * unit.factor).toFixed(1));
    $('.stat-min-wind-val').text((min * unit.factor).toFixed(1));
    $('.stat-avg-wind-val').text((avg * unit.factor).toFixed(1));
}
function setWindUnit(idx) {
    currentUnitIdx = idx;
    localStorage.setItem('windUnit', currentUnitIdx);
    updateWindUI();
    updateButtonStyles();
}
function updateButtonStyles() {
    document.querySelectorAll('.btn-unit-select').forEach((btn, index) => {
        btn.classList.toggle('active', index === currentUnitIdx);
    });
}
function initWindUnit() {
    updateWindUI();
}
function updateWindUI() {
    const unit = getCurrentUnit();
    updateButtonStyles();
    const legendUnit = document.getElementById('legend-unit-label');
    if (legendUnit) legendUnit.textContent = unit.label;
    [0, 2, 5, 10, 15, 20, 25].forEach(ms => {
        const el = document.getElementById(`legend-${ms}`);
        if (!el) return;
        const val = Math.round(ms * unit.factor);
        el.textContent = ms === 25 ? `${val}+` : val;
    });
    const bar = document.querySelector('.legend-bar');
    if (bar) {
        const gradient = WINDY_COLORS.map(c => c.color).join(', ');
        bar.style.background = `linear-gradient(to right, ${gradient})`;
    }
    resizeLabel();
    if (typeof customPickerMarker !== 'undefined' && customPickerMarker?.isPopupOpen()) {
        const popupPane = customPickerMarker.getPopup().getElement();
        if (popupPane) {
            const speedValEl = popupPane.querySelector('#picker-wind-value');
            const speedWrap  = popupPane.querySelector('#picker-speed-wrap');
            const unitLabel  = popupPane.querySelector('#picker-unit-label');
            const arrowG     = popupPane.querySelector('#picker-arrow-g');
            if (speedValEl) {
                const ms    = parseFloat(speedValEl.dataset.raw);
                const color = getWindColor(ms);
                speedValEl.textContent = (ms * unit.factor).toFixed(1);
                if (speedWrap) speedWrap.style.color = color;
                if (unitLabel) unitLabel.textContent  = unit.label;
                if (arrowG) {
                    arrowG.querySelectorAll('line, polygon, circle').forEach(shape => {
                        const attr = shape.tagName === 'line' ? 'stroke' : 'fill';
                        shape.setAttribute(attr, color);
                    });
                }
            }
            const gustValEl = popupPane.querySelector('#picker-gust-value');
            const gustWrap  = popupPane.querySelector('#picker-gust-wrap');
            if (gustValEl) {
                const gMs = parseFloat(gustValEl.dataset.raw);
                gustValEl.textContent = `${(gMs * unit.factor).toFixed(1)} ${unit.label}`;
                if (gustWrap) gustWrap.style.color = getWindColor(gMs);
            }
        }
    }
    if (typeof updateWindDashboardUnit === 'function') {
        updateWindDashboardUnit(unit);
    }
}
async function loadPoles() {
    if (poleLayerGroup?.getLayers().length > 0) {
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
                icon:        _buildPoleIcon(pole, initSize),
                zIndexOffset: 1000,
            }).addTo(poleLayerGroup);
            marker._poleData = pole;
            marker.on('click', () => openPoles(pole.poles_id));
            const windId  = `wind-auto-${pole.poles_id}`;
            const arrowId = `arrow-${pole.poles_id}`;
            const pt = map.latLngToContainerPoint([lat, lng]);
            const otherPolePoints = polePoints.filter(p =>
                !(Math.abs(p.x - pt.x) < 1 && Math.abs(p.y - pt.y) < 1)
            );
            const off = getSmartOffset(lat, lng, window._usedLabelBoxes, map, map.getZoom(), otherPolePoints);
            const anchorX = off.dx >= 0 ? 0 : Math.abs(off.dx);
            const anchorY = off.dy >= 0 ? 0 : Math.abs(off.dy);
            const { svgW, svgH, html } = buildWindLabelSVG({
                anchorX, anchorY,
                labelDx: off.dx,
                labelDy: off.dy,
                windId, arrowId,
                scale: initScale,
            });
            const labelMarker = L.marker([lat, lng], {
                icon: L.divIcon({
                    className:  'pole-label-wrap',
                    iconSize:   [svgW, svgH],
                    iconAnchor: [anchorX, anchorY],
                    html,
                }),
                interactive:  false,
                zIndexOffset: 500,
            }).addTo(poleLayerGroup);
            if (!windOn) labelMarker.setOpacity(0);
            poleMarkers[pole.poles_id] = { marker, labelMarker, lat, lng, windId, arrowId };
        }
        currentIndex = end;
        if (currentIndex < totalPoles) {
            setTimeout(renderChunk, 1);
        } else {
            if (typeof applyRestoredState === 'function') {
                applyRestoredState();
            } else if (windOn) {
                refreshAllWindData();
            }
        }
    }
    renderChunk();
    if (!map._poleZoomBound) {
        map._poleZoomBound = true;
        let _zoomTimer = null;
        map.on('zoom', () => {
            const size    = _calcIconSize(map.getZoom());
            Object.values(poleMarkers).forEach(({ marker }) => {
                const pd = marker._poleData;
                if (!pd) { console.warn('no _poleData on marker'); return; }
                marker.setIcon(_buildPoleIcon(pd, size));
            });
        });
        map.on('zoomend', () => {
            clearTimeout(_zoomTimer);
            _zoomTimer = setTimeout(() => {
                resizeLabel();
                refreshAllWindData();
            }, 80);
        });
    }
}
function resizeLabel() {
    const zoom     = map.getZoom();
    const scale    = _calcLabelScale(zoom);
    let   poleSize = 20;
    if (globalPoleIcon?.sizes?.[zoom]) {
        poleSize = globalPoleIcon.sizes[zoom];
    }
    window._usedLabelBoxes = [];
    const polePoints = Object.values(poleMarkers).map(({ lat, lng }) =>
        map.latLngToContainerPoint([lat, lng])
    );
    Object.values(poleMarkers).forEach(({ marker, labelMarker, lat, lng, windId, arrowId }) => {
        const pd = marker._poleData;
        if (!pd) return;
        marker.setIcon(_buildPoleIcon(pd, poleSize));
        const pt         = map.latLngToContainerPoint([lat, lng]);
        const otherPts   = polePoints.filter(p =>
            !(Math.abs(p.x - pt.x) < 1 && Math.abs(p.y - pt.y) < 1)
        );
        const off = getSmartOffset(lat, lng, window._usedLabelBoxes, map, zoom, otherPts);
        const anchorX = off.dx >= 0 ? 0 : Math.abs(off.dx);
        const anchorY = off.dy >= 0 ? 0 : Math.abs(off.dy);
        const windEl = document.getElementById(windId);
        const arrowEl = document.getElementById(arrowId);
        const windSpeed = windEl  ? parseFloat(windEl.dataset.raw)   || 0 : 0;
        const windDir = arrowEl ? parseFloat(arrowEl.dataset.dir)  || 0 : 0;
        const { svgW, svgH, html } = buildWindLabelSVG({
            anchorX, anchorY,
            labelDx: off.dx,
            labelDy: off.dy,
            windId, arrowId,
            windSpeed, windDir, scale,
        });
        labelMarker.setIcon(L.divIcon({
            className: 'pole-label-wrap',
            iconSize: [svgW, svgH],
            iconAnchor: [anchorX, anchorY],
            html,
        }));
    });
    if (typeof turbineMarkers !== 'undefined') {
        const turbineSize = _getTurbineSize(zoom);
        const opacity = zoom < 10 ? 0.7 : 1;
        Object.values(turbineMarkers).forEach(({ marker }) => {
            if (!marker) return;
            marker.setIcon(_buildTurbineIcon(turbineSize));
            marker.setOpacity(opacity);
        });
    }
}
async function loadWindTurbines() {
    try {
        const res     = await fetchJSON(`${BASE_URL}/api/windturbines.get`);
        const turbines = Array.isArray(res) ? res : (res.list || []);
        if (res.icon_config) window.globalWindturbineIcon = res.icon_config;
        if (!Array.isArray(turbines)) return;
        Object.values(turbineMarkers).forEach(({ marker }) => {
            if (marker && poleLayerGroup.hasLayer(marker)) poleLayerGroup.removeLayer(marker);
        });
        turbineMarkers = {};
        const isVisible  = localStorage.getItem('windturbine') === 'true';
        const zoom       = map.getZoom();
        const currentSize = _getTurbineSize(zoom);
        const opacity    = zoom < 10 ? 0.6 : 1;
        turbines.forEach((turbine, index) => {
            const lat = parseFloat(turbine.windturbine_lat);
            const lng = parseFloat(turbine.windturbine_lng);
            if (isNaN(lat) || isNaN(lng)) return;
            const marker = L.marker([lat, lng], {
                icon:        _buildTurbineIcon(currentSize),
                zIndexOffset: 900,
                opacity,
            });
            marker._turbineData = turbine;
            if (turbine.windturbine_name) {
                marker.bindTooltip(turbine.windturbine_name, {
                    permanent:  false,
                    direction: 'top',
                });
            }
            turbineMarkers[index] = { marker, turbine };
            if (isVisible) marker.addTo(poleLayerGroup);
        });
        if (!map._turbineZoomBound) {
            map._turbineZoomBound = true;
            map.on('zoomend', () => {
                if (typeof resizeLabel === 'function') resizeLabel();
            });
        }
    } catch (err) {
        console.error('loadWindTurbines error:', err);
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
    customPickerMarker = L.marker([lat, lng], {
        draggable: true,
        zIndexOffset: 1000,
    }).addTo(map);
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
    const speedColor = windData.speed !== null ? getWindColor(windData.speed) : '#ffffff';
    const pickerIcon = L.divIcon({
        className: 'popupTop',
        iconSize: [24, 60],
        iconAnchor: [4, 58],
        html: `
        <svg width="24" height="60" viewBox="0 0 24 60" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;">
            <line x1="4" y1="54" x2="4" y2="0" stroke="rgba(255,255,255,0.7)" stroke-width="0.5" stroke-dasharray="3 2"/>
            <circle cx="4" cy="57" r="5" fill="${speedColor}" stroke="rgba(255,255,255,0.7)" stroke-width="1"/>
        </svg>`,
    });
    if (!customPickerMarker) return;
    customPickerMarker.setIcon(pickerIcon);
    const content = buildPickerPopupHTML(lat, lng, windData);
    if (!map.getPane('popupTop')) {
        map.createPane('popupTop');
        map.getPane('popupTop').style.zIndex = 1000;
    }
    if (!customPickerMarker.getPopup()) {
        customPickerMarker.bindPopup(content, {
            pane: 'popupTop',
            className: 'custom-wind-popup',
            offset: L.point(0, -45),
            closeButton: false,
            autoClose: false,
            closeOnClick: false,
            maxWidth: 280,
            minWidth: 210,
        });
        customPickerMarker.openPopup();
        customPickerMarker.setZIndexOffset(10000);
    } else {
        customPickerMarker.setPopupContent(content);
    }
}
function buildPickerPopupHTML(lat, lng, { speed, direction, gusts }) {
    const unit         = getCurrentUnit();
    const compassDir   = direction !== null ? degToCompass(direction) : '—';
    const arrowRotate  = direction ?? 0;
    const speedColor   = speed !== null ? getWindColor(speed) : '#aaa';
    const tickLines = Array.from({ length: 8 }, (_, i) => {
        const a  = (i * 45) * Math.PI / 180;
        const x1 = (36 + 28 * Math.sin(a)).toFixed(1);
        const y1 = (36 - 28 * Math.cos(a)).toFixed(1);
        const x2 = (36 + 32 * Math.sin(a)).toFixed(1);
        const y2 = (36 - 32 * Math.cos(a)).toFixed(1);
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>`;
    }).join('');
    const gustHtml = gusts !== null
        ? `<div class="cpicker-gust" id="picker-gust-wrap" style="color: ${getWindColor((gusts * unit.factor))};">
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
async function renderWindAreas(picker, areaData, masterData) {
    const { polygons = [] } = areaData;
    if (polygons.length === 0) return;
    map.eachLayer(layer => {
        if (layer instanceof L.GeoJSON || (layer instanceof L.Polygon && layer._isMask)) {
            map.removeLayer(layer);
        }
    });
    if (typeof areaLayers !== 'undefined') Object.keys(areaLayers).forEach(k => delete areaLayers[k]);
    if (typeof areaBounds !== 'undefined') Object.keys(areaBounds).forEach(k => delete areaBounds[k]);
    if (typeof areaVisibility !== 'undefined') Object.keys(areaVisibility).forEach(k => delete areaVisibility[k]);
    if (typeof allHoles !== 'undefined') allHoles.length = 0;
    isMaskMode = masterData?.polygon_visibility === 'close';
    const featureGroup = L.featureGroup();
    const overlapGroups = {};
    polygons.forEach((area, i) => {
        const key = area.overlap_group ?? 'single_' + i;
        if (!overlapGroups[key]) overlapGroups[key] = [];
        overlapGroups[key].push({ index: i, area });
    });
    Object.entries(overlapGroups).forEach(([, group]) => {
        const styleGroups = new Map();
        group.forEach(({ index, area }) => {
            if (!area.geo_data || area.area_visible === 'no') return;
            try {
                const geoJsonData = JSON.parse(area.geo_data);
                const styleData = area.custom_style ? JSON.parse(area.custom_style) : {};
                const styleConfig = {
                    fillColor: styleData.fillColor || '#3388ff',
                    fillOpacity: !isNaN(styleData.fillOpacity) ? parseFloat(styleData.fillOpacity) : 0.2,
                    color: styleData.color || '#3388ff',
                    weight: !isNaN(styleData.weight) ? parseFloat(styleData.weight) : 2,
                };
                const styleKey = JSON.stringify(styleConfig);
                if (!styleGroups.has(styleKey)) {
                    styleGroups.set(styleKey, { styleConfig, areas: [] });
                }
                styleGroups.get(styleKey).areas.push({ index, geoJsonData, area });
            } catch (err) {
                console.error(`Error parsing data for area at index ${index}:`, err);
            }
        });
        styleGroups.forEach(({ styleConfig, areas }) => {
            const unionGeo = _mergePolygonsToUnion(areas.map(a => a.geoJsonData));
            if (unionGeo) {
                L.geoJSON(unionGeo, {
                    style: () => ({
                        fillColor: styleConfig.fillColor,
                        fillOpacity: styleConfig.fillOpacity,
                        stroke: false,
                        interactive: false
                    }),
                }).addTo(featureGroup);
            }
            areas.forEach(({ index, geoJsonData, area }, posInGroup) => {
                try {
                    const layer = L.geoJSON(geoJsonData);
                    const b = layer.getBounds();
                    if (b.isValid()) areaBounds[index] = b;
                } catch (e) {}
                const isRepresentative = posInGroup === 0;
                const strokeLayer = L.geoJSON(geoJsonData, {
                    style: () => ({
                        fill: true,
                        fillColor: 'rgba(0,0,0,0)',
                        fillOpacity: 0,
                        color: styleConfig.color,
                        weight: isRepresentative ? styleConfig.weight : 0,
                        stroke: isRepresentative && styleConfig.weight !== 0,
                        opacity: isRepresentative ? 1 : 0,
                        interactive: true,
                    }),
                });
                areaLayers[index] = strokeLayer;
                strokeLayer.on('click', e => {
                    highlightAreaItem(index);
                    flyToArea(index, area, true, false, e.latlng);
                });
                strokeLayer.addTo(featureGroup);
                if (isMaskMode && isRepresentative) {
                    strokeLayer.eachLayer(layer => {
                        const lls = layer.getLatLngs?.();
                        if (!lls) return;
                        const rings = Array.isArray(lls[0]) && !(lls[0][0] instanceof L.LatLng) ? lls.map(inner => inner[0]) : [lls[0]];
                        allHoles.push(...rings);
                    });
                }
            });
        });
    });
    featureGroup.addTo(map).bringToFront();
    const bounds = featureGroup.getBounds();
    if (bounds.isValid()) {
        const padded = bounds.pad(0.1);
        map.fitBounds(bounds, { padding: [20, 20] });
        map.setMaxBounds(padded);
        map.options.minZoom = map.getBoundsZoom(bounds);
    }
    buildAreaPanel(polygons);
}
function buildAreaPanel(polygons) {
    const list = document.getElementById('ap-list');
    if (!list) return;
    const visiblePolygons = (polygons || []).map((area, index) => ({ ...area, originalIndex: index })).filter(area => area.project_visible !== 'no');
    if (visiblePolygons.length === 0) {
        list.innerHTML = `
            <div class="p-4 text-center">
                <i class="fa-solid fa-folder-open d-block mb-2 opacity-20" style="font-size:24px"></i>
                <div class="small text-muted">${langData?.['no_data_found'] || 'No data available'}</div>
            </div>`;
        return;
    }
    list.innerHTML = visiblePolygons.map((area) => {
        const i = area.originalIndex;
        const color = area.area_status_color || '#3388ff';
        const hasStatus = !!area.area_status_color;
        areaVisibility[i] = true;
        return `
            <div class="ap-item animate__animated animate__fadeInUp" 
                 id="ap-item-${i}" 
                 data-index="${i}" 
                 style="animation-delay: 0.05s">
                <i class="fa-solid fa-circle-dot ${hasStatus ? 'status-pulse' : ''} me-2" style="color:${color}"></i>
                <span class="ap-name" title="${area.area_name}">${area.area_name}</span>
            </div>
        `;
    }).join('');
    list.querySelectorAll('.ap-item').forEach(el => {
        el.addEventListener('click', function () {
            const i = parseInt(this.dataset.index);
            if (!areaLayers[i]) {
                console.warn(`Layer for index ${i} not found on map.`);
                return;
            }
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
    const geoLayer    = areaLayers[areaIndex];
    const focusZoom   = map.getBoundsZoom(targetBounds, false, [25, 25]);
    const currentMax  = map.options.maxBounds;
    const needsRelax  = currentMax && !currentMax.contains(targetBounds);
    const fromCenter  = map.getCenter();
    const toCenter    = targetBounds.getCenter();
    const distDeg     = Math.hypot(toCenter.lat - fromCenter.lat, toCenter.lng - fromCenter.lng);
    const zoomDiff    = Math.abs((map.getZoom() || 10) - focusZoom);
    const rawDuration = 1.2 + distDeg * 2.2 + zoomDiff * 0.18;
    const duration    = Math.min(3.0, Math.max(1.2, rawDuration));
    if (needsRelax) {
        map.setMaxBounds(currentMax.extend(targetBounds).pad(0.08));
    }
    try {
        if (windyAPI?.map?.stop)  windyAPI.map.stop();
        if (windyAPI?.store?.set) windyAPI.store.set('overlay', windyAPI.store.get('overlay'));
    } catch (_) {}
    map.options.zoomAnimation = false;
    map.setView(targetBounds.getCenter(), focusZoom, {
        animate:       true,
        duration,
        easeLinearity: 0.08,
        noMoveStart:   true,
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
            setTimeout(() => handlePickerOpening(pickerLatLng, windyAPI.picker, geoLayer), 200);
        }
        if (openProject) {
            const projectId = areaObj?.project_id;
            if (projectId) openProjectDetail(projectId);
        }
    });
}
function resetView() {
    if (!initialBounds) return;
    const fromCenter  = map.getCenter();
    const toCenter    = initialBounds.getCenter();
    const distDeg     = Math.hypot(toCenter.lat - fromCenter.lat, toCenter.lng - fromCenter.lng);
    const targetZoom  = map.getBoundsZoom(initialBounds, false, [20, 20]);
    const zoomDiff    = Math.abs((map.getZoom() || 10) - targetZoom);
    const duration    = Math.min(3.0, Math.max(1.2, 1.2 + distDeg * 2.2 + zoomDiff * 0.18));
    try {
        if (windyAPI?.map?.stop)  windyAPI.map.stop();
        if (windyAPI?.store?.set) windyAPI.store.set('overlay', windyAPI.store.get('overlay'));
    } catch (_) {}
    map.options.zoomAnimation = false;
    map.setView(toCenter, targetZoom, {
        animate:       true,
        duration,
        easeLinearity: 0.08,
        noMoveStart:   true,
    });
    map.once('moveend', () => { map.options.zoomAnimation = true; });
}
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
        interactive: false,
    });
}
function toggleHoles(show, allHoles = []) {
    if (show) {
        if (maskLayer) return;
        const world = [[90, -180], [90, 180], [-90, 180], [-90, -180]];
        maskLayer = L.polygon([world, ...allHoles], {
            fillColor:   '#C0C0C0',
            fillOpacity: 0.75,
            stroke:      false,
            interactive: false,
            pane:        'overlayPane',
            smoothFactor: 0.1,
            noClip:      true,
        }).addTo(map);
        maskLayer.bringToBack();
        maskLayer._zoomHandler = () => maskLayer?.bringToBack();
        map.on('zoomend', maskLayer._zoomHandler);
    } else {
        if (maskLayer) {
            map.off('zoomend', maskLayer._zoomHandler);
            map.removeLayer(maskLayer);
            maskLayer = null;
        }
    }
}
function toggleFocus(isOn) {
    focusOn = isOn;
    if (!map.getPane('focusPane')) {
        const pane = map.createPane('focusPane');
        pane.style.zIndex       = 450;
        pane.style.pointerEvents = 'none';
    }
    if (focusMaskLayer) {
        map.removeLayer(focusMaskLayer);
        focusMaskLayer = null;
    }
    map.eachLayer(layer => {
        if (layer.options?.id === 'focus-mask-layer') map.removeLayer(layer);
    });
    if (isOn && geoDataGlobal) {
        const world       = [[90, -180], [90, 180], [-90, 180], [-90, -180]];
        const countryHoles = [];
        geoDataGlobal.features.forEach(feature => {
            const geom = feature.geometry;
            if (geom.type === 'Polygon') {
                geom.coordinates.forEach(ring => countryHoles.push(ring.map(c => [c[1], c[0]])));
            } else if (geom.type === 'MultiPolygon') {
                geom.coordinates.forEach(polygon =>
                    polygon.forEach(ring => countryHoles.push(ring.map(c => [c[1], c[0]])))
                );
            }
        });
        focusMaskLayer = L.polygon([world, ...countryHoles], {
            id:          'focus-mask-layer',
            fillColor:   '#161616',
            fillOpacity: 0.5,
            stroke:      false,
            interactive: false,
            pane:        'focusPane',
            smoothFactor: 1,
        }).addTo(map);
    }
}
function toggleAnimation(isOn) {
    $('#windy #map-container .leaflet-tile-pane .particles-layer').css('z-index', isOn ? 500 : 0);
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
function toggleWindTurbine(isOn) {
    Object.values(turbineMarkers).forEach(({ marker }) => {
        if (!marker) return;
        if (isOn) {
            if (!poleLayerGroup.hasLayer(marker)) marker.addTo(poleLayerGroup);
        } else {
            if (poleLayerGroup.hasLayer(marker))  poleLayerGroup.removeLayer(marker);
        }
    });
}
function toggleEquipment(isOn) {
    if (!map || !poleLayerGroup) return;
    if (isOn) {
        if (!map.hasLayer(poleLayerGroup)) poleLayerGroup.addTo(map);
        Object.values(poleMarkers).forEach(p => {
            p.marker?.setOpacity(1);
            p.labelMarker?.setOpacity(windOn ? 1 : 0);
        });
        _applyWindState(isOn);
        $('#toggle-wind-values').prop('checked', true);
        $('#wind-status-icon').addClass('spinning');
        localStorage.setItem('winds', 'true');
    } else {
        Object.values(poleMarkers).forEach(p => {
            p.marker?.setOpacity(0);
            p.labelMarker?.setOpacity(0);
        });
        $('#toggle-wind-values').prop('checked', false);
        $('#wind-status-icon').removeClass('spinning');
        windOn = false;
        localStorage.setItem('winds', 'false');
    }
}
function _applyWindState(isOn) {
    windOn = isOn;
    if (windyAPI?.store) {
        windyAPI.store.set('overlay', isOn ? 'wind' : '');
    }
    Object.values(poleMarkers).forEach(p => {
        const isPoleVisible = p.marker?.options.opacity > 0;
        p.labelMarker?.setOpacity(isOn && isPoleVisible ? 1 : 0);
    });
    $('#wind-status-icon').toggleClass('spinning', isOn);
    $('.map-wind-label').stop().fadeTo(300, isOn ? 1 : 0);
    stopWindAutoRefresh();
    if (isOn) {
        refreshAllWindData();
        startWindAutoRefresh();
    }
}
function toggleWind(isOn) {
    if (isOn && !$('#toggle-equipment').prop('checked')) {
        $('#toggle-equipment').prop('checked', true);
        toggleEquipment(true);
    }
    _applyWindState(isOn);
}
const CONTROL_CONFIG = {
    opt1: {
        el: '#toggle-wind-values',
        fn: toggleWind
    },
    opt2: {
        el: '#toggle-equipment',
        fn: toggleEquipment
    },
    opt3: {
        el: '#toggle-focus',
        fn: toggleFocus
    },
    opt4: {
        el: '#toggle-windturbine',
        fn: toggleWindTurbine
    },
    opt5: {
        el: '#toggle-animation',
        fn: toggleAnimation
    },
    opt6: {
        el: '#toggle-label',
        fn: toggleLabel
    },
    opt7: {
        el: '.wind-legend',
        fn: toggleLegend
    },
    opt8: {
        el: '#toggle-area-fill', 
        fn: (enabled) => toggleAreaFill(enabled),
    },
    opt9: {
        el: '#toggle-area-stroke',
        fn: (enabled) => toggleAreaStroke(enabled),
    },
};
function toggleLegend(isOn) {
    $('.wind-legend').toggleClass('d-none', !isOn);
}
function applyMapControl(mode, mapControlStr) {
    if (!mapControlStr) return;
    let mapControl;
    try {
        mapControl = JSON.parse(mapControlStr);
    } catch (e) {
        console.error('MAP_CONTROL parse error', e);
        return;
    }
    const config = mapControl[mode];
    if (!config) return;
    const localStorageKeyMap = {
        opt1: 'winds',
        opt2: 'equipment',
        opt3: 'focus',
        opt4: 'windturbine',
        opt5: 'animation',
        opt6: 'labels',
    };
    Object.keys(config).forEach(key => {
        const optKey = key.replace(/^(wind|sat)-/, '');
        const opt = CONTROL_CONFIG[optKey];
        if (!opt) return;
        const serverEnabled = config[key] == 1;
        $(opt.el).closest('.control-row').toggleClass('d-none', !serverEnabled);
        if (!serverEnabled) {
            if ($(opt.el).is('input[type="checkbox"]')) {
                $(opt.el).prop('checked', false);
            }
            if (typeof opt.fn === 'function') opt.fn(false);
            return;
        }
        let enabled;
        if (optKey === 'opt8' || optKey === 'opt9') {
            enabled = serverEnabled;
        } else {
            const lsKey = localStorageKeyMap[optKey];
            const lsVal = lsKey ? localStorage.getItem(lsKey) : null;
            enabled = lsVal !== null ? lsVal === 'true' : true;
        }
        if ($(opt.el).is('input[type="checkbox"]')) {
            $(opt.el).prop('checked', enabled);
        }
        if (typeof opt.fn === 'function') opt.fn(enabled);
    });
}
function toggleMapControls(mode) {
    if (!map) return;
    const isSatellite = mode === 'satellite';
    if (isSatellite) {
        if (!satelliteLayer) {
            satelliteLayer = L.tileLayer(
                'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                { attribution: 'Tiles &copy; Esri', maxZoom: 18 }
            );
        }
        if (!map.hasLayer(satelliteLayer)) {
            satelliteLayer.addTo(map);
        }
        windyAPI?.store.set('overlay', null);
        windyAPI?.store.set('graticule', false);
    } else {
        if (satelliteLayer && map.hasLayer(satelliteLayer)) {
            map.removeLayer(satelliteLayer);
        }
        windyAPI?.store.set('overlay', 'wind');
        windyAPI?.store.set('graticule', false);
    }
    applyMapControl(mode, MAP_CONTROL);
    $('#mapModeWind, #mapModeSat').removeClass('active');
    if (isSatellite) {
        $('#mapModeSat').addClass('active');
        toggleHoles(false, allHoles);
    } else {
        $('#mapModeWind').addClass('active');
        toggleHoles(true, allHoles);
    }
    map.setMaxZoom(isSatellite ? 18 : 11);
    map.setZoom(Math.min(map.getZoom(), map.getMaxZoom()));
}
async function loadMenuLevel(level) {
    const cfg = MENU_LEVELS[level];
    if (!cfg) return;
    for (let i = level; i <= 3; i++) {
        $(`#menu-level-${i}`).removeClass('active').hide().empty();
    }
    const data = await fetchJSON(cfg.endpoint, menuState).catch(() => []);
    if (!data.length) return;
    let html = `<div class="menu-header" data-i18n="${cfg.lang}">
        ${langData[cfg.lang] || cfg.title}
    </div>`;
    data.forEach(item => {
        const label    = item[cfg.label].replace(/\r\n|\n/g, '<br />');
        let extraInfo  = '';
        if (cfg.title === 'PROJECT' && item.project_status_color) {
            extraInfo = `<i class="fa-solid fa-circle-dot status-pulse me-2" style="color:${item.project_status_color};margin-right:6px"></i>`;
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
function handleStationClick(lat, lng, id, el) {
    if (isNaN(lat) || isNaN(lng)) return;
    $('.station-item').removeClass('selected');
    $(el).addClass('selected');
    $('.menu-panel').fadeOut();
    openPoles(id, 'station');
}
function selectItem(level, id, el) {
    $(el).addClass('selected').siblings().removeClass('selected');
    menuState[MENU_LEVELS[level].key] = id;
    loadMenuLevel(level + 1);
}
async function openPoles(poleId, target = 'equipment') {
    const isEquipmentOpen = $('#toggle-equipment').prop('checked');
    if (!isEquipmentOpen && target === 'equipment') {
        return;
    }
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
    const pm = poleMarkers[poleId];
    let windBadgeHtml = '';
    if (pm) {
        const elSpeed = document.getElementById(pm.windId);
        const elArrow = document.getElementById(pm.arrowId);
        const rawSpeed = elSpeed ? parseFloat(elSpeed.dataset.raw) : null;
        const unit = getCurrentUnit();
        const dir = elArrow ? parseFloat(elArrow.dataset.dir) : null;
        if (rawSpeed !== null && !isNaN(rawSpeed)) {
            const displaySpeed = (rawSpeed * unit.factor).toFixed(1);
            const color = getWindColor(rawSpeed);
            const arrowRotate = (!isNaN(dir)) ? `transform: rotate(${dir}deg);` : '';
            function isLightColor(hex) {
                const c = hex.replace('#', '');
                const r = parseInt(c.substr(0,2),16);
                const g = parseInt(c.substr(2,2),16);
                const b = parseInt(c.substr(4,2),16);
                return (r*299 + g*587 + b*114) / 1000 > 155;
            }
            const textColor   = isLightColor(color) ? '#1a1a1a' : '#ffffff';
            const iconBg      = isLightColor(color) ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.25)';
            windBadgeHtml = `
                <div style="display:flex;align-items:center;gap:10px; margin-left:auto;flex-shrink:0; background:${color}; border-radius:999px; padding:6px 14px 6px 6px; box-shadow:0 4px 16px ${color}99, 0 1px 4px rgba(0,0,0,0.18);">
                    <span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;background:${iconBg};border-radius:50%;transform:rotate(${dir}deg);color:${textColor};font-size:15px;transition:transform 0.3s;flex-shrink:0;">
                        <i class="fa-solid fa-arrow-up"></i>
                    </span>
                    <div style="display:flex;flex-direction:column;line-height:1.2;">
                        <span style="font-size:1.05rem;font-weight:800;color:${textColor};white-space:nowrap;">
                            ${displaySpeed} <span style="font-size:0.75rem;font-weight:600;opacity:0.85">${unit.label}</span>
                        </span>
                        <span style="font-size:0.62rem;font-weight:600;color:${textColor};opacity:0.75;white-space:nowrap;letter-spacing:0.06em;text-transform:uppercase;">
                            ${langData['wind_speed'] || 'Wind Speed'}
                        </span>
                    </div>
                </div>`;
        }
    }
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
            body:    JSON.stringify({ id: poleId }),
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
        bodyContent = bodyContent.replace(
            /src="(?!(http|https|\/\/))/g,
            `src="${fullBase}/`
        );
        const bg       = data.project_bg || {};
        const projBg   = bg.project_background;
        const opacity  = bg.project_opacity > 0 ? bg.project_opacity / 100 : 1;
        const fadeVal  = 1 - opacity;
        const bgStyle  = projBg ? `background-image:linear-gradient(rgba(255,255,255,${fadeVal}),rgba(255,255,255,${fadeVal})),url('${fullBase}/${projBg}');background-size:cover;background-position:top center;background-repeat:no-repeat;` : '';
        const coverHtml =
            hasContent &&
            data.content?.cover &&
            data.content?.cover_display === 'yes'
                ? `<div class="poles-cover-wrap">
                       <img src="${fullBase}/${data.content.cover}" alt="cover" loading="lazy" class="poles-cover-img">
                       <div class="poles-cover-overlay"></div>
                   </div>`
                : '';
        const chip = (iconClass, color, labelKey, value) => `
        <div class="poles-chip">
            <div class="poles-chip-icon" style="color:${color}">
                <i class="${iconClass}"></i>
            </div>
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
                    ${windBadgeHtml}
                </div>
            </div>
            <div class="poles-chips">
                ${chip('fa-solid fa-diagram-project', '#2d7fc1', 'project',  data.project_name)}
                ${chip('fa-solid fa-map-marker-alt',  '#059669', 'location',
                    `${data.poles_lat}, ${data.poles_lng}`)}
            </div>
            <div class="poles-content-section" style="${bgStyle}">
                ${data.content_id ? `
                    ${coverHtml}
                    ${data.content.presentation?.length
                        ? renderPresentationShow(data.content.presentation)
                        : ''}
                    <article class="poles-article">
                        <h4 class="poles-article-title">${title}</h4>
                        <div class="poles-article-meta">
                            <i class="fa-regular fa-calendar-check"></i>
                            ${data.updated_at || data.created_at || ''}
                        </div>
                        <div class="poles-article-body article-content">${bodyContent}</div>
                    </article>
                    <div class="multimedia-container px-1">
                        ${renderMultimedia(data.content, lang, fullBase)}
                    </div>
                ` : `
                    ${!projBg ? `
                        <div class="poles-empty">
                            <i class="fa-regular fa-file-lines"></i>
                            <div class="poles-empty-title">
                                ${langData['no_content_available'] || 'No content available'}
                            </div>
                            <div class="poles-empty-sub">
                                ${langData['content_nothing_hear'] || "It looks like there's nothing here."}
                            </div>
                        </div>` : '<div style="padding:40px 0"></div>'}
                `}
            </div>
        </div>`);
        $header.find('.modal-title').html(`
        <span class="project-status">
            <i class="fa-solid fa-circle-dot status-pulse me-2" style="color:${data.project_status_color || '#ccc'};font-size:0.8em"></i>
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
            let style = ($img.attr('style') || '').replace(/width\s*:\s*[^;]+;?/gi, '').replace(/height\s*:\s*[^;]+;?/gi, '');
            $img.attr({ style: style.trim(), loading: 'lazy' });
            if (!$img.parent('a').length) {
                $img.wrap(`<a href="${src}" data-fancybox="content-images" class="content-img-link"></a>`);
            }
            $img.css({ cursor: 'zoom-in', transition: 'opacity 0.2s' }).addClass('hover-opacity');
        });
        if (typeof Fancybox !== 'undefined') {
            Fancybox.bind('[data-fancybox]', {
                Hash:    false,
                Toolbar: { display: { left: ['infobar'], right: ['close'] } },
            });
        }
    } catch (err) {
        console.error('openPoles error:', err);
        $body.html(renderErrorAlert(
            'danger',
            langData['cannot_load'] || 'Failed to load data. Please try again later.'
        ));
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
                        <div class="mm-vr-badge">
                            <i class="fa-solid fa-rotate fa-spin me-2"></i>360°
                        </div>
                        <div class="mm-thumb-overlay">
                            <i class="fa-solid fa-expand"></i>
                        </div>
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
                        <div class="mm-thumb-overlay">
                            <i class="fa-solid fa-magnifying-glass-plus"></i>
                        </div>
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
                        <div class="mm-att-dl">
                            <i class="fa-solid fa-download"></i>
                        </div>
                    </a>`;
                }).join('')}
            </div>
        </div>`;
    }
    return html;
}
async function openProjectDetail(project_id) {
    if (!project_id) return;
    try {
        const res = await fetch(`${BASE_URL}/api/project.poles`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ project_id }),
        });
        const data = await res.json();
        if (!data) {
            console.warn('No project data for project', project_id);
            return;
        }
        document.getElementById('pp-name').textContent  = data.project_name || 'Unknown Project';
        document.getElementById('pp-count').textContent = data.poles?.length ?? 0;
        const avgEl = document.getElementById('pp-avg-wind');
        const unit  = getCurrentUnit();
        const ppBody = document.getElementById('pp-body');
        const statusColor = data.status_color  || '#ccc';
        const statusName  = (data.project_status || 'UNKNOWN').toUpperCase();
        const dot  = document.getElementById('pp-status-dot');
        const pill = document.getElementById('pp-status');
        if (dot) dot.style.backgroundColor = statusColor;
        if (pill) {
            pill.style.backgroundColor = statusColor;
            pill.style.color = '#fff';
            pill.textContent = statusName;
        }
        if (!data.poles?.length) {
            if (avgEl) {
                avgEl.textContent = `0.0 ${unit.label}`;
                avgEl.style.color = '';
            }
            ppBody.innerHTML = `
            <div class="pp-empty-state">
                <div class="pp-empty-icon">
                    <i class="fa-solid fa-tower-broadcast"></i>
                </div>
                <div class="pp-empty-title">
                    ${langData['no_poles_found'] || 'No monitoring stations found'}
                </div>
                <div class="pp-empty-sub">
                    ${langData['no_poles_desc'] || 'This project has no stations assigned yet.'}
                </div>
            </div>`;
            bootstrap.Offcanvas.getOrCreateInstance(document.getElementById('projectCanvas')).show();
            return; 
        }
        ppBody.innerHTML = data.poles.map(p => {
            const color = p.default_color || '#f5a623';
            const iconSize = 40;
            let iconHtml = '';
            if (p.poles_icon?.trim()) {
                iconHtml = `<img src="${BASE_URL}/${p.poles_icon}" style="width:${iconSize}px;height:${iconSize}px;object-fit:contain;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.3))" alt="icon">`;
            } else {
                const extra = `
                    <line x1="3" y1="32" x2="-5" y2="32" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round"/>
                    <circle cx="-5" cy="32" r="1.8" fill="${color}" stroke="#ffffff" stroke-width="0.8"/>`;
                iconHtml = `
                <svg width="20" height="52" viewBox="0 0 20 52" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">
                    <circle cx="3" cy="49" r="3.5" fill="rgba(255,255,255,0.85)" stroke="${color}" stroke-width="1.5"/>
                    <line x1="3" y1="46" x2="3" y2="3" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>
                    <line x1="3" y1="5"  x2="15" y2="5" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round"/>
                    <line x1="3" y1="14" x2="11" y2="14" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round"/>
                    ${extra}
                    <circle cx="15" cy="5"  r="2.2" fill="${color}"  stroke="#ffffff" stroke-width="0.8"/>
                    <circle cx="11" cy="14" r="1.8" fill="${color}" stroke="#ffffff" stroke-width="0.8"/>
                </svg>`;
            }
            return `
            <div class="pole-row" onclick="openPoles(${p.poles_id})">
                <div class="pole-index" style="width:45px;display:flex;justify-content:center;align-items:center;">
                    ${iconHtml}
                </div>
                <div class="pole-info">
                    <div class="pole-title">
                        <strong>${p.type_name || 'N/A'}</strong>
                        <div>
                            <small class="project-status">
                                <i class="fa-solid fa-circle-dot status-pulse me-2" style="color:${p.poles_status_color || '#3388ff'};font-size:0.8em"></i>
                                <span class="fw-bold" style="color:${p.poles_status_color || '#3388ff'};">
                                    ${p.poles_status_name || '-'}
                                </span>
                            </small>
                        </div>
                        <div class="small">${p.installations_name || 'N/A'}</div>
                    </div>
                    <div class="pole-coords">
                        <small>
                            <i class="fa-solid fa-location-dot me-1"></i>
                            ${p.lat}° N, ${p.lng}° E
                        </small>
                    </div>
                    <div class="pole-bar-wrap">
                        <div class="pole-bar" id="bar-${p.poles_id}" style="width:0%;transition:width 0.6s ease, background-color 0.3s"></div>
                    </div>
                </div>
                <div class="pole-wind-box">
                    <i class="fa-solid fa-location-arrow wind-arrow" id="wind-arrow-${p.poles_id}"></i>
                    <span class="pole-wind" id="wind-val-${p.poles_id}" data-raw="0">
                        -- <small>${unit.label}</small>
                    </span>
                </div>
            </div>`;
        }).join('');
        bootstrap.Offcanvas.getOrCreateInstance(document.getElementById('projectCanvas')).show();
        let totalWind = 0;
        let validPolesCount = 0;
        data.poles.forEach((p) => {
            const cachedPole = poleMarkers[p.poles_id];
            let speed = 0;
            let direction = 0;
            if (cachedPole) {
                const elSpeed = document.getElementById(cachedPole.windId);
                const elArrow = document.getElementById(cachedPole.arrowId);
                if (elSpeed && elSpeed.dataset.raw) speed = parseFloat(elSpeed.dataset.raw);
                if (elArrow && elArrow.dataset.dir) direction = parseFloat(elArrow.dataset.dir);
            }
            totalWind += speed;
            validPolesCount++;
            const elWind  = document.getElementById(`wind-val-${p.poles_id}`);
            const elArrow = document.getElementById(`wind-arrow-${p.poles_id}`);
            const elBar   = document.getElementById(`bar-${p.poles_id}`);
            if (elWind && elBar) {
                const activeColor  = getWindColor(speed);
                const displaySpeed = (speed * unit.factor).toFixed(1);
                elWind.dataset.raw = speed;
                elWind.style.color = activeColor;
                elWind.innerHTML   = `${displaySpeed} <small>${unit.label}</small>`;
                if (elArrow) {
                    elArrow.style.color     = activeColor;
                    elArrow.style.transform = `rotate(${direction - 45}deg)`;
                }
                const pct = Math.min((speed / 25) * 100, 100);
                requestAnimationFrame(() => {
                    elBar.style.width           = `${pct}%`;
                    elBar.style.backgroundColor = activeColor;
                });
            }
        });
        if (avgEl) {
            if (validPolesCount > 0) {
                const avgSpeed = totalWind / validPolesCount;
                avgEl.textContent = `${(avgSpeed * unit.factor).toFixed(1)} ${unit.label}`;
                avgEl.style.color = getWindColor(avgSpeed);
            } else {
                avgEl.textContent = `0.0 ${unit.label}`;
                avgEl.style.color = ''; 
            }
        }
    } catch (err) {
        console.error('openProject error:', err);
    }
}
Fancybox.bind("[data-fancybox='gallery']", {
    Hash:    false,
    Thumbs:  { autoStart: false },
    Toolbar: {
        display: {
            left:   ['infobar'],
            middle: [],
            right:  ['iterateZoom', 'close'],
        },
    },
});
$(document).ready(function () {
    const $panel   = $('#sideControlPanel');
    const $fab     = $('#fabToggle');
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
        if (
            e.originalEvent.touches[0].clientY - touchStartY > 50 &&
            $panel.hasClass('mobile-open')
        ) {
            toggleMobilePanel(false);
        }
    });
    $(window).on('resize', () => {
        if ($(window).width() > 768 && $panel.hasClass('mobile-open')) {
            toggleMobilePanel(false);
        }
    });
    $('#toggleExpandBtn').on('click', () => {
        $panel.toggleClass('collapsed');
    });
    window.setMapMode = mode => {
        $('#mapModeWind').toggleClass('active', mode === 'wind');
        $('#mapModeSat').toggleClass('active',  mode === 'satellite');
        toggleMapControls(mode);
        localStorage.setItem('map_views', mode);
    };
    const bindToggle = (selector, key, fn) => {
        $(selector).on('change', function () {
            const isOn = $(this).is(':checked');
            fn(isOn);
            localStorage.setItem(key, isOn ? 'true' : 'false');
        });
    };
    bindToggle('#toggle-wind-values', 'winds',       toggleWind);
    bindToggle('#toggle-focus',       'focus',        toggleFocus);
    bindToggle('#toggle-label',       'labels',       toggleLabel);
    bindToggle('#toggle-windturbine', 'windturbine',  toggleWindTurbine);
    bindToggle('#toggle-animation',   'animation',    toggleAnimation);
    bindToggle('#toggle-equipment',   'equipment',    toggleEquipment);
    window.restoreMapSettings = function () {
        const restoreCheckbox = (key, $el) => {
            const val = localStorage.getItem(key);
            if (val === null) return;
            $el.prop('checked', val === 'true');
        };
        restoreCheckbox('winds',       $('#toggle-wind-values'));
        restoreCheckbox('focus',       $('#toggle-focus'));
        restoreCheckbox('labels',      $('#toggle-label'));
        restoreCheckbox('windturbine', $('#toggle-windturbine'));
        restoreCheckbox('animation',   $('#toggle-animation'));
        restoreCheckbox('equipment',   $('#toggle-equipment'));
    };
    window.applyRestoredState = function () {
        const applyOne = (key, $el, fn) => {
            const val = localStorage.getItem(key);
            const isOn = val !== null ? val === 'true' : true;
            $el.prop('checked', isOn);
            fn(isOn);
        };
        applyOne('equipment',   $('#toggle-equipment'),    toggleEquipment);
        applyOne('winds',       $('#toggle-wind-values'),  toggleWind);
        applyOne('focus',       $('#toggle-focus'),         toggleFocus);
        applyOne('labels',      $('#toggle-label'),         toggleLabel);
        applyOne('windturbine', $('#toggle-windturbine'),   toggleWindTurbine);
        applyOne('animation',   $('#toggle-animation'),     toggleAnimation);
    };
});
$(document).on('click', () => $('.menu-panel').fadeOut());
$('.menu-panel').on('click', e => e.stopPropagation());
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
document.getElementById('area-panel-toggle')?.addEventListener('click', toggleAreaPanel);
$(document).ready(function () {
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
    initMap();
    bindWindLoadingHide();
    if (!isMobile()) {
        $('#area-panel').removeClass('collapsed').css('opacity', '1');
    }
    $('.scrolling').removeClass('d-none');
});