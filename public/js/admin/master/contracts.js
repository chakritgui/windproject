let tb_contract;
function initContractsTable() {
    let oldPage = 0;
    if ($.fn.DataTable.isDataTable('#tb_contract')) {
        oldPage = $('#tb_contract').DataTable().page();
        $('#tb_contract').DataTable().destroy();
    }
    if ($.fn.DataTable.isDataTable('#tb_contract')) {
        $('#tb_contract').DataTable().ajax.reload(null, false);
        return;
    }
    tb_contract = $('#tb_contract').DataTable({
        processing: true,
        serverSide: true,
        ordering: false,
        order: [[5, 'desc']],
        ajax: { 
            url: "api/contracts/list", 
            type: "POST",
            data: function(d){
                d.status = $('#filter_status').val();
            }
        },
        columns: [      
            { data: "contract_no" },
            { data: "contract_name" },
            { data: "contract_start" },
            { data: "contract_end" },
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
                        <button class="btn btn-light text-secondary manage-contract" data-id="${row.contract_id}"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="btn btn-light text-secondary text-danger delete-contract" data-id="${row.contract_id}"><i class="fa-regular fa-trash-can"></i></button>
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
            var input = $('#tb_contract_filter input').unbind();
            var self = this.api();
            input.bind('keypress', function(e){
                if(e.keyCode == 13) {
                    self.search(input.val()).draw();
                }
            });
            let $filter = $('#tb_contract_filter');
            let btn = `
                <button class="btn btn-primary btn-sm manage-contract" data-id="">
                    <i class="fa-solid fa-plus"></i> <span data-i18n="contract"></span>
                </button>
            `;
            $filter.append(btn);
            var input = $('#tb_contract_filter input').unbind();
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
$(document).on('click', '.delete-contract', function() {
    let contract_id = $(this).data("id");
    showConfirm(langData['confirm'], langData['confirm_delete'], function(){
        $.ajax({
            url: `${BASE_URL}/api/contracts/delete`,
            method: 'POST',
            data: { id: contract_id },
            dataType: 'json',
            success: function(res) {
                if(res.status === true){
                    showSuccess('Success', langData['deleted_successfully']);
                    initContractsTable();
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
$(document).on('click', '.manage-contract', function() {
    let contract_id = $(this).data("id");
    $.ajax({
        url: `${BASE_URL}/api/contracts/get`,
        method: 'POST',
        data: { id: contract_id },
        dataType: 'json',
        success: function(res) {
            if(res.status === true){
                let contractData = res.data;
                let modalEl = $('#windModal');
                let modal = new bootstrap.Modal(modalEl[0]);
                modal.show();
                modalEl.find(".modal-header").html(`
                    <h5 class="modal-title" data-i18n="${(contract_id) ? 'manageContract' : 'newContract'}"></h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                `);
                modalEl.find(".modal-footer").html(`
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" data-i18n="close"></button>
                    <button type="submit" class="btn btn-primary save-contract" data-i18n="save"></button>
                `);
                modalEl.find(".modal-body").html(`
                    <input type="hidden" name="contract_id" id="contract_id" value="${contract_id ?? ''}">
                    <div class="mb-3">
                        <label class="mb-2 required" data-i18n="contract_name"></label>
                        <input type="text" class="form-control obj-required" id="contract_name" maxlength="255">
                    </div>
                    <div class="mb-3">
                        <label class="mb-2" data-i18n="contract_no"></label>
                        <input type="text" class="form-control" id="contract_no" maxlength="255">
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="mb-2" data-i18n="startDate"></label>
                            <input type="text" class="form-control" id="contract_start">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="mb-2" data-i18n="endDate"></label>
                            <input type="text" class="form-control" id="contract_end">
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="mb-2 required" data-i18n="status"></label>
                            <select id="status" class="form-select obj-required"></select>
                        </div>
                    </div>
                `);
                initSelect2Remote('#status', `${BASE_URL}/api/contracts/filter`, { type: 'status' });
                initDatePicker('#contract_start');
                initDatePicker('#contract_end');
                if (contractData) {
                    $("#contract_id").val(contractData.contract_id);
                    $("#contract_name").val(contractData.contract_name);
                    $("#contract_no").val(contractData.contract_no);
                    if (contractData.contract_start) {
                        let startDate = new Date(contractData.contract_start);
                        $('#contract_start').datepicker('setDate', startDate);
                    }
                    if (contractData.contract_end) {
                        let endDate = new Date(contractData.contract_end);
                        $('#contract_end').datepicker('setDate', endDate);
                    }
                    if (contractData.status) {
                        let statusName = contractData.status.charAt(0).toUpperCase() + contractData.status.slice(1);
                        var newOptionStatus = new Option(statusName, contractData.status, true, true);
                        $('#status').append(newOptionStatus).trigger('change');
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
    let startStr = $('#contract_start').val();
    let endStr = $('#contract_end').val();
    if (!startStr || !endStr) return;
    let startDate = moment(startStr, "DD/MM/YYYY");
    let endDate = moment(endStr, "DD/MM/YYYY");
    if (endDate.isBefore(startDate)) {
        showWarning(
            langData['validation_error'] || 'Validation Error',
            langData['validation_date'] || 'End date cannot be earlier than start date.'
        );
        $('#contract_end').val('');
        if ($('#contract_end').data('datepicker')) {
            $('#contract_end').datepicker('clearDates');
        }
    }
}
$(document).on("change", "#contract_start, #contract_end", function () {
    validateDates();
});
$(document).on('click', '.save-contract', function () {
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
    saveContract();
});
function saveContract() {
    const btn = $(".save-contract");
    const name = $("#contract_name").val();
    if (!name) {
        showError('Error', 'Please enter contract name');
        return;
    }
    btn.prop("disabled", true);
    const formData = new FormData();
    formData.append("contract_id", $("#contract_id").val() || "");
    formData.append("contract_name", name);
    formData.append("contract_no", $("#contract_no").val() || "");
    formData.append("contract_start", $("#contract_start").val());
    formData.append("contract_end", $("#contract_end").val());
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
        url: "api/contracts/save",
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
                if (typeof initContractsTable === "function") initContractsTable();
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