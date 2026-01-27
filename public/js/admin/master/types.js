let tb_type;
function initTypesTable() {
    let oldPage = 0;
    if ($.fn.DataTable.isDataTable('#tb_type')) {
        oldPage = $('#tb_type').DataTable().page();
        $('#tb_type').DataTable().destroy();
    }
    if ($.fn.DataTable.isDataTable('#tb_type')) {
        $('#tb_type').DataTable().ajax.reload(null, false);
        return;
    }
    tb_type = $('#tb_type').DataTable({
        processing: true,
        serverSide: true,
        ordering: false,
        order: [[3, 'desc']],
        ajax: { 
            url: "api/types/list", 
            type: "POST",
            data: function(d){
                d.status = $('#filter_type_status').val();
            }
        },
        columns: [      
            { 
                data: "type_icon",
                orderable: false,
                searchable: false,
                render: function(data){
                    if (!data) {
                        return `<img src="${BASE_URL}/public/images/noimage.jpg" style="height:60px; border-radius:6px; object-fit:cover;">`;
                    }
                    return `
                        <img src="${BASE_URL}/${data}" style="height:60px; border-radius:6px; object-fit:cover;">
                    `;
                }
            },
            { data: "type_name" },
            { 
                data: 'status',
                render: function (status, type, row) {
                    let badgeColor = "";
                    switch(status) {
                        case 'active':
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
                className: "text-end",
                render: function(row){
                    return `
                        <button class="btn btn-light text-secondary manage-type" data-id="${row.type_id}"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="btn btn-light text-secondary text-danger delete-type" data-id="${row.type_id}"><i class="fa-regular fa-trash-can"></i></button>
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
            var input = $('#tb_type_filter input').unbind();
            var self = this.api();
            input.bind('keypress', function(e){
                if(e.keyCode == 13) {
                    self.search(input.val()).draw();
                }
            });
            let $filter = $('#tb_type_filter');
            let btn = `
                <button class="btn btn-primary btn-sm manage-type" data-id="">
                    <i class="fa-solid fa-plus"></i> <span data-i18n="pole_types"></span>
                </button>
            `;
            $filter.append(btn);
            var input = $('#tb_type_filter input').unbind();
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
$(document).on('click', '.delete-type', function() {
    let type_id = $(this).data("id");
    showConfirm(langData['confirm'], langData['confirm_delete'], function(){
        $.ajax({
            url: `${BASE_URL}/api/types/delete`,
            method: 'POST',
            data: { id: type_id },
            dataType: 'json',
            success: function(res) {
                if(res.status === true){
                    showSuccess('Success', langData['deleted_successfully']);
                    initTypesTable();
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
$(document).on('click', '.manage-type', function() {
    let type_id = $(this).data("id");
    $.ajax({
        url: `${BASE_URL}/api/types/get`,
        method: 'POST',
        data: { id: type_id },
        dataType: 'json',
        success: function(res) {
            if(res.status === true){
                let typeData = res.data;
                let modalEl = $('#windModal');
                let modal = new bootstrap.Modal(modalEl[0]);
                modal.show();
                modalEl.find(".modal-header").html(`
                    <h5 class="modal-title" data-i18n="${(type_id) ? 'manageType' : 'newType'}"></h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                `);
                modalEl.find(".modal-footer").html(`
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" data-i18n="close"></button>
                    <button type="submit" class="btn btn-primary save-type" data-i18n="save"></button>
                `);
                modalEl.find(".modal-body").html(`
                    <input type="hidden" name="type_id" id="type_id" value="${type_id ?? ''}">
                    <div id="coverDropArea" class="cover-drop-area text-center mb-3">
                        <input type="file" id="type_icon" accept="image/*" hidden>
                        <div id="coverPreviewWrapper" class="h-100 d-flex align-items-center justify-content-center">
                            ${typeData.type_icon 
                                ? `<img id="coverPreview" src="${typeData.type_icon}" class="img-fluid rounded shadow-sm" style="max-height:150px;">`
                                : `<img id="coverPreview" class="img-fluid rounded shadow-sm d-none" style="max-height:150px;">`
                            }
                        </div>
                        <div id="coverDropLabel" class="${typeData.type_icon ? 'd-none' : ''}">
                            <div class="fw-bold fs-6 mt-2" data-i18n="dropHere"></div>
                            <div class="text-muted small mb-2">
                                <span data-i18n="or"></span> <span data-i18n="choose"></span>
                            </div>
                        </div>
                        <div class="text-muted small mt-2" data-i18n="allow_images_only"></div>
                        <button type="button" id="btnRemoveCover" class="btn btn-sm btn-outline-danger mt-2 ${typeData.type_icon ? '' : 'd-none'}" data-i18n="remove"></button>
                    </div>
                    <input type="hidden" id="ex_type_icon" value="${typeData.type_icon ? typeData.type_icon : ''}">
                    <div class="mb-3">
                        <label class="mb-2 required" data-i18n="type_name"></label>
                        <input type="text" class="form-control obj-required" id="type_name" maxlength="255">
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="mb-2 required" data-i18n="status"></label>
                            <select id="status" class="form-select obj-required"></select>
                        </div>
                    </div>
                `);
                initSelect2Remote('#status', `${BASE_URL}/api/types/filter`, { type: 'status' });
                if (typeData) {
                    $("#type_id").val(typeData.type_id);
                    $("#type_name").val(typeData.type_name);
                    if (typeData.status) {
                        let statusName = typeData.status.charAt(0).toUpperCase() + typeData.status.slice(1);
                        var newOptionStatus = new Option(statusName, typeData.status, true, true);
                        $('#status').append(newOptionStatus).trigger('change');
                    }
                    initCoverUpload();
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
function initCoverUpload() {
    const dropArea = document.getElementById("coverDropArea");
    const input = document.getElementById("type_icon");
    const preview = document.getElementById("coverPreview");
    const label = document.getElementById("coverDropLabel");
    const btnRemove = document.getElementById("btnRemoveCover");
    const exIcon = document.getElementById("ex_type_icon");
    dropArea.addEventListener("click", () => input.click());
    ["dragenter", "dragover"].forEach(ev =>
        dropArea.addEventListener(ev, e => {
            e.preventDefault();
            dropArea.classList.add("border-primary");
        })
    );
    ["dragleave", "drop"].forEach(ev =>
        dropArea.addEventListener(ev, e => {
            e.preventDefault();
            dropArea.classList.remove("border-primary");
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
        preview.src = "";
        preview.classList.add("d-none");
        label.classList.remove("d-none");
        btnRemove.classList.add("d-none");
        exIcon.value = "";
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
$(document).on('click', '.save-type', function () {
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
    saveType();
});
function saveType() {
    const btn = $(".save-type");
    const name = $("#type_name").val();
    if (!name) {
        showError('Error', 'Please enter type name');
        return;
    }
    btn.prop("disabled", true);
    const formData = new FormData();
    formData.append("type_id", $("#type_id").val() || "");
    formData.append("type_name", name);
    formData.append("status", $("#status").val());
    formData.append("ex_type_icon", $("#ex_type_icon").val());
    const type_icon = $("#type_icon")[0].files[0] || null;
    if (type_icon) {
        formData.append("type_icon", type_icon);
    }
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
        url: "api/types/save",
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
                if (typeof initTypesTable === "function") initTypesTable();
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