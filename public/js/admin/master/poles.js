let tb_pole;
function initPolesTable() {
    let oldPage = 0;
    if ($.fn.DataTable.isDataTable('#tb_pole')) {
        oldPage = $('#tb_pole').DataTable().page();
        $('#tb_pole').DataTable().destroy();
    }
    if ($.fn.DataTable.isDataTable('#tb_pole')) {
        $('#tb_pole').DataTable().ajax.reload(null, false);
        return;
    }
    tb_pole = $('#tb_pole').DataTable({
        processing: true,
        serverSide: true,
        ordering: false,
        order: [[8, 'desc']],
        ajax: { 
            url: `${BASE_URL}/api/poles/list`, 
            type: "POST",
            data: function(d){
                d.status = $('#filter_pole_status').val();
                d.project = $('#filter_pole_project').val();
                d.type = $('#filter_pole_type').val();
                d.installation = $('#filter_pole_installation').val();
            }
        },
        columns: [      
            { data: "poles_code" },
            { data: "type_name" },
            { data: "project_name" },
            { data: "poles_lat" },
            { data: "poles_lng" },
            { data: "installations_name" },
            { 
                data: 'status',
                render: function (status, type, row) {
                    let badgeColor = "";
                    switch(status) {
                        case 'online':
                            badgeColor = "success";
                            break;
                        case 'inactive':
                            badgeColor = "secondary";
                            break;
                    }
                    return `
                        <div class="d-flex align-items-center gap-2">
                            <span class="badge bg-${badgeColor}" style="font-weight:400;" data-i18n="${status}"></span>
                        </div>
                    `;
                }
            },
            { 
                data: null,
                orderable: false,
                render: function(row){
                    return (row.content_id) ? `
                        <button class="btn btn-info view-content" data-pole="${row.poles_id}" data-content="${row.content_id}"><i class="fa-solid fa-eye"></i></button> 
                        <button class="btn btn-warning manage-content" data-pole="${row.poles_id}" data-content="${row.content_id}"><i class="fa-solid fa-pen-to-square"></i></button> 
                        <button class="btn btn-danger delete-content" data-pole="${row.poles_id}" data-content="${row.content_id}"><i class="fa-solid fa-trash-can"></i></button> 
                    ` : `
                        <button class="btn btn-light manage-content" data-pole="${row.poles_id}" data-content=""><i class="fa-solid fa-plus"></i></button>
                    `;
                }
            },
            { 
                data: null,
                orderable: false,
                className: "text-end",
                render: function(row){
                    return `
                        <button class="btn btn-light text-secondary manage-pole" data-id="${row.poles_id}"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="btn btn-light text-secondary text-danger delete-pole" data-id="${row.poles_id}"><i class="fa-regular fa-trash-can"></i></button>
                    `;
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
        initComplete: function(){
            var input = $('#tb_pole_filter input').unbind();
            var self = this.api();
            input.bind('keypress', function(e){
                if(e.keyCode == 13) {
                    self.search(input.val()).draw();
                }
            });
            let $filter = $('#tb_pole_filter');
            let btn = `
                <button class="btn btn-primary btn-sm manage-pole" data-id="">
                    <i class="fa-solid fa-plus"></i> <span data-i18n="poles"></span>
                </button>
            `;
            $filter.append(btn);
            var input = $('#tb_pole_filter input').unbind();
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
$(document).on('click', '.delete-pole', function() {
    let poles_id = $(this).data("id");
    showConfirm(langData['confirm'], langData['confirm_delete'], function(){
        $.ajax({
            url: `${BASE_URL}/api/poles/delete`,
            method: 'POST',
            data: { id: poles_id },
            dataType: 'json',
            success: function(res) {
                if(res.status === true){
                    showSuccess('Success', langData['deleted_successfully']);
                    initPolesTable();
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
$(document).on('click', '.delete-content', function() {
    let poles_id = $(this).data("pole");
    let content_id = $(this).data("content");
    showConfirm(langData['confirm'], langData['confirm_delete'], function(){
        $.ajax({
            url: `${BASE_URL}/api/poles/delete-content`,
            method: 'POST',
            data: { poles_id: poles_id, content_id: content_id },
            dataType: 'json',
            success: function(res) {
                if(res.status === true){
                    showSuccess('Success', langData['deleted_successfully']);
                    initPolesTable();
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
$(document).on('click', '.manage-pole', function() {
    let poles_id = $(this).data("id");
    $.ajax({
        url: `${BASE_URL}/api/poles/get`,
        method: 'POST',
        data: { id: poles_id },
        dataType: 'json',
        success: function(res) {
            if(res.status === true){
                let poleData = res.data;
                let modalEl = $('#windModal');
                let modal = new bootstrap.Modal(modalEl[0]);
                modal.show();
                modalEl.find(".modal-header").html(`
                    <h5 class="modal-title" data-i18n="${(poles_id) ? 'managePole' : 'newPole'}"></h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                `);
                modalEl.find(".modal-footer").html(`
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" data-i18n="close"></button>
                    <button type="submit" class="btn btn-primary save-pole" data-i18n="save"></button>
                `);
                modalEl.find(".modal-body").html(`
                    <input type="hidden" name="poles_id" id="poles_id" value="${poles_id ?? ''}">
                    <div class="mb-3">
                        <label class="mb-2 required" data-i18n="pole_code"></label>
                        <input type="text" class="form-control obj-required" id="poles_code" maxlength="255">
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="mb-2 required" data-i18n="project"></label>
                            <select id="project" class="form-select obj-required"></select>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="mb-2 required" data-i18n="type"></label>
                            <select id="type" class="form-select obj-required"></select>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="mb-2 required" data-i18n="latitude"></label>
                            <input type="text" class="form-control obj-required" id="latitude" maxlength="255">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="mb-2 required" data-i18n="longitude"></label>
                            <input type="text" class="form-control obj-required" id="longitude" maxlength="255">
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="mb-2 required" data-i18n="installation"></label>
                            <select id="installation" class="form-select obj-required"></select>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="mb-2 required" data-i18n="status"></label>
                            <select id="status" class="form-select obj-required"></select>
                        </div>
                    </div>
                `);
                initSelect2Remote('#status', `${BASE_URL}/api/poles/filter`, { type: 'status' });
                initSelect2Remote('#project', `${BASE_URL}/api/poles/filter`, { type: 'project' });
                initSelect2Remote('#type', `${BASE_URL}/api/poles/filter`, { type: 'type' });
                initSelect2Remote('#installation', `${BASE_URL}/api/poles/filter`, { type: 'installation' });
                if (poleData) {
                    $("#poles_code").val(poleData.poles_code);
                    $("#latitude").val(poleData.poles_lat);
                    $("#longitude").val(poleData.poles_lng);
                    if (poleData.project_name) {
                        var newOptionStatus = new Option(poleData.project_name, poleData.project_id, true, true);
                        $('#project').append(newOptionStatus).trigger('change');
                    }
                    if (poleData.type_name) {
                        var newOptionStatus = new Option(poleData.type_name, poleData.type_id, true, true);
                        $('#type').append(newOptionStatus).trigger('change');
                    }
                    if (poleData.installations_name) {
                        var newOptionStatus = new Option(poleData.installations_name, poleData.installations_id, true, true);
                        $('#installation').append(newOptionStatus).trigger('change');
                    }
                    if (poleData.status) {
                        let statusName = poleData.status.charAt(0).toUpperCase() + poleData.status.slice(1);
                        var newOptionStatus = new Option(statusName, poleData.status, true, true);
                        $('#status').append(newOptionStatus).trigger('change');
                    }
                } else {
                    var newOptionStatus = new Option('Online', 'online', true, true);
                    $('#status').append(newOptionStatus).trigger('change');
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
$(document).on('click', '.save-pole', function () {
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
    savePole();
});
function savePole() {
    const btn = $(".save-pole");
    btn.prop("disabled", true);
    const formData = new FormData();
    formData.append("poles_id", $("#poles_id").val() || "");
    formData.append("poles_code", $("#poles_code").val() || "");
    formData.append("latitude", $("#latitude").val() || "");
    formData.append("longitude", $("#longitude").val() || "");
    formData.append("project", $("#project").val());
    formData.append("type", $("#type").val());
    formData.append("installation", $("#installation").val());
    formData.append("status", $("#status").val());
    Swal.fire({
        title: langData['saving'] || 'Saving...',
        html: `
            <p data-i18n="do_not_close"></p>
            <div class="progress mt-2">
                <div id="swal-progress" class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width:0%">0%</div>
            </div>
        `,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });
    $.ajax({
        url: "api/poles/save",
        type: "POST",
        data: formData,
        contentType: false,
        processData: false,
        dataType: "json",
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
                if (typeof initPolesTable === "function") initPolesTable();
                $('#windModal').modal('hide');
            } else {
                showError('Error', (langData['cannot_save'] || 'Error: ') + ' ' + (langData[res.message] || 'Unknown error'));
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
$(document).on('click', '.manage-content', function () {
    let pole = $(this).data("pole");
    let content = $(this).data("content");
    manageContent(pole, content);
});
function manageContent(poles_id, content_id) {
    $.post("api/poles/gets", {
        poles_id, content_id
    }, function(res) {
        if(res.status !== "success") return;
        let d = res.data;
        let $modal = $("#windModal");
        let modal = new bootstrap.Modal($modal[0]);
        $modal.find(".modal-header").html(`
            <h5 class="modal-title" data-i18n="content"></h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        `);
        $modal.find(".modal-footer").html(`
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" data-i18n="close"></button>
            <button type="button" class="btn btn-primary" id="btnSaveContent" data-i18n="save"></button>
        `);
        $modal.find(".modal-body").html(getContentForm(d, poles_id, content_id));
        initCoverUpload();
        initAttachmentsUpload(d.attachments || []);
        initImagesUpload(d.images || []);
        init360ImagesUpload(d.images360 || []);
        initTinyMCE();
        modal.show();
    }, "json");
}
function getContentForm(d, poles_id, content_id) {
    return `
        <form id="contentForm">
            <ul class="nav nav-pills nav-justified mb-4" id="contentTab" role="tablist">
                <li class="nav-item">
                    <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#tab-basic" type="button">
                        <i class="fa-solid fa-pen-to-square me-2"></i>Content
                    </button>
                </li>
                <li class="nav-item">
                    <button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-gallery" type="button">
                        <i class="fa-solid fa-images me-2"></i><span data-i18n="gallery"></span>
                    </button>
                </li>
                <li class="nav-item">
                    <button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-360" type="button">
                        <i class="fa-solid fa-images me-2"></i><span data-i18n="360°"></span>
                    </button>
                </li>
                <li class="nav-item">
                    <button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-files" type="button">
                        <i class="fa-solid fa-file-arrow-up me-2"></i><span data-i18n="attachments"></span>
                    </button>
                </li>
            </ul>
            <div class="tab-content">
                <div class="tab-pane fade show active" id="tab-basic">
                    <div id="coverDropArea" class="cover-drop-area text-center mb-3">
                        <input type="file" id="cover" accept="image/*" hidden>
                        <div id="coverPreviewWrapper" class="h-100 d-flex align-items-center justify-content-center">
                            ${d.cover 
                                ? `<img id="coverPreview" src="${BASE_URL}/${d.cover}" class="img-fluid rounded shadow-sm" style="max-height:150px;">`
                                : `<img id="coverPreview" class="img-fluid rounded shadow-sm d-none" style="max-height:150px;">`
                            }
                        </div>
                        <div id="coverDropLabel" class="${d.cover ? 'd-none' : ''}">
                            <div class="fw-bold fs-6 mt-2" data-i18n="dropHere"></div>
                            <div class="text-muted small mb-2">
                                <span data-i18n="or"></span> <span data-i18n="choose"></span>
                            </div>
                        </div>
                        <div class="text-muted small mt-2" data-i18n="allow_images_only"></div>
                        <button type="button" id="btnRemoveCover" class="btn btn-sm btn-outline-danger mt-2 ${d.cover ? '' : 'd-none'}" data-i18n="remove"></button>
                    </div>
                    <input type="hidden" id="ex_cover" value="${d.cover ? d.cover : ''}">
                    <div class="mb-3">
                        <label class="form-label fw-bold">Content</label>
                        <ul class="nav nav-tabs" role="tablist">
                            <li class="nav-item"><a class="nav-link active" data-bs-toggle="tab" href="#en">English</a></li>
                            <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#lo">ລາວ</a></li>
                            <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#th">ไทย</a></li>
                        </ul>
                        <div class="tab-content border border-top-0 p-3">
                            ${langTab("en", d)}
                            ${langTab("lo", d)}
                            ${langTab("th", d)}
                        </div>
                    </div>
                </div>
                <div class="tab-pane fade" id="tab-gallery">
                    <div class="mb-4">
                        <label class="form-label fw-bold" data-i18n="upload2"></label>
                        <div class="border border-2 border-dashed rounded-3 p-4 text-center" id="imagesDropArea" style="cursor: pointer; min-height: 120px;">
                            <input type="file" id="images" name="images[]" class="d-none" accept="image/*" multiple>
                            <div id="imagesDropLabel">
                                <i class="fa-solid fa-image fs-1 text-muted"></i>
                                <p class="mb-0 mt-2 text-muted" data-i18n="drop_here"></p>
                                <small class="text-muted" data-i18n="multiple_upload"></small>
                            </div>
                        </div>
                        <div id="imagesList" class="mt-3 row g-2"></div>
                    </div>
                </div>
                <div class="tab-pane fade" id="tab-360">
                    <div class="mb-4">
                        <label class="form-label fw-bold" data-i18n="upload3"></label>
                        <div class="border border-2 border-dashed rounded-3 p-4 text-center" 
                            id="images360DropArea" style="cursor: pointer; min-height: 120px;">
                            <input type="file" id="images360" name="images360[]" class="d-none" accept="image/*" multiple>
                            <div id="images360DropLabel">
                                <i class="fa-solid fa-maximize fs-1 text-muted"></i>
                                <p class="mb-0 mt-2 text-muted" data-i18n="drop_here"></p>
                                <small class="text-muted" data-i18n="multiple_upload"></small>
                            </div>
                        </div>
                        <div id="images360List" class="mt-3 row g-2"></div>
                    </div>
                </div>
                <div class="tab-pane fade" id="tab-files">
                    <div class="mb-4">
                        <label class="form-label fw-bold" data-i18n="upload1"></label>
                        <div class="border border-2 border-dashed rounded-3 p-4 text-center" id="attachmentsDropArea" style="cursor: pointer; min-height: 120px;">
                            <input type="file" id="attachments" name="attachments[]" class="d-none" multiple>
                            <div id="attachmentsDropLabel">
                                <i class="fa-solid fa-paperclip fs-1 text-muted"></i>
                                <p class="mb-0 mt-2 text-muted" data-i18n="drop_here"></p>
                                <small class="text-muted" data-i18n="multiple_upload"></small>
                            </div>
                        </div>
                        <div id="attachmentsList" class="mt-3"></div>
                    </div>
                </div>
            </div>
            <input type="hidden" id="poles_id" value="${poles_id || ""}">
            <input type="hidden" id="content_id" value="${content_id || ""}">
        </form>
    `;
}
function initCoverUpload() {
    const dropArea = document.getElementById("coverDropArea");
    const input = document.getElementById("cover");
    const preview = document.getElementById("coverPreview");
    const label = document.getElementById("coverDropLabel");
    const btnRemove = document.getElementById("btnRemoveCover");
    const ex_cover = document.getElementById("ex_cover");
    dropArea.addEventListener("click", () => input.click());
    ["dragenter", "dragover"].forEach(ev =>
        dropArea.addEventListener(ev, e => {
            e.preventDefault();
            dropArea.classList.add("border-primary", "bg-light");
        })
    );
    ["dragleave", "drop"].forEach(ev =>
        dropArea.addEventListener(ev, e => {
            e.preventDefault();
            dropArea.classList.remove("border-primary", "bg-light");
        })
    );
    dropArea.addEventListener("drop", e => {
        const file = e.dataTransfer.files[0];
        if (file) showPreview(file);
    });
    input.addEventListener("change", e => {
        const file = e.target.files[0];
        if (file) showPreview(file);
    });
    btnRemove.addEventListener("click", e => {
        e.stopPropagation();
        input.value = "";
        ex_cover.value = "";
        preview.src = "";
        preview.classList.add("d-none");
        label.classList.remove("d-none");
        btnRemove.classList.add("d-none");
    });
    function showPreview(file) {
        const validExt = ["jpg","jpeg","png","gif","webp"];
        const ext = file.name.split(".").pop().toLowerCase();
        if (!file.type.startsWith("image/") && !validExt.includes(ext)) {
            showWarning(
                langData['validation_error'] || 'Validation Error',
                langData['allow_images_only'] || 'Allow images only (jpg, jpeg, png, gif, webp)'
            );
            input.value = "";
            return;
        }
        const reader = new FileReader();
        reader.onload = e => {
            preview.src = e.target.result;
            preview.classList.remove("d-none");
            label.classList.add("d-none");
            btnRemove.classList.remove("d-none");
        };
        reader.readAsDataURL(file);
    }
}
function initAttachmentsUpload(existingAttachments = []) {
    const dropArea = document.getElementById("attachmentsDropArea");
    const input = document.getElementById("attachments");
    const list = document.getElementById("attachmentsList");
    let attachmentsData = [];
    existingAttachments.forEach(att => {
        attachmentsData.push({
            type: 'existing',
            id: att.id,
            name: att.name,
            url: att.url,
            size: att.size
        });
    });
    renderAttachments();
    dropArea.addEventListener("click", () => input.click());
    ["dragenter", "dragover"].forEach(ev =>
        dropArea.addEventListener(ev, e => {
            e.preventDefault();
            dropArea.classList.add("border-primary", "bg-light");
        })
    );
    ["dragleave", "drop"].forEach(ev =>
        dropArea.addEventListener(ev, e => {
            e.preventDefault();
            dropArea.classList.remove("border-primary", "bg-light");
        })
    );
    dropArea.addEventListener("drop", e => {
        const files = Array.from(e.dataTransfer.files);
        addFiles(files);
    });
    input.addEventListener("change", e => {
        const files = Array.from(e.target.files);
        addFiles(files);
        input.value = ""; 
    });
    function addFiles(files) {
        files.forEach(file => {
            attachmentsData.push({
                type: 'new',
                file: file,
                name: file.name,
                size: file.size
            });
        });
        renderAttachments();
    }
    function renderAttachments() {
        if (attachmentsData.length === 0) {
            list.innerHTML = '';
            return;
        }
        list.innerHTML = '<div class="list-group sortable-attachments">' +
            attachmentsData.map((att, index) => `
                <div class="list-group-item d-flex align-items-center" data-index="${index}">
                    <i class="fa-solid fa-file text-primary me-2 fs-5"></i>
                    <div class="flex-grow-1">
                        <div class="fw-medium">${att.name}</div>
                        <small class="text-muted">${formatFileSize(att.size)}</small>
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeAttachment(${index})"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            `).join('') +
            '</div>';
    }
    window.removeAttachment = function(index) {
        attachmentsData.splice(index, 1);
        renderAttachments();
    };
    window.getAttachmentsData = function() {
        return attachmentsData;
    };
}
function initImagesUpload(existingImages = []) {
    const dropArea = document.getElementById("imagesDropArea");
    const input = document.getElementById("images");
    const list = document.getElementById("imagesList");
    let imagesData = [];
    existingImages.forEach(img => {
        imagesData.push({
            type: 'existing',
            id: img.id,
            url: img.url,
            name: img.name || 'image'
        });
    });
    renderImages();
    dropArea.addEventListener("click", () => input.click());
    ["dragenter", "dragover"].forEach(ev =>
        dropArea.addEventListener(ev, e => {
            e.preventDefault();
            dropArea.classList.add("border-primary", "bg-light");
        })
    );
    ["dragleave", "drop"].forEach(ev =>
        dropArea.addEventListener(ev, e => {
            e.preventDefault();
            dropArea.classList.remove("border-primary", "bg-light");
        })
    );
    dropArea.addEventListener("drop", e => {
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        addFiles(files);
    });
    input.addEventListener("change", e => {
        const files = Array.from(e.target.files);
        addFiles(files);
        input.value = "";
    });
    function addFiles(files) {
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = e => {
                imagesData.push({
                    type: 'new',
                    file: file,
                    preview: e.target.result,
                    name: file.name
                });
                renderImages();
            };
            reader.readAsDataURL(file);
        });
    }
    function renderImages() {
        if (imagesData.length === 0) {
            list.innerHTML = '';
            return;
        }
        list.innerHTML = imagesData.map((img, index) => `
            <div class="col-4 col-md-3 col-lg-2" data-index="${index}">
                <div class="card">
                    <div class="position-relative">
                        <img src="${img.preview || img.url}" class="card-img-top" style="height: 100px; object-fit: contain;">
                        <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1" onclick="removeImage(${index})"><i class="fa-solid fa-x"></i></button>
                    </div>
                    <div class="card-body p-2">
                        <small class="text-muted text-truncate d-block">${img.name}</small>
                    </div>
                </div>
            </div>
        `).join('');
    }
    window.removeImage = function(index) {
        imagesData.splice(index, 1);
        renderImages();
    };
    window.getImagesData = function() {
        return imagesData;
    };
}
function init360ImagesUpload(existing360Images = []) {
    const dropArea = document.getElementById("images360DropArea");
    const input = document.getElementById("images360");
    const list = document.getElementById("images360List");
    let images360Data = [];
    existing360Images.forEach(img => {
        images360Data.push({
            type: 'existing',
            id: img.id,
            url: img.url,
            name: img.name || '360-image'
        });
    });
    render360Images();
    dropArea.addEventListener("click", () => input.click());
    ["dragenter", "dragover"].forEach(ev =>
        dropArea.addEventListener(ev, e => {
            e.preventDefault();
            dropArea.classList.add("border-primary", "bg-light");
        })
    );
    ["dragleave", "drop"].forEach(ev =>
        dropArea.addEventListener(ev, e => {
            e.preventDefault();
            dropArea.classList.remove("border-primary", "bg-light");
        })
    );
    dropArea.addEventListener("drop", e => {
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        addFiles(files);
    });
    input.addEventListener("change", e => {
        const files = Array.from(e.target.files);
        addFiles(files);
        input.value = "";
    });
    function addFiles(files) {
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = e => {
                images360Data.push({
                    type: 'new',
                    file: file,
                    preview: e.target.result,
                    name: file.name
                });
                render360Images();
            };
            reader.readAsDataURL(file);
        });
    }
    function render360Images() {
        if (images360Data.length === 0) {
            list.innerHTML = '';
            return;
        }
        list.innerHTML = images360Data.map((img, index) => `
            <div class="col-4 col-md-3 col-lg-2" data-index="${index}">
                <div class="card border-info">
                    <div class="position-relative">
                        <img src="${img.preview || img.url}" class="card-img-top" style="height: 100px; object-fit: contain;">
                        <div class="position-absolute top-0 start-0 m-1">
                            <span class="badge bg-info">360°</span>
                        </div>
                        <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1" onclick="remove360Image(${index})"><i class="fa-solid fa-x"></i></button>
                    </div>
                    <div class="card-body p-2">
                        <small class="text-muted text-truncate d-block">${img.name}</small>
                    </div>
                </div>
            </div>
        `).join('');
    }
    window.remove360Image = function(index) {
        images360Data.splice(index, 1);
        render360Images();
    };
    window.get360ImagesData = function() {
        return images360Data;
    };
}
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
function langTab(lang, d) {
    return `
        <div class="tab-pane fade ${lang === 'en' ? 'show active' : ''}" id="tab-${lang}">
            <div class="mb-3">
                <label class="form-label">Title</label>
                <input type="text" class="form-control" id="title_${lang}" value="${d.title?.[lang] || ''}">
            </div>
            <div class="mb-3">
                <label class="form-label">Content</label>
                <textarea class="form-control tinymce" id="content_${lang}" rows="10">${d.content?.[lang] || ''}</textarea>
            </div>
        </div>
    `;
}
$(document).on('click', '#btnSaveContent', function() {
    const formData = new FormData($('#contentForm')[0]);
    const attachments = window.getAttachmentsData();
    attachments.forEach((att, index) => {
        if (att.type === 'new') {
            formData.append('new_attachments[]', att.file);
        } else {
            formData.append('existing_attachments[]', att.id);
        }
    });
    const images = window.getImagesData();
    images.forEach((img, index) => {
        if (img.type === 'new') {
            formData.append('new_images[]', img.file);
        } else {
            formData.append('existing_images[]', img.id);
        }
    });
    const images360 = window.get360ImagesData();
    images360.forEach((img, index) => {
        if (img.type === 'new') {
            formData.append('new_images360[]', img.file);
        } else {
            formData.append('existing_images360[]', img.id);
        }
    });
    formData.append("poles_id", $("#poles_id").val() || "");
    formData.append("content_id", $("#content_id").val() || "");
    formData.append("title_en", $("#title_en").val());
    formData.append("title_lo", $("#title_lo").val());
    formData.append("title_th", $("#title_th").val());
    formData.append("content_en", tinymce.get('content_en')?.getContent() || '');
    formData.append("content_lo", tinymce.get('content_lo')?.getContent() || '');
    formData.append("content_th", tinymce.get('content_th')?.getContent() || '');
    const cover = $("#cover")[0].files[0] || null;
    if (cover) {
        formData.append("cover", cover);
    }
    formData.append("ex_cover", $("#ex_cover").val());
    $.ajax({
        url: `${BASE_URL}/api/poles/save-content`,
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function(res) {
            if (res.status === 'success') {
                showSuccess('Success', langData['saved_successfully']);
                initPolesTable();
                $('#windModal').modal('hide');
            }
        }
    });
});