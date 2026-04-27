let pages = 'document';
let tb_document;
function initDocumentTable() {
    let oldPage = 0;
    if ($.fn.DataTable.isDataTable('#tb_document')) {
        oldPage = $('#tb_document').DataTable().page();
        $('#tb_document').DataTable().destroy();
    }
    if ($.fn.DataTable.isDataTable('#tb_document')) {
        $('#tb_document').DataTable().ajax.reload(null, false);
        return;
    }
    tb_document = $('#tb_document').DataTable({
        processing: true,
        serverSide: true,
        order: [[4, 'desc']],
        ajax: { 
            url: `${BASE_URL}/api/document.list`, 
            type: "POST",
            data: function(d){
                d.date = $('#filter_date').val();
                d.status = $('#filter_status').val();
                d.contract = $('#filter_contract').val();
                d.project = $('#filter_project').val();
                d.installation = $('#filter_installations').val();
                d.pole = $('#filter_poles').val();
                d.type = $('#filter_type').val();
            }
        },
        columns: [{ 
            data: "document_name",
            orderable: true,
            className: 'align-middle',
            render: function (data, type, row) {
                const iconClass = getFileIconClass(row.document_type);
                const createBadge = (text, icon, colorClass) => {
                    if (!text) return '';
                    return `<span class="badge ${colorClass} fw-normal d-inline-flex align-items-center me-1" style="font-size: 8px; padding: 3px 6px;"><i class="${icon} me-1"></i>${text}</span>`;
                };
                let allFoldersHtml = '';
                let visibilityBadges = '';
                const hasFolders = Array.isArray(row.folder_chains) && row.folder_chains.length > 0;
                if (Array.isArray(row.folder_chains) && row.folder_chains.length > 0) {
                    allFoldersHtml = row.folder_chains.map((chain) => {
                        if (!Array.isArray(chain) || chain.length === 0) return '';
                        const breadcrumb = chain.slice().reverse().map((f, index, arr) => {
                            if (index === arr.length - 1) {
                                return `<span class="fw-semibold text-dark">${f.name}</span>`;
                            }
                            return `<span class="text-muted">${f.name}</span>`;
                        }).join(' <span class="text-secondary" style="font-size: 0.8em;">/</span> ');
                        return `
                            <div class="small mb-1 d-flex align-items-center">
                                <i class="fa-solid fa-folder-open text-warning me-1"></i>
                                <span>${breadcrumb}</span>
                            </div>
                        `;
                    }).join('');
                }
                if (hasFolders) {
                    if (row.folder_show_admin === 'yes') {
                        visibilityBadges += `
                            <span class="small badge bg-danger-subtle text-danger me-1">
                                <i class="fa-solid fa-user-shield me-1"></i><span data-i18n="admin"></span>
                            </span>`;
                    }
                    if (row.folder_show_user === 'yes') {
                        visibilityBadges += `
                            <span class="small badge bg-info-subtle text-info me-1">
                                <i class="fa-solid fa-user me-1"></i><span data-i18n="user"></span>
                            </span>`;
                    }
                }
                if (!allFoldersHtml) {
                    allFoldersHtml = ``;
                }
                return `
                    <div class="d-flex align-items-start gap-3 py-1">
                        <div class="mt-1"><i class="${iconClass} fa-2x text-secondary-light"></i></div>
                        <div class="d-flex flex-column gap-1">
                            <p class="text-truncate fw-bold" style="max-width: 400px;" title="${data}">${data}</p>
                            <div class="d-flex flex-wrap gap-1">
                                ${createBadge(row.contract_name, 'fa-solid fa-file-lines', 'bg-primary-subtle text-primary')}
                                ${createBadge(row.project_name, 'fa-solid fa-folder-tree', 'bg-info-subtle text-info')}
                                ${createBadge(row.type_name, 'fa-solid fa-tags', 'bg-secondary-subtle text-secondary')}
                                ${createBadge(row.installations_name, 'fa-solid fa-location-dot', 'bg-warning-subtle text-warning-emphasis')}
                                ${createBadge(row.poles_code, 'fa-solid fa-tower-broadcast', 'bg-dark-subtle text-dark')}
                            </div>
                            <div class="folder-visibility-container">
                                ${allFoldersHtml}
                                <div class="mt-1">${visibilityBadges}</div>
                            </div>
                        </div>
                    </div>
                    `;
            }
        },{ 
            data: null,
            orderable: true,
            className: 'align-middle text-nowrap',
            render: function(data, type, row) {
                return `<div class="lh-sm">${row.document_start || ""} - ${row.document_end || ""}</div>`;
            }
        },{ 
            data: "document_size",
            orderable: true,
            className: 'align-middle text-nowrap',
            render: function(data, type, row) {
                let size = data ? (data / (1024 * 1024)).toFixed(2) + " MB" : "-";
                return `<div class="lh-sm">
                            <small class="text-muted"><i class="fa-solid fa-database me-2"></i>${size}</small>
                        </div>`;
            }
        },{ 
            data: "document_type",
            orderable: true,
            className: 'align-middle text-nowrap',
            render: function(data, type, row) {
                let size = data ? (data / (1024 * 1024)).toFixed(2) + " MB" : "-";
                return `<div class="lh-sm">
                            <span class="badge bg-light text-dark border-0 fw-bold">${row.document_type.toUpperCase()}</span> 
                        </div>`;
            }
        },{ 
            data: "created_at",
            orderable: true,
        },{
            data: "status",
            orderable: true,
            className: 'align-middle text-center',
            render: function (status, type, row) {
                let badgeColor = status === "public" ? "success" : "secondary";
                return `
                    <div class="d-flex flex-column align-items-center gap-1">
                        <span class="badge rounded-pill bg-${badgeColor}-subtle text-${badgeColor}">${langData[status] || status}</span>
                    </div>`;
            }
        },{ 
            data: "document_download",
            orderable: true,
            className: 'text-end',
            render: function(data, type, row) {
                let size = data ? (data / (1024 * 1024)).toFixed(2) + " MB" : "-";
                return `<small class="text-muted"><i class="fa-solid fa-download me-1"></i>${row.document_download}</small>`;
            }
        },{
            data: null,
            className: 'align-middle text-end',
            render: function(row){
                return `
                    <div class="btn-group border rounded-3 bg-white">
                        <button class="btn btn-link text-secondary py-1 history-download" title="History" data-id="${row.document_id}"><i class="fa-solid fa-clock-rotate-left"></i></button>
                        <a href="${BASE_URL}/${row.document_path}" target="_blank" class="btn btn-link text-primary py-1 border-start" title="Open"><i class="fa-solid fa-folder-open"></i></a> 
                        <button class="btn btn-link text-warning py-1 border-start manage-document" title="Edit" data-id="${row.document_id}"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="btn btn-link text-danger py-1 border-start delete-document" title="Delete" data-id="${row.document_id}"><i class="fa-regular fa-trash-can"></i></button>
                    </div>`;
            }
        }],
        pageLength: pageLength,
        lengthMenu: lengthMenu,
        stateLoadParams: function (settings, data) {
            data.start = oldPage;
            data.length = pageLength; 
        },
        language: getTableLang(),
        initComplete: function() {
            let self = this.api();
            let $filter = $('#tb_document_filter');
            if ($filter.find('.manage-document').length === 0) {
                let btn = `
                    <button class="btn btn-primary btn-sm manage-document ms-2" data-id="">
                        <i class="fa-solid fa-plus me-2"></i><span>${langData['document'] || 'Document'}</span>
                    </button>
                `;
                $filter.append(btn);
            }
            let $input = $filter.find('input').unbind();
            $input.bind('keypress', function(e) {
                if (e.keyCode == 13) {
                    self.search(this.value).draw();
                }
            });
        },
        drawCallback: function(){
            getTableLang();
        }
    });
}
$('.filter').on('change', function () {
    initDocumentTable();
});
async function initDocument() {
    initDocumentTable(); 
}
$(document).ready(function () {
    initTable();
    $(".nav-link").click(function() {
        let p = $(this).data("page");
        pages = p;
        initTable();
    });
});
function initTable() {
     switch(pages) {
        case 'document':
            initSelect2Remote('#filter_contract', `${BASE_URL}/api/document.filter`, { type: 'contract' });
            initSelect2Remote('#filter_project', `${BASE_URL}/api/document.filter`, { type: 'project' });
            initSelect2Remote('#filter_type', `${BASE_URL}/api/document.filter`, { type: 'type' });
            initSelect2Remote('#filter_installations', `${BASE_URL}/api/document.filter`, { type: 'installation' });
            initSelect2Remote('#filter_poles', `${BASE_URL}/api/document.filter`, { type: 'pole' });
            initSelect2Remote('#filter_status', `${BASE_URL}/api/document.filter`, { type: 'status' });
            initDateRangePicker('#filter_date', initDocumentTable);
            initDocumentTable();
            break;
        case 'history':
            initSelect2Remote('#filter_history_document', `${BASE_URL}/api/document.filter`, { type: 'document' });
            initSelect2Remote('#filter_history_member', `${BASE_URL}/api/member.filter`, { type: 'member' });
            initSelect2Remote('#filter_history_device', `${BASE_URL}/api/member.filter`, { type: 'device' });
            initSelect2Remote('#filter_history_browser', `${BASE_URL}/api/member.filter`, { type: 'browser' });
            initDateRangePicker('#filter_history_date', initHistoryTable);
            initHistoryTable();
            break;
    }
}
$(document).on('click', '.manage-document', function () {
    const document_id = $(this).data("id");
    const isEdit = !!document_id;
    $.ajax({
        url: `${BASE_URL}/api/document.info`,
        method: 'POST',
        data: { id: document_id },
        dataType: 'json',
        success: function (res) {
            if (res.status !== 'success') {
                showError(langData['cannot_load']);
                return;
            }
            const docData = res.data;
            const modalEl = $('#windModal');
            const modal = new bootstrap.Modal(modalEl[0]);
            renderModalContent(modalEl, document_id, isEdit, docData);
            initPlugins();
            const toggleNotification = () => {
                const currentStatus = $('#status').val();
                if (currentStatus === 'public') {
                    $('#notification_section').slideDown();
                } else {
                    $('#notification_section').slideUp();
                }
            };
            $(document).off('change', '#status').on('change', '#status', toggleNotification);
            if (docData) {
                fillDocumentData(docData);
                toggleNotification();
            }
            modal.show();
        },
        error: () => showError(langData['cannot_load'])
    });
});
function renderModalContent(modalEl, document_id, isEdit, d) {
    modalEl.find(".modal-header").html(`
        <h5 class="modal-title">${langData['manageDocument'] || 'Manage Document'}</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
    `);
    modalEl.find(".modal-footer").html(`
        <button type="submit" class="btn btn-primary me-2 save-document">${langData['save'] || "Save"}</button>
        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">${langData['close'] || "Close"}</button>
    `);
    modalEl.find(".modal-body").html(`
        <input type="hidden" id="mode" value="${document_id ? 'edit' : 'new'}">
        <input type="hidden" name="document_id" id="document_id" value="${document_id ?? ''}">
        <div class="mb-3">
            <label class="mb-2 required">${langData['uploadFile'] || 'Upload File'}</label>
            <div id="drop_zone" class="border rounded-3 p-4 text-center" style="cursor:pointer; border-style:dashed;">
                <div id="drop_text">
                    <i class="fa-solid fa-folder-open fa-4x text-warning"></i>
                    <p class="mb-0 mt-2 text-muted">${langData['drop_here'] || 'Drop here or click to browse'}</p>
                </div>
                <div id="file_preview" class="mt-3 d-none"></div>
                <div id="drop_button">
                    <button class="btn btn-primary mt-2" type="button" id="btn_select_file">${langData['choose'] || 'Choose'}</button>
                    <input type="file" class="d-none obj-required" id="document_file" accept=".ppt,.pptx,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif,.webp">
                </div>
            </div>
        </div>
        <div class="mb-3">
            <label class="mb-2 required">${langData['documentName'] || 'Document Name'}</label>
            <input type="text" class="form-control obj-required" id="document_name" maxlength="255">
        </div>
        <div class="row">
            <div class="col-md-6 mb-3">
                <label class="mb-2 required">${langData['fileType'] || 'File Type'}</label>
                <input type="text" class="form-control obj-required" id="document_type" readonly>
            </div>
            <div class="col-md-6 mb-3">
                <label class="mb-2 required">${langData['fileSize'] || 'File Size'}</label>
                <input type="text" class="form-control obj-required" id="document_size" readonly>
            </div>
        </div>
        <div class="row">
            <div class="col-md-6 mb-3">
                <label class="mb-2">${langData['startDate'] || 'Start Date'}</label>
                <input type="text" class="form-control" id="document_start">
            </div>
            <div class="col-md-6 mb-3">
                <label class="mb-2">${langData['endDate'] || 'End Date'}</label>
                <input type="text" class="form-control" id="document_end">
            </div>
        </div>
        <div class="row">
            <div class="col-md-6 mb-3"><label class="mb-2">${langData['contract']}</label><select id="contract" class="form-select"></select></div>
            <div class="col-md-6 mb-3"><label class="mb-2">${langData['project']}</label><select id="project" class="form-select"></select></div>
        </div>
        <div class="row">
            <div class="col-md-6 mb-3"><label class="mb-2">${langData['wind_measurement_equipment']}</label><select id="type" class="form-select"></select></div>
            <div class="col-md-6 mb-3"><label class="mb-2">${langData['installation']}</label><select id="installation" class="form-select"></select></div>
        </div>
        <div class="row">
            <div class="col-md-6 mb-3"><label class="mb-2">${langData['poles']}</label><select id="pole" class="form-select"></select></div>
            <div class="col-md-6 mb-3">
                <label class="mb-2 required">${langData['status'] || 'Status'}</label>
                <select id="status" class="form-select obj-required"></select>
            </div>
        </div>
        <hr class="my-4">
        <label class="mb-2 mt-3">
            <i class="fa-solid fa-folder-tree me-2"></i>
            ${langData['folder'] || 'Folder'}
        </label>
        <div class="mb-3 p-2">
            <label class="fw-bold mb-2" data-i18n="save_to_a_folder"></label>
            <div class="d-flex gap-3">
                <div class="form-check">
                    <input class="form-check-input" type="radio" name="use_folder_toggle" id="use_folder_no" value="no" 
                        ${(!d.folder_id || (Array.isArray(d.folder_id) && d.folder_id.length === 0)) ? 'checked' : ''}>
                    <label class="form-check-label" for="use_folder_no" data-i18n="use_folder_no"></label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="radio" name="use_folder_toggle" id="use_folder_yes" value="yes" 
                        ${(Array.isArray(d.folder_id) && d.folder_id.length > 0) ? 'checked' : ''}>
                    <label class="form-check-label" for="use_folder_yes" data-i18n="use_folder_yes"></label>
                </div>
            </div>
        </div>
        <div id="folder_tree_wrapper" style="${!d.folder_id || (Array.isArray(d.folder_id) && d.folder_id.length === 0) ? 'display:none;' : ''}">
            <div class="border rounded p-3 bg-white" style="max-height:300px; overflow:auto;">
                ${renderFolderTree(d.folders, d.folder_id)}
            </div>
            <div class="row mt-3">
                <div class="col-12 mb-2">
                    <div class="form-check form-switch">
                        <input class="form-check-input switch-item" type="checkbox" id="folder_show_all" ${d.folder_show_admin == 'yes' && d.folder_show_user == 'yes' ? 'checked' : ''}>
                        <label class="form-check-label fw-bold text-dark" for="folder_show_all">
                            <i class="fa-solid fa-check-double me-2 text-dark"></i>
                            ${langData['select_all'] || 'Select All'}
                        </label>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-check form-switch">
                        <input class="form-check-input switch-item" type="checkbox" id="folder_show_admin" ${d.folder_show_admin == 'yes' ? 'checked' : ''}>
                        <label class="form-check-label fw-bold" for="folder_show_admin">
                            <i class="fa-solid fa-user-shield me-2 text-primary"></i>
                            ${langData['show_project_admin'] || 'Show in Project (Admin)'}
                        </label>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-check form-switch">
                        <input class="form-check-input switch-item" type="checkbox" id="folder_show_user" ${d.folder_show_user == 'yes' ? 'checked' : ''}>
                        <label class="form-check-label fw-bold" for="folder_show_user">
                            <i class="fa-solid fa-users me-2 text-success"></i>
                            ${langData['show_project_user'] || 'Show in Project (User)'}
                        </label>
                    </div>
                </div>
            </div>
        </div>
        <div id="notification_section" style="display:none;">
            <hr class="my-4">
            <div class="card bg-light border-0">
                <div class="card-body">
                    <h6 class="card-title fw-bold text-dark"><i class="fa-solid fa-bell me-2"></i>${langData['notification_settings']}</h6>
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="send_notification">
                        <label class="form-check-label" for="send_notification">
                            ${isEdit ? langData['send_update'] : langData['send_publishing']}
                        </label>
                    </div>
                    <small class="text-muted d-block mt-1">${langData['if_enabled']}</small>
                </div>
            </div>
        </div>
    `);
}
$(document).on('change', '#folder_show_all', function() {
    const isChecked = $(this).is(':checked');
    $('#folder_show_admin, #folder_show_user').prop('checked', isChecked);
});
$(document).on('change', '#folder_show_admin, #folder_show_user', function() {
    const isAdminChecked = $('#folder_show_admin').is(':checked');
    const isUserChecked = $('#folder_show_user').is(':checked');
    $('#folder_show_all').prop('checked', isAdminChecked && isUserChecked);
});
$(document).on('change', 'input[name="use_folder_toggle"]', function() {
    const useFolder = $(this).val() === 'yes';
    if (useFolder) {
        $('#folder_tree_wrapper').slideDown(200);
    } else {
        $('#folder_tree_wrapper').slideUp(200);
        $('input[name="folder_id"]').prop('checked', false);
    }
});
function renderFolderTree(folders, selectedIds = [], level = 0) {
    if (!folders || !folders.length) return '';
    const selectedArray = Array.isArray(selectedIds) ? selectedIds : [selectedIds];
    let html = '';
    folders.forEach(f => {
        const indent = level * 20;
        const hasChildren = f.children && f.children.length > 0;
        const isChildSelected = (items) => {
            return items?.some(child => 
                selectedArray.includes(child.id.toString()) || 
                selectedArray.includes(Number(child.id)) || 
                isChildSelected(child.children)
            );
        };
        const isCurrentSelected = selectedArray.includes(f.id.toString()) || selectedArray.includes(Number(f.id));
        const shouldExpand = (isCurrentSelected || isChildSelected(f.children));
        html += `
            <div class="folder-item-container">
                <div class="form-check d-flex align-items-center" style="margin-left:${indent}px; min-height: 32px;">
                    <span class="toggle-icon me-2" style="cursor:pointer; width: 20px; display: inline-block; text-align: center;" onclick="toggleFolder(this, 'child_container_${f.id}')">
                        ${hasChildren ? `<i class="fa-solid ${shouldExpand ? 'fa-square-minus' : 'fa-square-plus'} text-secondary"></i>` : ''}
                    </span>
                    <input class="form-check-input me-2" type="checkbox" name="folder_id[]" value="${f.id}" id="folder_${f.id}" ${isCurrentSelected ? 'checked' : ''} style="margin-left: 0; cursor: pointer;">        
                    <label class="form-check-label" for="folder_${f.id}" style="cursor: pointer;">
                        ${level === 0 
                            ? `<i class="fa-solid fa-folder-tree text-primary me-1"></i>` 
                            : `<i class="fa-solid fa-folder text-warning me-1"></i>`}
                        ${f.name}
                    </label>
                </div>
                ${hasChildren ? `
                    <div id="child_container_${f.id}" class="folder-children" style="display: ${shouldExpand ? 'block' : 'none'};">
                        ${renderFolderTree(f.children, selectedArray, level + 1)}
                    </div>
                ` : ''}
            </div>
        `;
    });
    return html;
}
function toggleFolder(element, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const isHidden = container.style.display === 'none';
    container.style.display = isHidden ? 'block' : 'none';
    const icon = element.querySelector('i');
    if (isHidden) {
        icon.classList.replace('fa-square-plus', 'fa-square-minus');
    } else {
        icon.classList.replace('fa-square-minus', 'fa-square-plus');
    }
}
function initPlugins() {
    const filters = ['contract', 'project', 'type', 'installation', 'pole', 'status'];
    filters.forEach(f => initSelect2Remote(`#${f}`, `${BASE_URL}/api/document.filter`, { type: f }));
    initDatePicker('#document_start');
    initDatePicker('#document_end');
}
function fillDocumentData(docData) {
    $("#document_id").val(docData.document_id);
    $("#document_name").val(docData.document_name);
    if (docData.document_start) $('#document_start').datepicker('setDate', new Date(docData.document_start));
    if (docData.document_end) $('#document_end').datepicker('setDate', new Date(docData.document_end));
    if (docData.document_path) {
        handleFile({
            name: docData.document_file_name,
            size: docData.document_size,
            type: docData.document_type,
        }, 'edit');
        $("#document_file").removeClass("obj-required");
    }
    const mapSelect2 = [
        { id: '#contract', val: docData.contract_id, text: docData.contract_name },
        { id: '#project', val: docData.project_id, text: docData.project_name },
        { id: '#type', val: docData.type_id, text: docData.type_name },
        { id: '#installation', val: docData.installations_id, text: docData.installations_name },
        { id: '#pole', val: docData.poles_id, text: docData.poles_code },
        { id: '#status', val: docData.status, text: docData.status ? (docData.status.charAt(0).toUpperCase() + docData.status.slice(1)) : '' }
    ];
    mapSelect2.forEach(item => {
        if (item.val) {
            $(item.id).append(new Option(item.text, item.val, true, true)).trigger('change');
        }
    });
}
$(document).on('change', '#contract, #filter_contract, #project, #filter_project, #type, #filter_type, #installation, #filter_installations', function() {
    const $this = $(this);
    const id = $this.attr('id');
    const val = $this.val();
    const isFilter = id.startsWith('filter_');
    const prefix = isFilter ? '#filter_' : '#';
    const getVal = (target) => $(prefix + target).val();
    if (id.includes('contract')) {
        $(`${prefix}project, ${prefix}type, ${prefix}installation, ${prefix}pole`).val(null).trigger('change.select2');
        initSelect2Remote(`${prefix}project`, `${BASE_URL}/api/document.filter`, { 
            type: 'project', 
            contract_id: val 
        });
    } else if (id.includes('project')) {
        $(`${prefix}type, ${prefix}installation, ${prefix}pole`).val(null).trigger('change.select2');
        initSelect2Remote(`${prefix}type`, `${BASE_URL}/api/document.filter`, { 
            type: 'type', 
            contract_id: getVal('contract'),
            project_id: val 
        });
    } else if (id.includes('type')) {
        $(`${prefix}installation, ${prefix}pole`).val(null).trigger('change.select2');
        initSelect2Remote(`${prefix}installation`, `${BASE_URL}/api/document.filter`, { 
            type: 'installation', 
            contract_id: getVal('contract'),
            project_id: getVal('project'),
            type_id: val
        });
    } else if (id.includes('installation')) {
        $(`${prefix}pole`).val(null).trigger('change.select2');
        initSelect2Remote(`${prefix}pole`, `${BASE_URL}/api/document.filter`, { 
            type: 'pole', 
            contract_id: getVal('contract'),
            project_id: getVal('project'),
            type_id: getVal('type'),
            installation_id: val
        });
    }
});
function validateDates() {
    let startStr = $('#document_start').val();
    let endStr = $('#document_end').val();
    if (!startStr || !endStr) return;
    let startDate = moment(startStr, "DD/MM/YYYY");
    let endDate = moment(endStr, "DD/MM/YYYY");
    if (endDate.isBefore(startDate)) {
        showWarning(langData['validation_date'] || 'End date cannot be earlier than start date.');
        $('#document_end').val('');
        if ($('#document_end').data('datepicker')) {
            $('#document_end').datepicker('clearDates');
        }
    }
}
$(document).on("change", "#document_start, #document_end", function () {
    validateDates();
});
$(document).on("click", "#btn_select_file", function () {
    $("#document_file").trigger("click");
});
function handleFile(file, mode = 'edit') {
    if (!file) return;
    const validExt = ["ppt","pptx","pdf","doc","docx", "xls", "xlsx", "txt", "zip", "rar", "jpg", "jpeg", "png", "gif", "webp"];
    const ext = file.name.split(".").pop().toLowerCase();
    if (!file.type.startsWith("image/") && !validExt.includes(ext)) {
        showWarning(langData['support_file'] || 'Supports .ppt, .pptx, .pdf, .doc, .docx, .xls, .xlsx, .txt, .zip, .rar, .jpg, .jpeg, .png, .gif, .webp only.)');
        input.value = "";
        return;
    } 
    let baseName = file.name.replace(/\.[^/.]+$/, "");
    baseName = baseName.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
    if (mode === 'new' ||  $("#document_name").val() === "") {
        $("#document_name").val(baseName);
    }
    const type = file.name.split(".").pop().toLowerCase();
    $("#document_type").val(type);
    $("#document_size").val(readableSize(file.size));
    $("#drop_text").addClass("d-none");
    $("#drop_button").addClass("d-none");
    const iconClass = getFileIconClass(ext);
    $("#file_preview").removeClass("d-none").html(`
        <div class="justify-content-between align-items-center p-2"> 
            <i class="${iconClass} fa-4x"></i>
            <div class="mt-2">
                <strong>${file.name}</strong> 
                <br><small>${readableSize(file.size)}</small>
            </div>
            <div class="mt-2">
                <button class="btn btn-primary btn-sm" type="button" id="btn_select_file">${langData['choose'] || 'Choose'}</button>
                <button type="button" class="btn btn-sm btn-danger" id="remove_file">
                    <span>${langData['remove'] || 'Remove'}</span>
                </button>
            </div>
        </div>
    `);
}
$(document).on("click", "#remove_file", function () {
    const mode = $("#mode").val() || 'new';
    $("#document_file").val("");
    $("#file_preview").addClass("d-none").html("");
    $("#drop_text").removeClass("d-none");
    $("#drop_button").removeClass("d-none");
    $("#document_name").val("");
    $("#document_type").val("");
    $("#document_size").val("");
    $("#document_file").addClass("obj-required");
});
$(document).on("change", "#document_file", function (e) {
    const file = e.target.files[0];
    const mode = $("#mode").val() || 'new';
    handleFile(file, mode);
});
$(document).on("dragover", "#drop_zone", function(e){
    e.preventDefault();
});
$(document).on("drop", "#drop_zone", function(e){
    e.preventDefault();
    const file = e.originalEvent.dataTransfer.files[0];
    $("#document_file")[0].files = e.originalEvent.dataTransfer.files;
    const mode = $("#mode").val() || 'new';
    handleFile(file, mode);
});
$(document).on('click', '.save-document', function () {
    let errors = [];
    $('.obj-required').each(function () {
        let value = $(this).val()?.trim() || '';
        if (!value) {
            $(this).addClass('is-invalid');
            errors.push(this.name || this.id);
        } else {
            $(this).removeClass('is-invalid');
        }
    });
    if (errors.length) {
        showWarning(langData['required_star_message'] || 'Please fill all fields marked with *');
        $('.is-invalid').first().focus();
        return;
    }
    const isNotify = $("#send_notification").is(":checked");
    if (isNotify) {
        Swal.fire({
            title: langData['send_notification'],
            text: langData['success_record'],
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: langData['save_and_notify']
        }).then((result) => { if (result.isConfirmed) executeSave(); });
    } else {
        executeSave();
    }
});
function executeSave() {
    const btn = $(".save-document");
    btn.prop("disabled", true);
    const formData = new FormData();
    formData.append("document_id", $("#document_id").val() || "");
    formData.append("document_name", $("#document_name").val() || "");
    formData.append("document_start", $("#document_start").val());
    formData.append("document_end", $("#document_end").val());
    formData.append("status", $("#status").val());
    formData.append("contract_id", $("#contract").val() || "");
    formData.append("project_id", $("#project").val() || "");
    formData.append("type_id", $("#type").val() || "");
    formData.append("installations_id", $("#installation").val() || "");
    formData.append("poles_id", $("#pole").val() || "");
    formData.append("status", $("#status").val() || "");
    const file = $("#document_file")[0].files[0];
    if (file) {
        formData.append("document_file", file);
    }
    formData.append("send_notification", $("#send_notification").is(":checked") ? 'yes' : 'no');
    const useFolder = $('input[name="use_folder_toggle"]:checked').val();
    let folder_show_admin = 'no';
    let folder_show_user = 'no';
    if (useFolder === 'yes') {
        const selectedFolders = $('input[name="folder_id[]"]:checked');  
        if (selectedFolders.length > 0) {
            selectedFolders.each(function() {
                formData.append('folder_id[]', $(this).val());
            });
            folder_show_admin = $('#folder_show_admin').is(':checked') ? 'yes' : 'no';
            folder_show_user  = $('#folder_show_user').is(':checked') ? 'yes' : 'no';
        } else {
            formData.append('folder_id[]', ''); 
        }
    } else {
        formData.append('folder_id[]', '');
    }
    formData.append("folder_show_admin", folder_show_admin);
    formData.append("folder_show_user", folder_show_user);
    Swal.fire({
        title: langData['uploading'] || 'Uploading...',
        html: `
            <p>${langData['do_not_close'] || 'Please do not close this window.'}</p>
            <div class="progress mt-2">
                <div id="swal-progress" class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width:0%">0%</div>
            </div>
        `,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });
    $.ajax({
        url: `${BASE_URL}/api/document.save`,
        type: "POST",
        data: formData,
        contentType: false,
        processData: false,
        xhr: function () {
            let xhr = new window.XMLHttpRequest();
            xhr.upload.addEventListener("progress", function (e) {
                if (e.lengthComputable) {
                    let percent = Math.round((e.loaded / e.total) * 100);
                    let bar = document.getElementById("swal-progress");
                    if (bar) {
                        bar.style.width = percent + "%";
                        bar.innerText = percent + "%";
                    }
                }
            });
            return xhr;
        },
        success: function (res) {
            Swal.close();
            btn.prop("disabled", false);
            if (res.status === true) {
                showSuccess(langData['saved_successfully']);
                if (typeof initDocumentTable === "function") initDocumentTable();
                $("#document_id").val(res.document_id);
            } else {
                showError((langData['cannot_save'] || 'Error: ') + (res.message || 'Unknown error'));
            }
        },
        error: function (xhr, status, error) {
            Swal.close();
            btn.prop("disabled", false);
            let msg = langData['cannot_save'];
            try {
                let res = JSON.parse(xhr.responseText);
                if (res.message) msg += ": " + res.message;
            } catch (e) {}
            showError(msg);
        },
        complete: function() {
            btn.prop("disabled", false);
        }
    });
}
$(document).on('click', '.delete-document', function() {
    let document_id = $(this).data("id");
    showConfirm(langData['confirm'], langData['confirm_delete'], function(){
        $.ajax({
            url: `${BASE_URL}/api/document.delete`,
            method: 'POST',
            data: { id: document_id },
            dataType: 'json',
            success: function(res) {
                if(res.status === true){
                    showSuccess(langData['deleted_successfully']);
                    initDocumentTable();
                } else {
                    showError(langData['cannot_delete']);
                }   
            },
            error: function(){
                showError(langData['cannot_delete']);
            }
        });
    });
});
$(document).on('click', '.history-download', function(){
    const document_id = $(this).data("id");
    let modalEl = $('#windModal');
    let modal = new bootstrap.Modal(modalEl[0]);
    modal.show();
    modalEl.find(".modal-header").html(`
        <h5 class="modal-title">${langData['download_history'] || 'Download History'}</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
    `);
    modalEl.find(".modal-body").html(`
        <div class="alert alert-info">
            <span>${langData['total_downloads'] || 'Total Downloads'}</span>: <strong id="total_downloads">0</strong>
        </div>
        <table id="downloadHistoryTable" class="table table-striped w-100">
            <thead>
                <tr>
                    <th>#</th>
                    <th>${langData['member'] || 'Member'}</th>
                    <th>${langData['date'] || 'Date'}</th>
                    <th>${langData['device'] || 'Device'}</th>
                    <th>${langData['browsers'] || 'Browser'}</th>
                </tr>
            </thead>
        </table>
    `);
    modalEl.find(".modal-footer").html(`
        <button class="btn btn-outline-secondary" data-bs-dismiss="modal">${langData['close'] || "Close"}</button>
    `);
    loadDownloadHistory(document_id);
});
function loadDownloadHistory(document_id){
    $('#downloadHistoryTable').DataTable({
        destroy: true,
        processing: true,
        serverSide: true,
        order: [[2, 'desc']],
        ajax: {
            url: `${BASE_URL}/api/document.history`,
            type: "POST",
            data: function(d){
                d.document_id = document_id;
                d.start_date = $("#filter_start").val();
                d.end_date = $("#filter_end").val();
            }
        },
        columns: [{
            data: null,
            render: function (data, type, row, meta) {
                return meta.row + meta.settings._iDisplayStart + 1;
            }
        },{ 
            data: "member_name",
            orderable: true, 
        },{ 
            data: "download_date",
            orderable: true, 
        }, { 
            data: "device_os",
            className: 'align-middle',
            render: function(data) {
                let icon = 'fa-laptop', color = 'text-secondary';
                if(data === 'Windows') { icon = 'fa-brands fa-windows'; color = 'text-primary'; }
                else if(data === 'Android') { icon = 'fa-brands fa-android'; color = 'text-success'; }
                else if(data.includes('iPhone') || data.includes('iPad')) { icon = 'fa-solid fa-mobile-screen'; color = 'text-dark'; }
                else if(data === 'Mac OS') { icon = 'fa-brands fa-apple'; color = 'text-dark'; }
                
                return `<span class="${color} fw-medium"><i class="${icon} me-2"></i>${data}</span>`;
            }
        },
        { 
            data: "device_browser",
            className: 'align-middle',
            render: function(data) {
                let bIcon = 'fa-globe';
                if(data === 'Chrome') bIcon = 'fa-brands fa-chrome text-warning';
                else if(data === 'Firefox') bIcon = 'fa-brands fa-firefox text-danger';
                else if(data === 'Safari') bIcon = 'fa-brands fa-safari text-info';
                return `<span class="text-muted small"><i class="${bIcon} me-1"></i>${data}</span>`;
            }
        }],
        pageLength: pageLength,
        lengthMenu: lengthMenu,
        language: getTableLang(),
        drawCallback: function(settings){
            $("#total_downloads").text(settings.json.recordsTotal);
        }
    });
}
$('.filter-history').on('change', function () {
    initHistoryTable();
});
let tb_history;
function initHistoryTable() {
    let oldPage = 0;
    if ($.fn.DataTable.isDataTable('#tb_history')) {
        oldPage = $('#tb_history').DataTable().page();
        $('#tb_history').DataTable().destroy();
    }
    tb_history = $('#tb_history').DataTable({
        processing: true,
        serverSide: true,
        order: [[2, 'desc']],
        ajax: { 
            url: `${BASE_URL}/api/download.history`, 
            type: "POST",
            data: function(d){
                d.date = $('#filter_history_date').val();
                d.document = $('#filter_history_document').val();
                d.member = $('#filter_history_member').val();
                d.device = $('#filter_history_device').val();
                d.browser = $('#filter_history_browser').val();
            }
        },
        columns: [
            { 
                data: "document_name",
                className: 'align-middle',
                render: function (data, type, row) {
                    const iconClass = typeof getFileIconClass === 'function' ? getFileIconClass(row.document_type) : 'fa-file';
                    return `
                        <div class="d-flex align-items-center gap-3">
                            <i class="${iconClass} fa-2x text-secondary"></i>
                            <div class="d-flex flex-column">
                                <span class="fw-bold text-dark">${data}</span>
                            </div>
                        </div>`;
                }
            },
            { 
                data: null,
                className: 'align-middle',
                render: function(row) {
                    return `
                        <div class="d-flex align-items-center">
                            <div class="symbol symbol-30px symbol-circle bg-primary-subtle d-flex align-items-center justify-content-center me-2" style="width:30px; height:30px; border-radius:50%">
                                <i class="fa fa-user text-primary" style="font-size:10px"></i>
                            </div>
                            <span class="fw-semibold text-gray-800">${row.first_name} ${row.last_name}</span>
                        </div>`;
                }
            },
            { 
                data: "download_date",
                className: 'align-middle text-nowrap',
                render: data => `<small class="text-muted"><i class="fa-solid fa-clock me-1"></i>${data}</small>`
            },
            { 
                data: "device_os",
                className: 'align-middle',
                render: function(data) {
                    let icon = 'fa-laptop', color = 'text-secondary';
                    if(data === 'Windows') { icon = 'fa-brands fa-windows'; color = 'text-primary'; }
                    else if(data === 'Android') { icon = 'fa-brands fa-android'; color = 'text-success'; }
                    else if(data.includes('iPhone') || data.includes('iPad')) { icon = 'fa-solid fa-mobile-screen'; color = 'text-dark'; }
                    else if(data === 'Mac OS') { icon = 'fa-brands fa-apple'; color = 'text-dark'; }
                    
                    return `<span class="${color} fw-medium"><i class="${icon} me-2"></i>${data}</span>`;
                }
            },
            { 
                data: "device_browser",
                className: 'align-middle',
                render: function(data) {
                    let bIcon = 'fa-globe';
                    if(data === 'Chrome') bIcon = 'fa-brands fa-chrome text-warning';
                    else if(data === 'Firefox') bIcon = 'fa-brands fa-firefox text-danger';
                    else if(data === 'Safari') bIcon = 'fa-brands fa-safari text-info';
                    return `<span class="text-muted small"><i class="${bIcon} me-1"></i>${data}</span>`;
                }
            }
        ],
        pageLength: pageLength,
        lengthMenu: lengthMenu,
        stateLoadParams: function (settings, data) {
            data.start = oldPage;
            data.length = pageLength; 
        },
        language: getTableLang(),
        initComplete: function() {
            let $filter = $('#tb_history_filter');
            let self = this.api();
            let $input = $filter.find('input').unbind();
            $input.bind('keypress', function(e) {
                if (e.keyCode == 13) {
                    self.search(this.value).draw();
                }
            });
        },
        drawCallback: function(){
            getTableLang();
        }
    });
}