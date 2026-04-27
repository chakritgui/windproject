let tb_windturbine;
function initWindturbineTable() {
    let oldPage = 0;
    if ($.fn.DataTable.isDataTable('#tb_windturbine')) {
        oldPage = $('#tb_windturbine').DataTable().page();
        $('#tb_windturbine').DataTable().destroy();
    }
    if ($.fn.DataTable.isDataTable('#tb_windturbine')) {
        $('#tb_windturbine').DataTable().ajax.reload(null, false);
        return;
    }
    tb_windturbine = $('#tb_windturbine').DataTable({
        processing: true,
        serverSide: true,
        order: [[3, 'desc']],
        ajax: { 
            url: `${BASE_URL}/api/windturbine.list`, 
            type: "POST",
            data: function(d){
                d.project = $('#filter_windturbine_project').val();
                d.status = $('#filter_windturbine_status').val();
            }
        },
        columns: [{ 
            data: "project_name",
            orderable: true,
        },{ 
            data: "windturbine_lat",
            orderable: true,
        },{ 
            data: "windturbine_lng",
            orderable: true,
        },{ 
            data: "created_at",
            orderable: true,
        },{ 
            data: 'status',
            orderable: true,
            render: function (status, type, row) {
                const isChecked = (status === 'active') ? 'checked' : '';
                const rowId = row.id;
                return `
                    <div class="form-check form-switch">
                        <input class="form-check-input update-status-switch" type="checkbox" role="switch" id="switch_${rowId}" data-id="${rowId}" ${isChecked} style="cursor: pointer;">
                        <label class="form-check-label ms-1 small text-muted" for="switch_${rowId}"></label>
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
                        <button class="btn btn-link text-danger py-1 border-start delete-windturbine" data-id="${row.id}"><i class="fa-regular fa-trash-can"></i></button>
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
            var $filter = $('#tb_windturbine_filter');
            var input = $filter.find('input').unbind(); 
            input.bind('keypress', function(e) {
                if (e.keyCode == 13) {
                    self.search(input.val()).draw();
                }
            });
            if ($filter.find('.import-windturbine').length === 0) {
                let btn = `
                    <button class="btn btn-primary btn-sm import-windturbine ms-1">
                        <i class="fa-solid fa-plus me-2"></i><span>${langData['import'] || "Import"}</span>
                    </button>
                `;
                $filter.append(btn);
            }
            if ($filter.find('.icon-windturbine').length === 0) {
                let btn = `
                    <button class="btn btn-info btn-sm icon-windturbine ms-1">
                        <i class="fa-solid fa-gears me-2"></i><span>${langData['icon'] || "Icon"}</span>
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
$(document).on('click', '.delete-windturbine', function() {
    let id = $(this).data("id");
    showConfirm(langData['confirm'], langData['confirm_delete'], function(){
        $.ajax({
            url: `${BASE_URL}/api/windturbine.delete`,
            method: 'POST',
            data: { id: id },
            dataType: 'json',
            success: function(res) {
                if(res.status === true){
                    showSuccess(langData['deleted_successfully']);
                    initWindturbineTable();
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
$(document).on('click', '.import-windturbine', function () {
    let modalEl = $('#windModal');
    let modal = new bootstrap.Modal(modalEl[0]);
    modal.show();
    modalEl.find(".modal-header").html(`
        <h5 class="modal-title">${langData['windturbine'] || 'Wind Turbine'}</h5>
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
        <div class="mb-3">
            <label class="mb-2 required">${langData['importMode'] || "Import Mode"}</label>
            <div class="d-flex gap-3">
                <div class="form-check">
                    <input class="form-check-input" type="radio" name="import_mode" id="mode_append" value="append" checked>
                    <label class="form-check-label" for="mode_append">${langData['add-new-keep-old'] || "Add New (Keep Old)"}</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="radio" name="import_mode" id="mode_replace" value="replace">
                    <label class="form-check-label" for="mode_replace">${langData['replace-duplicate'] || "Replace Duplicate (Inactive All First)"}</label>
                </div>
            </div>
        </div>
    `);
    loadLang(currentLang);
});
$(document).on('click', '.icon-windturbine', function () {
    openIconSetting('windturbine');
    
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
        url: `${BASE_URL}/api/windturbine.import`,
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
                    if (typeof initWindturbineTable === "function") initWindturbineTable();
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
$(document).on("change", ".update-status-switch", function() {
    let id = $(this).data("id");
    let newStatus = $(this).is(":checked") ? 'active' : 'inactive';
    $.ajax({
        url: `${BASE_URL}/api/windturbine.updateStatus`,
        method: 'POST',
        data: { id: id, status: newStatus },
        dataType: 'json',
        success: function(res) {    
            if(res.status === true){
                showSuccess(langData['saved_successfully'] || 'Saved successfully');
                if (typeof initWindturbineTable === "function") initWindturbineTable();
            } else {
                showError((langData['cannot_save'] || 'Error: ') + ' ' + (langData[res.message] || 'Unknown error'));
            }
        },
        error: function(){
            Swal.close();
            let msg = langData['cannot_save'];
            try {
                let res = JSON.parse(xhr.responseText);
                if (res.message) msg += ": " + res.message;
            } catch (e) {}
            showError(msg);
        }
    });
});
$(document).on('click', '.clear-windturbine', function() {
    showConfirm(langData['confirm'], langData['confirm_clear'], function(){
        $.ajax({
            url: `${BASE_URL}/api/windturbine.clear`,
            method: 'POST',
            dataType: 'json',
            success: function(res) {
                if(res.status === true){
                    showSuccess(langData['clear_successfully']);
                    initWindturbineTable();
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
    });
});