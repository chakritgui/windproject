let map, drawnItems, drawControl;
let isZoomLocked = true;
let polygons = [];
let polygonLayers = {};
let currentStyle = {
    fillColor: '#3388ff',
    color: '#3388ff',
    fillOpacity: 0.3,
    weight: 2
};
let retry = 0;
function safeInitMap() {
    if (typeof L === 'undefined' || typeof L.Control.Draw === 'undefined') {
        retry++;
        if (retry <= 10) {
            console.warn(`Waiting Leaflet... ${retry}/10`);
            setTimeout(safeInitMap, 500);
        } else {
            alert('Leaflet / Leaflet.draw load failed');
        }
        return;
    }
    initMap();
}
function initMap() {
    if (!$('#map').length) return;
    map = L.map('map').setView([13.7563, 100.5018], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);
    drawnItems = new L.FeatureGroup().addTo(map);
    setupDrawControl();
    setupEvents();
    applyLockState(true);
}
function setupDrawControl() {
    drawControl = new L.Control.Draw({
        edit: {
            featureGroup: drawnItems,
            remove: false
        },
        draw: {
            polygon: { shapeOptions: currentStyle },
            polyline: false,
            rectangle: false,
            circle: false,
            marker: false,
            circlemarker: false
        }
    });
    map.addControl(drawControl);
}
function setupEvents() {
    map.on('draw:created', onDrawCreated);
    $('#toggleLockBtn').on('click', () => applyLockState(!isZoomLocked));
    $('#fillColor').on('input', e => currentStyle.fillColor = e.target.value);
    $('#borderColor').on('input', e => currentStyle.color = e.target.value);
    $('#fillOpacity').on('input', e => {
        currentStyle.fillOpacity = e.target.value / 100;
        $('#opacityValue').text(e.target.value + '%');
    });
    $('#borderWeight').on('input', e => {
        currentStyle.weight = parseInt(e.target.value, 10);
        $('#weightValue').text(e.target.value + 'px');
    });
    $('#importJsonBtn').on('click', function () {
        $('#importJsonInput').val('').click();
    });
    $('#importJsonInput').on('change', handleJsonImport);
}
function onDrawCreated(e) {
    const id = Date.now();
    const layer = e.layer;
    layer.options.id = id;
    drawnItems.addLayer(layer);
    polygons.push({
        id,
        name: `Area-${id.toString().slice(-4)}`,
        data: layer.toGeoJSON(),
        style: { ...currentStyle } 
    });
    renderPolygons();
}
function applyLockState(locked) {
    isZoomLocked = locked;
    const action = locked ? 'disable' : 'enable';
    map.dragging[action]();
    map.scrollWheelZoom[action]();
    map.doubleClickZoom[action]();
    $('#statusBadge').html(
        locked
            ? '<i class="bi bi-lock-fill text-danger"></i> Locked'
            : '<i class="bi bi-unlock-fill text-success"></i> Editing'
    );
}
function renderPolygons() {
    drawnItems.clearLayers();
    polygonLayers = {};
    polygons.forEach(p => {
        const geo = L.geoJSON(p.data, { style: p.style });
        geo.eachLayer(layer => {
            layer.options.id = p.id;
            drawnItems.addLayer(layer);
            polygonLayers[p.id] = layer;
        });
    });
    renderPolygonList();
}
function renderPolygonList() {
    const $list = $('#polygonList').empty();
    if (!polygons.length) {
        $list.append('<p class="text-muted small text-center p-3">No areas</p>');
        return;
    }
    polygons.forEach(p => {
        $list.append(`
            <div class="data-item d-flex justify-content-between align-items-center"
                 onclick="focusOnLayer(${p.id})">
                <div>
                    <div class="fw-bold small">${p.name}</div>
                    <div class="text-muted" style="font-size:10px">ID: ${p.id}</div>
                </div>
                <i class="bi bi-geo-alt-fill text-primary"></i>
            </div>
        `);
    });
}
function focusOnLayer(id) {
    const layer = polygonLayers[id];
    if (!layer) return;
    applyLockState(false);
    map.fitBounds(layer.getBounds(), {
        padding: [60, 60],
        animate: true
    });
    layer.setStyle({ color: '#dc3545', weight: 3 });
    setTimeout(() => {
        layer.setStyle({
            ...polygons.find(p => p.id === id).style
        });
    }, 1200);
}
function handleJsonImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        try {
            const json = JSON.parse(ev.target.result);
            importMapJSON(json);
        } catch {
            alert('Invalid JSON / GeoJSON');
        }
    };
    reader.readAsText(file);
}
function importMapJSON(json) {
    if (!json.features || !Array.isArray(json.features)) return;
    polygons = [];
    json.features.forEach((f, i) => {
        if (!f.geometry) return;
        polygons.push({
            id: Date.now() + i,
            name: f.properties?.name || `Area-${i + 1}`,
            data: f,
            style: { ...currentStyle }
        });
    });
    renderPolygons();
    applyLockState(false);
    setTimeout(fitAllLayers, 50);
}
function fitAllLayers() {
    const layers = Object.values(polygonLayers);
    if (!layers.length) return;
    const group = L.featureGroup(layers);
    map.fitBounds(group.getBounds(), {
        padding: [60, 60],
        animate: true
    });
}
$(document).ready(safeInitMap);