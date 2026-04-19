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
const levels = ["100m", "950h", "925h", "900h", "850h", "800h", "700h", "600h", "500h", "400h", "300h", "250h", "200h", "150h", "10h"];
const labels = ["100m (330ft)", "950hPa (600m)", "925hPa (750m)", "900hPa (900m)","850hPa (1.5km)", "800hPa (2km)", "700hPa (3km)", "600hPa (4.2km)","500hPa (5.5km)", "400hPa (7km)", "300hPa (9km)", "250hPa (10km)","200hPa (11.7km)", "150hPa (13.5km)", "10hPa (30km)"];
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
    $('#heightSlider').on('input change', function() {
        const index = $(this).val();
        const selectedValue = levels[index];
        const displayLabel = labels[index];
        $('#height-display').text(displayLabel);
        $('#actual_level').val(selectedValue);
    });
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
    $('#noFill').on('change', function () {
        const checked = $(this).is(':checked');
        if (checked) {
            currentStyle.fillOpacity = 0;
            $('#fillOpacity').prop('disabled', true);
            $('#fillColor').prop('disabled', true);
            $('#opacityValue').text('0%');
        } else {
            const val = parseFloat($('#fillOpacity').val()) || 30;
            currentStyle.fillOpacity = val / 100;
            $('#fillOpacity').prop('disabled', false);
            $('#fillColor').prop('disabled', false);
            $('#opacityValue').text(Math.round(val) + '%');
        }
    });
    $('#noBorder').on('change', function () {
        const checked = $(this).is(':checked');
        if (checked) {
            currentStyle.weight = 0;
            $('#borderWeight').prop('disabled', true);
            $('#borderColor').prop('disabled', true);
            $('#weightValue').text('0px');
        } else {
            const val = parseInt($('#borderWeight').val()) || 2;
            currentStyle.weight = val;
            $('#borderWeight').prop('disabled', false);
            $('#borderColor').prop('disabled', false);
            $('#weightValue').text(val + 'px');
        }
    });
    $('input[name="show_country_line"]').on('change', function () {
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
        url: `${BASE_URL}/api/map.load`,
        method: 'GET',
        dataType: 'json',
        success: function (res) {
            if (res.status && res.data) {
                const settings = res.data.map_settings;
                const savedPolygons = res.data.polygons;
                const DEFAULT_LEVEL = res.data.DEFAULT_LEVEL || '100m';
                const levelIndex = levels.indexOf(DEFAULT_LEVEL);
                if (levelIndex !== -1) {
                    $('#heightSlider').val(levelIndex);
                    $('#height-display').text(labels[levelIndex]);
                    $('#actual_level').val(DEFAULT_LEVEL);
                }
                if (settings.mode_settings) {
                    try {
                        const modeConfigs = typeof settings.mode_settings === 'string' ? JSON.parse(settings.mode_settings) : settings.mode_settings;
                        Object.keys(modeConfigs).forEach(mode => {
                            const options = modeConfigs[mode];
                            Object.keys(options).forEach(id => {
                                $(`#${id}`).prop('checked', options[id] === 1);
                            });
                            const $container = $(`.mode-container[data-mode="${mode}"]`);
                            if (typeof updateDependency === 'function') {
                                updateDependency($parentMode); 
                            }
                        });
                    } catch (e) {
                        console.error("Error parsing mode settings:", e);
                    }
                }
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
                        } catch (e) { console.error("Error parsing country data"); }
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
                        data: typeof p.geo_data === 'string' ? JSON.parse(p.geo_data) : p.geo_data,
                        project_id: p.project_id || null,
                        project_name: p.project_name || ''
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
    const noFill = currentStyle.fillOpacity === 0;
    const noBorder = currentStyle.weight === 0;
    $('#noFill').prop('checked', noFill);
    $('#fillOpacity, #fillColor').prop('disabled', noFill);
    $('#noBorder').prop('checked', noBorder);
    $('#borderWeight, #borderColor').prop('disabled', noBorder);
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
        style: { ...currentStyle },
        project_id: null,
        project_name: null
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
                    <div>
                        <div class="fw-bold small text-truncate" style="max-width:130px;">${p.name}</div>
                        <div class="mt-2" style="font-size:9px;">
                            <span style="padding:2px 6px; border-radius:8px; ${p.project_name ? 'background:#eef3ff; color:#3b5bdb;' : 'background:#ffe3e3; color:#c92a2a;'}">${p.project_name ? '<i class="fa-solid fa-diagram-project me-1"></i>' + p.project_name : 'No Project'}</span>
                        </div>
                    </div>
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
function openEditPopup(id) {
    const poly = polygons.find(p => p.poly_id == id);
    if (!poly) return;
    const noFillChecked   = poly.style.fillOpacity === 0  ? 'checked' : '';
    const noBorderChecked = poly.style.weight == 0        ? 'checked' : '';
    const modalHtml = `
    <div class="modal fade" id="editModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-md modal-dialog-centered">
            <div class="modal-content shadow border-0">
                <div class="modal-header bg-light py-2">
                    <h6 class="modal-title small fw-bold"><span data-i18n="edit"></span>: ${poly.name}</h6>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-3">
                    <div class="mb-3">
                        <label class="form-label small fw-bold" data-i18n="project"></label>
                        <select id="editProject" class="form-select form-select-sm"></select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label small fw-bold mb-1" data-i18n="area_border_color"></label>
                        <div class="d-flex gap-2">
                            <input type="color" id="editFillColor" class="form-control form-control-color w-100" value="${poly.style.fillColor}" ${noFillChecked   ? 'disabled' : ''}>
                            <input type="color" id="editBorderColor" class="form-control form-control-color w-100" value="${poly.style.color}"      ${noBorderChecked ? 'disabled' : ''}>
                        </div>
                        <div class="d-flex gap-3 mt-2">
                            <div class="form-check form-check-inline mb-0">
                                <input class="form-check-input" type="checkbox" id="editNoFill" ${noFillChecked}>
                                <label class="form-check-label small" for="editNoFill" data-i18n="no_fill"></label>
                            </div>
                            <div class="form-check form-check-inline mb-0">
                                <input class="form-check-input" type="checkbox" id="editNoBorder" ${noBorderChecked}>
                                <label class="form-check-label small" for="editNoBorder" data-i18n="no_border"></label>
                            </div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label small fw-bold mb-1"><span data-i18n="opacity"></span>: <span id="valOpacity">${Math.round(poly.style.fillOpacity * 100)}%</span></label>
                        <input type="range" id="editOpacity" class="form-range" min="0" max="100" value="${poly.style.fillOpacity * 100}" ${noFillChecked ? 'disabled' : ''}>
                    </div>
                    <div class="mb-3">
                        <label class="form-label small fw-bold mb-1"><span data-i18n="border_weight"></span>: <span id="valWeight">${poly.style.weight}px</span></label>
                        <input type="range" class="form-range" id="editborderWeight" min="0" max="10" value="${poly.style.weight}" ${noBorderChecked ? 'disabled' : ''}>
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
    $('#editOpacity').on('input', function () {
        $('#valOpacity').text($(this).val() + '%');
    });
    $('#editborderWeight').on('input', function () {
        $('#valWeight').text($(this).val() + 'px');
    });
    $('#editNoFill').on('change', function () {
        const checked = $(this).is(':checked');
        $('#editFillColor, #editOpacity').prop('disabled', checked);
        if (checked) {
            $('#editOpacity').val(0);
            $('#valOpacity').text('0%');
        } else {
            const prev = poly.style.fillOpacity > 0 ? Math.round(poly.style.fillOpacity * 100) : 30;
            $('#editOpacity').val(prev);
            $('#valOpacity').text(prev + '%');
        }
    });
    $('#editNoBorder').on('change', function () {
        const checked = $(this).is(':checked');
        $('#editBorderColor, #editborderWeight').prop('disabled', checked);
        if (checked) {
            $('#editborderWeight').val(0);
            $('#valWeight').text('0px');
        } else {
            const prev = poly.style.weight > 0 ? poly.style.weight : 2;
            $('#editborderWeight').val(prev);
            $('#valWeight').text(prev + 'px');
        }
    });
    $('#btnResetIndividual').on('click', function () {
        showConfirm(langData['confirm'], langData['confirm_change'], function () {
            $('#editFillColor').val(currentStyle.fillColor);
            $('#editBorderColor').val(currentStyle.color);
            $('#editOpacity').val(currentStyle.fillOpacity * 100);
            $('#valOpacity').text((currentStyle.fillOpacity * 100) + '%');
            $('#editborderWeight').val(currentStyle.weight);
            $('#valWeight').text((currentStyle.weight) + 'px');
            const noFill   = currentStyle.fillOpacity === 0;
            const noBorder = currentStyle.weight === 0;
            $('#editNoFill').prop('checked', noFill);
            $('#editFillColor, #editOpacity').prop('disabled', noFill);
            $('#editNoBorder').prop('checked', noBorder);
            $('#editBorderColor, #editborderWeight').prop('disabled', noBorder);
            $('#btnSaveIndividual').click();
        });
    });
    $('#btnSaveIndividual').on('click', function () {
        poly.style = {
            ...poly.style,
            fillColor: $('#editFillColor').val(),
            color: $('#editBorderColor').val(),
            fillOpacity: parseFloat($('#editOpacity').val()) / 100,
            weight: parseInt($('#editborderWeight').val(), 10),
        };
        const selected = $('#editProject').select2('data')[0];
        poly.project_id = selected ? selected.id   : null;
        poly.project_name = selected ? selected.text : '';

        if (polygonLayers[id]) {
            polygonLayers[id].setStyle(poly.style);
        }
        renderPolygonList();
        myModal.hide();
    });
    initSelect2Remote('#editProject', `${BASE_URL}/api/poles.filter`, { type: 'project' });
    if (poly.project_name) {
        var newOptionStatus = new Option(poly.project_name, poly.project_id, true, true);
        $('#editProject').append(newOptionStatus).trigger('change');
    }
}
function deletePolygon(id) {
    showConfirm(langData['confirm'], langData['confirm_delete'], function () {
        polygons = polygons.filter(p => p.poly_id != id);
        if (polygonLayers[id]) {
            drawnItems.removeLayer(polygonLayers[id]);
            delete polygonLayers[id];
        }
        renderPolygonList();
    });
}
function importMapJSON(input) {
    let features = [];
    if (typeof input === 'string') {
        const trimmedInput = input.trim();
        try {
            const parsed = JSON.parse(trimmedInput);
            features = (parsed.type === 'FeatureCollection') ? parsed.features : (Array.isArray(parsed) ? parsed : [parsed]);
        } catch (e) {
            features = trimmedInput.split('\n').filter(line => line.trim() !== "").map(line => {
                try { return JSON.parse(line); }
                catch (err) { console.error("Invalid JSON line skipped:", line); return null; }
            }).filter(f => f !== null);
        }
    } else if (typeof input === 'object' && input !== null) {
        features = (input.type === 'FeatureCollection') ? input.features : (Array.isArray(input) ? input : [input]);
    }
    if (!features || features.length === 0) {
        console.warn("No features found to import.");
        return;
    }
    features.forEach((f) => {
        if (f.type === 'FeatureCollection' && f.features) {
            f.features.forEach(subF => processFeature(subF));
        } else {
            processFeature(f);
        }
    });
    function processFeature(f) {
        if (f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon') {
            const name = f.properties?.NAME || f.properties?.name || `Area-${Date.now().toString().slice(-4)}`;
            const new_id = Date.now() + Math.floor(Math.random() * 1000);
            polygons.push({
                poly_id: new_id,
                name: name,
                data: f,
                style: { ...currentStyle },
                project_id: null,
                project_name: null
            });
        }
    }
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
    const fileName = file.name.toLowerCase();
    const allowedExtensions = ['.json', '.geojson', '.geojsonl'];
    const isValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    if (!isValidExtension) {
        $(e.target).val(''); 
        showError(langData['support_json'] || "Supports .json, .geojson, and .geojsonl only.");
        return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
        try { 
            importMapJSON(ev.target.result); 
        } catch (err) { 
            showError(langData['invalid_json_file'] || "Error parsing JSON content."); 
        }
    };
    reader.onerror = () => showError("Failed to read file.");
    reader.readAsText(file);
}
async function handleJsonImports(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        try { importMapJSONs(JSON.parse(ev.target.result)); }
        catch (err) { showError(langData['invalid_json_file']); }
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
    const DEFAULT_LEVEL = $("input[name=DEFAULT_LEVEL]").val() || '100m';
    const modeConfigs = {};
    $('.mode-container').each(function() {
        const modeName = $(this).data('mode');
        modeConfigs[modeName] = {};
        $(this).find('input[type="checkbox"]').each(function() {
            const key = $(this).attr('id'); 
            modeConfigs[modeName][key] = $(this).is(':checked') ? 1 : 0;
        });
    });
    return {
        map_settings: {
            center_lat: center.lat.toFixed(8),
            center_lng: center.lng.toFixed(8),
            zoom_level: map.getZoom(),
            is_locked: isZoomLocked ? 1 : 0,
            default_style: JSON.stringify(currentStyle),
            mode_settings: JSON.stringify(modeConfigs), 
            polygon_visibility: document.querySelector('input[name="polygon_visibility"]:checked')?.value || 'close',
            show_country_line: document.querySelector('input[name="show_country_line"]:checked')?.value || 'hide',
            map_labels: document.querySelector('input[name="map_labels"]:checked')?.value || 'hide',
            country_layers_data: countryLayers ? JSON.stringify(countryLayers) : null,
            DEFAULT_LEVEL: DEFAULT_LEVEL
        },
        polygons: polygons.map(p => {
            const currentLayer = polygonLayers[p.poly_id];
            const latestGeo = currentLayer ? currentLayer.toGeoJSON() : p.data;
            return {
                poly_id: p.poly_id,
                area_name: p.name,
                project_id: p.project_id,
                custom_style: JSON.stringify(p.style),
                geo_data: JSON.stringify(latestGeo)
            };
        })
    };
}
function handleMainSave() {
    const $btn    = $("#saveGlobalBtn");
    const payload = getMapFullConfigForSave();
    $btn.prop("disabled", true);
    $.ajax({
        url: `${BASE_URL}/api/map.save`,
        method: 'POST',
        data: { payload: payload },
        dataType: 'json',
        success: function (res) {
            if (res.status === true) {
                showSuccess(langData['saved_successfully']);
                setTimeout(() => {
                    location.reload();
                }, 3000);
            } else {
                showError(res.message);
                $btn.prop("disabled", false);
            }
        },
        error: () => showError(langData['cannot_save']),
        complete: () => $btn.prop("disabled", false)
    });
}
$(document).ready(safeInitMap);
$(document).ready(function() {
    function updateDependency($container) {
        const isMasterChecked = $container.find('.master-control').is(':checked');
        const $dependents = $container.find('.dependent-opt');
        if (!isMasterChecked) {
            $dependents.prop('checked', false).prop('disabled', true);
            $dependents.closest('.form-check').addClass('text-muted');
        } else {
            $dependents.prop('disabled', false);
            $dependents.closest('.form-check').removeClass('text-muted');
        }
    }
    $('.master-control').on('change', function() {
        const $parentMode = $(this).closest('.mode-container');
        updateDependency($parentMode);
    });
    $('.mode-container').each(function() {
        updateDependency($(this));
    });
});