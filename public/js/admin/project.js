let currentFolderId = null;
let currentLevel = 1; 
let currentRefId = null;
let currentProjectId = null;
let currentPath = [{id: null, name: 'PSTG PROJECT', level: 1, ref_id: null, project_id: null}];
let cachedData = []; 
let offset = 0;
const limit = 20;
let isLoading = false;
let isFull = false;
let currentSearch = '';
initProject();
function initProject() {
    fetchFolders(true);
}
function fetchFolders(isNewSearch = false) {
    if (isLoading) return;
    if (isNewSearch) {
        offset = 0;
        isFull = false;
        cachedData = [];
        $('#listViewBody').html('');
    }
    if (isFull) return;
    isLoading = true;
    $('#loadingIndicator').removeClass('d-none'); 
    $.ajax({
        url: 'api/project/get',
        method: 'POST',
        data: {
            level: currentLevel,
            item: currentFolderId,
            ref_id: currentRefId,
            project_id: currentProjectId,
            start: offset,
            length: limit,
            search: { value: currentSearch }
        },
        dataType: 'json',
        success: function(res) {
            if(res.status === true) {
                const result = res.data;
                const newData = result.data;
                cachedData = cachedData.concat(newData);
                renderTable(newData, isNewSearch);
                renderBreadcrumb();
                if (!result.hasMore || newData.length < limit) {
                    isFull = true;
                }
                offset += limit;
            } else {
                showError('Error', langData['cannot_load']);
            }
        },
        error: function () {
            showError('Error', langData['cannot_load']);
        },
        complete: function() {
            isLoading = false;
            $('#loadingIndicator').addClass('d-none');
        }
    });
}
function renderTable(data, isNewSearch) {
    const $body = $('#listViewBody');
    const $empty = $('#emptyState');
    const $tableHeader = $body.closest('table').find('thead'); 
    if (isNewSearch && (!data || data.length === 0)) {
        $body.html('');
        $empty.removeClass('d-none');
        $tableHeader.addClass('d-none');
        return;
    }
    $empty.addClass('d-none');
    $tableHeader.removeClass('d-none');
    let html = '';
    data.forEach((item, index) => {
        const globalIndex = cachedData.length - data.length + index;
        let icon = 'fa-folder-open text-warning';
        if (item.type === 'root') icon = 'fa-folder-open text-secondary';
        if (item.type === 'content') icon = 'fa-file-lines text-primary';
        const badge = item.child_count > 0 ? `<span class="badge rounded-pill bg-light text-dark border ms-2" style="font-size: 0.7rem;">${item.child_count}</span>` : '';
        html += `
            <tr data-index="${globalIndex}" style="cursor:pointer;">
                <td class="text-center"><i class="fa-solid ${icon} fa-2x"></i></td>
                <td>
                    <div class="fw-bold">${item.folder_name || '-'} ${badge}</div>
                    <small class="text-muted">${item.code ? item.code.toUpperCase() : 'FOLDER'}</small>
                </td>
                <td>${item.created_at || '-'}</td>
                <td>-</td>
                <td>-</td>
                <td>
                    ${(item.type !== 'root') ? `
                        <button class="btn btn-sm btn-light manage-project" data-id="${item.id}"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="btn btn-sm btn-light text-danger ${(item.child_count > 0) ? 'd-none' : 'delete-project'}" data-id="${item.id}"><i class="fa-regular fa-trash-can"></i></button>
                        ` : ``}
                </td>
            </tr>`;
    });
    if (isNewSearch) {
        $body.html(html);
    } else {
        $body.append(html);
    }
    $body.find('tr').off('click').on('click', function(e) {
        if ($(e.target).closest('button').length) return;
        const index = $(this).data('index');
        const rowData = cachedData[index]; 
        if (rowData) {
            currentFolderId = rowData.id;
            currentLevel = parseInt(rowData.level) + 1;
            currentRefId = rowData.ref_id || null;
            currentProjectId = rowData.project_id || currentProjectId;
            currentPath.push({
                id: currentFolderId,
                name: rowData.folder_name, 
                level: currentLevel,
                ref_id: currentRefId,
                project_id: currentProjectId
            });
            fetchFolders(true); 
        }
    });
}
$(window).on('scroll', function() {
    if ($(window).scrollTop() + $(window).height() >= $(document).height() - 100) {
        fetchFolders(false);
    }
});
$('#txtSearch').on('keyup', function() {
    clearTimeout(window.searchTimer);
    const searchTerm = $(this).val();
    window.searchTimer = setTimeout(() => {
        currentSearch = searchTerm;
        fetchFolders(true);
    }, 500); 
});
function renderBreadcrumb() {
    let html = '';
    currentPath.forEach((p, idx) => {
        const isHome = idx === 0;
        const isActive = idx === currentPath.length - 1;
        const homeIcon = isHome ? '<i class="fa-solid fa-house me-1"></i> ' : '';
        let displayName = p.name;
        if (!isActive && displayName.length > 20) {
            displayName = displayName.substring(0, 20) + '...';
        }
        html += `
            <li class="breadcrumb-item ${isActive ? 'active' : ''}">
                ${isActive 
                    ? `<span>${homeIcon}${displayName}</span>` 
                    : `<a href="javascript:void(0)" class="text-decoration-none" data-idx="${idx}">${homeIcon}${displayName}</a>`
                }
            </li>`;
    });
    $('#breadcrumb').html(html);
    $('#breadcrumb a').off('click').on('click', function() {
        const idx = $(this).data('idx');
        currentPath = currentPath.slice(0, idx + 1);
        const target = currentPath[idx];
        currentFolderId = target.id;
        currentLevel = target.level;
        currentRefId = target.ref_id;
        currentProjectId = target.project_id; 
        fetchFolders(currentLevel, currentFolderId, currentRefId, currentProjectId);
    });
}
$(document).on('click', '.manage-project', function () {
    let id = $(this).data("id");
    manageFolder(id);
});
$(document).on('click', '.delete-project', function () {
    let id = $(this).data("id");
    showConfirm(langData['confirm'], langData['confirm_delete'], function(){
        $.ajax({
            url: 'api/project/delete',
            method: 'POST',
            data: { folder_id: id },
            dataType: 'json',
            success: function(res) {
                if (res.status === 'success') {
                    showSuccess('Success', langData['deleted_successfully']);
                    fetchFolders(currentLevel, currentFolderId, currentRefId);
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
$(document).on('click', '#btnCreateFolder', function () {
    manageFolder();
});
function manageFolder(folder_id = '') {
    let modalEl = $('#windModal');
    let modal = new bootstrap.Modal(modalEl[0]);
    modal.show();
    modalEl.find(".modal-header").html(`
        <h5 class="modal-title" data-i18n="create_folder"></h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
    `);
    modalEl.find(".modal-footer").html(`
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" data-i18n="close"></button>
        <button type="button" class="btn btn-primary save-folder" data-i18n="save"></button>
    `);
    modalEl.find(".modal-body").html(`
        <input type="hidden" name="folder_id" id="folder_id" value="${folder_id ?? ''}">
        <div class="mb-3">
            <label class="mb-2 required" data-i18n="name"></label>
            <input type="text" class="form-control obj-required" id="folder_name" maxlength="255">
        </div>
    `);
    if(folder_id) {
        $.ajax({
            url: 'api/project/data',
            method: 'POST',
            data: { folder_id: folder_id },
            dataType: 'json',
            success: function(res){
                if (res.status === 'success') {
                    $('#folder_name').val(res.data.folder_name);
                    $('#folder_id').val(res.data.id);
                    $('#windModal').find(".modal-title").text(langData['edit_folder'] || 'Edit Folder');
                } else {
                    showError('Error', langData['cannot_load']);
                }
            },
            error: function(){
                showError('Error', langData['cannot_load']);
            }
        });
    }
}
$(document).on('click', '.save-folder', function () {
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
    saveFolder();
});
function saveFolder() {
    const btn = $(".save-folder");
    btn.prop("disabled", true);
    const formData = new FormData();
    formData.append("folder_id", $("#folder_id").val() || "");
    formData.append("folder_name", $("#folder_name").val() || "");
    formData.append("parent_id", currentFolderId || 0);
    formData.append("level", currentLevel || 1);
    formData.append("ref_id", currentRefId || "");
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
        url: "api/project/save",
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
                showSuccess('Success', langData['saved_successfully']);
                fetchFolders(currentLevel, currentFolderId, currentRefId);
                $('#windModal').modal('hide');
            } else {
                showError('Error', (langData['cannot_save'] || 'Error: ') + (res.message || 'Unknown error'));
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