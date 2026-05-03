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
        order: [[0, 'asc']],
        ajax: { 
            url: `${BASE_URL}/api/types.list`, 
            type: "POST",
            data: function(d){
                d.status = $('#filter_type_status').val();
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
            data: 'status',
            orderable: true,
            render: function (status, type, row) {
                const isChecked = row.status === 'active' ? 'checked' : '';
                return `
                    <div class="form-check form-switch mb-0">
                        <input class="form-check-input update-item-switch" type="checkbox" role="switch"id="switch_${row.type_id}" data-id="${row.type_id}" data-type="type" ${isChecked} style="cursor:pointer;">
                    </div>
                `;
            }
        },{ 
            data: "type_icon",
            orderable: false,
            searchable: false,
            className: 'text-center',
            render: function (data, type, row) {
                if (!data) {
                    let color = row.default_color || '#d4821e';
                    return `
                        <svg width="20" height="52" viewBox="0 0 20 52" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">
                            <circle cx="3" cy="49" r="3.5" fill="rgba(255,255,255,0.85)" stroke="${color}" stroke-width="1.5"/>
                            <line x1="3" y1="46" x2="3" y2="3" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>
                            <line x1="3" y1="5"  x2="15" y2="5" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round"/>
                            <line x1="3" y1="14" x2="11" y2="14" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round"/>
                            <line x1="3" y1="32" x2="-5" y2="32" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round"/>
                            <circle cx="-5" cy="32" r="1.8" fill="${color}" stroke="#ffffff" stroke-width="0.8"/>
                            <circle cx="15" cy="5"  r="2.2" fill="${color}"  stroke="#ffffff" stroke-width="0.8"/>
                            <circle cx="11" cy="14" r="1.8" fill="${color}" stroke="#ffffff" stroke-width="0.8"/>
                        </svg>
                    `;
                }
                return `
                    <img src="${BASE_URL}/${data}" style="height:60px; border-radius:6px; object-fit:contain;" loading="lazy">
                `;
            }
        },{ 
            data: "type_name",
            orderable: true,
            render: function (data, type, row) {
                if (data) {
                    return data.replace(/\r\n|\n/g, '<br />');
                }
                return data;
            }
        },{ 
            data: "type_name_display",
            orderable: true,
            render: function (data, type, row) {
                if (data) {
                    return data.replace(/\r\n|\n/g, '<br />');
                }
                return data;
            }
        },{ 
            data: "created_at",
            orderable: true,
        },{ 
            data: null,
            orderable: false,
            className: "text-end",
            render: function(row){
                return `
                    <div class="btn-group border rounded-3 bg-white">
                        <button class="btn btn-link text-warning py-1 manage-type" data-id="${row.type_id}"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="btn btn-link text-danger py-1 border-start delete-type" data-id="${row.type_id}"><i class="fa-regular fa-trash-can"></i></button>
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
            var $filter = $('#tb_type_filter');
            var input = $filter.find('input').unbind(); 
            input.bind('keypress', function(e) {
                if (e.keyCode == 13) {
                    self.search(input.val()).draw();
                }
            });
            if ($filter.find('.manage-type[data-id=""]').length === 0) {
                let btn = `
                    <button class="btn btn-primary btn-sm manage-type ms-1" data-id="">
                        <i class="fa-solid fa-plus me-2"></i><span>${langData['pole_types'] || 'Wind Measurement Equipment'}</span>
                    </button>
                `;
                $filter.append(btn);
            }
            if ($filter.find('.icon-type').length === 0) {
                let btn = `
                    <button class="btn btn-info btn-sm icon-type ms-1">
                        <i class="fa-solid fa-gears me-2"></i><span>${langData['icon'] || "Icon"}</span>
                    </button>
                `;
                $filter.append(btn);
            }
            if ($filter.find('.item-order').length === 0) {
                let btn = `
                    <button class="btn btn-warning btn-sm item-order ms-1" data-type="pole_types">
                        <i class="fa-solid fa-sort me-2"></i><span>${langData['sort'] || 'Sort'}</span>
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
$(document).on('click', '.delete-type', function() {
    let type_id = $(this).data("id");
    showConfirm(langData['confirm'], langData['confirm_delete'], function(){
        $.ajax({
            url: `${BASE_URL}/api/types.delete`,
            method: 'POST',
            data: { id: type_id },
            dataType: 'json',
            success: function(res) {
                if(res.status === true){
                    showSuccess(langData['deleted_successfully']);
                    initTypesTable();
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
$(document).on('click', '.manage-type', function() {
    let type_id = $(this).data("id");
    $.ajax({
        url: `${BASE_URL}/api/types.get`,
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
                    <h5 class="modal-title">${langData['manageType'] || 'Manage Type'}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                `);
                modalEl.find(".modal-footer").html(`
                    <button type="submit" class="btn btn-primary me-2 save-type">${langData['save'] || 'Save'}</button>
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">${langData['close'] || 'Close'}</button>
                `);
                modalEl.find(".modal-body").html(`
                    <input type="hidden" name="type_id" id="type_id" value="${type_id ?? ''}">
                    ${renderCover(typeData, 'poles')}
                    <input type="hidden" id="ex_cover" value="${typeData.type_icon ? typeData.type_icon : ''}">
                    <div class="mb-3">
                        <label class="mb-2 required">${langData['type_name'] || 'Type Name'}</label>
                        <input type="text" class="form-control obj-required" id="type_name" maxlength="255">
                    </div>
                    <div class="mb-3">
                        <label class="mb-2">${langData['display'] || 'Display'}</label>
                        <textarea class="form-control" id="type_name_display"></textarea>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="mb-2 required">${langData['color'] || 'Color'}</label>
                            <input type="color" class="form-control obj-required" id="default_color" value="${typeData.default_color}">
                        </div>
                    </div>
                `);
                if (typeData) {
                    $("#type_id").val(typeData.type_id);
                    $("#type_name").val(typeData.type_name);
                }
                initCoverUpload();
            } else {
                showError(langData['cannot_load']);
            }
        },
        error: function(){
            showError(langData['cannot_load']);
        }
    });
});
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
        showWarning(langData['required_star_message'] || 'Please fill all fields marked with *');
        $('.is-invalid').first().focus();
        return;
    }
    saveType();
});
function saveType() {
    const btn = $(".save-type");
    btn.prop("disabled", true);
    const formData = new FormData();
    formData.append("type_id", $("#type_id").val() || "");
    formData.append("type_name", $("#type_name").val() || "");
    formData.append("type_name_display", $("#type_name_display").val() || "");
    formData.append("ex_cover", $("#ex_cover").val());
    formData.append("default_color", $("#default_color").val() || "#f5a623");
    const cover = $("#cover")[0].files[0] || null;
    if (cover) {
        formData.append("cover", cover);
    }
    Swal.fire({
        title: langData['saving'] || 'Saving...',
        html: `
            <p>${langData['please_do_not_close_this_page'] || 'Please do not close this page.'}</p>
            <div class="progress mt-2">
                <div id="swal-progress" class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width:0%">0%</div>
            </div>
        `,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });
    $.ajax({
        url: `${BASE_URL}/api/types.save`,
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
                if (typeof initTypesTable === "function") initTypesTable();
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
$(document).on('click', '.icon-type', function () {
    openIconSetting('pole');
});