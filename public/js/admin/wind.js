let tb_wind;
function initWindTable() {
    let oldPage = 0;
    if ($.fn.DataTable.isDataTable('#tb_document')) {
        oldPage = $('#tb_document').DataTable().page();
        $('#tb_document').DataTable().destroy();
    }
    if ($.fn.DataTable.isDataTable('#tb_wind')) {
        $('#tb_wind').DataTable().ajax.reload(null, false);
        return;
    }
    tb_wind = $('#tb_wind').DataTable({
        processing: true,
        serverSide: true,
        order: [[1, 'desc']],
        ajax: {
            url: "api/wind/list",
            type: "POST",
            data: function (d) {
                d.date = $("#filter_date").val();
            }
        },
        columns: [
            { data: "import_start" },
            { data: "import_end" },
            { data: "status" },
            { data: "import_record" },
            { data: "remark" },
        ],
        stateSave: true,
        pageLength: pageLength,
        lengthMenu: lengthMenu,
        stateLoadParams: function (settings, data) {
            data.start = oldPage;
            data.length = pageLength; 
        },
        language: getTableLang(),
        initComplete: function(){
            var input = $('#tb_wind_filter input').unbind();
            var self = this.api();
            input.bind('keypress', function(e){
                if(e.keyCode == 13) {
                    self.search(input.val()).draw();
                }
            });
        }, 
        initComplete: function(){
            let $filter = $('#tb_wind_filter');
            let btn = `
                <button class="btn btn-primary btn-sm manage-wind" data-id="">
                    <i class="fa-solid fa-plus"></i> <span data-i18n="import"></span>
                </button>
            `;
            $filter.append(btn);
            var input = $('#tb_wind_filter input').unbind();
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
$(document).ready(function () {
    initWindTable();
    initDateRangePicker('#filter_date', initWindTable);
    $(".filter").on("change", () => initWindTable());
});
$(document).on('click', '.manage-wind', function () {
    let modalEl = $('#windModal');
    let modal = new bootstrap.Modal(modalEl[0]);
    modal.show();
    modalEl.find(".modal-header").html(`
        <h5 class="modal-title" data-i18n="wind_management"></h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
    `);
    modalEl.find(".modal-footer").html(`
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" data-i18n="close"></button>
        <button type="submit" class="btn btn-primary btn-import" data-i18n="import"></button>
    `);
    modalEl.find(".modal-body").html(`
        <div class="mb-3">
            <label class="mb-2 required" data-i18n="uploadFile"></label>
            <div id="drop_zone" class="border rounded-3 p-4 text-center" style="cursor:pointer; border-style:dashed;">
                <div id="drop_text">
                    <i class="fa-solid fa-folder-open fa-4x text-warning"></i>
                    <div data-i18n="dropHere"></div>
                    <div>— <span data-i18n="or"></span> —</div>
                </div>
                <div id="file_preview" class="mt-3 d-none"></div>
                <div id="drop_button">
                    <button class="btn btn-primary mt-2" type="button" id="btn_select_file" data-i18n="choose"></button>
                    <input type="file" class="d-none obj-required" id="wind_file" accept=".xlsx,.csv">
                </div>
            </div>
            <div class="alert alert-info rounded-3 mt-3">
                <h6 class="fw-bold mb-2" data-i18n="uploadGuideline"></h6>
                <ul class="mb-0 small">
                    <li data-i18n="uploadFormat1"></li>
                    <li data-i18n="uploadFormat2"></li>
                    <li data-i18n="uploadFormat3"></li>
                </ul>
            </div>
        </div>
    `);
    loadLang(currentLang);
});
$(document).on("click", "#btn_select_file", function () {
    $("#wind_file").trigger("click");
});
$(document).on("click", "#remove_file", function () {
    $("#wind_file").val("");
    $("#file_preview").addClass("d-none").html("");
    $("#drop_text").removeClass("d-none");
    $("#drop_button").removeClass("d-none");
    $("#wind_file").addClass("obj-required");
});
$(document).on("change", "#wind_file", function (e) {
    const file = e.target.files[0];
    handleFile(file);
});
$(document).on("dragover", "#drop_zone", function(e){
    e.preventDefault();
});
$(document).on("drop", "#drop_zone", function(e){
    e.preventDefault();
    const file = e.originalEvent.dataTransfer.files[0];
    $("#wind_file")[0].files = e.originalEvent.dataTransfer.files;
    handleFile(file);
});
function handleFile(file) {
    if (!file) return;
    const allowed = ['xlsx', 'csv'];
    const ext = file.name.split('.').pop().toLowerCase();
    if (!allowed.includes(ext)) {
        showWarning(
            langData['validation_error'] || 'Validation Error',
            langData['only_xlsx_csv'] || 'Only .xlsx or .csv files are allowed.'
        );
        return;
    }
    let baseName = file.name.replace(/\.[^/.]+$/, "");
    baseName = baseName.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
    $("#drop_text").addClass("d-none");
    $("#drop_button").addClass("d-none");
    const iconClass = getFileIconClass(ext);
    $("#file_preview").removeClass("d-none").html(`
        <div class="justify-content-between align-items-center p-2"> 
            <i class="${iconClass} fa-4x"></i>
            <div class="mt-2">
                <strong>${file.name}</strong> 
                <br><small>${readableSize(file.size)}</small>
            </div>
            <div class="mt-2">
                <button class="btn btn-primary btn-sm" type="button" id="btn_select_file" data-i18n="choose"></button>
                <button type="button" class="btn btn-sm btn-danger" id="remove_file">
                    <span data-i18n="remove"></span>
                </button>
            </div>
        </div>
    `);
}
$(document).on('click', '.btn-import', function () {
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
    showConfirm(langData['recommend'], langData['importing_data'], function(){
        importWindData();
    });
});
function importWindData() {
    $(".btn-import").prop("disabled", true);
    const file = $("#wind_file")[0].files[0] || null;
    const formData = new FormData();
    formData.append("wind_file", file);
    Swal.fire({
        title: langData['importing_data.'],
        html: `
            <div class="progress mt-2">
                <div id="swal-progress" class="progress-bar" role="progressbar" style="width:0%">0%</div>
            </div>
        `,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });
    $.ajax({
        url: "api/wind/import",
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
            Swal.close();
            if (res.status === true) {
                showSuccess('Success', langData['import_successfully'] || 'Imported successfully');
                $('#windModal').modal('hide');
                if (typeof initWindTable === "function") initWindTable();
            } else {
                showError('Error', (langData['cannot_import'] || 'Error: ') + ' ' + (res.message || 'Unknown error'));
            }
        },
        error: function (xhr, status, error) {
            let errorMessage = "Unknown error occurred";
            try {
                let response = JSON.parse(xhr.responseText);
                errorMessage = response.message || error;
            } catch (e) {
                errorMessage = error || xhr.statusText;
            }
            showError(
                langData['error_title'] || 'Import Error', 
                (langData['cannot_import'] || 'Failed to import: ') + ' ' +errorMessage
            );
        },
        complete: function() {
            $(".btn-import").prop("disabled", false);
        }
    });
}