let pages = 'contracts';
$(document).ready(function () {
    initMaster();
});
function initMaster() {
    initTable();
    $(".nav-link").click(function() {
        let p = $(this).data("page");
        pages = p;
        initTable();
    });
}
function initTable() {
    switch(pages) {
        case 'contracts':
            initSelect2Remote('#filter_status', `${BASE_URL}/api/contracts.filter`, { type: 'status' });
            $(".filter").on("change", () => initContractsTable());
            initContractsTable();
            break;
        case 'group':
            initSelect2Remote('#filter_group_status', `${BASE_URL}/api/installations.filter`, { type: 'status' });
            $(".filter").on("change", () => initGroupTable());
            initGroupTable();
            break;
        case 'project-status':
            initSelect2Remote('#filter_projectstatus_status', `${BASE_URL}/api/installations.filter`, { type: 'status' });
            $(".filter").on("change", () => initProjectStatusTable());
            initProjectStatusTable();
            break;
        case 'projects':
            initSelect2Remote('#filter_project_status', `${BASE_URL}/api/projects.filter`, { type: 'project_status' });
            initSelect2Remote('#filter_p_status', `${BASE_URL}/api/projects.filter`, { type: 'status' });
            initSelect2Remote('#filter_contract', `${BASE_URL}/api/projects.filter`, { type: 'contract' });
            initSelect2Remote('#filter_group', `${BASE_URL}/api/projects.filter`, { type: 'group' });
            $(".filter").on("change", () => initProjectsTable());
            initProjectsTable();
            break;
        case 'types':
            initSelect2Remote('#filter_type_status', `${BASE_URL}/api/types.filter`, { type: 'status' });
            $(".filter").on("change", () => initTypesTable());
            initTypesTable();
            break;
        case 'installation':
            initSelect2Remote('#filter_installation_project', `${BASE_URL}/api/installations.filter`, { type: 'project' });
            initSelect2Remote('#filter_installation_type', `${BASE_URL}/api/installations.filter`, { type: 'type' });
            initSelect2Remote('#filter_installation_status', `${BASE_URL}/api/installations.filter`, { type: 'status' });
            $(".filter").on("change", () => initInstallationsTable());
            initInstallationsTable();
            break;
        case 'level':
            initSelect2Remote('#filter_level_status', `${BASE_URL}/api/installations.filter`, { type: 'status' });
            $(".filter").on("change", () => initLevelTable());
            initLevelTable();
            break;
        case 'poles':
            initSelect2Remote('#filter_pole_project', `${BASE_URL}/api/poles.filter`, { type: 'project' });
            initSelect2Remote('#filter_pole_type', `${BASE_URL}/api/poles.filter`, { type: 'type' });
            initSelect2Remote('#filter_pole_installation', `${BASE_URL}/api/poles.filter`, { type: 'installation' });
            initSelect2Remote('#filter_pole_status', `${BASE_URL}/api/poles.filter`, { type: 'status' });
            initSelect2Remote('#filter_pole_project_status', `${BASE_URL}/api/projects.filter`, { type: 'project_status' });
            $(".filter").on("change", () => initPolesTable());
            initPolesTable();
            break;
        case 'windturbine':
            initSelect2Remote('#filter_windturbine_project', `${BASE_URL}/api/windturbine.filter`, { type: 'project' });
            initSelect2Remote('#filter_windturbine_status', `${BASE_URL}/api/windturbine.filter`, { type: 'status' });
            $(".filter").on("change", () => initWindturbineTable());
            initWindturbineTable();
            break;
    }
}
$(document).on('click', '.item-order', function() {
    let type = $(this).data("type");
    switch(type) {
        case 'contract':
            orderItem('contract', `${langData['contract'] || 'Contract'}`);
            break;
        case 'project':
            orderItem('project', `${langData['project'] || 'Project'}`);
            break;
        case 'pole_types':
            orderItem('pole_types', `${langData['pole_types'] || 'Wind Measurement Equipment'}`);
            break;
        case 'installation':
            orderItem('installation',`${langData['installation'] || 'Installation'}`);
            break;
        case 'level':
            orderItem('level', `${langData['level'] || 'Level'}`);
            break;
        case 'poles':
            orderItem('poles', `${langData['poles'] || 'Poles'}`);
            break;
        case 'group':
            orderItem('group', `${langData['group'] || 'Group'}`);
            break;
        case 'status':
            orderItem('project_status', `${langData['project_status'] || 'Project Status'}`);
            break;
    }
});
function orderItem(type, title) {
    let modalEl = $('#windModal');
    let modal = new bootstrap.Modal(modalEl[0]);
    modal.show();
    modalEl.find(".modal-header").html(`
        <h5 class="modal-title">${langData['sort'] || "Sort"} • ${langData[type] || title}</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
    `);
    modalEl.find(".modal-footer").html(`
        <button type="button" class="btn btn-primary me-2 save-order-item">${langData['save'] || "Save"}</button>
        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">${langData['close'] || "Close"}</button>
    `);
    modalEl.find(".modal-body").html('<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>');
    $.ajax({
        url: `${BASE_URL}/api/sort.list`,
        method: 'POST',
        data: { type: type },
        dataType: 'json',
        success: function(res) {
            if (res.status && res.data) {
                let html = '';
                if (type === 'poles') {
                    let grouped = {};
                    res.data.forEach(item => {
                        if (!grouped[item.project_name]) {
                            grouped[item.project_name] = [];
                        }
                        grouped[item.project_name].push(item);
                    });
                    html = `
                        <table class="table table-bordered mb-0">
                            <thead>
                                <tr>
                                    <th width="50px">${langData['sort'] || "Sort"}</th>
                                    <th>${langData['pole_code'] || "Code"}</th>
                                    <th>${langData['type'] || "Type"}</th>
                                    <th>${langData['installation'] || "Installation"}</th>
                                </tr>
                            </thead>`;
                    for (let projectName in grouped) {
                        html += `
                            <tbody class="table-light">
                                <tr>
                                    <td colspan="4" class="fw-bold text-primary bg-light">
                                        <i class="fas fa-project-diagram me-2"></i>${projectName}
                                    </td>
                                </tr>
                            </tbody>
                            <tbody class="sortable-project-group" data-project="${projectName}">`;
                        grouped[projectName].forEach(item => {
                            html += `
                                <tr data-id="${item.poles_id}" style="cursor: move;">
                                    <td class="text-center"><i class="fas fa-grip-lines text-muted"></i></td>
                                    <td>${item.poles_code}</td>
                                    <td>${item.type_name}</td>
                                    <td>${item.installations_name}</td>
                                </tr>`;
                        });
                        html += `</tbody>`;
                    }
                    html += `</table>`;
                    modalEl.find(".modal-body").html(html);
                    modalEl.find('.sortable-project-group').each(function() {
                        new Sortable(this, {
                            group: {
                                name: 'group-' + $(this).data('project'),
                                put: false,
                                pull: false
                            },
                            animation: 150,
                            ghostClass: 'bg-info-subtle'
                        });
                    });
                } else {
                    let rows = '';
                    res.data.forEach((item) => {
                        rows += `
                            <tr data-id="${item.item_id || item.poles_id}" style="cursor: move;">
                                <td class="text-center" width="50px"><i class="fas fa-grip-lines"></i></td>
                                <td>${item.item_name || item.poles_code}</td>
                            </tr>`;
                    });
                    html = `
                        <table class="table table-bordered mb-0">
                            <thead>
                                <tr>
                                    <th>${langData['sort'] || "Sort"}</th>
                                    <th>${langData[type] || title}</th>
                                </tr>
                            </thead>
                            <tbody id="sortable-list-default">${rows}</tbody>
                        </table>`;
                    modalEl.find(".modal-body").html(html);
                    new Sortable(document.getElementById('sortable-list-default'), {
                        animation: 150,
                        ghostClass: 'bg-info-subtle'
                    });
                }
            } else {
                showError(langData['cannot_load']);
            }
        }
    });
    modalEl.off('click', '.save-order-item').on('click', '.save-order-item', function() {
        let orderData = [];
        let targetSelector = (type === 'poles') ? '.sortable-project-group tr' : '#sortable-list-default tr';
        $(targetSelector).each(function() {
            let id = $(this).data('id');
            if (id) orderData.push(id);
        });
        if (orderData.length === 0) return;
        let btn = $(this);
        btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span>');
        $.ajax({
            url: `${BASE_URL}/api/sort.save`,
            method: 'POST',
            data: { 
                type: type,
                order: orderData
            },
            success: function(res) {
                btn.prop('disabled', false).text(langData['save'] || "Save");
                if (res.status) {
                    showSuccess(langData['save_success'] || "Saved!");
                    modal.hide();
                    const tableMaps = {
                        'contract': typeof initContractsTable === 'function' ? initContractsTable : null,
                        'project': typeof initProjectsTable === 'function' ? initProjectsTable : null,
                        'pole_types': typeof initTypesTable === 'function' ? initTypesTable : null,
                        'installation': typeof initInstallationsTable === 'function' ? initInstallationsTable : null,
                        'level': typeof initLevelTable === 'function' ? initLevelTable : null,
                        'poles': typeof initPolesTable === 'function' ? initPolesTable : null,
                        'group': typeof initGroupTable === 'function' ? initGroupTable : null,
                        'project_status': typeof initProjectStatusTable === 'function' ? initProjectStatusTable : null
                    };
                    
                    if (tableMaps[type]) tableMaps[type]();
                }
            }
        });
    });
}
function openIconSetting(type) {
    $.ajax({
        url: `${BASE_URL}/api/windturbine.get`,
        data: { icon_type: type },
        method: 'POST',
        dataType: 'json',
        success: function(res) {
            if(res.status === true){
                let turbineData = res.data || {};
                let savedSettings = {};
                if (turbineData.zoom_level && turbineData.zoom_val) {
                    turbineData.zoom_level.forEach((z, index) => {
                        savedSettings[z] = turbineData.zoom_val[index];
                    });
                }
                let modalEl = $('#windModal');
                let modal = new bootstrap.Modal(modalEl[0]);
                modal.show();
                modalEl.find(".modal-header").html(`
                    <h5 class="modal-title">${langData['icon_settings'] || 'Icon Settings'}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                `);
                modalEl.find(".modal-footer").html(`
                    <button type="button" class="btn btn-primary btn-save-icon">Save</button>
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Close</button>
                `);
                const savedColor = turbineData.icon_color || '#ff0000';
                let zoomHtml = '';
                for (let z = 8; z <= 17; z++) {
                    let baseSize = (type === 'windturbine') ? 3 : 20;
                    let defaultSize = baseSize + (z - 8) * 2;
                    let currentSize = savedSettings[z] || defaultSize;
                    zoomHtml += `
                    <div class="mb-3 zoom-row">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <label class="d-flex align-items-center">
                                <span class="me-2">${langData['configure_zoom_level'] || 'Level'} ${z}</span>
                                <div class="preview-container" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: #f8f9fa; border-radius: 4px; border: 1px solid #eee;">
                                    <div id="previewDot${z}" class="preview-dot-colored"
                                        style="width:${currentSize}px;height:${currentSize}px;
                                            background:${type === 'windturbine' ? savedColor : 'red'};
                                            border-radius:50%">
                                    </div>
                                </div>
                            </label>
                            <span><b class="zoom-value" id="zoomVal${z}">${currentSize}</b> px</span>
                        </div>
                        <input type="range" class="form-range zoom-slider" min="1" max="100" value="${currentSize}" data-zoom="${z}">
                    </div>`;
                }
                const coverSection = (type === 'windturbine') 
                    ? `<div class="mb-4">${renderCover(turbineData, 'icon')}</div>
                       <input type="hidden" id="ex_cover" value="${turbineData.cover || ''}">`
                    : `<input type="hidden" id="ex_cover" value="">`;
                const colorSection = (type === 'windturbine') ? `
                    <div class="mb-3 p-3" style="background:#f8f9fa;border-radius:8px;border:1px solid #eee">
                        <div class="d-flex align-items-center justify-content-between mb-2">
                            <label class="fw-bold small">${langData['icon_color'] || 'Icon Color'}</label>
                            <div style="display:flex;align-items:center;gap:8px">
                                <input type="color" id="iconColorPicker" value="${savedColor}"
                                    style="width:36px;height:32px;padding:2px;border:1px solid #ddd;border-radius:6px;cursor:pointer">
                                <input type="text" id="iconColorHex" value="${savedColor}" maxlength="7"
                                    style="width:80px;font-size:12px;font-family:monospace;padding:5px 8px;border:1px solid #ddd;border-radius:6px">
                                <div id="iconColorPreview" style="width:26px;height:26px;border-radius:50%;background:${savedColor};border:1px solid #ddd;flex-shrink:0"></div>
                            </div>
                        </div>
                        <div style="display:flex;gap:7px;flex-wrap:wrap" id="colorPresets">
                            ${['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#6b7280','#ffffff','#1e293b'].map(c => `<div class="color-preset-dot" data-color="${c}" style="width:26px;height:26px;border-radius:50%;background:${c}; border:2px solid ${c === savedColor ? '#333' : 'transparent'}; cursor:pointer;transition:transform 0.15s" onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'"></div>`).join('')}
                        </div>
                    </div>
                    <input type="hidden" id="icon_color" value="${savedColor}">
                ` : '';
                const autoScaleLabel = langData['auto_scale'] || 'Auto Scale (Relative)';
                modalEl.find(".modal-body").html(`
                    <input type="hidden" id="icon_type" value="${type}">
                    <div class="container-fluid">
                        ${coverSection}
                        ${colorSection}
                        <div class="d-flex justify-content-between mb-2 mt-3">
                            <label class="fw-bold">${langData['zoom_scale'] || 'Zoom Scale (Drag)'}</label>
                            <div class="d-flex gap-2">
                                <div class="form-check form-switch me-2">
                                    <input class="form-check-input" type="checkbox" id="enableRelScale" checked>
                                    <label class="form-check-label small" for="enableRelScale">${autoScaleLabel}</label>
                                </div>
                                <button class="btn btn-sm btn-outline-primary" id="autoFill" data-type="${type}">${langData['auto'] || 'Auto'}</button>
                            </div>
                        </div>
                        <div id="zoomSliderBox">
                            ${zoomHtml}
                        </div>
                    </div>
                `);
                if (type === 'windturbine') {
                    if (typeof initCoverUpload === 'function') initCoverUpload();
                    function _applyColor(hex) {
                        $('#icon_color').val(hex);
                        $('#iconColorPicker').val(hex);
                        $('#iconColorHex').val(hex);
                        $('#iconColorPreview').css('background', hex);
                        modalEl.find('#zoomSliderBox .preview-dot-colored').css('background', hex);
                        modalEl.find('.color-preset-dot').css('border-color', 'transparent');
                        modalEl.find(`.color-preset-dot[data-color="${hex}"]`).css('border-color', '#333');
                    }
                    modalEl.find('#iconColorPicker').on('input', function() {
                        _applyColor(this.value);
                    });
                    modalEl.find('#iconColorHex').on('input', function() {
                        if (/^#[0-9a-fA-F]{6}$/.test(this.value)) _applyColor(this.value);
                    });
                    modalEl.on('click', '.color-preset-dot', function() {
                        _applyColor($(this).data('color'));
                    });
                }
                if(type === 'windturbine' && typeof initCoverUpload === 'function') initCoverUpload();
            } else {
                showError(langData['cannot_load']);
            }
        },
        error: function(){
            showError(langData['cannot_load']);
        }
    });
}
$(document).on('input', '.zoom-slider', function () {
    let currentZoom = $(this).data('zoom');
    let currentVal  = parseInt($(this).val());
    updateZoomUI(currentZoom, currentVal);
    if ($('#enableRelScale').is(':checked')) {
        $('.zoom-slider').each(function () {
            let z = $(this).data('zoom');
            if (z > currentZoom) {
                let newVal = currentVal + (z - currentZoom) * 2;
                if (newVal > 100) newVal = 100;
                $(this).val(newVal);
                updateZoomUI(z, newVal);
            }
        });
    }
});
$(document).on('click', '#autoFill', function () {
    let type = $(this).data('type');
    let base = (type === 'pole') ? 20 : 3;
    $('.zoom-slider').each(function () {
        let z = $(this).data('zoom');
        let val = base + (z - 8) * 2;
        $(this).val(val);
        updateZoomUI(z, val);
    });
});
function updateZoomUI(zoom, val) {
    $('#zoomVal' + zoom).text(val);
    $('#previewDot' + zoom).css({
        'width': val + 'px',
        'height': val + 'px'
    });
}
$(document).on('click', '.btn-save-icon', function () {
    const btn = $(".btn-save-icon");
    const type = $("#icon_type").val();
    btn.prop("disabled", true);
    let zoomData = [];
    $('.zoom-slider').each(function() {
        zoomData.push({
            zoom: $(this).data('zoom'),
            val: $(this).val()
        });
    });
    const formData = new FormData();
    formData.append("ex_cover", $("#ex_cover").val() || "");
    formData.append("icon_type", type);
    formData.append("icon_color", $('#icon_color').val() || null);
    formData.append("zoom_settings", JSON.stringify(zoomData));
    if (type === 'windturbine') {
        const fileInput = $("#cover")[0];
        if (fileInput && fileInput.files[0]) {
            formData.append("cover", fileInput.files[0]);
        }
    }
    $.ajax({
        url: `${BASE_URL}/api/windturbine.save`,
        type: "POST",
        data: formData,
        contentType: false,
        processData: false,
        dataType: "json",
        success: function (res) {
            if (res.status === true) {
                showSuccess(langData['saved_successfully'] || 'Saved!');
                $('#windModal').modal('hide');
            } else {
                showError(langData[res.message] || res.message || 'Save failed');
            }
        },
        error: function () {
            showError(langData['cannot_save']);
        },
        complete: function() {
            btn.prop("disabled", false);
        }
    });
});