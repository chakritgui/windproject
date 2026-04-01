let tb_group;
function initGroupTable() {
    let oldPage = 0;
    if ($.fn.DataTable.isDataTable('#tb_group')) {
        oldPage = $('#tb_group').DataTable().page();
        $('#tb_group').DataTable().destroy();
    }
    if ($.fn.DataTable.isDataTable('#tb_group')) {
        $('#tb_group').DataTable().ajax.reload(null, false);
        return;
    }
    tb_group = $('#tb_group').DataTable({
        processing: true,
        serverSide: true,
        order: [[0, 'asc']],
        ajax: { 
            url: `${BASE_URL}/api/group.list`, 
            type: "POST",
            data: function(d){
                d.status = $('#filter_group_status').val();
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
            data: "project_group_name",
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
            render: function(row){
                return `
                    <div class="btn-group border rounded-3 bg-white">
                        <button class="btn btn-link text-warning py-1 manage-group" data-id="${row.project_group_id}"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="btn btn-link text-danger py-1 border-start delete-group" data-id="${row.project_group_id}"><i class="fa-regular fa-trash-can"></i></button>
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
            var $filter = $('#tb_group_filter');
            var input = $filter.find('input').unbind(); 
            input.bind('keypress', function(e) {
                if (e.keyCode == 13) {
                    self.search(input.val()).draw();
                }
            });
            if ($filter.find('.manage-group[data-id=""]').length === 0) {
                let btn = `
                    <button class="btn btn-primary btn-sm manage-group ms-2" data-id="">
                        <i class="fa-solid fa-plus"></i> <span>${langData['group'] || 'group'}</span>
                    </button>
                `;
                $filter.append(btn);
            }
            if ($filter.find('.item-order').length === 0) {
                let btn = `
                    <button class="btn btn-warning btn-sm item-order ms-2" data-type="group">
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
$(document).on('click', '.delete-group', function() {
    let project_group_id = $(this).data("id");
    showConfirm(langData['confirm'], langData['confirm_delete'], function(){
        $.ajax({
            url: `${BASE_URL}/api/group.delete`,
            method: 'POST',
            data: { id: project_group_id },
            dataType: 'json',
            success: function(res) {
                if(res.status === true){
                    showSuccess(langData['deleted_successfully']);
                    initGroupTable();
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
$(document).on('click', '.manage-group', function() {
    let project_group_id = $(this).data("id");
    $.ajax({
        url: `${BASE_URL}/api/group.get`,
        method: 'POST',
        data: { id: project_group_id },
        dataType: 'json',
        success: function(res) {
            if(res.status === true){
                let groupData = res.data;
                let modalEl = $('#windModal');
                let modal = new bootstrap.Modal(modalEl[0]);
                modal.show();
                modalEl.find(".modal-header").html(`
                    <h5 class="modal-title">${langData['manageGroup'] || 'Manage Group'}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                `);
                modalEl.find(".modal-footer").html(`
                    <button type="submit" class="btn btn-primary me-2 save-group">${langData['save'] || "Save"}</button>
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">${langData['close'] || "Close"}</button>
                `);
                modalEl.find(".modal-body").html(`
                    <input type="hidden" name="project_group_id" id="project_group_id" value="${project_group_id ?? ''}">
                    <div class="mb-3">
                        <label class="mb-2 required">${langData['group_name'] || 'Group Name'}</label>
                        <input type="text" class="form-control obj-required" id="project_group_name" maxlength="255">
                    </div>
                    <div class="mb-3">
                        <label class="mb-2 required">${langData['status'] || 'Status'}</label>
                        <select id="status" class="form-select obj-required"></select>
                    </div>
                `);
                initSelect2Remote('#status', `${BASE_URL}/api/installations.filter`, { type: 'status' });
                if (groupData) {
                    $("#project_group_id").val(groupData.project_group_id);
                    $("#project_group_name").val(groupData.project_group_name);
                    if (groupData.status) {
                        let statusName = groupData.status.charAt(0).toUpperCase() + groupData.status.slice(1);
                        var newOptionStatus = new Option(statusName, groupData.status, true, true);
                        $('#status').append(newOptionStatus).trigger('change');
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
$(document).on('click', '.save-group', function () {
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
    saveGroup();
});
function saveGroup() {
    const btn = $(".save-group");
    btn.prop("disabled", true);
    const formData = new FormData();
    formData.append("project_group_id", $("#project_group_id").val() || "");
    formData.append("status", $("#status").val() || "active");
    formData.append("project_group_name", $("#project_group_name").val());
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
        url: `${BASE_URL}/api/group.save`,
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
                if (typeof initGroupTable === "function") initGroupTable();
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