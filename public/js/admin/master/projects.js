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
        ordering: false,
        order: [[5, 'desc']],
        ajax: { 
            url: "api/projects/list", 
            type: "POST",
            data: function(d){
                d.status = $('#filter_project_status').val();
                d.contract = $('#filter_contract').val();
            }
        },
        columns: [      
            { data: "project_code" },
            { 
                data: "project_name",
                render: function (data, type, row) {
                    if (data) {
                        return data.replace(/\r\n|\n/g, '<br />');
                    }
                    return data;
                }
            },
            { 
                data: "project_name_display",
                render: function (data, type, row) {
                    if (data) {
                        return data.replace(/\r\n|\n/g, '<br />');
                    }
                    return data;
                }
            },
            { data: "contract_name" },
            { data: "project_start" },
            { data: "project_end" },
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
                        case 'expired':
                            badgeColor = "danger";
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
                        <button class="btn btn-sm btn-light text-secondary manage-project" data-id="${row.project_id}"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="btn btn-sm btn-light text-secondary text-danger delete-project" data-id="${row.project_id}"><i class="fa-regular fa-trash-can"></i></button>
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
            var input = $('#tb_project_filter input').unbind();
            var self = this.api();
            input.bind('keypress', function(e){
                if(e.keyCode == 13) {
                    self.search(input.val()).draw();
                }
            });
            let $filter = $('#tb_project_filter');
            let btn = `
                <button class="btn btn-primary btn-sm manage-project" data-id="">
                    <i class="fa-solid fa-plus"></i> <span data-i18n="project"></span>
                </button>
            `;
            $filter.append(btn);
            var input = $('#tb_project_filter input').unbind();
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
$(document).on('click', '.delete-project', function() {
    let project_id = $(this).data("id");
    showConfirm(langData['confirm'], langData['confirm_delete'], function(){
        $.ajax({
            url: `${BASE_URL}/api/projects/delete`,
            method: 'POST',
            data: { id: project_id },
            dataType: 'json',
            success: function(res) {
                if(res.status === true){
                    showSuccess('Success', langData['deleted_successfully']);
                    initProjectsTable();
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
$(document).on('click', '.manage-project', function() {
    let project_id = $(this).data("id");
    $.ajax({
        url: `${BASE_URL}/api/projects/get`,
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
                    <h5 class="modal-title" data-i18n="${(project_id) ? 'manageProject' : 'newProject'}"></h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                `);
                modalEl.find(".modal-footer").html(`
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" data-i18n="close"></button>
                    <button type="submit" class="btn btn-primary save-project" data-i18n="save"></button>
                `);
                modalEl.find(".modal-body").html(`
                    <input type="hidden" name="project_id" id="project_id" value="${project_id ?? ''}">
                    <div class="mb-3">
                        <label class="mb-2 required" data-i18n="contracts"></label>
                        <select class="form-select obj-required" id="contract"></select>
                    </div>
                    <div class="mb-3">
                        <label class="mb-2 required" data-i18n="project_name"></label>
                        <input type="text" class="form-control obj-required" id="project_name" maxlength="255">
                    </div>
                    <div class="mb-3">
                        <label class="mb-2" data-i18n="display"></label>
                        <textarea class="form-control" id="project_name_display"></textarea>
                    </div>
                    <div class="mb-3">
                        <label class="mb-2" data-i18n="project_code"></label>
                        <input type="text" class="form-control" id="project_code" maxlength="255">
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="mb-2" data-i18n="startDate"></label>
                            <input type="text" class="form-control" id="project_start">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="mb-2" data-i18n="endDate"></label>
                            <input type="text" class="form-control" id="project_end">
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="mb-2 required" data-i18n="status"></label>
                            <select id="status" class="form-select obj-required"></select>
                        </div>
                    </div>
                `);
                initSelect2Remote('#status', `${BASE_URL}/api/projects/filter`, { type: 'status' });
                initSelect2Remote('#contract', `${BASE_URL}/api/projects/filter`, { type: 'contract' });
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
                    if (projectData.status) {
                        let statusName = projectData.status.charAt(0).toUpperCase() + projectData.status.slice(1);
                        var newOptionStatus = new Option(statusName, projectData.status, true, true);
                        $('#status').append(newOptionStatus).trigger('change');
                    }
                    if (projectData && projectData.contract_name) {
                        var newOptionContract = new Option(projectData.contract_name, projectData.contract_id, true, true);
                        $('#contract').append(newOptionContract).trigger('change');
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
    let startStr = $('#project_start').val();
    let endStr = $('#project_end').val();
    if (!startStr || !endStr) return;
    let startDate = moment(startStr, "DD/MM/YYYY");
    let endDate = moment(endStr, "DD/MM/YYYY");
    if (endDate.isBefore(startDate)) {
        showWarning(
            langData['validation_error'] || 'Validation Error',
            langData['validation_date'] || 'End date cannot be earlier than start date.'
        );
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
        showWarning(
            langData['validation_error'] || 'Validation Error',
            langData['required_star_message'] || 'Please fill all fields marked with *'
        );
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
        url: "api/projects/save",
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
                if (typeof initProjectsTable === "function") initProjectsTable();
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