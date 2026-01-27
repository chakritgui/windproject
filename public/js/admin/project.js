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
            <tr data-index="${globalIndex}" style="${item.type === 'content' ? 'cursor:default;' : 'cursor:pointer;'}">
                <td class="text-center" style="width: 80px;">
                    <div style="width: 50px; height: 50px; line-height: 50px; overflow: hidden; margin: 0 auto; border-radius: 4px; border: 1px solid #eee;">
                    ${(item.type === 'content') ? `
                        ${item.cover ? 
                            `<img src="${BASE_URL}/${item.cover}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='${BASE_URL}/public/images/noimage.jpg';">` : 
                            `<i class="fa-solid ${icon} fa-2x"></i>`
                        }
                    ` : `
                        <i class="fa-solid ${icon} fa-2x"></i>    
                    `}
                    </div>
                </td>
                <td>
                    <div class="fw-bold">${item.folder_name || '-'} ${badge}</div>
                    <small class="text-muted">${item.type ? item.type.toUpperCase() : 'FOLDER'}</small>
                </td>
                <td>${item.created_at || '-'}</td>
                <td>
                    ${(item.type === 'content') ? `
                        <div class="d-flex align-items-center gap-2 mt-1">
                            <i class="fa-solid fa-bell${item.notification_status === 'yes' ? '' : '-slash'} ${item.notification_status === 'yes' ? 'text-warning' : 'text-muted'}" style="font-size: 0.8rem;"></i> 
                            <span class="badge bg-${item.notification_status === 'yes' ? 'warning' : 'secondary'}" 
                                data-i18n="${item.notification_status}">
                                ${item.notification_status === 'yes' ? 'Yes' : 'No'}
                            </span>
                        </div>
                    ` : ``}
                </td>
                <td style="white-space: nowrap;">
                    ${(item.type === 'content') ? `
                        <button class="btn btn-light text-secondary view-content" data-id="${item.content_id}">
                            <i class="fa-solid fa-eye"></i>
                        </button>    
                    ` : ``}
                    ${(item.type !== 'root') ? `
                        <button class="btn btn-sm btn-light manage-${(item.type === 'content') ? 'content' : 'project'}" data-id="${(item.type === 'content') ? item.content_id :item.id}"><i class="fa-solid fa-pen-to-square"></i></button>
                        ${(item.child_count === 0) ? `
                           <button class="btn btn-sm btn-light text-danger delete-${(item.type === 'content') ? 'content' : 'project'}" data-id="${(item.type === 'content') ? item.content_id :item.id}"><i class="fa-regular fa-trash-can"></i></button> 
                        ` : ``}
                        
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
            if (rowData.type === 'content') {
                return; 
            }
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
$(document).on('click', '.manage-content', function () {
    let id = $(this).data("id");
    manageContent(id);
});
function manageContent(id) {
    $.post("api/project/gets", { id }, function(res) {
        if(res.status !== "success") return;
        let d = res.data;
        let $modal = $("#windModal");
        let modal = new bootstrap.Modal($modal[0]);
        $modal.find(".modal-header").html(`
            <h5 class="modal-title" data-i18n="content"></h5>
            <button class="btn-close" data-bs-dismiss="modal"></button>
        `);
        $modal.find(".modal-footer").html(`
            <button class="btn btn-secondary" data-bs-dismiss="modal" data-i18n="close"></button>
            <button class="btn btn-primary save-content" data-i18n="save"></button>
        `);
        $modal.find(".modal-body").html(getContentForm(d));
        initCoverUpload();
        initTinyMCE();
        initSelect2Remote('#status', 'api/project/filter', { type: 'status' });
        initSelect2Remote('#notification', 'api/project/filter', { type: 'notification' });
        let status = (d.status) ? d.status : 'active';
        if (status) {
            let statusName = status.charAt(0).toUpperCase() + status.slice(1);
            var newOptionStatus = new Option(statusName, status, true, true);
            $('#status').append(newOptionStatus).trigger('change');
        }
        let notification_status = (d.notification_status) ? d.notification_status : 'no';
        if (notification_status) {
            let statusName = notification_status.charAt(0).toUpperCase() + notification_status.slice(1);
            var newOptionStatus = new Option(statusName, notification_status, true, true);
            $('#notification').append(newOptionStatus).trigger('change');
        }
        modal.show();
    }, "json");
}
function getContentForm(d) {
    return `
        <input type="hidden" id="content_id" value="${d.id ?? ''}">
        <div id="coverDropArea" class="cover-drop-area text-center mb-3">
            <input type="file" id="cover" accept="image/*" hidden>
            <div id="coverPreviewWrapper" class="h-100 d-flex align-items-center justify-content-center">
                ${d.cover 
                    ? `<img id="coverPreview" src="${d.cover}" class="img-fluid rounded shadow-sm" style="max-height:150px;">`
                    : `<img id="coverPreview" class="img-fluid rounded shadow-sm d-none" style="max-height:150px;">`
                }
            </div>
            <div id="coverDropLabel" class="${d.cover ? 'd-none' : ''}">
                <div class="fw-bold fs-6 mt-2" data-i18n="dropHere"></div>
                <div class="text-muted small mb-2">
                    <span data-i18n="or"></span> <span data-i18n="choose"></span>
                </div>
            </div>
            <div class="text-muted small mt-2" data-i18n="allow_images_only"></div>
            <button type="button" id="btnRemoveCover" class="btn btn-sm btn-outline-danger mt-2 ${d.cover ? '' : 'd-none'}" data-i18n="remove"></button>
        </div>
        <input type="hidden" id="ex_cover" value="${d.cover ? d.cover : ''}">
        <ul class="nav nav-tabs mb-3">
            <li class="nav-item"><a class="nav-link active" data-bs-toggle="tab" href="#en">English</a></li>
            <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#lo">ລາວ</a></li>
            <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#th">ไทย</a></li>
        </ul>
        <div class="tab-content">
            ${langTab("en", d)}
            ${langTab("lo", d)}
            ${langTab("th", d)}
        </div>
        <div class="row g-3">
            <div class="col-md-4">
                <label class="mb-2 mt-3 required" data-i18n="status"></label>
                <select id="status" class="form-select obj-required"></select>
            </div>
            <div class="col-md-4">
                <label class="mb-2 mt-3 required" data-i18n="notification"></label>
                <select id="notification" class="form-select obj-required"></select>
            </div>
        </div>
    `;
}
function initCoverUpload() {
    const dropArea = document.getElementById("coverDropArea");
    const input = document.getElementById("cover");
    const preview = document.getElementById("coverPreview");
    const label = document.getElementById("coverDropLabel");
    const btnRemove = document.getElementById("btnRemoveCover");
    const ex_cover = document.getElementById("ex_cover");
    dropArea.addEventListener("click", () => input.click());
    ["dragenter", "dragover"].forEach(ev =>
        dropArea.addEventListener(ev, e => {
            e.preventDefault();
            dropArea.classList.add("border-primary");
        })
    );
    ["dragleave", "drop"].forEach(ev =>
        dropArea.addEventListener(ev, e => {
            e.preventDefault();
            dropArea.classList.remove("border-primary");
        })
    );
    dropArea.addEventListener("drop", e => {
        const file = e.dataTransfer.files[0];
        if (file) showPreview(file);
    });
    input.addEventListener("change", e => {
        const file = e.target.files[0];
        if (file) showPreview(file);
    });
    btnRemove.addEventListener("click", e => {
        e.stopPropagation();
        input.value = "";
        ex_cover.value = "";
        preview.src = "";
        preview.classList.add("d-none");
        label.classList.remove("d-none");
        btnRemove.classList.add("d-none");
    });
    function showPreview(file) {
        const validExt = ["jpg","jpeg","png","gif","webp"];
        const ext = file.name.split(".").pop().toLowerCase();
        if (!file.type.startsWith("image/") && !validExt.includes(ext)) {
            showWarning(
                langData['validation_error'] || 'Validation Error',
                langData['allow_images_only'] || 'Allow images only (jpg, jpeg, png, gif, webp)'
            );
            input.value = "";
            return;
        } 
        const reader = new FileReader();
        reader.onload = e => {
            preview.src = e.target.result;
            preview.classList.remove("d-none");
            label.classList.add("d-none");
            btnRemove.classList.remove("d-none");
        };
        reader.readAsDataURL(file);
    }
}
function langTab(lang, d) {
    return `
        <div class="tab-pane fade ${lang==='en' ? 'show active':''}" id="${lang}">
            <div class="mb-2">
                <label class="mb-2 ${lang === 'en' ? 'required' : ''}" data-i18n="title"></label>
                <input class="form-control ${lang === 'en' ? 'obj-required' : ''}" id="title_${lang}" value="${d.title[lang] ?? ''}">
            </div>
            <label class="mb-2" data-i18n="news"></label>
            <textarea id="content_${lang}">${d.content[lang] ?? ''}</textarea>
        </div>
    `;
}
$(document).on('click', '.save-content', function () {
    $('.is-invalid').removeClass('is-invalid');
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
    saveContent();
});
function saveContent() {
    const btn = $(".save-content");
    btn.prop("disabled", true);
    const formData = new FormData();
    formData.append("parent_id", currentFolderId || 0);
    formData.append("level", currentLevel || 1);
    formData.append("ref_id", currentRefId || "");
    formData.append("content_id", $("#content_id").val() || "");
    formData.append("status", $("#status").val());
    formData.append("notification", $("#notification").val());
    formData.append("publish_at", typeof buildPublishAt === "function" ? buildPublishAt() : "");
    formData.append("title_en", $("#title_en").val());
    formData.append("title_lo", $("#title_lo").val());
    formData.append("ex_cover", $("#ex_cover").val());
    formData.append("title_th", $("#title_th").val());
    formData.append("content_en", tinymce.get('content_en')?.getContent() || '');
    formData.append("content_lo", tinymce.get('content_lo')?.getContent() || '');
    formData.append("content_th", tinymce.get('content_th')?.getContent() || '');
    const cover = $("#cover")[0].files[0] || null;
    if (cover) {
        formData.append("cover", cover);
    }
    Swal.fire({
        title: langData['saving'] || 'Saving News...',
        html: `
            <p>Please do not close this page.</p>
            <div class="progress mt-2">
                <div id="swal-progress" class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width:0%">0%</div>
            </div>
        `,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });
    $.ajax({
        url: "api/project/save-content",
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
$(document).on('click', '.delete-content', function () {
    let id = $(this).data("id");
    showConfirm(langData['confirm'], langData['confirm_delete'], function(){
        $.ajax({
            url: 'api/project/delete-content',
            method: 'POST',
            data: { content_id: id },
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
$(document).on('click', '.view-content', function () {
    let id = $(this).data("id");
    viewContent(id);
});
function viewContent(id) {
    $.post("api/project/gets", { id }, function(res) {
        if(res.status !== "success") return;
        let d = res.data;
        let $modal = $("#windModal");
        let modal = new bootstrap.Modal($modal[0]);
        $modal.find(".modal-header").html(`
            <h5 class="modal-title">${d.title.th || d.title.en}</h5>
            <button class="btn-close" data-bs-dismiss="modal"></button>
        `);
        $modal.find(".modal-footer").html(`
            <button class="btn btn-secondary" data-bs-dismiss="modal" data-i18n="close"></button>
        `);
        $modal.find(".modal-body").html(`
            <div class="content-view">
                <ul class="nav nav-tabs mb-3">
                    <li class="nav-item"><a class="nav-link active" data-bs-toggle="tab" href="#view_en">English</a></li>
                    <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#view_lo">ລາວ</a></li>
                    <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#view_th">ไทย</a></li>
                </ul>
                <div class="tab-content">
                    <div class="tab-pane fade show active" id="view_en">${d.content.en || ''}</div>
                    <div class="tab-pane fade" id="view_lo">${d.content.lo || ''}</div>
                    <div class="tab-pane fade" id="view_th">${d.content.th || ''}</div>
                </div>
            </div>
        `);
        modal.show();
    }, "json");
}