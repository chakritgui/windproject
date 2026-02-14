let tb_project;
function initProjectsTable() {
    let oldPage = 0;
    if ($.fn.DataTable.isDataTable('#tb_project')) {
        oldPage = $('#tb_project').DataTable().page();
        $('#tb_project').DataTable().destroy();
    }
    if ($.fn.DataTable.isDataTable('#tb_project')) {
        $('#tb_project').DataTable().ajax.reload(null, false);
        return;
    }
    tb_project = $('#tb_project').DataTable({
        processing: true,
        serverSide: true,
        order: [[7, 'desc']],
        ajax: { 
            url: `${BASE_URL}/api/projects.list`, 
            type: "POST",
            data: function(d){
                d.status = $('#filter_project_status').val();
                d.contract = $('#filter_contract').val();
                d.group = $('#filter_group').val();
            }
        },
        columns: [{ 
            data: "project_code",
            orderable: true,
        },{ 
            data: "project_name",
            orderable: true,
            render: function (data, type, row) {
                if (data) {
                    return data.replace(/\r\n|\n/g, '<br />');
                }
                return data;
            }
        },{ 
            data: "project_name_display",
            orderable: true,
            render: function (data, type, row) {
                if (data) {
                    return data.replace(/\r\n|\n/g, '<br />');
                }
                return data;
            }
        },{ 
            data: "contract_name",
            orderable: true, 
        },{ 
            data: "project_group_name",
            orderable: true, 
        },{ 
            data: "project_start",
            orderable: true, 
        },{ 
            data: "project_end",
            orderable: true,
        },{ 
            data: "created_at",
            orderable: true,
        },{ 
            data: 'project_status_name',
            orderable: true,
            render: function (data, type, row) {
                let color = row.project_status_color || '#3b82f6';
                let name = data || "-";
                return `
                    <div class="d-flex align-items-center">
                        <i class="fa-solid fa-circle me-2" style="color: ${color}; font-size: 0.8rem;"></i> 
                        <span>${name.replace(/\r\n|\n/g, '<br />')}</span>
                    </div>
                `;
            }
        },{ 
            data: 'project_background',
            orderable: true,
            render: function (data, type, row) {
                let project_opacity = row.project_opacity || 0;
                return `
                    ${(data) ? `
                        <div class="btn-group border rounded-3 bg-white mb-3">
                                <a href="${BASE_URL}/${row.project_background}" data-fancybox="pole-gallery" class="btn btn-link text-info py-1 border-start">
                                <i class="fa-solid fa-eye"></i>
                            </a>
                            <button class="btn btn-link text-warning py-1 border-start manage-background" data-id="${row.project_id}"><i class="fa-solid fa-pen-to-square"></i></button> 
                            <button class="btn btn-link text-danger py-1 border-start delete-background" data-id="${row.project_id}"><i class="fa-solid fa-trash-can"></i></button> 
                        </div>
                        <p><span data-i18n="opacity"></span> ${project_opacity}%</p>
                    ` : `
                        <button class="btn btn-sm btn-light manage-background" data-id="${row.project_id}"><i class="fa-solid fa-plus"></i></button>
                    `}
                `;
            }
        },{ 
            data: null,
            orderable: false,
            className: "text-end",
            render: function(row){
                return `
                    <div class="btn-group border rounded-3 bg-white">
                        <button class="btn btn-link text-warning py-1 manage-project" data-id="${row.project_id}"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="btn btn-link text-danger py-1 border-start delete-project" data-id="${row.project_id}"><i class="fa-regular fa-trash-can"></i></button>
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
            var $filter = $('#tb_project_filter');
            var input = $filter.find('input').unbind(); 
            input.bind('keypress', function(e) {
                if (e.keyCode == 13) {
                    self.search(input.val()).draw();
                }
            });
            if ($filter.find('.manage-contract[data-id=""]').length === 0) {
                let btn = `
                    <button class="btn btn-primary btn-sm manage-project" data-id=""><i class="fa-solid fa-plus"></i> <span>${langData['project'] || 'Project'}</span></button>
                `;
                $filter.append(btn);
            }
        },
        drawCallback: function(){
            getTableLang();
        }
    });
}
$(document).on('click', '.manage-background', function() {
    let project_id = $(this).data("id");
    $.post(`${BASE_URL}/api/projects/background`, {
        project_id
    }, function(res) {
        let bgData = res;
        let modalEl = $('#windModal');
        let modal = new bootstrap.Modal(modalEl[0]);
        modal.show();
        modalEl.find(".modal-header").html(`
            <h5 class="modal-title">${langData['manageBackground'] || 'Manage Background'}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        `);
        modalEl.find(".modal-footer").html(`
            <button type="submit" class="btn btn-primary me-2 save-background">${langData['save'] || 'Save'}</button>
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">${langData['close'] || 'Close'}</button>
        `);
        modalEl.find(".modal-body").html(`
            <form id="bgForm">
                <input type="hidden" id="project_id" value="${project_id}">
                <div id="coverDropArea" class="cover-drop-area text-center mb-3">
                    <input type="file" id="cover" accept="image/*" hidden>
                    <div id="coverPreviewWrapper" class="h-100 d-flex align-items-center justify-content-center">
                        ${bgData.project_background 
                            ? `<img id="coverPreview" src="${BASE_URL}/${bgData.project_background}" class="img-fluid rounded shadow-sm" style="max-height:150px;">`
                            : `<img id="coverPreview" class="img-fluid rounded shadow-sm d-none" style="max-height:150px;">`
                        }
                    </div>
                    <div id="coverDropLabel" class="${bgData.project_background ? 'd-none' : ''}">
                        <div class="fw-bold fs-6 mt-2">${langData['drop_here'] || 'Drop here or click to browse'}</div>
                        <div class="text-muted small mb-2">
                            <span>${langData['or'] || 'Or'}</span> <span>${langData['choose'] || 'Choose'}</span>
                        </div>
                    </div>
                    <div class="text-muted small mt-2">${langData['allow_images_only'] || 'Allow images only (jpg, jpeg, png, gif, webp)'}</div>
                    <button type="button" id="btnRemoveCover" class="btn btn-sm btn-outline-danger mt-2 ${bgData.project_background ? '' : 'd-none'}">${langData['remove'] || 'Remove'}</button>
                </div>
                <input type="hidden" id="ex_cover" value="${bgData.project_background ? bgData.project_background : ''}">
                <div class="mb-3">
                    <label for="bg_opacity" class="form-label d-flex justify-content-between">
                        <span>${langData['opacity'] || 'Opacity'}</span>
                        <span id="opacity_value"><strong>${bgData.project_opacity || 0}</strong>%</span>
                    </label>
                    <input type="range" class="form-range" id="bg_opacity" min="0" max="100" step="1" value="${bgData.project_opacity || 0}">
                </div>
            </form>
        `);
        initCoverUpload();
        $('#bg_opacity').on('input', function() {
            $('#opacity_value strong').text($(this).val());
        });
    });
});
$(document).on('click', '.delete-background', function() {
    let project_id = $(this).data("id");
    showConfirm(langData['confirm'], langData['confirm_delete'], function(){
        $.ajax({
            url: `${BASE_URL}/api/projects.deletebg`,
            method: 'POST',
            data: { id: project_id },
            dataType: 'json',
            success: function(res) {
                if(res.status === true){
                    showSuccess(langData['deleted_successfully']);
                    initProjectsTable();
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
$(document).on('click', '.save-background', function() {
    const btn = $(this); 
    $('.is-invalid').removeClass('is-invalid');
    let errors = [];
    $('.obj-required').each(function () {
        let value = $(this).val()?.trim() || '';
        if (!value) {
            $(this).addClass('is-invalid');
            errors.push(this.name || this.id);
        }
    });
    if (errors.length) {
        showWarning(langData['required_star_message'] || 'Please fill all fields marked with *');
        $('.is-invalid').first().focus();
        return;
    }
    const formData = new FormData($('#bgForm')[0]);
    formData.append("project_id", $("#project_id").val() || ""); 
    formData.append("bg_opacity", $("#bg_opacity").val() || "0");
    const cover = $("#cover")[0].files[0] || null;
    if (cover) {
        formData.append("cover", cover);
    }
    formData.append("ex_cover", $("#ex_cover").val());
    Swal.fire({
        title: langData['saving'] || 'Saving...',
        html: `
            <p>${langData['please_do_not_close_this_page'] || 'Please do not close this page.'}</p>
            <div class="progress mt-2" style="height: 20px;">
                <div id="swal-progress" class="progress-bar progress-bar-striped progress-bar-animated bg-primary" 
                    role="progressbar" style="width: 0%">0%</div>
            </div>
        `,
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    $.ajax({
        url: `${BASE_URL}/api/projects.savebg`,
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
            if (res.status === 'success') {
                showSuccess(langData['saved_successfully']);
                if (typeof initProjectsTable === "function") initProjectsTable();
                $('#windModal').modal('hide');
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
        }
    });
});
$(document).on('click', '.delete-project', function() {
    let project_id = $(this).data("id");
    showConfirm(langData['confirm'], langData['confirm_delete'], function(){
        $.ajax({
            url: `${BASE_URL}/api/projects.delete`,
            method: 'POST',
            data: { id: project_id },
            dataType: 'json',
            success: function(res) {
                if(res.status === true){
                    showSuccess(langData['deleted_successfully']);
                    initProjectsTable();
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
$(document).on('click', '.manage-project', function() {
    let project_id = $(this).data("id");
    $.ajax({
        url: `${BASE_URL}/api/projects.get`,
        method: 'POST',
        data: { id: project_id },
        dataType: 'json',
        success: function(res) {
            if(res.status === true){
                let projectData = res.data;
                let modalEl = $('#windModal');
                let modal = new bootstrap.Modal(modalEl[0]);
                modal.show();
                modalEl.find(".modal-header").html(`
                    <h5 class="modal-title">${langData['manageProject'] || 'Manage Project'}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                `);
                modalEl.find(".modal-footer").html(`
                    <button type="submit" class="btn btn-primary me-2 save-project">${langData['save'] || "Save"}</button>
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">${langData['close'] || "Close"}</button>
                `);
                modalEl.find(".modal-body").html(`
                    <input type="hidden" name="project_id" id="project_id" value="${project_id ?? ''}">
                    <div class="mb-3">
                        <label class="mb-2 required">${langData['project_name'] || 'Project Name'}</label>
                        <input type="text" class="form-control obj-required" id="project_name" maxlength="255">
                    </div>
                    <div class="mb-3">
                        <label class="mb-2">${langData['display'] || 'Display'}</label>
                        <textarea class="form-control" id="project_name_display"></textarea>
                    </div>
                    <div class="mb-3">
                        <label class="mb-2">${langData['project_code'] || 'Project Code'}</label>
                        <input type="text" class="form-control" id="project_code" maxlength="255">
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="mb-2">${langData['startDate'] || 'Start Date'}</label>
                            <input type="text" class="form-control" id="project_start">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="mb-2">${langData['endDate'] || 'End Date'}</label>
                            <input type="text" class="form-control" id="project_end">
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="mb-2 required">${langData['contracts'] || 'Contracts'}</label>
                        <select class="form-select obj-required" id="contract"></select>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="mb-2 required">${langData['group'] || 'Group'}</label>
                            <select id="group" class="form-select obj-required"></select>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="mb-2 required">${langData['status'] || 'Status'}</label>
                            <select id="status" class="form-select obj-required"></select>
                        </div>
                    </div>
                `);
                initSelect2Remote('#status', `${BASE_URL}/api/projects.filter`, { type: 'status' });
                initSelect2Remote('#contract', `${BASE_URL}/api/projects.filter`, { type: 'contract' });
                initSelect2Remote('#group', `${BASE_URL}/api/projects.filter`, { type: 'group' });
                initDatePicker('#project_start');
                initDatePicker('#project_end');
                if (projectData) {
                    $("#project_id").val(projectData.project_id);
                    $("#project_name").val(projectData.project_name);
                    $("#project_name_display").val(projectData.project_name_display);
                    $("#project_code").val(projectData.project_code);
                    if (projectData.project_start) {
                        let startDate = new Date(projectData.project_start);
                        $('#project_start').datepicker('setDate', startDate);
                    }
                    if (projectData.project_end) {
                        let endDate = new Date(projectData.project_end);
                        $('#project_end').datepicker('setDate', endDate);
                    }
                    if (projectData.project_status_name) {
                        var newOptionStatus = new Option(projectData.project_status_name, projectData.project_status_id, true, true);
                        $('#status').append(newOptionStatus).trigger('change');
                    }
                    if (projectData && projectData.contract_name) {
                        var newOptionContract = new Option(projectData.contract_name, projectData.contract_id, true, true);
                        $('#contract').append(newOptionContract).trigger('change');
                    }
                    if (projectData && projectData.project_group_name) {
                        var newOptionGroup = new Option(projectData.project_group_name, projectData.project_group_id, true, true);
                        $('#group').append(newOptionGroup).trigger('change');
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
function validateDates() {
    let startStr = $('#project_start').val();
    let endStr = $('#project_end').val();
    if (!startStr || !endStr) return;
    let startDate = moment(startStr, "DD/MM/YYYY");
    let endDate = moment(endStr, "DD/MM/YYYY");
    if (endDate.isBefore(startDate)) {
        showWarning(langData['validation_date'] || 'End date cannot be earlier than start date.');
        $('#project_end').val('');
        if ($('#project_end').data('datepicker')) {
            $('#project_end').datepicker('clearDates');
        }
    }
}
$(document).on("change", "#project_start, #project_end", function () {
    validateDates();
});
$(document).on('click', '.save-project', function () {
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
    saveProject();
});
function saveProject() {
    const btn = $(".save-project");
    btn.prop("disabled", true);
    const formData = new FormData();
    formData.append("project_id", $("#project_id").val() || "");
    formData.append("contract_id", $("#contract").val() || "");
    formData.append("project_name", $("#project_name").val() || "");
    formData.append("project_name_display", $("#project_name_display").val() || "");
    formData.append("project_code", $("#project_code").val() || "");
    formData.append("project_start", $("#project_start").val());
    formData.append("project_end", $("#project_end").val());
    formData.append("status", $("#status").val());
    formData.append("group", $("#group").val());
    Swal.fire({
        title: langData['saving'] || 'Saving...',
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
        url: `${BASE_URL}/api/projects.save`,
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
                if (typeof initProjectsTable === "function") initProjectsTable();
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