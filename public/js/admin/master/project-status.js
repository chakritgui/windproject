let tb_project_status;
function initProjectStatusTable() {
    if ($.fn.DataTable.isDataTable('#tb_project_status')) {
        tb_project_status.ajax.reload(null, false);
        return;
    }
    tb_project_status = $('#tb_project_status').DataTable({
        processing: true,
        serverSide: true,
        order: [[2, 'desc']],
        ajax: { 
            url: `${BASE_URL}/api/project.status.list`, 
            type: "POST",
            data: function(d){
                d.status = $('#filter_projectstatus_status').val();
            }
        },
        columns: [{ 
            data: "project_status_color",
            orderable: false,
            render: function (data, type, row) {
                return `<i class="fa-solid fa-circle" style="color: ${row.project_status_color};"></i>`;
            }
        },{ 
            data: "project_status_name",
            orderable: true,
            render: function (data, type, row) {
                return `${data}`;
            }
        },{ 
            data: "created_at",
            orderable: true,
        },{ 
            data: 'status',
            orderable: true,
            render: function (status, type, row) {
                let badge = "";
                switch(status) {
                    case 'active':
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
            className: "text-end",
            render: function(row) {
                return `
                    <div class="btn-group border rounded-3 bg-white">
                        <button class="btn btn-link text-warning py-1 manage-sta" data-id="${row.project_status_id}"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="btn btn-link text-danger py-1 border-start delete-sta" data-id="${row.project_status_id}"><i class="fa-regular fa-trash-can"></i></button>
                    </div>`;
            }
        }],
        language: getTableLang(),
        initComplete: function() {
            let $filter = $('#tb_project_status_filter');
            $filter.append(`
                <button class="btn btn-primary btn-sm manage-sta ms-2" data-id="">
                    <i class="fa-solid fa-plus"></i> ${langData['status'] || 'Status'}
                </button>
            `);
        }
    });
}
$(document).on('click', '.manage-sta', function() {
    let id = $(this).data("id");
    $.ajax({
        url: `api/project-status/get`,
        method: 'POST',
        data: { id: id },
        success: function(res) {
            if(res.status) {
                let d = res.data;
                let modalEl = $('#windModal');
                modalEl.find(".modal-header").html(`<h5 class="modal-title" data-i18n="manageStatus"></h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button>`);
                modalEl.find(".modal-body").html(`
                    <input type="hidden" id="project_status_id" value="${d.project_status_id || ''}">
                    <div class="mb-3">
                        <label class="mb-2 required" data-i18n="status"></label>
                        <input type="text" class="form-control obj-required" id="project_status_name" value="${d.project_status_name || ''}">
                    </div>
                    <div class="row mb-3">
                        <div class="col">
                            <label class="mb-2" data-i18n="color"></label>
                            <input type="color" class="form-control form-control-color w-100" id="project_status_color" value="${d.project_status_color || '#3b82f6'}">
                        </div>
                        <div class="col">
                            <label class="mb-2 required">${langData['status'] || 'Status'}</label>
                            <select id="status" class="form-select obj-required"></select>
                        </div>
                    </div>
                `);
                initSelect2Remote('#status', `${BASE_URL}/api/installations.filter`, { type: 'status' });
                if (d.status) {
                    let statusName = d.status.charAt(0).toUpperCase() + d.status.slice(1);
                    var newOptionStatus = new Option(statusName, d.status, true, true);
                    $('#status').append(newOptionStatus).trigger('change');
                }
                modalEl.find(".modal-footer").html(`
                    <button type="button" class="btn btn-primary save-sta">Save</button>
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Close</button>
                `);
                new bootstrap.Modal(modalEl[0]).show();
            }
        }
    });
});
$(document).on('click', '.save-sta', function () {
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
    saveStatus();
});
function saveStatus() {
    const btn = $(this);
    btn.prop("disabled", true);
    const formData = new FormData();
    formData.append("project_status_id", $("#project_status_id").val());
    formData.append("project_status_name", $("#project_status_name").val());
    formData.append("project_status_color", $("#project_status_color").val());
    formData.append("status", $("#status").val() || "active");
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
        url: `${BASE_URL}/api/project.status.save`,
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
                if (typeof initProjectStatusTable === "function") initProjectStatusTable();
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
$(document).on('click', '.delete-sta', function() {
    let id = $(this).data("id");
    showConfirm(langData['confirm'], langData['confirm_delete'], function(){
        $.ajax({
            url: `${BASE_URL}/api/project.status.delete`,
            method: 'POST',
            data: { id: id },
            dataType: 'json',
            success: function(res) {
                if(res.status === true){
                    showSuccess(langData['deleted_successfully']);
                    initProjectStatusTable();
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