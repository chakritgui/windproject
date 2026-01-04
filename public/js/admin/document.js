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
                let document = res.data;
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
                            <input type="date" class="form-control obj-required" id="document_start">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="mb-2 required" data-i18n="endDate"></label>
                            <input type="date" class="form-control obj-required" id="document_end">
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="mb-2 required" data-i18n="status"></label>
                            <div class="btn-group w-100" role="group">
                                <input type="radio" class="btn-check obj-required" name="status" id="public" value="public" checked>
                                <label class="btn btn-outline-success" for="public" data-i18n="public"></label>
                                <input type="radio" class="btn-check obj-required" name="status" id="private" value="private">
                                <label class="btn btn-outline-danger" for="private" data-i18n="private"></label>
                            </div>
                        </div>
                    </div>
                `);
                if (document) {
                    $("#document_id").val(document.document_id);
                    $("#document_name").val(document.document_name);
                    $("#document_start").val(document.document_start);
                    $("#document_end").val(document.document_end);
                    $("input[name='status'][value='" + document.status + "']").prop("checked", true);
                    if (document.document_path) {
                        const fileName = document.document_path.split("/").pop();
                        const fileType = document.document_type;
                        const fileSize = document.document_size;
                        const fakeFile = {
                            name: fileName,
                            size: fileSize
                        };
                        handleFile(fakeFile);
                        $("#document_file").removeClass("obj-required");
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
    let start = $('#document_start').val();
    let end = $('#document_end').val();
    if (!start || !end) return;
    if (end < start) {
        showWarning(
            langData['validation_error'] || 'Validation Error',
            langData['validation_date'] || 'End date cannot be earlier than start date.'
        );
        $('#document_end').val('');
        $('#document_end').focus();
    }
}
$(document).on("change", "#document_start, #document_end", function () {
    validateDates();
});
$(document).on("click", "#btn_select_file", function () {
    $("#document_file").trigger("click");
});
function readableSize(bytes) {
    if (bytes === 0) return "0 B";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return (bytes / Math.pow(1024, i)).toFixed(2) + " " + sizes[i];
}
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
function getFileIconClass(ext) {
    ext = ext.toLowerCase();
    if (["jpg","jpeg","png","gif","webp","svg"].includes(ext)) return "fa-solid fa-file-image text-info";
    if (["pdf"].includes(ext)) return "fa-solid fa-file-pdf text-danger";
    if (["doc","docx"].includes(ext)) return "fa-solid fa-file-word text-primary";
    if (["xls","xlsx","csv"].includes(ext)) return "fa-solid fa-file-excel text-success";
    if (["ppt","pptx"].includes(ext)) return "fa-solid fa-file-powerpoint text-orange";
    if (["zip","rar","7z"].includes(ext)) return "fa-solid fa-file-zipper text-secondary";
    if (["mp4","mov","avi","mkv"].includes(ext)) return "fa-solid fa-file-video text-purple";
    if (["mp3","wav","ogg"].includes(ext)) return "fa-solid fa-file-audio text-info";
    if (["txt","md","log"].includes(ext)) return "fa-solid fa-file-lines text-muted";
    return "fa-solid fa-file text-muted";
}
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
    $(".save-document").attr("disable", true);
    const document_id   = $("#document_id").val() || "";
    const name          = $("#document_name").val();
    const start_date    = $("#document_start").val();
    const end_date      = $("#document_end").val();
    const status        = $("input[name='status']:checked").val();
    const file          = $("#document_file")[0].files[0] || null;
    const formData = new FormData();
    formData.append("document_id", document_id);
    formData.append("document_name", name);
    formData.append("document_start", start_date);
    formData.append("document_end", end_date);
    formData.append("status", status);
    formData.append("document_file", file);
    Swal.fire({
        title: 'Uploading...',
        html: `
            <div class="progress mt-2">
                <div id="swal-progress" class="progress-bar" role="progressbar" style="width:0%">0%</div>
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
            if (res.status === true) {
                showSuccess('Success', langData['saved_successfully']);
                initDocumentTable();
                $('#windModal').modal('hide');
            } else {
                showError('Error', langData['cannot_save']);
            }
            $(".save-document").attr("disable", false);
        },
        error: function () {
            showError('Error', langData['cannot_save']);
            $(".save-document").attr("disable", false);
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