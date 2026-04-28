function initWindturbineTable() {
    const project = $('#filter_windturbine_project').val();
    const status  = $('#filter_windturbine_status').val();
    const search  = $('#search_windturbine').val();
    $.ajax({
        url: `${BASE_URL}/api/windturbine.list`,
        type: 'POST',
        data: { project, status, search },
        beforeSend: function() {
            $('#windturbine_accordion').html(`
                <div class="text-center py-4">
                    <div class="spinner-border text-primary"></div>
                </div>
            `);
        },
        success: function(res) {
            renderWindturbineAccordion(res.data);
        }
    });
}
function renderWindturbineAccordion(groups) {
    const $container = $('#windturbine_accordion');
    $container.empty();
    if (!groups || groups.length === 0) {
        $container.html('<div class="alert alert-info">No data found.</div>');
        return;
    }
    groups.forEach(function(group, index) {
        const collapseId = `collapse_wt_project_${group.project_id}`;
        const headerId   = `header_wt_project_${group.project_id}`;
        const count      = group.items.length;
        const isEmpty    = count === 0;
        let rowsHtml = '';
        if (isEmpty) {
            rowsHtml = `
                <tr>
                    <td colspan="5" class="text-center text-muted fst-italic">
                        <i class="fa-solid fa-inbox me-2"></i><span data-i18n="no_data_found"></span>
                    </td>
                </tr>`;
        } else {
            group.items.forEach(function(row) {
                const isChecked = row.status === 'active' ? 'checked' : '';
                rowsHtml += `
                <tr>
                    <td>${row.windturbine_lat}</td>
                    <td>${row.windturbine_lng}</td>
                    <td><small class="text-muted">${row.created_at}</small></td>
                    <td>
                        <div class="form-check form-switch mb-0">
                            <input class="form-check-input update-status-switch" type="checkbox" role="switch"id="switch_${row.id}" data-id="${row.id}" ${isChecked} style="cursor:pointer;">
                        </div>
                    </td>
                    <td class="text-end">
                        <button class="btn btn-link btn-sm text-danger p-0 delete-windturbine" data-id="${row.id}" data-project-id="${group.project_id}"><i class="fa-regular fa-trash-can"></i></button>
                    </td>
                </tr>`;
            });
        }
        const accordionItem = `
        <div class="accordion-item mb-2 border rounded shadow-sm">
            <h2 class="accordion-header" id="${headerId}">
                <button class="accordion-button ${index > 0 ? 'collapsed' : ''} fw-semibold" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="${index === 0 ? 'true' : 'false'}" aria-controls="${collapseId}">
                    <i class="fa-solid fa-folder-open me-2 text-warning"></i>
                    ${group.project_name}
                    <span class="badge ${isEmpty ? 'bg-secondary' : 'bg-primary'} ms-2">${count}</span>
                </button>
                <button class="btn btn-link text-danger py-0 px-3 delete-windturbine-project flex-shrink-0" data-project-id="${group.project_id}"data-project-name="${group.project_name}" title="Delete all in project">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </h2>
            <div id="${collapseId}" 
                 class="accordion-collapse collapse ${index === 0 ? 'show' : ''}" 
                 aria-labelledby="${headerId}">
                <div class="accordion-body p-0">
                    <div class="table-responsive">
                        <table class="table table-striped table-hover mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th data-i18n="latitude"></th>
                                    <th data-i18n="longitude"></th>
                                    <th data-i18n="create_at"></th>
                                    <th data-i18n="status"></th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>${rowsHtml}</tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>`;
        $container.append(accordionItem);
    });
    if (typeof applyI18n === 'function') applyI18n();
}
$('#filter_windturbine_project, #filter_windturbine_status').on('change', function() {
    initWindturbineTable();
});
$('#search_windturbine').on('keypress', function(e) {
    if (e.keyCode === 13) initWindturbineTable();
});
function reloadWindturbineProject(projectId) {
    const $accordion = $(`#collapse_wt_project_${projectId}`);
    const $tbody = $accordion.find('tbody');
    const status = $('#filter_windturbine_status').val();
    const search = $('#search_windturbine').val();
    $tbody.html(`
        <tr>
            <td colspan="5" class="text-center py-3">
                <div class="spinner-border spinner-border-sm text-primary"></div>
            </td>
        </tr>
    `);
    $.ajax({
        url: `${BASE_URL}/api/windturbine.listByProject`,
        type: 'POST',
        data: { project_id: projectId, status, search },
        dataType: 'json',
        success: function(res) {
            let rowsHtml = '';
            if (!res.data || res.data.length === 0) {
                rowsHtml = `
                    <tr>
                        <td colspan="5" class="text-center text-muted fst-italic">
                            <i class="fa-solid fa-inbox me-2"></i><span data-i18n="no_data_found"></span>
                        </td>
                    </tr>`;
            } else {
                res.data.forEach(function(row) {
                    const isChecked = row.status === 'active' ? 'checked' : '';
                    rowsHtml += `
                    <tr>
                        <td>${row.windturbine_lat}</td>
                        <td>${row.windturbine_lng}</td>
                        <td><small class="text-muted">${row.created_at}</small></td>
                        <td>
                            <div class="form-check form-switch mb-0">
                                <input class="form-check-input update-status-switch" type="checkbox" role="switch" id="switch_${row.id}" data-id="${row.id}" ${isChecked} style="cursor:pointer;">
                            </div>
                        </td>
                        <td class="text-end">
                            <button class="btn btn-link btn-sm text-danger p-0 delete-windturbine" data-id="${row.id}" data-project-id="${row.project_id}">
                                <i class="fa-regular fa-trash-can"></i>
                            </button>
                        </td>
                    </tr>`;
                });
            }
            $tbody.html(rowsHtml);
            const count = res.data ? res.data.length : 0;
            $(`[data-bs-target="#collapse_wt_project_${projectId}"] .badge`).text(count).removeClass('bg-primary bg-secondary').addClass(count > 0 ? 'bg-primary' : 'bg-secondary');
            if (typeof applyI18n === 'function') applyI18n();
        }
    });
}
$(document).on('click', '.delete-windturbine', function() {
    const id = $(this).data('id');
    const projectId = $(this).data('project-id');
    showConfirm(langData['confirm'], langData['confirm_delete'], function() {
        $.ajax({
            url: `${BASE_URL}/api/windturbine.delete`,
            method: 'POST',
            data: { id: id, project_id: projectId },
            dataType: 'json',
            success: function(res) {
                if (res.status === true) {
                    showSuccess(langData['deleted_successfully']);
                    reloadWindturbineProject(projectId);
                } else {
                    showError(langData['cannot_delete']);
                }
            },
            error: function() {
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
$(document).on('click', '.delete-windturbine-project', function(e) {
    e.stopPropagation();
    const projectId   = $(this).data('project-id');
    const projectName = $(this).data('project-name');
    showConfirm(
        langData['confirm'],
        `${langData['confirm_delete']} "${projectName}"?`,
        function() {
            $.ajax({
                url: `${BASE_URL}/api/windturbine.deleteByProject`,
                method: 'POST',
                data: { project_id: projectId },
                dataType: 'json',
                success: function(res) {
                    if (res.status === true) {
                        showSuccess(langData['deleted_successfully']);
                        reloadWindturbineProject(projectId);
                    } else {
                        showError(langData['cannot_delete']);
                    }
                },
                error: function() {
                    showError(langData['cannot_delete']);
                }
            });
        }
    );
});