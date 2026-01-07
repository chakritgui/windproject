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
        order: [[5, 'desc']],
        ajax: { 
            url: "api/document/list", 
            type: "POST",
            data: function(d){
                d.date = $('#filter_date').val();
                d.status = $('#filter_status').val();
                d.source = $('#filter_source').val();
            }
        },
        columns: [      
            { 
                data: "document_type",
                className: 'text-center',
                orderable: false,
                searchable: false,
                render: function(data){
                    const iconClass = getFileIconClass(data);
                    return `<i class="${iconClass} fa-2x"></i>`;
                }
            },
            { data: "document_name" },
            { data: "source_name" },
            { data: "document_type" },
            { 
                data: null,
                render: function(row){
                    return `
                        ${row.document_start} - ${row.document_end}
                    `;
                }
            },
            { 
                data: "document_size",
                render: function (data, type, row) {
                    if (!data) return "-";
                    return (data / (1024 * 1024)).toFixed(2) + " MB";
                }
            },
            { data: "created_at" },
            {
                data: "status",
                render: function (status, type, row) {
                    let badgeColor = status === "public" ? "success" : "secondary";
                    return `
                        <div class="d-flex align-items-center gap-2">
                            <span class="badge bg-${badgeColor}" style="font-weight:400;" data-i18n="${status}"></span>
                            <div class="dropdown">
                                <button class="btn btn-sm border-0" data-bs-toggle="dropdown">
                                    <i class="fa-solid fa-angle-down"></i>
                                </button>
                                <ul class="dropdown-menu dropdown-menu-end shadow">
                                    <li class="${status === 'public' ? 'd-none' : ''}">
                                        <a class="dropdown-item change-status" data-id="${row.document_id}" data-status="public"><span data-i18n="public" class="text-success"></span></a>
                                    </li>
                                    <li class="${status === 'private' ? 'd-none' : ''}">
                                        <a class="dropdown-item change-status" data-id="${row.document_id}" data-status="private"><span data-i18n="private" class="text-muted"></span></a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    `;
                }
            },
            { 
                data: "document_dowload",
                className: 'text-end',
                render: function(data, type, row) {
                    return `
                        ${data} <button class="btn btn-light text-secondary history-download" data-id="${row.document_id}"><i class="fa-solid fa-clock-rotate-left"></i></button> 
                    `;
                }
            },
            {
                data: null,
                orderable: false,
                render: function(row){
                    return `
                        <a href="${BASE_URL}/${row.document_path}" target="_blank" class="btn btn-light text-secondary" data-id="${row.document_id}"><i class="fa-solid fa-folder-open"></i></a> 
                        <button class="btn btn-light text-secondary manage-document" data-id="${row.document_id}"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="btn btn-light text-secondary text-danger delete-document" data-id="${row.document_id}"><i class="fa-regular fa-trash-can"></i></button>
                    `;
                }
            }
        ],
        stateSave: true,
        pageLength: pageLength,
        lengthMenu: lengthMenu,
        stateLoadParams: function (settings, data) {
            data.start = oldPage;
            data.length = pageLength; 
        },
        language: getTableLang(),
        initComplete: function(){
            var input = $('#tb_document_filter input').unbind();
            var self = this.api();
            input.bind('keypress', function(e){
                if(e.keyCode == 13) {
                    self.search(input.val()).draw();
                }
            });
        }, 
        initComplete: function(){
            let $filter = $('#tb_document_filter');
            let btn = `
                <button class="btn btn-primary btn-sm manage-document" data-id="">
                    <i class="fa-solid fa-plus"></i> <span data-i18n="document"></span>
                </button>
            `;
            $filter.append(btn);
            var input = $('#tb_document_filter input').unbind();
            var self = this.api();
            input.bind('keypress', function(e){
                if(e.keyCode == 13) {
                    self.search(input.val()).draw();
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
    initSelect2Remote('#filter_source', 'api/document/filter', { type: 'source' });
    initSelect2Remote('#filter_status', 'api/document/filter', { type: 'status' });
    initDateRangePicker('#filter_date', initDocumentTable);
});
$(document).on('click', '.manage-document', function () {
    let document_id = $(this).data("id");
    $.ajax({
        url: 'api/document/get',
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
                    <h5 class="modal-title" data-i18n="${(document_id) ? 'manageDocument' : 'newDocument'}"></h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                `);
                modalEl.find(".modal-footer").html(`
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" data-i18n="close"></button>
                    <button type="submit" class="btn btn-primary save-document" data-i18n="save"></button>
                `);
                modalEl.find(".modal-body").html(`
                    <input type="hidden" name="document_id" id="document_id" value="${document_id ?? ''}">
                    <div class="mb-3">
                        <label class="mb-2 required" data-i18n="uploadFile"></label>
                        <div id="drop_zone" class="border rounded-3 p-4 text-center" style="cursor:pointer; border-style:dashed;">
                            <div id="drop_text">
                                <i class="fa-solid fa-folder-open fa-4x text-warning"></i>
                                <div data-i18n="dropHere"></div>
                                <div>— <span data-i18n="or"></span> —</div>
                            </div>
                            <div id="file_preview" class="mt-3 d-none"></div>
                            <div id="drop_button">
                                <button class="btn btn-primary mt-2" type="button" id="btn_select_file" data-i18n="choose"></button>
                                <input type="file" class="d-none obj-required" id="document_file">
                            </div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="mb-2 required" data-i18n="documentName"></label>
                        <input type="text" class="form-control obj-required" id="document_name" maxlength="255">
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="mb-2 required" data-i18n="fileType"></label>
                            <input type="text" class="form-control obj-required" id="document_type" readonly>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="mb-2 required" data-i18n="fileSize"></label>
                            <input type="text" class="form-control obj-required" id="document_size" readonly>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-12 mb-3">
                            <small class="text-muted" data-i18n="file_remark"></small>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="mb-2 required" data-i18n="startDate"></label>
                            <input type="text" class="form-control obj-required" id="document_start">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="mb-2 required" data-i18n="endDate"></label>
                            <input type="text" class="form-control obj-required" id="document_end">
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="mb-2 required" data-i18n="source"></label>
                            <select id="source" class="form-select obj-required"></select>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="mb-2 required" data-i18n="status"></label>
                            <select id="status" class="form-select obj-required"></select>
                        </div>
                    </div>
                `);
                initSelect2Remote('#source', 'api/document/filter', { type: 'source' });
                initSelect2Remote('#status', 'api/document/filter', { type: 'status' });
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
                        const fileName = docData.document_path.split("/").pop();
                        const fileType = docData.document_type;
                        const fileSize = docData.document_size;
                        const fakeFile = {
                            name: fileName,
                            size: fileSize
                        };
                        handleFile(fakeFile);
                        $("#document_file").removeClass("obj-required");
                    }
                    if (docData.source_id) {
                        var newOptionSource = new Option(docData.source_name, docData.source_id, true, true);
                        $('#source').append(newOptionSource).trigger('change');
                    }
                    if (docData.status) {
                        let statusName = docData.status.charAt(0).toUpperCase() + docData.status.slice(1);
                        var newOptionStatus = new Option(statusName, docData.status, true, true);
                        $('#status').append(newOptionStatus).trigger('change');
                    }
                }
            } else {
                showError('Error', langData['cannot_load']);
            }
        },
        error: function(){
            showError('Error', langData['cannot_load']);
        }
    });
});
function validateDates() {
    let startStr = $('#document_start').val();
    let endStr = $('#document_end').val();
    if (!startStr || !endStr) return;
    let startDate = moment(startStr, "DD/MM/YYYY");
    let endDate = moment(endStr, "DD/MM/YYYY");
    if (endDate.isBefore(startDate)) {
        showWarning(
            langData['validation_error'] || 'Validation Error',
            langData['validation_date'] || 'End date cannot be earlier than start date.'
        );
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
    if (mode === 'new') {
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
                <button class="btn btn-primary btn-sm" type="button" id="btn_select_file" data-i18n="choose"></button>
                <button type="button" class="btn btn-sm btn-danger" id="remove_file">
                    <span data-i18n="remove"></span>
                </button>
            </div>
        </div>
    `);
}
$(document).on("click", "#remove_file", function () {
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
    handleFile(file, 'new');
});
$(document).on("dragover", "#drop_zone", function(e){
    e.preventDefault();
});
$(document).on("drop", "#drop_zone", function(e){
    e.preventDefault();
    const file = e.originalEvent.dataTransfer.files[0];
    $("#document_file")[0].files = e.originalEvent.dataTransfer.files;
    handleFile(file, 'new');
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
        showWarning(
            langData['validation_error'] || 'Validation Error',
            langData['required_star_message'] || 'Please fill all fields marked with *'
        );
        $('.is-invalid').first().focus();
        return;
    }
    saveDocument();
});
function saveDocument() {
    const btn = $(".save-document");
    const name = $("#document_name").val();
    if (!name) {
        showError('Error', 'Please enter document name');
        return;
    }
    btn.prop("disabled", true);
    const formData = new FormData();
    formData.append("document_id", $("#document_id").val() || "");
    formData.append("document_name", name);
    formData.append("document_start", $("#document_start").val());
    formData.append("document_end", $("#document_end").val());
    formData.append("status", $("#status").val());
    formData.append("source", $("#source").val());
    const file = $("#document_file")[0].files[0];
    if (file) {
        formData.append("document_file", file);
    }
    Swal.fire({
        title: langData['uploading'] || 'Uploading...',
        html: `
            <p>Please do not close this window.</p>
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
                showSuccess('Success', langData['saved_successfully']);
                if (typeof initDocumentTable === "function") initDocumentTable();
                $('#documentModal').modal('hide');
            } else {
                showError('Error', (langData['cannot_save'] || 'Error: ') + (res.message || 'Unknown error'));
            }
        },
        error: function (xhr, status, error) {
            Swal.close();
            let msg = langData['cannot_save'];
            try {
                let res = JSON.parse(xhr.responseText);
                if (res.message) msg += ": " + res.message;
            } catch (e) {}
            showError('Error', msg);
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
            url: 'api/document/delete',
            method: 'POST',
            data: { id: document_id },
            dataType: 'json',
            success: function(res) {
                if(res.status === true){
                    showSuccess('Success', langData['deleted_successfully']);
                    initDocumentTable();
                } else {
                    showError('Error', langData['cannot_delete']);
                }   
            },
            error: function(){
                showError('Error', langData['cannot_delete']);
            }
        });
    });
});
$(document).on('click', '.change-status', function() {
    let document_id = $(this).data("id");
    let status = $(this).data("status");
    showConfirm(langData['confirm'], langData['confirm_change'], function(){
        $.ajax({
            url: 'api/document/change',
            method: 'POST',
            data: { 
                id: document_id,
                status: status,
            },
            dataType: 'json',
            success: function(res) {
                if(res.status === true){
                    showSuccess('Success', langData['change_successfully']);
                    initDocumentTable();
                } else {
                    showError('Error', langData['cannot_change']);
                }   
            },
            error: function(){
                showError('Error', langData['cannot_change']);
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
        <h5 class="modal-title"data-i18n="download_history"></h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
    `);
    modalEl.find(".modal-body").html(`
        <div class="row mb-3">
            <div class="col-md-4">
                <label data-i18n="start_date"></label>
                <input type="date" id="filter_start" class="form-control">
            </div>
            <div class="col-md-4">
                <label data-i18n="end_date"></label>
                <input type="date" id="filter_end" class="form-control">
            </div>
            <div class="col-md-4">
                <label>&nbsp;</label>
                <button id="btnFilter" class="btn btn-primary w-100" data-i18n="filter"></button>
            </div>
        </div>
        <div class="alert alert-info">
            <span data-i18n="total_downloads"></span>: <strong id="total_downloads">0</strong>
        </div>
        <table id="downloadHistoryTable" class="table table-striped w-100">
            <thead>
                <tr>
                    <th>#</th>
                    <th data-i18n="member"></th>
                    <th data-i18n="date"></th>
                    <th data-i18n="device"></th>
                </tr>
            </thead>
        </table>
    `);
    modalEl.find(".modal-footer").html(`
        <button class="btn btn-secondary" data-bs-dismiss="modal" data-i18n="close"></button>
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
        columns: [
            {
                data: null,
                render: function (data, type, row, meta) {
                    return meta.row + meta.settings._iDisplayStart + 1;
                }
            },
            { data: "member_name" },
            { data: "download_date" },
            { 
                data: "download_device",
                render: function(d){
                    d = (d || '').toLowerCase();
                    if(d.includes("mobile"))
                        return `<span class="badge bg-success">Mobile</span>`;
                    if(d.includes("tablet"))
                        return `<span class="badge bg-warning text-dark">Tablet</span>`;
                    return `<span class="badge bg-primary">Desktop</span>`;
                }
            }
        ],
        pageLength: pageLength,
        lengthMenu: lengthMenu,
        language: getTableLang(),
        drawCallback: function(settings){
            $("#total_downloads").text(settings.json.total_downloads);
        }
    });
}