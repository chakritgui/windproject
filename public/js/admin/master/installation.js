let tb_installation;
function initInstallationsTable() {
    let oldPage = 0;
    if ($.fn.DataTable.isDataTable('#tb_installation')) {
        oldPage = $('#tb_installation').DataTable().page();
        $('#tb_installation').DataTable().destroy();
    }
    if ($.fn.DataTable.isDataTable('#tb_installation')) {
        $('#tb_installation').DataTable().ajax.reload(null, false);
        return;
    }
    tb_installation = $('#tb_installation').DataTable({
        processing: true,
        serverSide: true,
        order: [[0, 'asc']],
        ajax: { 
            url: `${BASE_URL}/api/installations.list`, 
            type: "POST",
            data: function(d){
                d.project = $('#filter_installation_project').val();
                d.type = $('#filter_installation_type').val();
                d.status = $('#filter_installation_status').val();
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
                        <input class="form-check-input update-item-switch" type="checkbox" role="switch"id="switch_${row.installations_id}" data-id="${row.installations_id}" data-type="installation" ${isChecked} style="cursor:pointer;">
                    </div>
                `;
            }
        },{ 
            data: "project_name",
            orderable: true,
        },{ 
            data: "type_name",
            orderable: true, 
        },{ 
            data: "installations_name",
            orderable: true,
            render: function (data, type, row) {
                if (data) {
                    return data.replace(/\r\n|\n/g, '<br />');
                }
                return data;
            }
        },{ 
            data: "installations_name_display",
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
                        <button class="btn btn-link text-warning py-1 manage-installation" data-id="${row.installations_id}"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="btn btn-link text-danger py-1 border-start delete-installation" data-id="${row.installations_id}"><i class="fa-regular fa-trash-can"></i></button>
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
            var $filter = $('#tb_installation_filter');
            var input = $filter.find('input').unbind(); 
            input.bind('keypress', function(e) {
                if (e.keyCode == 13) {
                    self.search(input.val()).draw();
                }
            });
            if ($filter.find('.manage-installation[data-id=""]').length === 0) {
                let btn = `
                    <button class="btn btn-primary btn-sm manage-installation ms-1" data-id="">
                        <i class="fa-solid fa-plus me-2"></i><span>${langData['installation'] || 'Installation'}</span>
                    </button>
                `;
                $filter.append(btn);
            }
            if ($filter.find('.item-order').length === 0) {
                let btn = `
                    <button class="btn btn-warning btn-sm item-order ms-1" data-type="installation">
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
$(document).on('click', '.delete-installation', function() {
    let installations_id = $(this).data("id");
    showConfirm(langData['confirm'], langData['confirm_delete'], function(){
        $.ajax({
            url: `${BASE_URL}/api/installations.delete`,
            method: 'POST',
            data: { id: installations_id },
            dataType: 'json',
            success: function(res) {
                if(res.status === true){
                    showSuccess(langData['deleted_successfully']);
                    initInstallationsTable();
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
$(document).on('click', '.manage-installation', function() {
    let installations_id = $(this).data("id");
    $.ajax({
        url: `${BASE_URL}/api/installations.get`,
        method: 'POST',
        data: { id: installations_id },
        dataType: 'json',
        success: function(res) {
            if(res.status === true){
                let installationData = res.data;
                let modalEl = $('#windModal');
                let modal = new bootstrap.Modal(modalEl[0]);
                modal.show();
                modalEl.find(".modal-header").html(`
                    <h5 class="modal-title">${langData['manageInstallation'] || 'Manage Installation'}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                `);
                modalEl.find(".modal-footer").html(`
                    <button type="submit" class="btn btn-primary me-2 save-installation">${langData['save'] || "Save"}</button>
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">${langData['close'] || "Close"}</button>
                `);
                modalEl.find(".modal-body").html(`
                    <input type="hidden" name="installations_id" id="installations_id" value="${installations_id ?? ''}">
                    <div class="mb-3">
                        <label class="mb-2 required">${langData['installation'] || 'Installation'}</label>
                        <input type="text" class="form-control obj-required" id="installations_name" maxlength="255">
                    </div>
                    <div class="mb-3">
                        <label class="mb-2">${langData['display'] || 'Display'}</label>
                        <textarea class="form-control" id="installations_name_display"></textarea>
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
                `);
                initSelect2Remote('#project', `${BASE_URL}/api/installations.filter`, { type: 'project' });
                initSelect2Remote('#type', `${BASE_URL}/api/installations.filter`, { type: 'type' });
                if (installationData) {
                    $("#installations_id").val(installationData.installations_id);
                    $("#installations_name").val(installationData.installations_name);
                    $("#installations_name_display").val(installationData.installations_name_display);
                    if (installationData.project_name) {
                        var newOptionStatus = new Option(installationData.project_name, installationData.project_id, true, true);
                        $('#project').append(newOptionStatus).trigger('change');
                    }
                    if (installationData.type_name) {
                        var newOptionStatus = new Option(installationData.type_name, installationData.type_id, true, true);
                        $('#type').append(newOptionStatus).trigger('change');
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
$(document).on('click', '.save-installation', function () {
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
    saveInstallation();
});
function saveInstallation() {
    const btn = $(".save-installation");
    btn.prop("disabled", true);
    const formData = new FormData();
    formData.append("installations_id", $("#installations_id").val() || "");
    formData.append("installations_name", $("#installations_name").val() || "");
    formData.append("installations_name_display", $("#installations_name_display").val() || "");
    formData.append("project", $("#project").val());
    formData.append("type", $("#type").val());
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
        url: `${BASE_URL}/api/installations.save`,
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
                if (typeof initInstallationsTable === "function") initInstallationsTable();
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