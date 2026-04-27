let tb_wind;
function initWindTable() {
    let oldPage = 0;
    if ($.fn.DataTable.isDataTable('#tb_wind')) {
        oldPage = $('#tb_wind').DataTable().page();
        $('#tb_wind').DataTable().destroy();
    }
    if ($.fn.DataTable.isDataTable('#tb_wind')) {
        $('#tb_wind').DataTable().ajax.reload(null, false);
        return;
    }
    tb_wind = $('#tb_wind').DataTable({
        processing: true,
        serverSide: true,
        ajax: {
            url: `${BASE_URL}/api/wind.list`,
            type: "POST",
            data: function (d) {
                d.date = $("#filter_date").val();
                d.project = $("#filter_project").val();
                d.pole = $("#filter_pole").val();
                d.type = $("#filter_type").val();
                d.installation = $("#filter_installation").val();
                d.height = $("#filter_height").val();
            }
        },
        order: [[5, 'desc']],
        columns: [
            { data: "poles_code", orderable: true },
            { data: "project_name", orderable: true },
            { data: "type_name", orderable: true },
            { data: "installations_name", orderable: true },
            { data: "year", orderable: true },
            { data: "wind_datetime", orderable: true },
            { data: "height_name", orderable: true },
            { data: "height_levels", orderable: true },
            { data: "wind_speed", orderable: true },
            { data: "wind_direction", orderable: true },
            { data: "air_density", orderable: true },
            { data: "pressure", orderable: true },
            { data: "humidity", orderable: true },
            { data: "temperature", orderable: true },
            { data: "turbulence_intensity", orderable: true },
            {
                data: null,
                orderable: false,
                render: function(row){
                    return `
                        <div class="btn-group border rounded-3 bg-white">
                            <button class="btn py-1 text-danger border-start delete-wind" data-id="${row.id}"><i class="fa-regular fa-trash-can"></i></button>
                        </div>
                    `;
                }
            },
        ],
        pageLength: pageLength,
        lengthMenu: lengthMenu,
        stateLoadParams: function (settings, data) {
            data.start = oldPage;
            data.length = pageLength; 
        },
        language: getTableLang(),
        initComplete: function() {
            let self = this.api();
            let $filter = $('#tb_wind_filter');
            if ($filter.find('.manage-wind').length === 0) {
                let btn = `
                    <button class="btn btn-primary btn-sm manage-wind ms-1" data-id="">
                        <i class="fa-solid fa-plus me-2"></i><span>${langData['import'] || "Import"}</span>
                    </button>
                `;
                $filter.append(btn);
            }
            if ($filter.find('.example-inport').length === 0) {
                let btn = `
                    <a href="${BASE_URL}/excel/WindImportExample.xlsx" class="btn btn-success btn-sm example-inport ms-1" target="_blank">
                        <i class="fa-solid fa-download me-2"></i><span>${langData['example_import'] || "Example Import"}</span>
                    </a>
                `;
                $filter.append(btn);
            }
            let $input = $filter.find('input').unbind();
            $input.bind('keypress', function(e) {
                if (e.keyCode == 13) {
                    self.search($(this).val()).draw();
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
    initSelect2Remote('#filter_project', `${BASE_URL}/api/wind.filter`, { type: 'project' });
    initSelect2Remote('#filter_pole', `${BASE_URL}/api/wind.filter`, { type: 'pole' });
    initSelect2Remote('#filter_type', `${BASE_URL}/api/wind.filter`, { type: 'type' });
    initSelect2Remote('#filter_installation', `${BASE_URL}/api/wind.filter`, { type: 'installation' });
    initSelect2Remote('#filter_height', `${BASE_URL}/api/wind.filter`, { type: 'height' });
    $(".filter").on("change", () => initWindTable());
});
$(document).on('click', '.manage-wind', function () {
    let modalEl = $('#windModal');
    let modal = new bootstrap.Modal(modalEl[0]);
    modal.show();
    modalEl.find(".modal-header").html(`
        <h5 class="modal-title">${langData['wind_management'] || 'Wind Management'}</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
    `);
    modalEl.find(".modal-footer").html(`
        <button type="submit" class="btn btn-primary me-2 btn-import">${langData['import'] || "Import"}</button>
        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">${langData['close'] || "Close"}</button>
    `);
    modalEl.find(".modal-body").html(`
        <div class="mb-3">
            <label class="mb-2 required">${langData['uploadFile'] || "Upload File"}</label>
            <div id="drop_zone" class="border rounded-3 p-4 text-center" style="cursor:pointer; border-style:dashed;">
                <div id="drop_text">
                    <i class="fa-solid fa-folder-open fa-4x text-warning"></i>
                    <div>${langData['dropHere'] || "Drag & Drop file here"}</div>
                    <div>— <span>${langData['or'] || "Or"}</span> —</div>
                </div>
                <div id="file_preview" class="mt-3 d-none"></div>
                <div id="drop_button">
                    <button class="btn btn-primary mt-2" type="button" id="btn_select_file">${langData['choose'] || "Choose"}</button>
                    <input type="file" class="d-none obj-required" id="wind_file" accept=".xlsx,.csv">
                </div>
            </div>
            <div class="alert alert-info rounded-3 mt-3">
                <h6 class="fw-bold mb-2">${langData['uploadGuideline'] || "Upload Guideline"}</h6>
                <ul class="mb-0 small">
                    <li>${langData['uploadFormat1'] || "Supports .xlsx and .csv files."}</li>
                    <li>${langData['uploadFormat2'] || "In Excel, use only the first sheet."}</li>
                    <li>${langData['uploadFormat3'] || "Old data will not be deleted until you press Import."}</li>
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
        showWarning(langData['only_xlsx_csv'] || 'Only .xlsx or .csv files are allowed.');
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
                <button class="btn btn-primary btn-sm" type="button" id="btn_select_file">${langData['choose'] || "Choose"}</button>
                <button type="button" class="btn btn-sm btn-danger" id="remove_file">
                    <span>${langData['remove'] || "Remove"}</span>
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
        showWarning(langData['required_star_message'] || 'Please fill all fields marked with *');
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
        title: langData['uploading'] || 'Uploading...',
        html: `
            <div id="import-status-text" class="mb-2">${langData['uploading'] || 'Uploading...'}</div>
            <div class="progress">
                <div id="swal-progress" class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width:0%">0%</div>
            </div>
        `,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });
    let fakePercent = 0;
    let progressTimer;
    $.ajax({
        url: `${BASE_URL}/api/wind.import`,
        type: "POST",
        data: formData,
        contentType: false,
        processData: false,
        xhr: function () {
            let xhr = new window.XMLHttpRequest();
            xhr.upload.addEventListener("progress", function (e) {
                if (e.lengthComputable) {
                    let uploadPercent = Math.round((e.loaded / e.total) * 30);
                    updateProgressBar(uploadPercent, langData['uploading'] || 'Uploading...');
                }
            });
            return xhr;
        },
        beforeSend: function() {
            setTimeout(() => {
                let current = 30;
                progressTimer = setInterval(() => {
                    if (current < 97) {
                        current += Math.random() * 2;
                        updateProgressBar(Math.floor(current), langData['processing_syncing'] || 'Processing & Syncing data');
                    }
                }, 1000);
            }, 500);
        },
        success: function (res) {
            clearInterval(progressTimer);
            updateProgressBar(100, 'Completed!');
            setTimeout(() => {
                Swal.close();
                if (res.status === true) {
                    showSuccess(langData['import_successfully'] || 'Imported successfully');
                    $('#windModal').modal('hide');
                    if (typeof initWindTable === "function") initWindTable();
                } else {
                    showError(res.message);
                }
            }, 500);
        },
        error: function (xhr, status, error) {
            clearInterval(progressTimer);
            Swal.close();
        },
        complete: function() {
            $(".btn-import").prop("disabled", false);
        }
    });
    function updateProgressBar(pct, text) {
        let bar = document.getElementById("swal-progress");
        let txt = document.getElementById("import-status-text");
        if (bar) {
            bar.style.width = pct + "%";
            bar.innerText = pct + "%";
        }
        if (txt) txt.innerText = text;
    }
}
$(document).on('click', '.clear-data', function() {
    let modalEl = $('#windModal');
    let modal = new bootstrap.Modal(modalEl[0]);
    modal.show();
    modalEl.find(".modal-header").html(`
        <h5 class="modal-title">${langData['clear_data'] || "Clear Data"}</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
    `);
    modalEl.find(".modal-footer").html(`
        <button type="submit" class="btn btn-danger me-2 confirm-clear-data">${langData['clear_data'] || "Clear Data"}</button>
        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">${langData['close'] || "Close"}</button>
    `);
    modalEl.find(".modal-body").html(`
        <div class="row">
            <div class="col-md-6 mb-3"><label class="mb-2">${langData['date']}</label><input type="text" class="form-control filter" id="date" autocomplete="off"></div>
            <div class="col-md-6 mb-3"><label class="mb-2">${langData['project']}</label><select id="project" class="form-select"></select></div>
        </div>
        <div class="row">
            <div class="col-md-6 mb-3"><label class="mb-2">${langData['wind_measurement_equipment']}</label><select id="type" class="form-select"></select></div>
            <div class="col-md-6 mb-3"><label class="mb-2">${langData['installation']}</label><select id="installation" class="form-select"></select></div>
        </div>
        <div class="row">
            <div class="col-md-6 mb-3"><label class="mb-2">${langData['height_level']}</label><select id="height_level" class="form-select"></select></div>
            <div class="col-md-6 mb-3"><label class="mb-2">${langData['poles']}</label><select id="pole" class="form-select"></select></div>
        </div>    
    `);
    initDateRangePicker('#date', "");
    initSelect2Remote('#project', `${BASE_URL}/api/wind.filter`, { type: 'project' });
    initSelect2Remote('#pole', `${BASE_URL}/api/wind.filter`, { type: 'pole' });
    initSelect2Remote('#type', `${BASE_URL}/api/wind.filter`, { type: 'type' });
    initSelect2Remote('#installation', `${BASE_URL}/api/wind.filter`, { type: 'installation' });
    initSelect2Remote('#height_level', `${BASE_URL}/api/wind.filter`, { type: 'height' });
});
$(document).on('click', '.confirm-clear-data', function() {
    let payload = {
        date: $('#date').val(),
        project_id: $('#project').val(),
        type_id: $('#type').val(),
        installation_id: $('#installation').val(),
        height_level: $('#height_level').val(),
        pole_id: $('#pole').val()
    };
    $.ajax({
        url: `${BASE_URL}/api/wind.count_clear`,
        method: 'POST',
        dataType: 'json',
        data: payload,
        success: function(res) {
            if(res.status === true) {
                let confirmMsg = `Found ${res.count} records. Do you want to clear them?`;
                showConfirm(langData['confirm'], confirmMsg, function(){
                    clearData(payload);
                });
            } else {
                showError(res.message || langData['cannot_check_data']);
            }
        }
    });
});
function clearData(filterData) {
    $.ajax({
        url: `${BASE_URL}/api/wind.clear`,
        method: 'POST',
        dataType: 'json',
        data: filterData,
        success: function(res) {
            if(res.status === true){
                showSuccess(langData['clear_successfully']);
                var modalEl = document.getElementById('windModal');
                var modal = bootstrap.Modal.getInstance(modalEl); 
                if (modal) {
                    modal.hide();
                }
                initWindTable();
            } else {
                showError(langData['cannot_clear']);
            }   
        },
        error: function (xhr, status, error) {
            let msg = langData['cannot_clear'];
            try {
                let res = JSON.parse(xhr.responseText);
                if (res.message) msg += ": " + res.message;
            } catch (e) {}
            showError(msg);
        }
    });
}
$(document).on('click', '.delete-wind', function() {
    let id = $(this).data("id");
    showConfirm(langData['confirm'], langData['confirm_delete'], function(){
        $.ajax({
            url: `${BASE_URL}/api/wind.delete`,
            method: 'POST',
            data: { id: id },
            dataType: 'json',
            success: function(res) {
                if(res.status === true){
                    showSuccess(langData['deleted_successfully']);
                    initWindTable();
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
$(document).on('click', '.import-history', function() {
    let modalEl = $('#windModal');
    let modal = new bootstrap.Modal(modalEl[0]);
    modal.show();
    modalEl.find(".modal-header").html(`
        <h5 class="modal-title">${langData['import_history'] || "Import History"}</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
    `);
    modalEl.find(".modal-footer").html(`
        <button class="btn btn-outline-secondary" data-bs-dismiss="modal">${langData['close'] || "Close"}</button>
    `);
    modalEl.find(".modal-body").html(`
        <table id="tb_history" class="table table-striped w-100">
            <thead>
                <tr>
                    <th>${langData['no.'] || "No."}</th>
                    <th>${langData['import_start'] || "Import Start"}</th>
                    <th>${langData['import_end'] || "Import End"}</th>
                    <th>${langData['record'] || "Record"}</th>
                    <th>${langData['status'] || "Status"}</th>
                    <th>${langData['result'] || "Result"}</th>
                </tr>
            </thead>
        </table>
    `);
    loadImportHistory();
});
let tb_history;
function loadImportHistory(){
    let oldPage = 0;
    if ($.fn.DataTable.isDataTable('#tb_history')) {
        oldPage = $('#tb_history').DataTable().page();
        $('#tb_history').DataTable().destroy();
    }
    if ($.fn.DataTable.isDataTable('#tb_history')) {
        $('#tb_history').DataTable().ajax.reload(null, false);
        return;
    }
    $('#tb_history').DataTable({
        processing: true,
        serverSide: true,
        ordering: false,
        order: [[1, 'desc']],
        ajax: {
            url: `${BASE_URL}/api/wind.history`,
            type: "POST",
        },
        columns: [{
            data: null,
            render: function (data, type, row, meta) {
                return meta.row + meta.settings._iDisplayStart + 1;
            }
        },{ 
            data: "import_start" 
        },{ 
            data: "import_end" 
        },{ 
            data: "import_record" 
        },{
            data: "status",
            render: function (status, type, row) {
                let badgeColor = status === "complete" ? "success" : "danger";
                return `
                    <div class="d-flex align-items-center gap-2">
                        <span class="badge bg-${badgeColor}" style="font-weight:400;">${langData[status] || status}</span>
                    </div>
                `;
            }
        },{ 
            data: "remark" 
        },],
        language: getTableLang(),
        initComplete: function(){
            var input = $('#tb_history_filter input').unbind();
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