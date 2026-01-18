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
            url: "api/poles/list", 
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
                    return ``;
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
            url: 'api/poles/delete',
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
$(document).on('click', '.manage-pole', function() {
    let poles_id = $(this).data("id");
    $.ajax({
        url: 'api/poles/get',
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
                initSelect2Remote('#status', 'api/poles/filter', { type: 'status' });
                initSelect2Remote('#project', 'api/poles/filter', { type: 'project' });
                initSelect2Remote('#type', 'api/poles/filter', { type: 'type' });
                initSelect2Remote('#installation', 'api/poles/filter', { type: 'installation' });
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