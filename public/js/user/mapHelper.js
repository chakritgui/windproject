'use strict';
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
function getWindColor(ms) {
    for (let i = WINDY_COLORS.length - 1; i >= 0; i--) {
        if (ms >= WINDY_COLORS[i].ms) return WINDY_COLORS[i].color;
    }
    return WINDY_COLORS[0].color;
}
function getCurrentUnit() {
    return WIND_UNITS[currentUnitIdx];
}
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
        body:    JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
    return res.json();
}
async function fetchWindAtPoint(lat, lng) {
    try {
        const url = `${BASE_URL}/api/weather.current?lat=${lat}&lon=${lng}&level=${DEFAULT_LEVEL}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return {
            speed:     data.wind_speed     ?? null,
            direction: data.wind_direction ?? null,
            gusts: data.wind_gusts ?? null,
        };
    } catch (err) {
        console.error('fetchWindAtPoint error:', err);
        return { speed: null, direction: null, gusts: null };
    }
}
function _calcOffsetDist(zoom) {
    const MIN_ZOOM = 8,  MAX_ZOOM = 19;
    const MIN_DIST = 42, MAX_DIST = 110;
    const t    = Math.max(0, Math.min(1, (zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)));
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
function _getTurbineSize(zoom) {
    if (globalWindturbineIcon?.sizes) {
        return globalWindturbineIcon.sizes[zoom] || 16;
    }
    return Math.max(3, Math.min(12, (zoom - 10) * 1.5 + 3));
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
            if (_overlaps(box, poleBox))                 continue;
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
function buildWindLabelSVG({
    anchorX, anchorY,
    labelDx, labelDy,
    windId, arrowId,
    windSpeed = 0, windDir = 0,
    scale = 1,
}) {
    const BOX_H   = Math.round(28 * scale);
    const PADDING = Math.round(10 * scale);
    const fs1 = Math.max(7,  Math.round(13 * scale));
    const fs2 = Math.max(6,  Math.round(10 * scale));
    const fs3 = Math.max(7,  Math.round(10 * scale));
    const rx   = Math.round(BOX_H / 2);
    const dotR = Math.max(2.5, 3.5 * scale);
    const lw   = Math.max(0.8, 1.2 * scale);
    const unit        = getCurrentUnit();
    const displayVal  = (windSpeed * unit.factor).toFixed(1);
    const label       = unit.label;
    const arrowW  = Math.round(fs3 * 1.2);
    const textW   = Math.round(displayVal.length * fs1 * 0.62 + label.length * fs2 * 0.6 + 2);
    const BOX_W   = PADDING + arrowW + Math.round(PADDING * 0.5) + textW + PADDING;
    const svgW    = Math.abs(labelDx) + BOX_W + 13;
    const svgH    = Math.abs(labelDy) + BOX_H + 12;
    const tipX  = anchorX + labelDx;
    const tipY  = anchorY + labelDy;
    const boxX  = labelDx >= 0 ? tipX : tipX - BOX_W;
    const boxY  = tipY - BOX_H / 2;
    const lineStartX = labelDx >= 0 ? boxX : boxX + BOX_W;
    const lineStartY = tipY;
    const arrowCX = boxX + PADDING + Math.round(arrowW / 2);
    const arrowCY = tipY;
    const textX   = boxX + PADDING + arrowW + Math.round(PADDING * 0.5);
    const activeColor = getWindColor(windSpeed);
    const glowColor   = activeColor;
    const lgId   = `lg-${windId}`;
    const shId   = `sh-${windId}`;
    const glowId = `gw-${windId}`;
    return {
        svgW,
        svgH,
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
                <feMerge>
                    <feMergeNode in="blur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>
        <line x1="${anchorX}" y1="${anchorY}" x2="${lineStartX}" y2="${lineStartY}" stroke="rgba(255,255,255,0.18)" stroke-width="${lw}" stroke-dasharray="${Math.round(3*scale)},${Math.round(2.5*scale)}" stroke-linecap="round"/>
        <circle cx="${anchorX}" cy="${anchorY}" r="${dotR + 2}" fill="${glowColor}" fill-opacity="0.15"/>
        <circle cx="${anchorX}" cy="${anchorY}" r="${dotR}" fill="${glowColor}" fill-opacity="0.7" stroke="rgba(255,255,255,0.35)" stroke-width="0.8"/>
        <rect id="rect-${windId}" x="${boxX}" y="${boxY}" width="${BOX_W}" height="${BOX_H}" rx="${rx}" fill="url(#${lgId})" fill-opacity="0.96" stroke="${glowColor}" stroke-width="0.65" stroke-opacity="0.45" filter="url(#${shId})"/>
        <rect x="${boxX+1}" y="${boxY+1}" width="${BOX_W-2}" height="${Math.round(BOX_H*0.45)}" rx="${rx}" fill="rgba(255,255,255,0.04)"/>
        <g id="${arrowId}" data-cx="${arrowCX}" data-cy="${arrowCY}" data-dir="${windDir}"
           transform="rotate(${windDir - 90}, ${arrowCX}, ${arrowCY})">
            <text x="${arrowCX}" y="${arrowCY}" font-size="${fs3}" fill="${activeColor}" text-anchor="middle" dominant-baseline="central" filter="url(#${glowId})">➤</text>
        </g>
        <text id="${windId}" data-raw="${windSpeed}" x="${textX}" y="${arrowCY}" font-size="${fs1}" font-weight="700" fill="${activeColor}" text-anchor="start" dominant-baseline="central" style="paint-order:stroke;stroke:rgba(0,0,0,0.4);stroke-width:1.2px;stroke-linejoin:round">
            ${displayVal}
            <tspan class="wind-unit-label" font-weight="400" font-size="${fs2}" dx="${Math.round(2*scale)}">${label}</tspan>
        </text>
        </svg>`,
    };
}
function _buildPoleIcon(pole, size = 20) {
    if (pole.type_icon?.trim()) {
        return L.icon({
            iconUrl:     pole.type_icon,
            iconSize:    [size, size],
            iconAnchor:  [size / 2, size],
            popupAnchor: [0, -size],
        });
    }
    const isEven  = pole.type_id % 2 === 0;
    const color   = isEven ? '#f5a623' : '#5bb8f5';
    const color2  = isEven ? '#d4821e' : '#1e90d4';
    const glowCol = isEven ? 'rgba(91,184,245,0.6)' : 'rgba(245,166,35,0.6)';
    const baseW = 20, baseH = 52;
    const w = size, h = size * (baseH / baseW);
    const extraY = 30;
    const extra = `
        <line x1="3" y1="${extraY}" x2="-5" y2="${extraY}" stroke="rgba(255,255,255,0.85)" stroke-width="1.3" stroke-linecap="round"/>
        <circle cx="-5" cy="${extraY}" r="1.8" fill="${color}" stroke="rgba(255,255,255,0.9)" stroke-width="0.7"/>`;
    return L.divIcon({
        className:  'pole-icon-wrap',
        iconSize:   [w, h],
        iconAnchor: [w * 0.15, h],
        html: `
        <svg width="${w}" height="${h}" viewBox="0 0 20 52" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;display:block;filter:drop-shadow(0px 2px 2px rgba(0,0,0,0.3))">
        <defs>
            <filter id="pglow-${pole.poles_id}" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="1.5" result="blur"/>
                <feMerge>
                    <feMergeNode in="blur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>
        <ellipse cx="3" cy="49" rx="5" ry="2" fill="${glowCol}" filter="url(#pglow-${pole.poles_id})"/>
        <circle cx="3" cy="49" r="3.5" fill="rgba(20,22,26,0.9)" stroke="${color}" stroke-width="1.5"/>
        <line x1="3" y1="46" x2="3" y2="3" stroke="rgba(255,255,255,0.82)" stroke-width="1.7" stroke-linecap="round"/>
        <line x1="3" y1="5"  x2="15" y2="5" stroke="rgba(255,255,255,0.82)" stroke-width="1.3" stroke-linecap="round"/>
        <circle cx="15" cy="5"  r="2.5" fill="${color}"  stroke="rgba(255,255,255,0.85)" stroke-width="0.7" filter="url(#pglow-${pole.poles_id})"/>
        <line x1="3" y1="15" x2="11" y2="15" stroke="rgba(255,255,255,0.82)" stroke-width="1.3" stroke-linecap="round"/>
        <circle cx="11" cy="15" r="2" fill="${color2}" stroke="rgba(255,255,255,0.85)" stroke-width="0.7"/>
        ${extra}
        </svg>`,
    });
}
function _buildTurbineIcon(size) {
    const iconUrl = globalWindturbineIcon?.url ? `${BASE_URL}/${globalWindturbineIcon.url}` : '';
    const iconColor = globalWindturbineIcon?.color || '#ef1515';
    if (iconUrl) {
        return L.icon({
            iconUrl,
            iconSize:    [size, size],
            iconAnchor:  [size / 2, size / 2],
            popupAnchor: [0, -size / 2],
            className:   'turbine-icon',
        });
    }
    return L.divIcon({
        className:  'turbine-dot',
        iconSize:   [size, size],
        iconAnchor: [size / 2, size / 2],
        html: `<div style="width:${size}px; height:${size}px; background:radial-gradient(circle at 30% 30%, ${iconColor}, ${iconColor}); border-radius:50%; box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>`,
    });
}
function _toFeatureCollection(g) {
    if (g?.type === 'FeatureCollection') return g;
    if (g?.type === 'Feature') return { type: 'FeatureCollection', features: [g] };
    return {
        type:     'FeatureCollection',
        features: [{ type: 'Feature', geometry: g, properties: {} }],
    };
}
function _toFeature(g) {
    return g?.type === 'Feature' ? g : { type: 'Feature', geometry: g, properties: {} };
}
function _mergePolygonsToUnion(geoJsonArray) {
    if (!geoJsonArray?.length) return null;
    if (geoJsonArray.length === 1) return _toFeatureCollection(geoJsonArray[0]);
    if (typeof turf === 'undefined') {
        console.warn('[_mergePolygonsToUnion] turf not loaded');
        return { type: 'FeatureCollection', features: geoJsonArray.map(_toFeature) };
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
        console.warn('[_mergePolygonsNoOverlap] turf not loaded');
        return { type: 'FeatureCollection', features: geoJsonArray.map(_toFeature) };
    }
    try {
        const features = geoJsonArray.flatMap(g => _toFeatureCollection(g).features).filter(f => f?.geometry);
        let accumulated   = null;
        const resultFeatures = [];
        features.forEach(feature => {
            try {
                const clean = accumulated
                    ? (turf.difference(feature, accumulated) ?? null)
                    : feature;
                if (clean) {
                    resultFeatures.push(clean);
                    accumulated = accumulated ? turf.union(accumulated, feature) : feature;
                }
            } catch (err) {
                console.warn('[_mergePolygonsNoOverlap] process feature error', err);
            }
        });

        return { type: 'FeatureCollection', features: resultFeatures };
    } catch (err) {
        console.error('[_mergePolygonsNoOverlap] error:', err);
        return { type: 'FeatureCollection', features: geoJsonArray.map(_toFeature) };
    }
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
        const hit =
            ((yi > point.lng) !== (yj > point.lng)) &&
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
function hideWindLoading() {
    const el = document.getElementById('wind-loading');
    if (!el) return;
    el.style.pointerEvents = 'none';
    el.style.transition    = 'opacity 0.3s ease-out';
    el.style.opacity       = 0;
    el.addEventListener('transitionend', () => el.remove(), { once: true });
}
function highlightAreaItem(index) {
    document.querySelectorAll('.ap-item').forEach(el => el.classList.remove('active'));
    document.getElementById(`ap-item-${index}`)?.classList.add('active');
}
function toggleAreaPanel() {
    document.getElementById('area-panel')?.classList.toggle('collapsed');
}
function renderErrorAlert(type, message) {
    return `<div class="alert alert-${type} m-3" role="alert">${message}</div>`;
}
function toggleAreaFill(enabled) {
    localStorage.setItem('area_fill', enabled);
    map.eachLayer(fg => {
        if (!(fg instanceof L.FeatureGroup)) return;
        fg.eachLayer(gj => {
            if (!(gj instanceof L.GeoJSON)) return;
            gj.eachLayer(l => {
                if (!l.options.stroke && l.options._origFillOpacity != null) {
                    l.setStyle({ fillOpacity: enabled ? l.options._origFillOpacity : 0 });
                }
            });
        });
    });
}

function toggleAreaStroke(enabled) {
    localStorage.setItem('area_stroke', enabled);
    Object.values(areaLayers).forEach(gj => {
        gj.eachLayer(l => {
            const origW = l.options._origWeight ?? l.options.weight;
            if (l.options._origWeight == null) l.options._origWeight = origW;
            l.setStyle({
                weight:  enabled ? origW : 0,
                stroke:  enabled,
                opacity: enabled ? 1 : 0,
            });
        });
    });
}