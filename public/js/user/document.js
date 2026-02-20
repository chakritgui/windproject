let docPage     = 1;
let isLoading  = false;
let hasMore    = true;
let currentView = 'list';
let currentSort = 'desc';
$(document).on('change', '#filter_contract, #filter_project, #filter_type, #filter_installations', function() {
    const $this = $(this);
    const id = $this.attr('id');
    const val = $this.val();
    const isFilter = id.startsWith('filter_');
    const prefix = isFilter ? '#filter_' : '#';
    const getVal = (target) => $(prefix + target).val();
    if (id.includes('contract')) {
        $(`${prefix}project, ${prefix}type, ${prefix}installation, ${prefix}pole`).val(null).trigger('change.select2');
        initSelect2Remote(`${prefix}project`, `${BASE_URL}/api/document.filter`, { 
            type: 'project', 
            contract_id: val 
        });
    } else if (id.includes('project')) {
        $(`${prefix}type, ${prefix}installation, ${prefix}pole`).val(null).trigger('change.select2');
        initSelect2Remote(`${prefix}type`, `${BASE_URL}/api/document.filter`, { 
            type: 'type', 
            contract_id: getVal('contract'),
            project_id: val 
        });
    } else if (id.includes('type')) {
        $(`${prefix}installation, ${prefix}pole`).val(null).trigger('change.select2');
        initSelect2Remote(`${prefix}installation`, `${BASE_URL}/api/document.filter`, { 
            type: 'installation', 
            contract_id: getVal('contract'),
            project_id: getVal('project'),
            type_id: val
        });
    } else if (id.includes('installation')) {
        $(`${prefix}pole`).val(null).trigger('change.select2');
        initSelect2Remote(`${prefix}pole`, `${BASE_URL}/api/document.filter`, { 
            type: 'pole', 
            contract_id: getVal('contract'),
            project_id: getVal('project'),
            type_id: getVal('type'),
            installation_id: val
        });
    }
});
$(document).ready(function () {
    loadDocuments();
    initSelect2Remote('#filter_contract', `${BASE_URL}/api/document.filter`, { type: 'contract' });
    initSelect2Remote('#filter_project', `${BASE_URL}/api/document.filter`, { type: 'project' });
    initSelect2Remote('#filter_type', `${BASE_URL}/api/document.filter`, { type: 'type' });
    initSelect2Remote('#filter_installations', `${BASE_URL}/api/document.filter`, { type: 'installation' });
    initSelect2Remote('#filter_poles', `${BASE_URL}/api/document.filter`, { type: 'pole' });
    initMonthYearPicker("#filter_date", function () {
        docPage = 1;
        hasMore = true;
        $('#gridView').empty();
        $('#listView').empty();
        loadDocuments();
    });
    $('#btnSearch').on('click', function () {
        docPage = 1;
        hasMore = true;
        $('#gridView, #listView').empty();
        loadDocuments();
    });
    $('#filter_keyword').on('keypress', function (e) {
        if (e.which === 13) {
            e.preventDefault();
            const keyword = $.trim($(this).val());
            if (keyword === '') {
                resetAndLoad();
            } else {
                $('#btnSearch').click();
            }
        }
    });
    $('#filter_keyword').on('input', function () {
        if ($.trim(this.value) === '') {
            resetAndLoad();
        }
    });
});
function resetAndLoad() {
    docPage = 1;
    hasMore = true;
    $('#gridView, #listView').empty();
    loadDocuments();
}
$(document).on('click', '.sort-option', function() {
    const sortValue = $(this).data('sort');
    const label = $(this).data('label');
    currentSort = sortValue;
    $('#selectedSortLabel').text(langData[label]);
    docPage = 1;
    hasMore = true;
    $('#gridView, #listView').empty();
    loadDocuments(); 
});
function triggerDownload(url, fileName='') {
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', fileName || '');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
$('.filter').on('change', function () {
    docPage = 1;
    hasMore = true;
    $('#gridView, #listView').empty();
    loadDocuments();
});
function loadDocuments() {
    if (isLoading || !hasMore) return;
    isLoading = true;
    $.ajax({
        url: `${BASE_URL}/api/document.get`,
        method: 'POST',
        dataType: 'json',
        data: { 
            page: docPage,
            contract: $("#filter_contract").val(),
            project: $("#filter_project").val(),
            type: $("#filter_type").val(),
            installations: $("#filter_installations").val(),
            poles: $("#filter_poles").val(),
            date: $("#filter_date").val(),
            keyword: $("#filter_keyword").val(),
            order: currentSort
        },
        success: function (res) {
            if (res.status === true) {
                $('#docTotal').text(res.data.total);
                renderDocuments(res.data.items);
                hasMore = res.data.has_more;
                docPage++;
            } else {
                showError(langData['cannot_load']);
            }
        },
        error: function () {
            showError(langData['cannot_load']);
        },
        complete: function () {
            isLoading = false;
        }
    });
}
function renderDocuments(items) {
    if (!items.length) {
        $('#listView').html(`
            <div class="empty-state-container animated fadeIn">
                <div class="empty-icon"><i class="fa-regular fa-folder-open"></i></div>
                <h3 class="empty-title" data-i18n="no_items"></h3>
                <p class="empty-subtitle" data-i18n="no_items_subtitle"></p>
            </div>
        `);
        return;
    }
    if (currentView === 'grid') {
        renderGridView(items);
    } else {
        renderListView(items);
    }
}
const createBadge = (text, icon, colorClass) => {
    if (!text) return '';
    return `<span class="badge ${colorClass} fw-normal d-inline-flex align-items-center me-1 mb-1" style="font-size: 8px; padding: 4px 8px; border-radius: 50rem;">
                <i class="${icon} me-1"></i>${text}
            </span>`;
};
function renderGridView(items) {
    if (!items.length) {
        $('#gridView').html(`
            <div class="empty-state-container animated fadeIn">
                <div class="empty-icon"><i class="fa-regular fa-folder-open"></i></div>
                <h3 class="empty-title" data-i18n="no_items"></h3>
                <p class="empty-subtitle" data-i18n="no_items_subtitle"></p>
            </div>
        `);
        return;
    }
    let html = '';
    items.forEach(item => {
        const icon = getFileIconClass(item.document_type);
        const size = formatFileSize(item.document_size);
        html += `
        <div class="col-12 col-md-4">
            <div class="doc-card card h-100">
                <div class="card-body text-center p-3">
                    <div class="doc-icon mx-auto mb-2">
                        <i class="${icon}"></i>
                    </div>
                    <h6 class="card-title doc-title">
                        ${item.document_name}
                    </h6>
                    <div class="doc-meta small text-muted">
                        <div class="mb-1" style="font-size: 10px;">
                            <i class="fa-regular fa-calendar"></i>
                            ${item.document_start || '-'}
                            ${item.document_end ? ' - ' + item.document_end : ''}
                        </div>
                        <div class="mb-1" style="font-size: 10px;">
                            <i class="fa-solid fa-hard-drive"></i> ${size} · <i class="fa-regular fa-file"></i> ${item.document_type.toUpperCase()}
                        </div>
                        ${createBadge(item.contract_name, 'fa-solid fa-file-lines', 'bg-primary-subtle text-primary')}
                        ${createBadge(item.project_name, 'fa-solid fa-folder-tree', 'bg-info-subtle text-info')}
                        ${createBadge(item.type_name, 'fa-solid fa-tags', 'bg-secondary-subtle text-secondary')}
                        ${createBadge(item.installations_name, 'fa-solid fa-location-dot', 'bg-warning-subtle text-warning-emphasis')}
                        ${createBadge(item.poles_code, 'fa-solid fa-tower-broadcast', 'bg-dark-subtle text-dark')}
                    </div>
                    <button class="btn btn-outline-primary download-btn w-100 mt-2" data-id="${item.document_id}" data-path="${item.document_path}" data-file-name="${item.document_file_name}">
                        <i class="fa-solid fa-download"></i>
                        <span class="btn-text" data-i18n="download"></span>
                    </button>
                </div>
            </div>
        </div>`;
    });
    $('#gridView').append(html);
}
function renderListView(items) {
    let html = '';
    items.forEach(item => {
        const icon = getFileIconClass(item.document_type);
        const size = formatFileSize(item.document_size);
        html += `
        <div class="list-view-item">
            <div class="row align-items-center g-2">
                <div class="col-auto">
                    <div class="doc-icon">
                        <i class="${icon}"></i>
                    </div>
                </div>
                <div class="col">
                    <h6 class="mb-2 doc-title">${item.document_name}</h6>
                    <div class="doc-meta small text-muted">
                        <div class="mb-1" style="font-size: 10px;">
                            <i class="fa-regular fa-calendar"></i>
                            ${item.document_start || '-'}
                            ${item.document_end ? ' - ' + item.document_end : ''}
                        </div>
                        <div class="mb-1" style="font-size: 10px;">
                            <i class="fa-solid fa-hard-drive"></i> ${size} · <i class="fa-regular fa-file"></i> ${item.document_type.toUpperCase()}
                        </div>
                        ${createBadge(item.contract_name, 'fa-solid fa-file-lines', 'bg-primary-subtle text-primary')}
                        ${createBadge(item.project_name, 'fa-solid fa-folder-tree', 'bg-info-subtle text-info')}
                        ${createBadge(item.type_name, 'fa-solid fa-tags', 'bg-secondary-subtle text-secondary')}
                        ${createBadge(item.installations_name, 'fa-solid fa-location-dot', 'bg-warning-subtle text-warning-emphasis')}
                        ${createBadge(item.poles_code, 'fa-solid fa-tower-broadcast', 'bg-dark-subtle text-dark')}
                    </div>
                </div>
                <div class="col-12 col-md-auto text-end">
                    <button class="btn btn-outline-primary download-btn w-100 w-md-auto" data-id="${item.notifications_item}" data-path="${item.path}" data-file-name="${item.item_name}">
                        <i class="fa-solid fa-download"></i>
                        <span class="btn-text" data-i18n="download"></span>
                    </button>
                </div>
            </div>
        </div>`;
    });
    $('#listView').append(html);
}
function setView(view) {
    if (currentView === view) return; 
    currentView = view;
    docPage = 1;
    hasMore = true;
    const $toggleButtons = $('.view-toggle .btn');
    $toggleButtons.removeClass('active').attr('aria-pressed', 'false');
    $toggleButtons.filter('[data-view="' + view + '"]').addClass('active').attr('aria-pressed', 'true');
    const $grid = $('#gridView');
    const $list = $('#listView');
    $grid.empty();
    $list.empty();
    if (view === 'grid') {
        $list.hide();
        $grid.fadeIn(300);
    } else {
        $grid.hide();
        $list.fadeIn(300);
    }
    loadDocuments();
}
const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
        loadDocuments();
    }
}, {
    root: null, 
    rootMargin: '200px',
});
observer.observe(document.getElementById('scrollEnd'));
let historyPage = 1; 
let historyLoading = false; 
let historyHasMore = true;
$(document).on('click', '.history-download', function (e) {
    historyPage = 1;
    historyLoading = false;
    historyHasMore = true;
    let modalEl = $('#windModal');
    let modal = new bootstrap.Modal(modalEl[0]);
    modal.show();
    modalEl.find(".modal-header").html(`
        <h5 class="modal-title" data-i18n="history_download"></h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
    `);
    modalEl.find(".modal-footer").html(`
        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal" data-i18n="close"></button>
    `);
    modalEl.find(".modal-body").html(`
        <div id="downloadHistoryList" class="d-flex flex-column gap-3"></div>
        <div class="text-center py-2" id="historyLoading" style="display:none;">
            <div class="spinner-border"></div>
        </div>
    `);
    loadDownloadHistory();
});
$(document).on('click', '.download-btn', function (e) {
    e.preventDefault();
    const btn  = $(this);
    const id   = btn.data('id');
    const path = btn.data('path');
    const fileName = btn.data('file-name') || '';
    if (!id || !path) return;
    $.ajax({
        url: `${BASE_URL}/api/document.download`,
        method: 'POST',
        dataType: 'json',
        data: { id: id },
        success: function (res) {
            triggerDownload(path, fileName);
        },
        error: function () {
            triggerDownload(path, fileName);
        }
    });
});
function loadDownloadHistory() {
    if (historyLoading || !historyHasMore) return;
    historyLoading = true;
    $('#historyLoading').show();
    $.ajax({
        url: `${BASE_URL}/api/document.history`,
        method: 'POST',
        dataType: 'json',
        data: { page: historyPage },
        success: function (res) {
            if (res.status) {
                renderHistoryRows(res.data.items);
                historyHasMore = res.data.has_more;
                historyPage++;
            }
        },
        complete: function () {
            historyLoading = false;
            $('#historyLoading').hide();
        }
    });
}
function renderHistoryRows(items) {
    let html = ``;
    if (!items || items.length === 0) {
        html = `
            <div class="empty-state-container animated fadeIn">
                <div class="empty-icon"><i class="fa-regular fa-folder-open"></i></div>
                <h3 class="empty-title" data-i18n="no_data_found"></h3>
            </div>`;
        $('#downloadHistoryList').html(html);
        return;
    }
    items.forEach((row) => {
        const device = parseUA(row.download_device);
        const icon = getFileIconClass(row.document_type);
        const size = formatFileSize(row.document_size);
        html += `
        <div class="card shadow-sm mb-3">
            <div class="card-body py-3">
                <h6 class="card-title mb-2 text-truncate">
                    <i class="${icon} me-1"></i>
                    ${row.document_name}
                </h6>
                <div class="small text-muted mb-1 d-flex flex-wrap gap-2 align-items-center">
                    ${createBadge(row.contract_name, 'fa-solid fa-file-lines', 'bg-primary-subtle text-primary')}
                    ${createBadge(row.project_name, 'fa-solid fa-folder-tree', 'bg-info-subtle text-info')}
                    ${createBadge(row.type_name, 'fa-solid fa-tags', 'bg-secondary-subtle text-secondary')}
                    ${createBadge(row.installations_name, 'fa-solid fa-location-dot', 'bg-warning-subtle text-warning-emphasis')}
                    ${createBadge(row.poles_code, 'fa-solid fa-tower-broadcast', 'bg-dark-subtle text-dark')}
                </div>
                <div class="small text-muted mb-1 d-flex flex-wrap gap-2 align-items-center">
                    <span>
                        <i class="fa-regular fa-file"></i>
                        ${row.document_type.toUpperCase()}
                    </span>
                    <span>
                        <i class="fa-solid fa-hard-drive"></i>
                        ${size}
                    </span>
                </div>
                <div class="small text-muted d-flex flex-wrap gap-3 align-items-center">
                    <span>
                        <i class="fa-regular fa-calendar"></i>
                        ${row.download_date}
                    </span>
                    <span>
                        <i class="fa-solid fa-download"></i>
                        ${device.label}
                    </span>
                </div>
            </div>
        </div>`;
    });
    $('#downloadHistoryList').append(html);
}
$('#windModal .modal-body').on('scroll', function () {
    const el = this;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
        loadDownloadHistory();
    }
});