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
        ordering: false,
        order: [[2, 'desc']],
        ajax: { 
            url: "api/document/list", 
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
            className: 'align-middle',
            render: function (data, type, row) {
                const iconClass = getFileIconClass(row.document_type);
                const createBadge = (text, icon, colorClass) => {
                    if (!text) return '';
                    return `<span class="badge ${colorClass} fw-normal d-inline-flex align-items-center me-1" style="font-size: 10px; padding: 3px 6px;"><i class="${icon} me-1"></i>${text}</span>`;
                };
                return `
                    <div class="d-flex align-items-start gap-3 py-1">
                        <div class="mt-1"><i class="${iconClass} fa-2x text-secondary-light"></i></div>
                        <div class="d-flex flex-column gap-1">
                            <h6 class="text-truncate fw-bold" style="max-width: 400px;" title="${data}">${data}</h6>
                            <div class="d-flex flex-wrap gap-1">
                                ${createBadge(row.contract_name, 'fa-solid fa-file-lines', 'bg-primary-subtle text-primary')}
                                ${createBadge(row.project_name, 'fa-solid fa-folder-tree', 'bg-info-subtle text-info')}
                                ${createBadge(row.type_name, 'fa-solid fa-tags', 'bg-secondary-subtle text-secondary')}
                                ${createBadge(row.installations_name, 'fa-solid fa-location-dot', 'bg-warning-subtle text-warning-emphasis')}
                                ${createBadge(row.poles_code, 'fa-solid fa-tower-broadcast', 'bg-dark-subtle text-dark')}
                            </div>
                        </div>
                    </div>`;
            }
        },{ 
            data: "created_at",
            className: 'align-middle',
            render: function(data, type, row) {
                return `<div class="lh-sm">
                            <small class="text-dark fw-semibold"><i class="fa-regular fa-calendar-check me-1"></i>${data}</small><br>
                            <small class="text-muted" style="font-size: 11px;"><span>${langData['range'] || 'Range'}</span>: ${row.document_start} - ${row.document_end}</small>
                        </div>`;
            }
        },{ 
            data: "document_size",
            className: 'align-middle text-nowrap',
            render: function(data, type, row) {
                let size = data ? (data / (1024 * 1024)).toFixed(2) + " MB" : "-";
                return `<div class="lh-sm">
                            <span class="badge bg-light text-dark border-0 fw-bold">${row.document_type.toUpperCase()}</span> 
                            <small class="text-muted"><i class="fa-solid fa-database"></i> ${size}</small> <small class="text-muted"><i class="fa-solid fa-download me-1"></i>${row.document_download}</small>
                        </div>`;
            }
        },{
            data: "status",
            className: 'align-middle text-center',
            render: function (status, type, row) {
                let badgeColor = status === "public" ? "success" : "secondary";
                return `
                    <div class="d-flex flex-column align-items-center gap-1">
                        <span class="badge rounded-pill bg-${badgeColor}-subtle text-${badgeColor}">${langData[status] || status}</span>
                    </div>`;
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
                        <i class="fa-solid fa-plus"></i> <span>${langData['document'] || 'Document'}</span>
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
    initDocument();
    initSelect2Remote('#filter_contract', `${BASE_URL}/api/document/filter`, { type: 'contract' });
    initSelect2Remote('#filter_project', `${BASE_URL}/api/document/filter`, { type: 'project' });
    initSelect2Remote('#filter_type', `${BASE_URL}/api/document/filter`, { type: 'type' });
    initSelect2Remote('#filter_installations', `${BASE_URL}/api/document/filter`, { type: 'installation' });
    initSelect2Remote('#filter_poles', `${BASE_URL}/api/document/filter`, { type: 'pole' });
    initSelect2Remote('#filter_status', `${BASE_URL}/api/document/filter`, { type: 'status' });
    initDateRangePicker('#filter_date', initDocumentTable);
});
$(document).on('click', '.manage-document', function () {
    let document_id = $(this).data("id");
    $.ajax({
        url: `${BASE_URL}/api/document/get`,
        method: 'POST',
        data: { id: document_id },
        dataType: 'json',
        success: function(res){
            if (res.status === 'success') {
                let docData = res.data;
                let modalEl = $('#windModal');
                let modal = new bootstrap.Modal(modalEl[0]);
                modal.show();
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
                                <div>${langData['dropHere'] || 'Drag & Drop file here'}</div>
                                <div>— <span>${langData['or'] || 'Or'}</span> —</div>
                            </div>
                            <div id="file_preview" class="mt-3 d-none"></div>
                            <div id="drop_button">
                                <button class="btn btn-primary mt-2" type="button" id="btn_select_file">${langData['choose'] || 'Choose'}</button>
                                <input type="file" class="d-none obj-required" id="document_file">
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
                        <div class="col-md-12 mb-3">
                            <small class="text-muted">${langData['file_remark'] || 'File Remark'}</small>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="mb-2 required">${langData['startDate'] || 'Start Date'}</label>
                            <input type="text" class="form-control obj-required" id="document_start">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="mb-2 required">${langData['endDate'] || 'End Date'}</label>
                            <input type="text" class="form-control obj-required" id="document_end">
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="mb-2">${langData['contract'] || 'Contract'}</label>
                            <select id="contract" class="form-select"></select>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="mb-2">${langData['project'] || 'Project'}</label>
                            <select id="project" class="form-select"></select>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="mb-2">${langData['pole_types'] || 'Pole Types'}</label>
                            <select id="type" class="form-select"></select>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="mb-2">${langData['installation'] || 'Installation'}</label>
                            <select id="installation" class="form-select"></select>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="mb-2">${langData['pole'] || 'Pole'}</label>
                            <select id="pole" class="form-select"></select>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="mb-2 required">${langData['status'] || 'Status'}</label>
                            <select id="status" class="form-select obj-required"></select>
                        </div>
                    </div>
                `);
                initSelect2Remote('#contract', `${BASE_URL}/api/document/filter`, { type: 'contract' });
                initSelect2Remote('#project', `${BASE_URL}/api/document/filter`, { type: 'project' });
                initSelect2Remote('#type', `${BASE_URL}/api/document/filter`, { type: 'type' });
                initSelect2Remote('#installation', `${BASE_URL}/api/document/filter`, { type: 'installation' });
                initSelect2Remote('#pole', `${BASE_URL}/api/document/filter`, { type: 'pole' });
                initSelect2Remote('#status', `${BASE_URL}/api/document/filter`, { type: 'status' });
                initDatePicker('#document_start');
                initDatePicker('#document_end');
                if (docData) {
                    $("#document_id").val(docData.document_id);
                    $("#document_name").val(docData.document_name);
                    if (docData.document_start) {
                        let startDate = new Date(docData.document_start);
                        $('#document_start').datepicker('setDate', startDate);
                    }
                    if (docData.document_end) {
                        let endDate = new Date(docData.document_end);
                        $('#document_end').datepicker('setDate', endDate);
                    }
                    if (docData.document_path) {
                        const fileType = docData.document_type;
                        const fileName = docData.document_file_name;
                        const fileSize = docData.document_size;
                        const fakeFile = {
                            name: fileName,
                            size: fileSize
                        };
                        handleFile(fakeFile, 'edit');
                        $("#document_file").removeClass("obj-required");
                    }
                    if (docData.contract_id) {
                        var newOptionContract = new Option(docData.contract_name, docData.contract_id, true, true);
                        $('#contract').append(newOptionContract).trigger('change');
                    }
                    if (docData.project_id) {
                        var newOptionProject = new Option(docData.project_name, docData.project_id, true, true);
                        $('#project').append(newOptionProject).trigger('change');
                    }
                    if (docData.type_id) {
                        var newOptionType = new Option(docData.type_name, docData.type_id, true, true);
                        $('#type').append(newOptionType).trigger('change');
                    }
                    if (docData.installations_id) {
                        var newOptionInstallation = new Option(docData.installations_name, docData.installations_id, true, true);
                        $('#installation').append(newOptionInstallation).trigger('change');
                    }
                    if (docData.poles_id) {
                        var newOptionPole = new Option(docData.poles_code, docData.poles_id, true, true);
                        $('#pole').append(newOptionPole).trigger('change');
                    }
                    if (docData.status) {
                        let statusName = docData.status.charAt(0).toUpperCase() + docData.status.slice(1);
                        var newOptionStatus = new Option(statusName, docData.status, true, true);
                        $('#status').append(newOptionStatus).trigger('change');
                    }
                }
            } else {
                showError(langData['cannot_load']);
            }
        },
        error: function(){
            showError(langData['cannot_load']);
        }
    });
});
$(document).on('change', '#contract, #filter_contract, #project, #filter_project, #type, #filter_type, #installation, #filter_installations', function() {
    const $this = $(this);
    const id = $this.attr('id');
    const val = $this.val();
    const isFilter = id.startsWith('filter_');
    const prefix = isFilter ? '#filter_' : '#';
    const getVal = (target) => $(prefix + target).val();
    if (id.includes('contract')) {
        $(`${prefix}project, ${prefix}type, ${prefix}installation, ${prefix}pole`).val(null).trigger('change.select2');
        initSelect2Remote(`${prefix}project`, `${BASE_URL}/api/document/filter`, { 
            type: 'project', 
            contract_id: val 
        });
    } else if (id.includes('project')) {
        $(`${prefix}type, ${prefix}installation, ${prefix}pole`).val(null).trigger('change.select2');
        initSelect2Remote(`${prefix}type`, `${BASE_URL}/api/document/filter`, { 
            type: 'type', 
            contract_id: getVal('contract'),
            project_id: val 
        });
    } else if (id.includes('type')) {
        $(`${prefix}installation, ${prefix}pole`).val(null).trigger('change.select2');
        initSelect2Remote(`${prefix}installation`, `${BASE_URL}/api/document/filter`, { 
            type: 'installation', 
            contract_id: getVal('contract'),
            project_id: getVal('project'),
            type_id: val
        });
    } else if (id.includes('installation')) {
        $(`${prefix}pole`).val(null).trigger('change.select2');
        initSelect2Remote(`${prefix}pole`, `${BASE_URL}/api/document/filter`, { 
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
    const ext = file.name.split(".").pop();
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
    saveDocument();
});
function saveDocument() {
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
        url: "api/document/save",
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
            if (res.status === true) {
                showSuccess(langData['saved_successfully']);
                if (typeof initDocumentTable === "function") initDocumentTable();
                $('#windModal').modal('hide');
            } else {
                showError((langData['cannot_save'] || 'Error: ') + (res.message || 'Unknown error'));
            }
        },
        error: function (xhr, status, error) {
            Swal.close();
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
            url: `${BASE_URL}api/document/delete`,
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
        <div class="row mb-3">
            <div class="col-md-4">
                <label>${langData['startDate'] || 'Start Date'}</label>
                <input type="date" id="filter_start" class="form-control">
            </div>
            <div class="col-md-4">
                <label>${langData['endDate'] || 'End Date'}</label>
                <input type="date" id="filter_end" class="form-control">
            </div>
            <div class="col-md-4">
                <label>&nbsp;</label>
                <button id="btnFilter" class="btn btn-primary w-100">${langData['filter'] || 'Filter'}</button>
            </div>
        </div>
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
                </tr>
            </thead>
        </table>
    `);
    modalEl.find(".modal-footer").html(`
        <button class="btn btn-outline-secondary" data-bs-dismiss="modal">${langData['close'] || "Close"}</button>
    `);
    loadDownloadHistory(document_id);
    $(document).off("click", "#btnFilter").on("click", "#btnFilter", function(){
        $('#downloadHistoryTable').DataTable().ajax.reload();
    });
});
function loadDownloadHistory(document_id){
    $('#downloadHistoryTable').DataTable({
        destroy: true,
        processing: true,
        serverSide: true,
        ordering: false,
        order: [[2, 'desc']],
        ajax: {
            url: "api/document/download_history",
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
            data: "member_name" 
        },{ 
            data: "download_date" 
        },{ 
            data: "download_device",
            render: function(d){
                d = (d || '').toLowerCase();
                if(d.includes("mobile"))
                    return `<span class="badge bg-success">Mobile</span>`;
                if(d.includes("tablet"))
                    return `<span class="badge bg-warning text-dark">Tablet</span>`;
                return `<span class="badge bg-primary">Desktop</span>`;
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