let tb_news;
function initNewsTable() {
    let oldPage = 0;
    if ($.fn.DataTable.isDataTable('#tb_news')) {
        oldPage = $('#tb_news').DataTable().page();
        $('#tb_news').DataTable().destroy();
    }
    tb_news = $('#tb_news').DataTable({
        processing: true,
        serverSide: true,
        responsive: true,
        order: [[6, 'desc']],
        ajax: {
            url: `${BASE_URL}/api/news.list`,
            type: "POST",
            data: d => { 
                d.status = $("#filter_status").val(); 
                d.type = $("#filter_type").val(); 
            }
        },
        columns: [{ 
            data: "cover_image",
            orderable: false,
            className: 'text-center',
            render: (data, type, row) => {
                return `${row.cover_image ? `
                    <div class="news-cover-wrapper mx-auto">
                        <img src="${BASE_URL}/${row.cover_image}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='${BASE_URL}/public/images/noimage.jpg';">
                    </div>
                    ` : `
                        <div class="folder-icon-box mx-auto">
                        ${(row.type === 'news') ? `
                            <i class="fa-regular fa-newspaper text-primary fa-3x"></i>
                        ` : `
                            <i class="fa-solid fa-diagram-project text-warning fa-3x"></i>
                        `}
                    `}
                `;
            }
        },{
            data: null,
            orderable: true,
            render: (data, type, row) => {
                const defaultLang = row.settings?.language_content || 'en';
                const title =
                    row[`subject_${currentLang}`] ||
                    row[`subject_${defaultLang}`] ||
                    row.subject_en ||
                    'No Title';
                let badges = '';
                if (parseInt(row.count_attachment) > 0)
                    badges += `<span class="badge rounded-pill bg-danger-subtle text-danger me-1">
                        <i class="fa-solid fa-file-pdf me-1"></i>${langData['document'] || 'Doc'}
                    </span>`;
                if (parseInt(row.count_image) > 0)
                    badges += `<span class="badge rounded-pill bg-primary-subtle text-primary me-1">
                        <i class="fa-solid fa-images me-1"></i>${langData['image'] || 'Img'}
                    </span>`;
                if (parseInt(row.count_image360) > 0)
                    badges += `<span class="badge rounded-pill bg-success-subtle text-success me-1">
                        <i class="fa-solid fa-vr-cardboard me-1"></i>VR
                    </span>`;
                return `
                    <div class="fw-bold text-dark mb-1">${title}</div>
                    <div>${badges}</div>
                `;
            }
        },{
            data: "type",
            orderable: true,
            render: (data, type, row) => `
                ${
                    (data === 'news') ? `
                        <span class="badge rounded-pill text-bg-primary"><i class="fa-regular fa-newspaper"></i> <span>${langData['news'] || 'News'}</span></span>
                    ` : `
                        <span class="badge rounded-pill text-bg-warning"><i class="fa-solid fa-diagram-project"></i> <span>${langData['project'] || 'Project'}</span></span>
                    `
                }
            `
        },{ 
            data: null,
            orderable: false,
            render: (data, type, row) => {
                const activeLangs = row.settings?.language ? row.settings.language.split(',') : ['en'];
                return `<div class="d-flex gap-1 flex-wrap">
                            ${activeLangs.map(lang => renderLangStatus(lang, row[`${lang}_status`])).join('')}
                        </div>`;
            }
        },{
            data: null,
            orderable: false,
            render: (data, type, row) => {
                let folderHtml = '';
                let visibilityBadges = '';
                if (Array.isArray(row.folder_chain) && row.folder_chain.length > 0) {
                    const breadcrumb = row.folder_chain.slice().reverse().map((f, index, arr) => {
                        if (index === arr.length - 1) {
                            return `<span class="fw-semibold text-dark">${f.name}</span>`;
                        }
                        return `<span class="text-muted">${f.name}</span>`;
                    }).join(' <span class="text-secondary">/</span> ');
                    folderHtml = `
                        <div class="small mb-1">
                            <i class="fa-solid fa-folder-open text-warning me-1"></i>
                            ${breadcrumb}
                        </div>
                    `;
                    if (row.folder_show_admin === 'yes' && row.type === 'news') {
                        visibilityBadges += `
                            <span class="badge bg-danger-subtle text-danger me-1">
                                <i class="fa-solid fa-user-shield me-1"></i>Admin
                            </span>`;
                    }
                    if (row.folder_show_user === 'yes' && row.type === 'news') {
                        visibilityBadges += `
                            <span class="badge bg-info-subtle text-info me-1">
                                <i class="fa-solid fa-user me-1"></i>User
                            </span>`;
                    }
                }
                return `
                    ${folderHtml}
                    <div class="mb-1">${visibilityBadges}</div>
                `;
            }
        },{
            data: "publish_at",
            orderable: true,
            render: (data, type, row) => (row.status !== 'published' || !data) ? `<span class="text-muted small">-</span>` : `<div class="small"><i class="fa-regular fa-calendar-check me-2"></i>${data}</div>`
        },{ 
            data: "created_at",
            orderable: true,
            render: data => `<div class="small text-muted">${data}</div>` 
        },{ 
            data: "content_view", 
            orderable: true,
            className: "text-end",
            render: data => `<strong>${Number(data).toLocaleString()}</strong>` 
        },{
            data: "status",
            orderable: true,
            render: status => {
                const bg = status === "published" || status === "active" ? "success" : "secondary";
                return `<span class="badge rounded-pill bg-${bg}-subtle text-${bg}">${langData[status] || status}</span>`;
            }
        },{
            data: null,
            orderable: false,
            render: (data, type, row) => `
                <div class="btn-group border rounded-3 bg-white">
                    <a class="btn btn-link text-info" onclick="openContent('${row.content_slug}', 'preview')"><i class="fa-solid fa-eye"></i></a>
                    ${(row.type === 'news') ? `
                        <button class="btn btn-link text-warning py-1 border-start manage-news" data-id="${row.content_id}"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="btn btn-link text-danger py-1 border-start delete-news" data-id="${row.content_id}"><i class="fa-regular fa-trash-can"></i></button>
                    ` : ``}
                </div>`
        }],
        pageLength: typeof pageLength !== 'undefined' ? pageLength : 10,
        lengthMenu: typeof lengthMenu !== 'undefined' ? lengthMenu : [10, 25, 50],
        stateLoadParams: (settings, data) => { data.start = oldPage; },
        language: getTableLang(),
        initComplete: function() {
            const api = this.api();
            const $filter = $('#tb_news_filter');
            if (!$filter.find('.btn-add-news').length) {
                $filter.append(`<button class="btn btn-primary btn-sm manage-news ms-2 btn-add-news" data-id=""><i class="fa-solid fa-plus me-2"></i>${langData['news'] || 'News'}</button>`);
            }
            $filter.find('input').unbind().bind('keypress', function(e) {
                if (e.keyCode == 13) api.search(this.value).draw();
            });
        }
    });
}
$(document).on("click", ".manage-news", function () {
    const id = $(this).data("id") || "";
    $.post(`${BASE_URL}/api/news.get`, { id }, function(res) {
        if(res.status !== "success") return;
        const d = res.data;
        const translates = d.translates;
        let ENABLE_TRANSLATE = translates.ENABLE_TRANSLATE;
        let GOOGLE_API_KEY = translates.GOOGLE_API_KEY;
        const $modal = $("#windModal");
        const $dialog = $modal.find(".modal-dialog");
        $dialog.removeClass("modal-fullscreen");
        const modalInstance = new bootstrap.Modal($modal[0]);
        $modal.find(".modal-header").html(`
            <h5 class="modal-title">${langData['news_management'] || 'News Management'}</h5>
            <div class="ms-auto">
                <button type="button" class="btn btn-sm btn-light me-2" id="btn-fullscreen"><i class="fa-regular fa-window-maximize"></i></button>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
        `);
        $modal.find(".modal-footer").html(`
            <div class="row w-100"> 
                <div class="col-6 d-flex align-items-center">
                    ${(ENABLE_TRANSLATE == 1 && GOOGLE_API_KEY) ? `
                        <div class="form-check mb-0">
                            <input class="form-check-input" type="checkbox" id="auto_translate" value="yes">
                            <label class="form-check-label" for="auto_translate">${langData['auto_translate'] || 'Auto Translate'}</label>
                        </div>
                        ` : ``}
                </div>
                <div class="col-6 text-end">
                    <button type="button" class="btn btn-primary save-news me-2">${langData['save'] || 'Save'}</button>
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">${langData['close'] || 'Close'}</button>
                </div>
            </div>
        `);
        const pubDate = d.publish_at ? d.publish_at.split(' ')[0] : '';
        const pubTime = d.publish_at ? d.publish_at.split(' ')[1].substring(0,5) : '';
        $modal.find(".modal-body").html(getContentForm(d, pubTime));
        initSelect2Remote('#status', `${BASE_URL}/api/news.filter`, { type: 'status' });
        if (d.status) {
            const statusLabel = d.status.charAt(0).toUpperCase() + d.status.slice(1);
            $('#status').append(new Option(statusLabel, d.status, true, true)).trigger('change');
        } else {
            $('#status').append(new Option('Draft', 'draft', true, true)).trigger('change');
        }
        initDatePicker('#publish_date');
        if (pubDate) $('#publish_date').datepicker('setDate', new Date(pubDate));
        setupTimePickers();
        initCoverUpload();
        initAttachmentsUpload(d.attachments || []);
        initImagesUpload(d.images || []);
        init360ImagesUpload(d.images360 || []);
        initSummernote();
        togglePublishControls();
        modalInstance.show();
    }, "json");
});
function getContentForm(d, publishTime) {
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
                            <select id="status" class="form-select obj-required" name="status"></select>
                        </div>
                        <div class="col-md-8">
                            <div class="row">
                                <div class="col-md-6">
                                    <label class="mb-2 mt-3 required">${langData['publish_date'] || 'Publish Date'}</label>
                                    <input type="text" id="publish_date" class="form-control datepicker obj-required" value="${d.publish_date || ''}">
                                </div>
                                <div class="col-md-6">
                                    <label class="mb-2 mt-3 required">${langData['publish_time'] || 'Publish Time'}</label>
                                    <input type="text" id="publish_time" class="form-control timepicker obj-required" value="${publishTime}" placeholder="HH:mm">
                                </div>
                            </div> 
                            <div class="form-check mt-2">
                                <input class="form-check-input" type="checkbox" id="publish_now">
                                <label class="form-check-label text-primary fw-bold" for="publish_now"><i class="fas fa-bolt me-2"></i>${langData['publish_now'] || 'Publish Now'}</label>
                            </div>
                        </div>
                    </div>
                    <hr class="my-4">
                    <label class="mb-2 mt-3">
                        <i class="fa-solid fa-folder-tree me-2"></i>
                        ${langData['folder'] || 'Folder'}
                    </label>
                    <div class="mb-3 p-2">
                        <label class="fw-bold mb-2" data-i18n="save_to_a_folder"></label>
                        <div class="d-flex gap-3">
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="use_folder_toggle" id="use_folder_no" value="no" ${!d.folder_id ? 'checked' : ''}>
                                <label class="form-check-label" for="use_folder_no" data-i18n="use_folder_no"></label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="use_folder_toggle" id="use_folder_yes" value="yes" ${d.folder_id ? 'checked' : ''}>
                                <label class="form-check-label" for="use_folder_yes" data-i18n="use_folder_yes"></label>
                            </div>
                        </div>
                    </div>
                    <div id="folder_tree_wrapper" style="${!d.folder_id ? 'display:none;' : ''}">
                        <div class="border rounded p-3 bg-white" style="max-height:300px; overflow:auto;">
                            ${renderFolderTree(d.folders, d.folder_id)}
                        </div>
                        <div class="row mt-3">
                            <div class="col-md-6">
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" id="folder_show_admin" ${d.folder_show_admin == 'yes' ? 'checked' : ''}>
                                    <label class="form-check-label fw-bold" for="folder_show_admin">
                                        <i class="fa-solid fa-user-shield me-2 text-primary"></i>
                                        ${langData['show_project_admin'] || 'Show in Project (Admin)'}
                                    </label>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" id="folder_show_user" ${d.folder_show_user == 'yes' ? 'checked' : ''}>
                                    <label class="form-check-label fw-bold" for="folder_show_user">
                                        <i class="fa-solid fa-users me-2 text-success"></i>
                                        ${langData['show_project_user'] || 'Show in Project (User)'}
                                    </label>
                                </div>
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
                ${render360()}
                ${renderFiles()}
            </div>
            <input type="hidden" id="content_id" value="${d.id ?? ''}">
        </form>`;
}
$(document).on('change', 'input[name="use_folder_toggle"]', function() {
    const useFolder = $(this).val() === 'yes';
    if (useFolder) {
        $('#folder_tree_wrapper').slideDown(200);
    } else {
        $('#folder_tree_wrapper').slideUp(200);
        $('input[name="folder_id"]').prop('checked', false);
    }
});
function renderFolderTree(folders, selectedId = null, level = 0) {
    if (!folders || !folders.length) return '';
    let html = '';
    folders.forEach(f => {
        const indent = level * 20;
        const hasChildren = f.children && f.children.length > 0;
        const isChildSelected = (items) => {
            return items?.some(child => child.id == selectedId || isChildSelected(child.children));
        };
        const shouldExpand = (f.id == selectedId || isChildSelected(f.children));
        html += `
            <div class="folder-item-container">
                <div class="form-check d-flex align-items-center" style="margin-left:${indent}px">
                    <span class="toggle-icon me-2" style="cursor:pointer; width: 20px; display: inline-block; text-align: center;" onclick="toggleFolder(this, 'child_container_${f.id}')">
                        ${hasChildren ? `<i class="fa-solid ${shouldExpand ? 'fa-square-minus' : 'fa-square-plus'} text-secondary"></i>` : ''}
                    </span>
                    <input class="form-check-input me-2" type="radio" name="folder_id" value="${f.id}" id="folder_${f.id}" ${selectedId == f.id ? 'checked' : ''} style="margin-left: 0;">
                    <label class="form-check-label" for="folder_${f.id}">
                        ${level === 0 
                            ? `<i class="fa-solid fa-folder-tree text-primary me-1"></i>` 
                            : `<i class="fa-solid fa-folder text-warning me-1"></i>`}
                        ${f.name}
                    </label>
                </div>
                ${hasChildren ? `
                    <div id="child_container_${f.id}" class="folder-children" style="display: ${shouldExpand ? 'block' : 'none'};">
                        ${renderFolderTree(f.children, selectedId, level + 1)}
                    </div>
                ` : ''}
            </div>
        `;
    });
    return html;
}
function toggleFolder(element, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const isHidden = container.style.display === 'none';
    container.style.display = isHidden ? 'block' : 'none';
    const icon = element.querySelector('i');
    if (isHidden) {
        icon.classList.replace('fa-square-plus', 'fa-square-minus');
    } else {
        icon.classList.replace('fa-square-minus', 'fa-square-plus');
    }
}
function togglePublishControls() {
    const status = $("#status").val();
    const isDraft = status === "draft";
    const isNow = $("#publish_now").is(":checked");
    $("#publish_date, #publish_time, #publish_now, #send_notification").prop("disabled", isDraft);
    if (isDraft) {
        $("#publish_date, #publish_time").val("").removeClass("obj-required");
        $("#publish_now, #send_notification").prop("checked", false);
    } else {
        $("#publish_date, #publish_time").prop("disabled", isNow).toggleClass("obj-required", !isNow);
        if (isNow) $("#publish_date, #publish_time").val("").removeClass("is-invalid");
    }
}
function buildPublishAt() {
    if ($("#publish_now").is(":checked")) return "NOW";
    const d = $("#publish_date").val();
    const t = $("#publish_time").val();
    return (d && t) ? `${d} ${t}:00` : null;
}
function setupTimePickers() {
    document.querySelectorAll('.timepicker').forEach(el => {
        if (el.dataset.tdInit) return;
        new tempusDominus.TempusDominus(el, {
            display: { viewMode: 'clock', components: { calendar: false } },
            localization: { format: 'HH:mm', hourCycle: 'h23' }
        });
        el.dataset.tdInit = 1;
    });
}
$(document).on('click', '.save-news', function () {
    let hasError = false;
    $('.is-invalid').removeClass('is-invalid');
    $('.obj-required:not(:disabled)').each(function () {
        if (!$(this).val()?.trim()) {
            $(this).addClass('is-invalid');
            hasError = true;
        }
    });
    if (hasError) {
        showWarning(langData['required_star_message'] || 'Please fill all required fields');
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
    const btn = $(".save-news");
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
    formData.append("publish_at", buildPublishAt());
    formData.append("send_notification",$("#send_notification").is(":checked") ? 'yes' : 'no');
    ['en', 'lo', 'th'].forEach(lang => {
        const $editor = $(`#content_${lang}`);
        if (!$editor.length) return;
        const html = $editor.summernote('code').trim();
        const text = html.replace(/<br\s*\/?>/gi, '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim();
        formData.append(`content_${lang}`, text === '' ? '' : html);
        formData.append(`title_${lang}`, $(`#title_${lang}`).val() || "");
    });
    formData.append("content_id", $("#content_id").val() || "");
    formData.append("status", $("#status").val() || "draft");
    const coverDisplayStatus = $("input[name='cover_display']:checked").val() || "no";
    formData.append("cover_display", coverDisplayStatus);
    formData.append("ex_cover", $("#ex_cover").val() || "");
    const cover = $("#cover")[0].files[0] || null;
    if (cover) {
        formData.append("cover", cover);
    }
    let useFolder = $('input[name="use_folder_toggle"]:checked').val();
    let folder_id = null;
    if (useFolder === 'yes') {
        folder_id = $('input[name="folder_id"]:checked').val() || null;
    }
    let folder_show_admin = $('#folder_show_admin').is(':checked') ? 'yes' : 'no';
    let folder_show_user  = $('#folder_show_user').is(':checked') ? 'yes' : 'no';
    formData.append("folder_id", folder_id ?? ""); 
    formData.append("folder_show_admin", folder_show_admin);
    formData.append("folder_show_user", folder_show_user);
    Swal.fire({
        title: langData['saving'] || 'Saving...',
        html: `
            <p>${langData['do_not_close'] || 'Please do not close this window.'}</p>
            <div class="progress mt-3" style="height: 20px;">
                <div id="swal-progress" class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: 0%">0%</div>
            </div>`,
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading()
    });
    $.ajax({
        url: `${BASE_URL}/api/news.save`,
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
                initNewsTable();
                $("#content_id").val(res.content_id)
            } else {
                showError(res.message || 'Error');
            }
        },
        error: () => { Swal.close(); showError("Server Connection Error"); },
        complete: () => btn.prop("disabled", false)
    });
}
$(document).on('click', '.delete-news', function() {
    const id = $(this).data("id");
    showConfirm(langData['confirm'], langData['confirm_delete'], function(){
        $.post(`${BASE_URL}/api/news.delete`, { id }, function(res) {
            if(res.status === true){
                showSuccess(langData['deleted_successfully']);
                initNewsTable();
            } else {
                showError(langData['cannot_delete']);
            }
        }, 'json');
    });
});
$(document).on("change", "#status, #publish_now", togglePublishControls);
$(document).on("click", "#btn-fullscreen", function() {
    const $modal = $("#windModal");
    $modal.find(".modal-dialog").toggleClass("modal-fullscreen");
    $(this).find("i").toggleClass("fa-window-maximize fa-window-restore");
});
$(document).ready(function () {
    initNewsTable();
    initSelect2Remote('#filter_status', `${BASE_URL}/api/news.filter`, { type: 'status' });
    initSelect2Remote('#filter_type', `${BASE_URL}/api/news.filter`, { type: 'type' });
    $(".filter").on("change", () => initNewsTable());
});