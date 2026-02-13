let tb_level;
function initLevelTable() {
    let oldPage = 0;
    if ($.fn.DataTable.isDataTable('#tb_level')) {
        oldPage = $('#tb_level').DataTable().page();
        $('#tb_level').DataTable().destroy();
    }
    if ($.fn.DataTable.isDataTable('#tb_level')) {
        $('#tb_level').DataTable().ajax.reload(null, false);
        return;
    }
    tb_level = $('#tb_level').DataTable({
        processing: true,
        serverSide: true,
        order: [[3, 'desc']],
        ajax: { 
            url: "api/level/list", 
            type: "POST",
            data: function(d){}
        },
        columns: [{ 
            data: "height_name",
            orderable: true,
            render: function (data, type, row) {
                if (data) {
                    return data.replace(/\r\n|\n/g, '<br />');
                }
                return data;
            }
        },{
            data: "height_levels",
            orderable: false,
            render: function (data, type, row) {
                if (!data) return '<span class="text-muted">-</span>';
                let levels = data.split(',');
                let html = '<div class="d-flex flex-wrap gap-1">'; 
                levels.forEach(function (level) {
                    if(level.trim() !== "") {
                        html += `<span class="badge rounded-pill bg-light text-dark border shadow-sm px-2 py-1" style="font-weight: 500;">${level.trim()}</span>`;
                    }
                });
                html += '</div>';
                return html;
            }
        },{ 
            data: "height_limit",
            orderable: true,
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
                        <button class="btn btn-link text-warning py-1 manage-level" data-id="${row.height_id}"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="btn btn-link text-danger py-1 border-start delete-level" data-id="${row.height_id}"><i class="fa-regular fa-trash-can"></i></button>
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
            var $filter = $('#tb_level_filter');
            var input = $filter.find('input').unbind(); 
            input.bind('keypress', function(e) {
                if (e.keyCode == 13) {
                    self.search(input.val()).draw();
                }
            });
            if ($filter.find('.manage-level[data-id=""]').length === 0) {
                let btn = `
                    <button class="btn btn-primary btn-sm manage-level ms-2" data-id="">
                        <i class="fa-solid fa-plus"></i> <span>${langData['level'] || 'Level'}</span>
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
$(document).on('click', '.delete-level', function() {
    let height_id = $(this).data("id");
    showConfirm(langData['confirm'], langData['confirm_delete'], function(){
        $.ajax({
            url: `${BASE_URL}/api/level/delete`,
            method: 'POST',
            data: { id: height_id },
            dataType: 'json',
            success: function(res) {
                if(res.status === true){
                    showSuccess(langData['deleted_successfully']);
                    initLevelTable();
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
let levelsArray = [];
$(document).on('click', '.manage-level', function() {
    let height_id = $(this).data("id");
    $.ajax({
        url: `${BASE_URL}/api/level/get`,
        method: 'POST',
        data: { id: height_id },
        dataType: 'json',
        success: function(res) {
            if(res.status === true){
                let levelData = res.data;
                levelsArray = [];
                let modalEl = $('#windModal');
                let modal = new bootstrap.Modal(modalEl[0]);
                modal.show();
                modalEl.find(".modal-header").html(`
                    <h5 class="modal-title">${langData['manageLevel'] || 'Manage Level'}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                `);
                modalEl.find(".modal-footer").html(`
                    <button type="submit" class="btn btn-primary me-2 save-level">${langData['save'] || "Save"}</button>
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">${langData['close'] || "Close"}</button>
                `);
                modalEl.find(".modal-body").html(`
                    <input type="hidden" name="height_id" id="height_id" value="${height_id ?? ''}">
                    <div class="mb-3">
                        <label class="mb-2 required">${langData['level'] || 'Level'}</label>
                        <input type="text" class="form-control obj-required" id="height_name" maxlength="255">
                    </div>
                    <div class="mb-3">
                        <label class="mb-2 required">${langData['level'] || 'Level'}</label>
                        <input type="number" class="form-control obj-required" id="height_limit" min="1" step="1" onkeypress="return event.charCode >= 48 && event.charCode <= 57">
                    </div>
                    <div class="mb-3">
                        <label class="mb-2 required">${langData['max_selection_reached'] || 'Select a maximum of'}</label>
                        <div id="tag-container" class="form-control d-flex flex-wrap align-items-center gap-2" style="min-height: 45px; cursor: text;">
                            <input type="text" id="tag-input" class="border-0 flex-grow-1" style="outline: none; min-width: 100px;" placeholder="Type and press Enter...">
                        </div>
                        <small class="text-muted"><span data-i18n="enter_multiple_values"></span> (e.g., 75, 120N)</small>
                        <input type="hidden" class="obj-required" name="height_levels" id="height_levels_hidden">
                    </div>
                `);
                if (levelData) {
                    $("#height_id").val(levelData.height_id);
                    $("#height_name").val(levelData.height_name);
                    $("#height_limit").val(levelData.height_limit);
                    if (levelData.height_levels) {
                        levelsArray = levelData.height_levels.split(',').map(s => s.trim()).filter(s => s !== "");
                    }
                    renderTags();
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
function renderTags() {
    const container = $('#tag-container');
    container.find('.tag-item').remove();
    levelsArray.forEach((val, index) => {
        $(`
            <span class="badge bg-primary d-flex align-items-center gap-2 tag-item p-2" style="font-weight: 400;">
                ${val}
                <span class="remove-tag" data-index="${index}" style="cursor:pointer; font-weight: bold; line-height: 1; font-size: 16px;">&times;</span>
            </span>
        `).insertBefore('#tag-input');
    });
    $('#height_levels_hidden').val(levelsArray.join(','));
}
$(document).on('click', '#tag-container', function() {
    $('#tag-input').focus();
});
$(document).on('keydown', '#tag-input', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        let val = $(this).val().trim();
        if (val !== "") {
            if(!levelsArray.includes(val)) {
                levelsArray.push(val);
                renderTags();
            }
            $(this).val('');
        }
    }
});
$(document).on('click', '.remove-tag', function() {
    const index = $(this).data('index');
    levelsArray.splice(index, 1);
    renderTags();
});
$(document).on('click', '.save-level', function () {
    let errors = [];
    const limitVal = parseInt($('#height_limit').val()) || 0;
    const totalLevels = levelsArray.length;
    $('.obj-required').each(function () {
        let value = $(this).val()?.trim() || '';
        if (!value) {
            $(this).addClass('is-invalid');
            errors.push(this.id);
        } else {
            $(this).removeClass('is-invalid');
        }
    });
    if (errors.length) {
        showWarning(langData['required_star_message'] || 'Please fill all fields marked with *');
        return;
    }
    if (limitVal > totalLevels) {
        $('#height_limit').addClass('is-invalid');
        showWarning(
            (langData['selection_reached'] || 'Select a maximum of') + " " + totalLevels
        );
        return;
    }
    if (limitVal < 1) {
        $('#height_limit').addClass('is-invalid');
        showWarning(langData['limit_must_be_1'] || 'Limit must be at least 1');
        return;
    }

    saveLevel();
});
function saveLevel() {
    const btn = $(".save-level");
    btn.prop("disabled", true);
    const formData = new FormData();
    formData.append("height_id", $("#height_id").val() || "");
    formData.append("height_limit", $("#height_limit").val() || 3);
    formData.append("height_name", $("#height_name").val());
    formData.append("height_levels", $("#height_levels_hidden").val());
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
        url: "api/level/save",
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
                if (typeof initLevelTable === "function") initLevelTable();
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