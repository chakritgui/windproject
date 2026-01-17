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
let is_locked = 1;
let retry = 0;
function safeInitMap() {
    if (typeof L === 'undefined' || typeof L.Control.Draw === 'undefined') {
        retry++;
        if (retry <= 10) {
            setTimeout(safeInitMap, 500);
        } else {
            showError('Error', langData['map_failed']);
        }
        return;
    }
    initMap();
}
function initMap() {
    if (!$('#map').length) return;
    map = L.map('map').setView([13.7563, 100.5018], 12);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { 
        attribution: false 
    }).addTo(map);
    drawnItems = new L.FeatureGroup().addTo(map);
    setupDrawControl();
    setupEvents();
    applyLockState(true);
    loadMapDataFromServer();
}
function setupDrawControl() {
    drawControl = new L.Control.Draw({
        edit: { featureGroup: drawnItems, remove: false },
        draw: {
            polygon: { shapeOptions: currentStyle },
            polyline: false, rectangle: false, circle: false, marker: false, circlemarker: false
        }
    });
    map.addControl(drawControl);
}
function setupEvents() {
    map.on('draw:created', onDrawCreated);
    $('#statusBadge').on('click', () => applyLockState(!isZoomLocked));
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
    $('#importJsonBtn').on('click', () => $('#importJsonInput').val('').click());
    $('#importJsonInput').on('change', handleJsonImport);
    $('#saveGlobalBtn').on('click', handleMainSave);
    $('#fitBoundaryBtn').on('click', fitAllLayers);
}
function loadMapDataFromServer() {
    $.ajax({
        url: 'api/mapsetting/load',
        method: 'GET',
        dataType: 'json',
        success: function(res) {
            if (res.status && res.data) {
                const settings = res.data.map_settings;
                const savedPolygons = res.data.polygons;
                if (settings) {
                    const lat = parseFloat(settings.center_lat) || 13.7563;
                    const lng = parseFloat(settings.center_lng) || 100.5018;
                    const zoom = parseInt(settings.zoom_level) || 12;
                    map.setView([lat, lng], zoom);
                    if (settings.default_style) {
                        currentStyle = typeof settings.default_style === 'string' 
                            ? JSON.parse(settings.default_style) 
                            : settings.default_style;
                        updateControlPanelUI();
                    }
                }
                if (savedPolygons && savedPolygons.length > 0) {
                    polygons = savedPolygons.map(p => ({
                        poly_id: p.poly_id, 
                        name: p.area_name || `Area-${p.poly_id}`,
                        style: typeof p.custom_style === 'string' ? JSON.parse(p.custom_style) : p.custom_style,
                        data: typeof p.geo_data === 'string' ? JSON.parse(p.geo_data) : p.geo_data
                    }));
                    renderPolygons();
                }
            }
        },
        error: () => console.warn("Failed to load map data.")
    });
}
function updateControlPanelUI() {
    $('#fillColor').val(currentStyle.fillColor);
    $('#borderColor').val(currentStyle.color);
    $('#fillOpacity').val(currentStyle.fillOpacity * 100);
    $('#opacityValue').text(Math.round(currentStyle.fillOpacity * 100) + '%');
    $('#borderWeight').val(currentStyle.weight);
    $('#weightValue').text(currentStyle.weight + 'px');
}
function onDrawCreated(e) {
    const poly_id = Date.now(); 
    const layer = e.layer;
    layer.options.poly_id = poly_id;
    drawnItems.addLayer(layer);
    polygons.push({
        poly_id: poly_id,
        name: `Area-${poly_id.toString().slice(-4)}`,
        data: layer.toGeoJSON(),
        style: { ...currentStyle } 
    });
    renderPolygons(); 
}
function renderPolygons() {
    drawnItems.clearLayers();
    polygonLayers = {};
    polygons.forEach(p => {
        if (!p.data) return;
        try {
            const geo = L.geoJSON(p.data, { style: p.style });
            geo.eachLayer(layer => {
                layer.options.poly_id = p.poly_id;
                drawnItems.addLayer(layer);
                polygonLayers[p.poly_id] = layer; 
            });
        } catch (err) { console.error("Error rendering poly_id:", p.poly_id, err); }
    });
    renderPolygonList();
}
function renderPolygonList() {
    const $list = $('#polygonList').empty();
    if (!polygons.length) {
        $list.append('<p class="text-muted small text-center p-3" data-i18n="no_areas"></p>');
        return;
    }
    polygons.forEach(p => {
        const fill = p.style?.fillColor || currentStyle.fillColor;
        const border = p.style?.color || currentStyle.color;
        $list.append(`
            <div id="item-${p.poly_id}" class="data-item d-flex justify-content-between align-items-center p-2 border-bottom">
                <div class="d-flex align-items-center" style="cursor:pointer; flex-grow:1" onclick="handleItemClick(${p.poly_id})">
                    <span class="me-2" style="display:inline-block; width:12px; height:12px; border-radius:50%; background-color:${fill}; border:1px solid ${border};"></span>
                    <div>
                        <div class="fw-bold small text-truncate" style="max-width: 130px;">${p.name}</div>
                    </div>
                </div>
                <div class="btn-group btn-group-sm ms-2">
                    <button class="btn btn-outline-primary" onclick="focusOnLayer(${p.poly_id})"><i class="bi bi-eye-fill"></i></button>
                    <button class="btn btn-outline-warning" onclick="openEditPopup(${p.poly_id})"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-outline-danger" onclick="deletePolygon(${p.poly_id})"><i class="bi bi-trash-fill"></i></button>
                </div>
            </div>
        `);
    });
}
function deletePolygon(id) {
    showConfirm(langData['confirm'], langData['confirm_delete'], function(){
        polygons = polygons.filter(p => p.poly_id != id);
        if (polygonLayers[id]) {
            drawnItems.removeLayer(polygonLayers[id]);
            delete polygonLayers[id];
        }
        renderPolygonList();
    });
}
function importMapJSON(json) {
    let features = (json.type === 'FeatureCollection') ? json.features : (Array.isArray(json) ? json : [json]);
    features.forEach((f) => {
        if (f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon') {
            const name = f.properties?.NAME || f.properties?.name || `Area-${Date.now().toString().slice(-4)}`;
            const existingIndex = polygons.findIndex(p => p.name === name);
            if (existingIndex > -1) {
                polygons[existingIndex].data = f;
            } else {
                const new_id = Date.now() + Math.floor(Math.random() * 1000);
                polygons.push({
                    poly_id: new_id,
                    name: name,
                    data: f,
                    style: { ...currentStyle }
                });
            }
        }
    });
    renderPolygons();
    setTimeout(fitAllLayers, 100);
}
function openEditPopup(id) {
    const poly = polygons.find(p => p.poly_id == id);
    if (!poly) return;
    const modalHtml = `
    <div class="modal fade" id="editModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-sm modal-dialog-centered">
            <div class="modal-content shadow border-0">
                <div class="modal-header bg-light py-2">
                    <h6 class="modal-title small fw-bold"><span data-i18n="edit"></span>: ${poly.name}</h6>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-3">
                    <div class="mb-3">
                        <label class="form-label small fw-bold mb-1">Colors</label>
                        <div class="d-flex gap-2">
                            <input type="color" id="editFillColor" class="form-control form-control-color w-100" value="${poly.style.fillColor}">
                            <input type="color" id="editBorderColor" class="form-control form-control-color w-100" value="${poly.style.color}">
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label small fw-bold mb-1">Opacity: <span id="valOpacity">${Math.round(poly.style.fillOpacity * 100)}%</span></label>
                        <input type="range" id="editOpacity" class="form-range" min="0" max="100" value="${poly.style.fillOpacity * 100}">
                    </div>
                </div>
                <div class="modal-footer border-0 pt-0 d-flex gap-2">
                    <button type="button" class="btn btn-sm btn-outline-secondary" id="btnResetIndividual" data-i18n="reset"></button>
                    <button type="button" class="btn btn-sm btn-primary" id="btnSaveIndividual" data-i18n="save"></button>
                </div>
            </div>
        </div>
    </div>`;
    $('#editModal').remove();
    $('body').append(modalHtml);
    const myModal = new bootstrap.Modal(document.getElementById('editModal'));
    myModal.show();
    $('#editOpacity').on('input', function() { 
        $('#valOpacity').text($(this).val() + '%'); 
    });
    $('#btnResetIndividual').on('click', function() {
        showConfirm(langData['confirm'], langData['confirm_change'], function(){
            $('#editFillColor').val(currentStyle.fillColor);
            $('#editBorderColor').val(currentStyle.color);
            $('#editOpacity').val(currentStyle.fillOpacity * 100);
            $('#valOpacity').text((currentStyle.fillOpacity * 100) + '%');
            $('#btnSaveIndividual').click();
        });
    });
    $('#btnSaveIndividual').on('click', function() {
        poly.style = {
            ...poly.style,
            fillColor: $('#editFillColor').val(),
            color: $('#editBorderColor').val(),
            fillOpacity: $('#editOpacity').val() / 100
        };
        if (polygonLayers[id]) {
            polygonLayers[id].setStyle(poly.style);
        }
        renderPolygonList();
        myModal.hide();
    });
}
function focusOnLayer(id) {
    const layer = polygonLayers[id];
    if (!layer) return;
    $('.data-item').removeClass('active');
    $(`#item-${id}`).addClass('active');
    applyLockState(false);
    map.fitBounds(layer.getBounds(), { padding: [60, 60], animate: true });
}
function handleItemClick(id) { focusOnLayer(id); }
function applyLockState(locked) {
    isZoomLocked = locked;
    const action = locked ? 'disable' : 'enable';
    if (map.dragging) map.dragging[action]();
    if (map.scrollWheelZoom) map.scrollWheelZoom[action]();
    if (map.doubleClickZoom) map.doubleClickZoom[action]();
    $('#statusBadge').html(locked 
        ? '<i class="bi bi-lock-fill text-danger"></i>' 
        : '<i class="bi bi-unlock-fill text-success"></i>'
    );
}
async function handleJsonImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        try { importMapJSON(JSON.parse(ev.target.result)); } catch (err) { showError('Error', langData['invalid_json_file']); }
    };
    reader.readAsText(file);
}
function fitAllLayers() {
    const layers = Object.values(polygonLayers);
    if (layers.length > 0) {
        applyLockState(false);
        const group = L.featureGroup(layers);
        map.fitBounds(group.getBounds(), { padding: [40, 40], animate: true });
    } else {
        showError('Error', langData['no_data_on_map']);
    }
}
function getMapFullConfigForSave() {
    const center = map.getCenter();
    return {
        map_settings: {
            center_lat: center.lat.toFixed(8),
            center_lng: center.lng.toFixed(8),
            zoom_level: map.getZoom(),
            is_locked: isZoomLocked ? 1 : 0, 
            default_style: JSON.stringify(currentStyle) 
        },
        polygons: polygons.map(p => {
            const currentLayer = polygonLayers[p.poly_id];
            const latestGeo = currentLayer ? currentLayer.toGeoJSON() : p.data;
            return {
                poly_id: p.poly_id, 
                area_name: p.name,
                custom_style: JSON.stringify(p.style),
                geo_data: JSON.stringify(latestGeo)
            };
        })
    };
}
function handleMainSave() {
    const $btn = $(".save-map");
    const payload = getMapFullConfigForSave();
    if (!payload) return;
    $btn.prop("disabled", true);
    $.ajax({
        url: 'api/mapsetting/save',
        method: 'POST',
        data: { payload: payload },
        dataType: 'json',
        success: function(res) {
            if (res.status === true) {
                showSuccess('Success', langData['saved_successfully']);
                loadMapDataFromServer();
            } else {
                showError('Error', langData['cannot_save'] + res.message);
            }
        },
        error: () => showError('Error', langData['cannot_save']),
        complete: () => $btn.prop("disabled", false)
    });
}
$(document).ready(safeInitMap);