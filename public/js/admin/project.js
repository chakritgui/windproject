let currentFolderId = (typeof initialData !== 'undefined') ? initialData.currentFolderId : null;
let currentLevel = (typeof initialData !== 'undefined') ? initialData.currentLevel : 1;
let currentPath = (typeof initialData !== 'undefined' && initialData.initialPath) ? initialData.initialPath : [{id: null, name: 'PSTG PROJECT', level: 1, slug: ''}]; 
let cachedData = []; 
let offset = 0;
let limit = 20;
let isLoading = false;
let isFull = false;
let currentSearch = '';
function updateURL() {
    const slugString = currentPath.filter(p => p.slug) .map(p => p.slug).join('/');
    const newURL = `${BASE_URL}/project/${slugString}`;
    window.history.pushState({ path: currentPath, folderId: currentFolderId, level: currentLevel }, '', newURL);
}
initProject();
function initProject() {
    fetchFolders(true);
}
function updateBrowserURL() {
    const slugString = currentPath
        .filter(p => p.slug && p.slug !== '') 
        .map(p => p.slug)
        .join('/');
    const newURL = `${BASE_URL}/project/${slugString}`;
    window.history.pushState({ 
        path: currentPath, 
        folderId: currentFolderId, 
        level: currentLevel 
    }, '', newURL);
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
        url: `${BASE_URL}/api/project.get`,
        method: 'POST',
        data: {
            level: currentLevel,
            item: currentFolderId,
            start: offset,
            length: limit,
            search: { value: currentSearch },
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
                $('#btnSaveSort').addClass('d-none');
            }
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
        const activeLangs = item.settings?.language ? item.settings.language.split(',') : ['en'];
        let statusHtml = `
            <div class="mt-1 d-flex gap-1 flex-wrap">
                ${activeLangs.map(lang => {
                    const status = item[`${lang}_status`]; 
                    return typeof renderLangStatus === 'function' ? renderLangStatus(lang, status) : '';
                }).join('')}
            </div>`;
        const globalIndex = cachedData.length - data.length + index;
        let icon = 'fa-folder-open text-warning';
        if (item.type === 'content') icon = (item.sub_type == 'news') ? 'fa-regular fa-newspaper text-primary' : 'fa-solid fa-diagram-project text-warning';
        const badge = item.child_count > 0 ? `<span class="badge rounded-pill bg-light text-dark border ms-2" style="font-size: 0.7rem;">${item.child_count}</span>` : '';
        let folder_name = '-';
        if (item.type === 'content') {
            folder_name = (currentLang === 'th' && item.th_subject) || (currentLang === 'en' && item.en_subject) || (currentLang === 'lo' && item.lo_subject) || item.th_subject || item.en_subject || item.lo_subject || '-';
        } else {
            folder_name = item.folder_name || '-';
        }
        const bg = (item.status === "active" || item.status === "published"  || item.status === "public") ? "success" : "secondary";
        const statusBody = `<span class="badge rounded-pill bg-${bg}-subtle text-${bg}">${langData[item.status] || item.status}</span>`;
        let typeHtml = '';
        if(item.sub_type === 'news') {
            typeHtml = `<span class="badge rounded-pill text-bg-primary"><i class="fa-regular fa-newspaper me-2"></i><span>${langData['news'] || 'News'}</span></span>`;
        } else if(item.sub_type === 'project') {
            typeHtml = `<span class="badge rounded-pill text-bg-warning"><i class="fa-solid fa-diagram-project me-2"></i><span>${langData['project'] || 'Project'}</span></span>`;
        } else if(item.sub_type === 'document') {
            typeHtml = `<span class="badge rounded-pill text-bg-danger"><i class="fa-solid fa-folder-open me-2"></i><span>${langData['document'] || 'Document'}</span></span>`;
        }
        let badges = '';
        if (parseInt(item.count_attachment) > 0)
            badges += `<span class="badge rounded-pill bg-danger-subtle text-danger me-1">
                <i class="fa-solid fa-file-pdf me-1"></i>${langData['document'] || 'Doc'}
            </span>`;
        if (parseInt(item.count_image) > 0)
            badges += `<span class="badge rounded-pill bg-primary-subtle text-primary me-1">
                <i class="fa-solid fa-images me-1"></i>${langData['image'] || 'Img'}
            </span>`;
        if (parseInt(item.count_image360) > 0)
            badges += `<span class="badge rounded-pill bg-success-subtle text-success me-1">
                <i class="fa-solid fa-vr-cardboard me-1"></i>VR
            </span>`;
        if (parseInt(item.count_presentation) > 0)
            badges += `<span class="badge rounded-pill bg-success-subtle text-success me-1">
                <i class="fa-solid fa-photo-film me-1"></i>${langData['presentation'] || 'Presentation'}
            </span>`;
        html += `
            <tr data-index="${globalIndex}" data-id="${item.id}" data-type="${item.type}" style="${item.type === 'content' || item.type === 'document' ? 'cursor:default;' : 'cursor:pointer;'}">
                <td>
                    <i class="fa-solid fa-grip-vertical drag-handle text-muted me-2" style="cursor:grab;"></i>
                </td>
                <td class="text-center" style="width: 80px;">
                    <div style="width: 50px; height: 50px; line-height: 50px; overflow: hidden; margin: 0 auto; border-radius: 4px; border: 1px solid #eee;">
                    ${item.cover ? 
                        `<img src="${BASE_URL}/${item.cover}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='${BASE_URL}/public/images/noimage.jpg';" loading="lazy">` : 
                        `
                            ${(item.type === 'document') ? `<i class="${getFileIconClass(item.cover)} fa-2x text-secondary-light"></i>` : `<i class="fa-solid ${icon} fa-3x"></i>`}
                        `
                    }
                    </div>
                </td>
                <td>
                    <div class="fw-bold mb-2">
                        ${folder_name || '-'} ${badge}
                    </div>
                    ${badges}
                </td>
                <td>
                    ${(item.type === 'content' || item.type === 'document') ? typeHtml : ``}
                </td>
                <td>${item.created_at || '-'}</td>
                <td>
                    ${(item.type === 'content') ? statusHtml : ``}
                </td>
                <td>
                    ${statusBody}
                </td>
                <td style="white-space: nowrap;" class="text-end">
                    <div class="btn-group border rounded-3 bg-white">
                        ${(item.type === 'content') ? `
                            <a onclick="openContent('${item.content_slug}', 'preview')" class="btn btn-link text-info view-content"><i class="fa-solid fa-eye"></i></a> 
                        ` : ``}
                        ${(item.type === 'document') ? `
                            <a href="${BASE_URL}/${item.slug}" class="btn btn-link text-primary" target="_blank"><i class="fa-solid fa-folder-open"></i></a> 
                        ` : ``}
                        ${item.sub_type === 'project' ? `
                            <button class="btn btn-link text-warning border-start manage-${(item.type === 'content') ? 'content' : 'project'}" data-id="${(item.type === 'content') ? item.content_id :item.id}"><i class="fa-solid fa-pen-to-square"></i></button>
                            ${(item.child_count === 0) ? `
                                <button class="btn btn-link text-danger border-start delete-${(item.type === 'content') ? 'content' : 'project'}" data-id="${(item.type === 'content') ? item.content_id :item.id}"><i class="fa-regular fa-trash-can"></i></button> 
                            ` : ``}
                        ` : `
                            <button class="btn btn-link text-danger border-start unlink-content" data-id="${item.id}" data-content="${item.content_id}"><i class="fa-solid fa-link-slash"></i></button>
                        `}
                    </div>
                </td>
            </tr>`;
    });
    if (isNewSearch) {
        $body.html(html);
    } else {
        $body.append(html);
    }
    $body.find('tr').off('click').on('click', function(e) {
        if ($(e.target).closest('button').length || $(e.target).closest('a').length) return;
        const index = $(this).data('index');
        const rowData = cachedData[index];
        if (rowData) {
            if (rowData.type === 'content' || rowData.type === 'document') return;
            currentFolderId = rowData.id;
            currentLevel = parseInt(rowData.level) + 1;
            currentPath.push({
                id: currentFolderId,
                name: rowData.folder_name, 
                level: rowData.level,
                slug: rowData.slug
            });
            updateBrowserURL(); 
            fetchFolders(true); 
        }
    });
    enableSorting();
}
let sortableInstance = null;
function enableSorting() {
    const el = document.getElementById('listViewBody');
    if (sortableInstance) {
        sortableInstance.destroy();
    }
    sortableInstance = new Sortable(el, {
        animation: 150,
        ghostClass: 'bg-light',
        handle: '.drag-handle',
        onEnd: function () {
            $('#btnSaveSort').removeClass('d-none');
        }
    });
}
$('#btnSaveSort').on('click', function () {
    const btn = $(this);
    btn.prop("disabled", true);
    const sortedIds = [];
    $('#listViewBody tr').each(function (index) {
        const id = $(this).data('id');
        if (!id) return;
        sortedIds.push({
            id: id,
            sort_order: index + 1
        });
    });
    Swal.fire({
        title: langData['saving'] || 'Saving...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });
    $.ajax({
        url: `${BASE_URL}/api/project.sort`,
        type: "POST",
        data: JSON.stringify({
            items: sortedIds
        }),
        contentType: "application/json",
        success: function (res) {
            Swal.close();
            if (res.status === true) {
                $('#btnSaveSort').addClass('d-none');
                showSuccess(langData['saved_successfully'] || "Sort updated");
            } else {
                showError(res.message || "Cannot save sort");
            }
        },
        error: function () {
            Swal.close();
            showError("Server error");
        },
        complete: function () {
            btn.prop("disabled", false);
        }
    });
});
function renderBreadcrumb() {
    let html = '';
    currentPath.forEach((p, idx) => {
        const isHome = idx === 0;
        const isActive = idx === currentPath.length - 1;
        const homeIcon = isHome ? '<i class="fa-solid fa-house me-2"></i>' : '';
        let displayName = p.name;
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
        currentLevel = target.id === null ? 1 : parseInt(target.level) + 1;
        updateURL();
        fetchFolders(true);
    });
}
window.onpopstate = function(event) {
    if (event.state && event.state.path) {
        currentPath = event.state.path;
        const lastStep = currentPath[currentPath.length - 1];
        currentFolderId = lastStep.id;
        currentLevel = lastStep.id === null ? 1 : parseInt(lastStep.level) + 1;
        fetchFolders(true);
    } else {
        window.location.reload();
    }
};
const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
        fetchFolders(false);
    }
}, {
    root: null, 
    rootMargin: '200px',
});
observer.observe(document.getElementById('scrollEnd'));
$('#txtSearch').on('keyup', function() {
    clearTimeout(window.searchTimer);
    const searchTerm = $(this).val();
    window.searchTimer = setTimeout(() => {
        currentSearch = searchTerm;
        fetchFolders(true);
    }, 500); 
});
$(document).on('click', '.manage-project', function () {
    let id = $(this).data("id");
    manageFolder(id);
});
$(document).on('click', '.delete-project', function () {
    let id = $(this).data("id");
    showConfirm(langData['confirm'], langData['confirm_delete'], function(){
        $.ajax({
            url: `${BASE_URL}/api/project.delete`,
            method: 'POST',
            data: { folder_id: id },
            dataType: 'json',
            success: function(res) {
                if (res.status === 'success') {
                    showSuccess(langData['deleted_successfully']);
                    fetchFolders(currentLevel, currentFolderId);
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
$(document).on('click', '.unlink-content', function () {
    let id = $(this).data("id");
    let content_id = $(this).data("content");
    showConfirm(langData['confirm'], langData['confirm_unlink'], function(){
        $.ajax({
            url: `${BASE_URL}/api/project.unlink`,
            method: 'POST',
            data: { folder_id: id, content_id: content_id },
            dataType: 'json',
            success: function(res) {
                if (res.status === 'success') {
                    showSuccess(langData['successfully']);
                    fetchFolders(currentLevel, currentFolderId);
                } else {
                    showError(langData['process_failed']);
                }   
            },
            error: function(){
                showError(langData['cannot_delete']);
            }
        });
    });
});
function manageFolder(folder_id = '') {
    let modalEl = $('#windModal');
    let modal = new bootstrap.Modal(modalEl[0]);
    modal.show();
    modalEl.find(".modal-header").html(`
        <h5 class="modal-title">${langData['create_folder'] || 'Create Folder'}</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
    `);
    modalEl.find(".modal-footer").html(`
        <button type="button" class="btn btn-primary me-2 save-folder">${langData['save'] || 'Save'}</button>
        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">${langData['close'] || 'Close'}</button>
    `);
    if (folder_id) {
        $.ajax({
            url: `${BASE_URL}/api/project.info`,
            method: 'POST',
            data: { folder_id },
            dataType: 'json',
            success: function(res){
                if (res.status === 'success') {
                    renderForm(res.data);
                    modalEl.find(".modal-title").text(langData['edit_folder'] || 'Edit Folder');
                } else {
                    showError(langData['cannot_load']);
                }
            },
            error: function(){
                showError(langData['cannot_load']);
            }
        });
    } else {
        renderForm({
            id: '',
            folder_name: '',
            status: 'active',
            cover: ''
        });
    }
    function renderForm(data) {
        modalEl.find(".modal-body").html(`
            <input type="hidden" id="folder_id" value="${data.id || ''}">
            ${renderCover(data || '', 'folder')}
            <div class="mb-3">
                <label class="mb-2 required">${langData['name'] || 'Name'}</label>
                <input type="text" class="form-control obj-required" id="folder_name" maxlength="255" value="${data.folder_name || ''}">
            </div>
            <div class="row g-3">
                <div class="col-md-4">
                    <label class="mb-2 mt-3 required">${langData['status'] || 'Status'}</label>
                    <select id="status" class="form-select obj-required"></select>
                </div>
            </div>
        `);
        initSelect2Remote('#status', `${BASE_URL}/api/project.filter`, { type: 'status' });
        let status = data.status || 'active';
        let statusName = status.charAt(0).toUpperCase() + status.slice(1);
        let option = new Option(statusName, status, true, true);
        $('#status').append(option).trigger('change');
        initCoverUpload();
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
        showWarning(langData['required_star_message'] || 'Please fill all fields marked with *');
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
    formData.append("status", $("#status").val() || "active");
    formData.append("parent_id", currentFolderId || 0);
    formData.append("level", currentLevel || 1);
    formData.append("ex_cover", $("#ex_cover").val());
    const cover = $("#cover")[0].files[0] || null;
    if (cover) {
        formData.append("cover", cover);
    }
    Swal.fire({
        title: langData['saving'] || 'Saving...',
        html: `
            <p>${langData['please_do_not_close_this_page'] || 'Please do not close this page.'}</p>
            <div class="progress mt-2">
                <div id="swal-progress" class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width:0%">0%</div>
            </div>
        `,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });
    $.ajax({
        url: `${BASE_URL}/api/project.save`,
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
                fetchFolders(currentLevel, currentFolderId);
                $('#windModal').modal('hide');
            } else {
                showError((langData['cannot_save'] || 'Error: ') + (res.message || 'Unknown error'));
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
$(document).on('click', '.manage-content', function () {
    let id = $(this).data("id");
    manageContent(id);
});
function manageContent(id) {
    $.post(`${BASE_URL}/api/project.gets`, { id }, function(res) {
        if(res.status !== "success") return;
        let d = res.data;
        const translates = d.translates;
        let ENABLE_TRANSLATE = translates.ENABLE_TRANSLATE;
        let GOOGLE_API_KEY = translates.GOOGLE_API_KEY;
        let $modal = $("#windModal");
        const $dialog = $modal.find(".modal-dialog");
        $dialog.removeClass("modal-fullscreen");
        let modal = new bootstrap.Modal($modal[0]);
        $modal.find(".modal-header").html(`
            <h5 class="modal-title">${langData['content'] || 'Content'}</h5>
            <div class="ms-auto">
                <button type="button" class="btn btn-sm btn-light me-2" id="btn-fullscreen">
                    <i class="fa-regular fa-window-maximize"></i>
                </button>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
        `);
        $modal.find("#btn-fullscreen").on("click", function() {
            $modal.find(".modal-dialog").toggleClass("modal-fullscreen");
            const icon = $(this).find("i");
            icon.toggleClass("fa-regular fa-window-maximize fa-regular fa-window-restore");
        });
        $modal.find(".modal-footer").html(`
            <div class="row w-100"> 
                <div class="col-6 d-flex align-items-center">
                    ${(ENABLE_TRANSLATE == 1 && GOOGLE_API_KEY) ? `
                        <div class="form-check mb-0">
                            <input class="form-check-input" type="checkbox" id="auto_translate" value="yes">
                            <label class="form-check-label" for="auto_translate">
                                ${langData['auto_translate'] || 'Auto Translate'}
                            </label>
                        </div>
                        ` : ``}
                </div>
                <div class="col-6 text-end">
                    <button type="button" class="btn btn-primary me-2 save-content">
                        ${langData['save'] || 'Save'}
                    </button>
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
                        ${langData['close'] || 'Close'}
                    </button>
                </div>
            </div>
        `);
        $modal.find(".modal-body").html(getContentForm(d));
        initSelect2Remote('#status', `${BASE_URL}/api/project.filter`, { type: 'status' });
        let status = (d.status) ? d.status : 'active';
        if (status) {
            let statusName = status.charAt(0).toUpperCase() + status.slice(1);
            var newOptionStatus = new Option(statusName, status, true, true);
            $('#status').append(newOptionStatus).trigger('change');
        }
        initCoverUpload();
        initAttachmentsUpload(d.attachments || []);
        initImagesUpload(d.images || []);
        initPresentationUpload(d.presentation || []);
        init360ImagesUpload(d.images360 || []);
        initSummernote();
        modal.show();
        modal.show();
    }, "json");
}
function getContentForm(d) {
    const isEdit = !!d.id; 
    return `
        <form id="contentForm">
            ${renderTabs()}
            <div class="tab-content">
                <div class="tab-pane fade show active" id="tab-basic">
                    ${renderCover(d)}
                    ${renderLangTabs(d)}
                    <div class="row g-3">
                        <div class="col-md-4">
                            <label class="mb-2 mt-3 required">${langData['status'] || 'Status'}</label>
                            <select id="status" class="form-select obj-required"></select>
                        </div>
                    </div>
                    <hr class="my-4">
                    <div class="row mt-3">
                        <div class="col-12 mb-2">
                            <div class="form-check form-switch">
                                <input class="form-check-input switch-item" type="checkbox" id="folder_show_all" ${d.folder_show_admin == 'yes' && d.folder_show_user == 'yes' ? 'checked' : ''}>
                                <label class="form-check-label fw-bold text-dark" for="folder_show_all">
                                    <i class="fa-solid fa-check-double me-2 text-dark"></i>
                                    ${langData['select_all'] || 'Select All'}
                                </label>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-check form-switch">
                                <input class="form-check-input switch-item" type="checkbox" id="folder_show_admin" ${d.folder_show_admin == 'yes' ? 'checked' : ''}>
                                <label class="form-check-label fw-bold" for="folder_show_admin">
                                    <i class="fa-solid fa-user-shield me-2 text-primary"></i>
                                    ${langData['show_news_admin'] || 'Show in News (Admin)'}
                                </label>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-check form-switch">
                                <input class="form-check-input switch-item" type="checkbox" id="folder_show_user" ${d.folder_show_user == 'yes' ? 'checked' : ''}>
                                <label class="form-check-label fw-bold" for="folder_show_user">
                                    <i class="fa-solid fa-users me-2 text-success"></i>
                                    ${langData['show_news_user'] || 'Show in News (User)'}
                                </label>
                            </div>
                        </div>
                    </div>
                    <hr class="my-4">
                    <div class="card bg-light border-0">
                        <div class="card-body">
                            <h6 class="card-title fw-bold text-dark"><i class="fa-solid fa-bell me-2"></i>${langData['notification_settings']}</h6>
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="send_notification">
                                <label class="form-check-label" for="send_notification">${isEdit ? langData['send_update'] : langData['send_publishing']}</label>
                            </div>
                            <small class="text-muted d-block mt-1">${langData['if_enabled']}</small>
                        </div>
                    </div>
                </div>
                ${renderGallery()}
                ${renderPresentation()}
                ${render360()}
                ${renderFiles()}
            </div>
            <input type="hidden" id="content_id" value="${d.id ?? ''}">
        </form>
    `;
}
$(document).on('change', '#folder_show_all', function() {
    const isChecked = $(this).is(':checked');
    $('#folder_show_admin, #folder_show_user').prop('checked', isChecked);
});
$(document).on('change', '#folder_show_admin, #folder_show_user', function() {
    const isAdminChecked = $('#folder_show_admin').is(':checked');
    const isUserChecked = $('#folder_show_user').is(':checked');
    $('#folder_show_all').prop('checked', isAdminChecked && isUserChecked);
});
$(document).on('click', '.save-content', function () {
    let hasError = [];
    $('.is-invalid').removeClass('is-invalid');
    $('.obj-required').each(function () {
        let value = $(this).val()?.trim() || '';
        if (!value) {
            $(this).addClass('is-invalid');
            hasError.push(this.name || this.id);
        } else {
            $(this).removeClass('is-invalid');
        }
    });
    if (hasError.length) {
        showWarning(langData['required_star_message'] || 'Please fill all fields marked with *');
        $('.is-invalid').first().focus();
        return;
    }
    const isNotify = $("#send_notification").is(":checked");
    if (isNotify) {
        Swal.fire({
            title: langData['send_notification'],
            text: langData['success_record'],
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: langData['save_and_notify']
        }).then((result) => { if (result.isConfirmed) executeSave(); });
    } else {
        executeSave();
    }
});
function executeSave() {
    const btn = $(".save-content");
    btn.prop("disabled", true);
    const formData = new FormData();
    const appendFiles = (getter, prefix) => {
        getter().forEach(item => {
            const key = item.type === 'new' ? `new_${prefix}[]` : `existing_${prefix}[]`;
            formData.append(key, item.type === 'new' ? item.file : item.id);
        });
    };
    appendFiles(window.getAttachmentsData, 'attachments');
    appendFiles(window.getImagesData, 'images');
    appendFiles(window.get360ImagesData, 'images360');
    appendFiles(window.getPresentationData, 'presentation');
    formData.append("parent_id", currentFolderId || 0);
    formData.append("level", currentLevel || 1);
    formData.append("content_id", $("#content_id").val() || "");
    formData.append("status", $("#status").val());
    formData.append("publish_at", typeof buildPublishAt === "function" ? buildPublishAt() : "");
    const coverDisplayStatus = $("input[name='cover_display']:checked").val() || "no";
    formData.append("cover_display", coverDisplayStatus);
    formData.append("ex_cover", $("#ex_cover").val() || "");
    formData.append("send_notification", $("#send_notification").is(":checked") ? 'yes' : 'no');
    let folder_show_admin = $('#folder_show_admin').is(':checked') ? 'yes' : 'no';
    let folder_show_user  = $('#folder_show_user').is(':checked') ? 'yes' : 'no';
    formData.append("folder_show_admin", folder_show_admin);
    formData.append("folder_show_user", folder_show_user);
    ['en', 'lo', 'th'].forEach(lang => {
        const $editor = $(`#content_${lang}`);
        const $title = $(`#title_${lang}`);
        if ($editor.length) {
            let htmlContent = $editor.summernote('code').trim();
            const hasText = htmlContent.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim().length > 0;
            const hasImage = htmlContent.includes('<img');
            if (hasText || hasImage) {
                formData.append(`content_${lang}`, htmlContent);
            } else {
                formData.append(`content_${lang}`, ''); 
            }
        }
        if ($title.length) {
            formData.append(`title_${lang}`, $title.val().trim());
        }
    });
    formData.append("auto_translate", $("#auto_translate").is(":checked") ? 'yes' : 'no');
    const cover = $("#cover")[0].files[0] || null;
    if (cover) {
        formData.append("cover", cover);
    }
    Swal.fire({
        title: langData['saving'] || 'Saving...',
        html: `
            <div class="progress mt-3" style="height: 20px;">
                <div id="swal-progress" class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: 0%">0%</div>
            </div>`,
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading()
    });
    $.ajax({
        url: `${BASE_URL}/api/project.content.save`,
        type: "POST",
        data: formData,
        contentType: false,
        processData: false,
        xhr: function () {
            let xhr = new window.XMLHttpRequest();
            xhr.upload.addEventListener("progress", function (e) {
                if (e.lengthComputable) {
                    let percent = Math.round((e.loaded / e.total) * 100);
                    $("#swal-progress").css("width", percent + "%").text(percent + "%");
                }
            });
            return xhr;
        },
        success: function (res) {
            Swal.close();
            if (res.status === true) {
                showSuccess(langData['saved_successfully']);
                fetchFolders(currentLevel, currentFolderId);
                $('#windModal').modal('hide');
            } else {
                showError((langData['cannot_save'] || 'Error: ') + (res.message || 'Unknown error'));
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
$(document).on('click', '.delete-content', function () {
    let id = $(this).data("id");
    showConfirm(langData['confirm'], langData['confirm_delete'], function(){
        $.ajax({
            url: `${BASE_URL}/api/project.content.delete`,
            method: 'POST',
            data: { content_id: id },
            dataType: 'json',
            success: function(res) {
                if (res.status === 'success') {
                    showSuccess(langData['deleted_successfully']);
                    fetchFolders(currentLevel, currentFolderId);
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