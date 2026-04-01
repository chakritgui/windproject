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
        order: [[0, 'asc']],
        ajax: { 
            url: `${BASE_URL}/api/poles.list`, 
            type: "POST",
            data: function(d){
                d.status = $('#filter_pole_status').val();
                d.project = $('#filter_pole_project').val();
                d.type = $('#filter_pole_type').val();
                d.installation = $('#filter_pole_installation').val();
            }
        },
        columns: [{
            data: "item_order", 
            orderable: false,
            searchable: false,
            render: function (data, type, row, meta) {
                return meta.row + meta.settings._iDisplayStart + 1;
            }
        },{ 
            data: "poles_code",
            orderable: true, 
        },{ 
            data: "type_name",
            orderable: true,
        },{ 
            data: "project_name",
            orderable: true, 
        },{ 
            data: "poles_lat",
            orderable: true,
        },{ 
            data: "poles_lng",
            orderable: true,
        },{ 
            data: "installations_name",
            orderable: true, 
        },{ 
            data: "created_at",
            orderable: true,
        },{ 
            data: 'status',
            orderable: true,
            render: function (status, type, row) {
                let badge = "";
                switch(status) {
                    case 'online':
                        badge = "success";
                        break;
                    case 'inactive':
                        badge = "secondary";
                        break;
                }
                return `
                    <div class="d-flex align-items-center gap-2">
                        <span class="badge bg-${badge}-subtle text-${badge}" style="font-weight:400;">${langData[status] || status}</span>
                    </div>
                `;
            }
        },{ 
            data: null,
            orderable: false,
            render: function(row){
                const activeLangs = row.settings?.language ? row.settings.language.split(',') : ['en'];
                const defaultLang = row.settings?.language_content || 'en';
                let statusHtml = `
                    <div class="mt-1 d-flex gap-1 flex-wrap">
                        ${activeLangs.map(lang => {
                            const status = row[`${lang}_status`]; 
                            return renderLangStatus(lang, status);
                        }).join('')}
                    </div>`;
                return (row.content_id) ? `
                    <div class="btn-group border rounded-3 bg-white mb-3">
                        <a onclick="openContent('${row.content_slug}', 'preview')" class="btn btn-link text-info py-1"><i class="fa-solid fa-eye"></i></a> 
                        <button class="btn btn-link text-warning py-1 border-start manage-content" data-pole="${row.poles_id}" data-content="${row.content_id}"><i class="fa-solid fa-pen-to-square"></i></button> 
                        <button class="btn btn-link text-danger py-1 border-start delete-content" data-pole="${row.poles_id}" data-content="${row.content_id}"><i class="fa-solid fa-trash-can"></i></button> 
                    </div>
                    ${statusHtml}
                ` : `
                    <button class="btn btn-sm btn-light manage-content" data-pole="${row.poles_id}" data-content=""><i class="fa-solid fa-plus"></i></button>
                `;
            }
        },{ 
            data: null,
            orderable: false,
            className: "text-end",
            render: function(row){
                return `
                    <div class="btn-group border rounded-3 bg-white">
                        <button class="btn btn-link text-warning py-1 manage-pole" data-id="${row.poles_id}"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="btn btn-link text-danger py-1 border-start delete-pole" data-id="${row.poles_id}"><i class="fa-regular fa-trash-can"></i></button>
                    </div>
                `;
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
            var self = this.api();
            var $filter = $('#tb_pole_filter');
            var input = $filter.find('input').unbind(); 
            input.bind('keypress', function(e) {
                if (e.keyCode == 13) {
                    self.search(input.val()).draw();
                }
            });
            if ($filter.find('.manage-pole[data-id=""]').length === 0) {
                let btn = `
                    <button class="btn btn-primary btn-sm manage-pole" data-id="">
                        <i class="fa-solid fa-plus"></i> <span>${langData['poles'] || 'Poles'}</span>
                    </button>
                `;
                $filter.append(btn);
            }
            if ($filter.find('.item-order').length === 0) {
                let btn = `
                    <button class="btn btn-warning btn-sm item-order ms-2" data-type="poles">
                        <i class="fa-solid fa-sort"></i> <span>${langData['sort'] || 'Sort'}</span>
                    </button>
                `;
                $filter.append(btn);
            }
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
            url: `${BASE_URL}/api/poles.delete`,
            method: 'POST',
            data: { id: poles_id },
            dataType: 'json',
            success: function(res) {
                if(res.status === true){
                    showSuccess(langData['deleted_successfully']);
                    initPolesTable();
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
$(document).on('click', '.delete-content', function() {
    let poles_id = $(this).data("pole");
    let content_id = $(this).data("content");
    showConfirm(langData['confirm'], langData['confirm_delete'], function(){
        $.ajax({
            url: `${BASE_URL}/api/poles.deletecontent`,
            method: 'POST',
            data: { poles_id: poles_id, content_id: content_id },
            dataType: 'json',
            success: function(res) {
                if(res.status === true){
                    showSuccess(langData['deleted_successfully']);
                    initPolesTable();
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
$(document).on('click', '.manage-pole', function() {
    let poles_id = $(this).data("id");
    $.ajax({
        url: `${BASE_URL}/api/poles.get`,
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
                    <h5 class="modal-title">${langData['managePole'] || 'Manage Pole'}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                `);
                modalEl.find(".modal-footer").html(`
                    <button type="submit" class="btn btn-primary me-2 save-pole">${langData['save'] || 'Save'}</button>
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">${langData['close'] || 'Close'}</button>
                `);
                modalEl.find(".modal-body").html(`
                    <input type="hidden" name="poles_id" id="poles_id" value="${poles_id ?? ''}">
                    <div class="mb-3">
                        <label class="mb-2 required">${langData['pole_code'] || 'Pole Code'}</label>
                        <input type="text" class="form-control obj-required" id="poles_code" maxlength="255">
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="mb-2 required">${langData['project'] || 'Project'}</label>
                            <select id="project" class="form-select obj-required"></select>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="mb-2 required">${langData['type'] || 'Type'}</label>
                            <select id="type" class="form-select obj-required"></select>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="mb-2 required">${langData['latitude'] || 'Latitude'}</label>
                            <input type="text" class="form-control obj-required" id="latitude" maxlength="255">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="mb-2 required">${langData['longitude'] || 'Longitude'}</label>
                            <input type="text" class="form-control obj-required" id="longitude" maxlength="255">
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="mb-2 required">${langData['installation'] || 'Installation'}</label>
                            <select id="installation" class="form-select obj-required"></select>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="mb-2 required">${langData['status'] || 'Status'}</label>
                            <select id="status" class="form-select obj-required"></select>
                        </div>
                    </div>
                `);
                initSelect2Remote('#status', `${BASE_URL}/api/poles.filter`, { type: 'status' });
                initSelect2Remote('#project', `${BASE_URL}/api/poles.filter`, { type: 'project' });
                initSelect2Remote('#type', `${BASE_URL}/api/poles.filter`, { type: 'type' });
                initSelect2Remote('#installation', `${BASE_URL}/api/poles.filter`, { type: 'installation' });
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
                showError(langData['cannot_load']);
            }
        },
        error: function(){
            showError(langData['cannot_load']);
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
        showWarning(langData['required_star_message'] || 'Please fill all fields marked with *');
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
            <p>${langData['please_do_not_close_this_page'] || 'Please do not close this page.'}</p>
            <div class="progress mt-2" style="height: 10px;">
                <div class="progress-bar progress-bar-striped progress-bar-animated bg-primary" 
                    role="progressbar" 
                    style="width: 100%">
                </div>
            </div>
        `,
        allowOutsideClick: false,
        showConfirmButton: false, 
        didOpen: () => {
            Swal.showLoading();
        }
    });
    $.ajax({
        url: `${BASE_URL}/api/poles.save`,
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
                showSuccess(langData['saved_successfully']);
                if (typeof initPolesTable === "function") initPolesTable();
                $('#windModal').modal('hide');
            } else {
                showError((langData['cannot_save'] || 'Error: ') + ' ' + (langData[res.message] || 'Unknown error'));
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
$(document).on('click', '.manage-content', function () {
    let pole = $(this).data("pole");
    let content = $(this).data("content");
    manageContent(pole, content);
});
function manageContent(poles_id, content_id) {
    $.post(`${BASE_URL}/api/poles.gets`, {
        poles_id, content_id
    }, function(res) {
        if(res.status !== "success") return;
        let d = res.data;
        const translates = d.translates;
        let ENABLE_TRANSLATE = translates.ENABLE_TRANSLATE;
        let GOOGLE_API_KEY = translates.GOOGLE_API_KEY;
        let $modal = $("#windModal");
        const $dialog = $modal.find(".modal-dialog");
        $dialog.removeClass("modal-fullscreen");
        let modal = new bootstrap.Modal($modal[0]);
        $modal.find(".modal-header").html(`
            <h5 class="modal-title">${langData['content'] || 'Content'}</h5>
            <div class="ms-auto">
                <button type="button" class="btn btn-sm btn-light me-2" id="btn-fullscreen">
                    <i class="fa-regular fa-window-maximize"></i>
                </button>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
        `);
        $modal.find("#btn-fullscreen").on("click", function() {
            $modal.find(".modal-dialog").toggleClass("modal-fullscreen");
            const icon = $(this).find("i");
            icon.toggleClass("fa-regular fa-window-maximize fa-regular fa-window-restore");
        });
        $modal.find(".modal-footer").html(`
            <div class="row w-100"> 
                <div class="col-6 d-flex align-items-center">
                    ${(ENABLE_TRANSLATE == 1 && GOOGLE_API_KEY) ? `
                        <div class="form-check mb-0">
                            <input class="form-check-input" type="checkbox" id="auto_translate" value="yes">
                            <label class="form-check-label" for="auto_translate">
                                ${langData['auto_translate'] || 'Auto Translate'}
                            </label>
                        </div>
                        ` : ``}
                </div>
                <div class="col-6 text-end">
                    <button type="button" class="btn btn-primary me-2" id="btnSaveContent">
                        ${langData['save'] || 'Save'}
                    </button>
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
                        ${langData['close'] || 'Close'}
                    </button>
                </div>
            </div>
        `);
        $modal.find(".modal-body").html(getContentForm(d, poles_id, content_id));
        initCoverUpload();
        initAttachmentsUpload(d.attachments || []);
        initImagesUpload(d.images || []);
        initPresentationUpload(d.presentation || []);
        init360ImagesUpload(d.images360 || []);
        initSummernote();
        modal.show();
    }, "json");
}
function getContentForm(d, poles_id, content_id) {
    return `
        <form id="contentForm">
            ${renderTabs()}
            <div class="tab-content">
                <div class="tab-pane fade show active" id="tab-basic">
                    ${renderCover(d)}
                    ${renderLangTabs(d)}
                </div>
                ${renderPresentation()}
                ${renderGallery()}
                ${render360()}
                ${renderFiles()}
            </div>
            <input type="hidden" id="poles_id" value="${poles_id || ""}">
            <input type="hidden" id="content_id" value="${content_id || ""}">
        </form>
    `;
}
$(document).on('click', '#btnSaveContent', function() {
    let errors = [];
    $('.is-invalid').removeClass('is-invalid');
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
    executeSave();
});
function executeSave() {
    const btn = $(this); 
    btn.prop("disabled", true);
    const formData = new FormData();
    const attachments = window.getAttachmentsData ? window.getAttachmentsData() : [];
    attachments.forEach((att) => {
        if (att.type === 'new') {
            formData.append('new_attachments[]', att.file);
        } else {
            formData.append('existing_attachments[]', att.id);
        }
    });
    const images = window.getImagesData ? window.getImagesData() : [];
    images.forEach((img) => {
        if (img.type === 'new') {
            formData.append('new_images[]', img.file);
        } else {
            formData.append('existing_images[]', img.id);
        }
    });
    const images360 = window.get360ImagesData ? window.get360ImagesData() : [];
    images360.forEach((img) => {
        if (img.type === 'new') {
            formData.append('new_images360[]', img.file);
        } else {
            formData.append('existing_images360[]', img.id);
        }
    });
    const presentation = window.getPresentationData ? window.getPresentationData() : [];
    presentation.forEach((img) => {
        if (img.type === 'new') {
            formData.append('new_presentation[]', img.file);
        } else {
            formData.append('existing_presentation[]', img.id);
        }
    });
    formData.append("poles_id", $("#poles_id").val() || "");
    formData.append("content_id", $("#content_id").val() || "");
    if (typeof currentFolderId !== 'undefined') {
        formData.append("parent_id", currentFolderId);
    }
    ['en', 'lo', 'th'].forEach(lang => {
        const $editor = $(`#content_${lang}`);
        const $title = $(`#title_${lang}`);
        if ($editor.length) {
            let htmlContent = $editor.summernote('code').trim();
            const hasText = htmlContent.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim().length > 0;
            const hasImage = htmlContent.includes('<img');
            if (hasText || hasImage) {
                formData.append(`content_${lang}`, htmlContent);
            } else {
                formData.append(`content_${lang}`, ''); 
            }
        }
        if ($title.length) {
            formData.append(`title_${lang}`, $title.val().trim());
        }
    });
    formData.append("auto_translate", $("#auto_translate").is(":checked") ? 'yes' : 'no');
    const coverFile = $("#cover")[0]?.files[0] || null;
    if (coverFile) {
        formData.append("cover", coverFile);
    }
    formData.append("ex_cover", $("#ex_cover").val() || "");
    formData.append("cover_display", $("input[name='cover_display']:checked").val() || "no");
    Swal.fire({
        title: langData['saving'] || 'Saving...',
        html: `
            <p>${langData['please_do_not_close_this_page'] || 'Please do not close this page.'}</p>
            <div class="progress mt-2" style="height: 20px;">
                <div id="swal-progress" class="progress-bar progress-bar-striped progress-bar-animated bg-primary" role="progressbar" style="width: 0%">0%</div>
            </div>
        `,
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    $.ajax({
        url: `${BASE_URL}/api/poles.savecontent`,
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
            }, false);
            return xhr;
        },
        success: function (res) {
            if (res.status === 'success' || res.status === true) {
                Swal.fire({
                    icon: 'success',
                    title: langData['saved_successfully'] || 'Saved!',
                }).then(() => {
                    if (typeof initPolesTable === "function") initPolesTable();
                    $('#windModal').modal('hide');
                });
            } else {
                showError((langData['cannot_save'] || 'Error: ') + (res.message || 'Unknown error'));
            }
        },
        error: function (xhr) {
            let msg = langData['cannot_save'] || 'Cannot save';
            try {
                let res = JSON.parse(xhr.responseText);
                if (res.message) msg += ": " + res.message;
            } catch (e) {}
            showError(msg);
        },
        complete: function() {
            btn.prop("disabled", false);
            if (Swal.isVisible() && $('.swal2-loader').is(':visible')) {
                Swal.close();
            }
        }
    });
}