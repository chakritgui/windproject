let map, drawnItems, drawControl;
let isZoomLocked = true;
let polygons = [];
let polygonLayers = {};
let countryLayers = null;
let countryLayerInstance = null;
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
            setTimeout(safeInitMap, 500);
        } else {
            showError(langData['map_failed']);
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
    $('input[name="show_country_line"]').on('change', function() {
        const val = $(this).val();
        if (val === 'show') {
            $('#jsonUploadSection').slideDown();
            if (countryLayerInstance) map.addLayer(countryLayerInstance);
        } else {
            $('#jsonUploadSection').slideUp();
            if (countryLayerInstance) map.removeLayer(countryLayerInstance);
        }
    });
    $('#importJsonBtn').on('click', () => $('#importJsonInput').val('').click());
    $('#importJsonInput').on('change', handleJsonImport);
    $('#jsonFile').on('change', handleJsonImports);
    $('#saveGlobalBtn').on('click', handleMainSave);
    $('#fitBoundaryBtn').on('click', fitAllLayers);
}
function loadMapDataFromServer() {
    $.ajax({
        url: `${BASE_URL}/api/mapsetting/load`,
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
                    if (settings.show_country_line) {
                        const val = settings.show_country_line;
                        $(`input[name="show_country_line"][value="${val}"]`).prop('checked', true);
                        val === 'show' ? $('#jsonUploadSection').show() : $('#jsonUploadSection').hide();
                    }
                    if (settings.map_labels) {
                        const val = settings.map_labels;
                        $(`input[name="map_labels"][value="${val}"]`).prop('checked', true);
                    }
                    if (settings.country_layers_data) {
                        try {
                            countryLayers = typeof settings.country_layers_data === 'string' 
                                ? JSON.parse(settings.country_layers_data) : settings.country_layers_data;
                            renderCountryLayersOnly();
                        } catch(e) { console.error("Error parsing country data"); }
                    }
                    if (settings.default_style) {
                        currentStyle = typeof settings.default_style === 'string' 
                            ? JSON.parse(settings.default_style) : settings.default_style;
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
    renderPolygonList(); 
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
function renderCountryLayersOnly() {
    if (!countryLayers) return;
    if (countryLayerInstance) map.removeLayer(countryLayerInstance);
    try {
        countryLayerInstance = L.geoJSON(countryLayers, {
            style: { color: '#000000', weight: 1, fillOpacity: 0, interactive: false }
        });
        if ($('input[name="show_country_line"]:checked').val() === 'show') {
            countryLayerInstance.addTo(map);
        }
    } catch (err) { console.error("Error rendering countryLayers:", err); }
}
function renderPolygonList() {
    const $list = $('#polygonList').empty();
    if (!polygons.length) {
        $list.append(`<p class="text-muted small text-center p-3">${langData['no_areas'] || "No areas"}</p>`);
        return;
    }
    polygons.forEach(p => {
        const fill = p.style?.fillColor || currentStyle.fillColor;
        const border = p.style?.color || currentStyle.color;
        $list.append(`
            <div id="item-${p.poly_id}" class="data-item d-flex justify-content-between align-items-center p-2 border-bottom">
                <div class="d-flex align-items-center" style="cursor:pointer; flex-grow:1" onclick="handleItemClick(${p.poly_id})">
                    <span class="me-2" style="display:inline-block; width:12px; height:12px; border-radius:50%; background-color:${fill}; border:1px solid ${border};"></span>
                    <div><div class="fw-bold small text-truncate" style="max-width: 130px;">${p.name}</div></div>
                </div>
                <div class="btn-group border rounded-3 bg-white">
                    <button class="btn btn-link text-info py-1" onclick="focusOnLayer(${p.poly_id})"><i class="fa-solid fa-eye"></i></button>
                    <button class="btn btn-link text-warning py-1 border-start" onclick="openEditPopup(${p.poly_id})"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="btn btn-link text-danger py-1 border-start" onclick="deletePolygon(${p.poly_id})"><i class="fa-solid fa-trash-can"></i></button>
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
            const new_id = Date.now() + Math.floor(Math.random() * 1000);
            polygons.push({
                poly_id: new_id,
                name: name,
                data: f,
                style: { ...currentStyle }
            });
        }
    });
    renderPolygons();
    setTimeout(fitAllLayers, 100);
}
function importMapJSONs(json) {
    countryLayers = json;
    renderCountryLayersOnly();
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
    $('#statusBadge').html(locked ? '<i class="fa-solid fa-lock text-danger"></i>' : '<i class="fa-solid fa-lock-open text-success"></i>');
}
async function handleJsonImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        try { importMapJSON(JSON.parse(ev.target.result)); } catch (err) { showError(langData['invalid_json_file']); }
    };
    reader.readAsText(file);
}
async function handleJsonImports(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        try { importMapJSONs(JSON.parse(ev.target.result)); } catch (err) { showError(langData['invalid_json_file']); }
    };
    reader.readAsText(file);
}
function fitAllLayers() {
    const layers = Object.values(polygonLayers);
    if (layers.length > 0) {
        applyLockState(false);
        const group = L.featureGroup(layers);
        map.fitBounds(group.getBounds(), { padding: [40, 40], animate: true });
    }
}
function getMapFullConfigForSave() {
    const center = map.getCenter();
    const polygonVisibility = document.querySelector('input[name="polygon_visibility"]:checked')?.value || 'close';
    const show_country_line = document.querySelector('input[name="show_country_line"]:checked')?.value || 'hide';
    const map_labels = document.querySelector('input[name="map_labels"]:checked')?.value || 'hide';
    return {
        map_settings: {
            center_lat: center.lat.toFixed(8),
            center_lng: center.lng.toFixed(8),
            zoom_level: map.getZoom(),
            is_locked: isZoomLocked ? 1 : 0, 
            default_style: JSON.stringify(currentStyle),
            polygon_visibility: polygonVisibility,
            show_country_line: show_country_line,
            map_labels: map_labels,
            country_layers_data: countryLayers ? JSON.stringify(countryLayers) : null
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
    const $btn = $("#saveGlobalBtn");
    const payload = getMapFullConfigForSave();
    $btn.prop("disabled", true);
    $.ajax({
        url: `${BASE_URL}/api/mapsetting/save`,
        method: 'POST',
        data: { payload: payload },
        dataType: 'json',
        success: function(res) {
            if (res.status === true) {
                showSuccess(langData['saved_successfully']);
            } else {
                showError(res.message);
            }
        },
        error: () => showError(langData['cannot_save']),
        complete: () => $btn.prop("disabled", false)
    });
}
$(document).ready(safeInitMap);