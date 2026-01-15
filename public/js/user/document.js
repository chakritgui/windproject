let docPage     = 1;
let isLoading  = false;
let hasMore    = true;
let currentView = 'list';
$(document).ready(function () {
    loadDocuments();
    initSelect2Remote('#filter_source', 'api/document/filter', { type: 'source' });
    initMonthYearPicker("#filter_date", function () {
        docPage = 1;
        hasMore = true;
        $('#gridView').empty();
        $('#listView').empty();
        loadDocuments();
    });
});
function triggerDownload(url) {
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', '');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
$('.filter').on('change', function () {
    loadDocuments();
});
function loadDocuments() {
    if (isLoading || !hasMore) return;
    isLoading = true;
    $.ajax({
        url: 'api/document-list',
        method: 'POST',
        dataType: 'json',
        data: { 
            page: docPage,
            source: $("#filter_source").val(),
            date: $("#filter_date").val()
        },
        success: function (res) {
            if (res.status === true) {
                renderDocuments(res.data.items);
                hasMore = res.data.has_more;
                docPage++;
            } else {
                showError('Error', langData['cannot_load']);
            }
        },
        error: function () {
            showError('Error', langData['cannot_load']);
        },
        complete: function () {
            isLoading = false;
        }
    });
}
function renderDocuments(items) {
    if (currentView === 'grid') {
        renderGridView(items);
    } else {
        renderListView(items);
    }
}
function renderGridView(items) {
    let html = '';
    items.forEach(item => {
        const icon = getDocIcon(item.document_type);
        const size = formatFileSize(item.document_size);
        html += `
        <div class="col-md-4">
            <div class="doc-card card h-100">
                <div class="card-body text-center">
                    <div class="doc-icon mb-3" style="margin: 0 auto 15px;">
                        <i class="bi ${icon} text-white" style="font-size:40px;"></i>
                    </div>
                    <h6 class="card-title" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 2.5rem;">${item.document_name}</h6>
                    <p class="text-muted small mb-1">
                        <i class="bi bi-calendar"></i>
                        ${item.document_start || '-'}
                        ${item.document_end ? ' - ' + item.document_end : ''}
                    </p>
                    <p class="text-muted small mb-1">
                        <span data-i18n="size"></span>: ${size} | ${item.document_type.toUpperCase()}
                    </p>
                    <p class="text-muted small mb-3">
                        <span class="badge bg-${(item.source_name === 'Met Mast') ? 'warning' : 'error'}" style="font-size: 10px;">${item.source_name}</span>
                    </p>
                    <button class="btn btn-download w-100" data-id="${item.document_id}" data-path="${item.document_path}">
                        <i class="bi bi-download"></i> <span data-i18n="download"></span>
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
        const icon = getDocIcon(item.document_type);
        const size = formatFileSize(item.document_size);
        html += `
        <div class="list-view-item p-3">
            <div class="row align-items-center">
                <div class="col-12 col-md-auto mb-2 mb-md-0">
                    <div class="doc-icon mx-auto mx-md-0">
                        <i class="bi ${icon} text-white" style="font-size:40px;"></i>
                    </div>
                </div>
                <div class="col-12 col-md">
                    <h6 class="mb-1">${item.document_name}</h6>
                    <small class="text-muted d-block">
                        <i class="bi bi-calendar"></i>
                        ${item.document_start || '-'}
                        ${item.document_end ? ' - ' + item.document_end : ''}
                    </small>
                    <small class="text-muted d-block">
                        <i class="bi bi-file-earmark"></i>
                        ${size} | ${item.document_type.toUpperCase()}
                        |
                        <span class="badge  bg-${(item.source_name === 'Met Mast') ? 'warning' : 'error'}">${item.source_name}</span>
                    </small>
                </div>
                <div class="col-12 col-md-auto mt-3 mt-md-0 text-md-end">
                    <button class="btn btn-download w-100 w-md-auto" data-id="${item.document_id}" data-path="${item.document_path}">
                        <i class="bi bi-download"></i>
                        <span data-i18n="download"></span>
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
    $('#gridView').empty();
    $('#listView').empty();
    docPage  = 1;
    hasMore  = true;
    $('.view-toggle .btn').removeClass('active');
    if (view === 'grid') {
        $('#gridView').show();
        $('#listView').hide();
        $('.view-toggle .btn').eq(0).addClass('active');
    } else {
        $('#gridView').hide();
        $('#listView').show();
        $('.view-toggle .btn').eq(1).addClass('active');
    }
    loadDocuments();
}
function getDocIcon(type) {
    type = (type || '').toLowerCase();
    if (type === 'pdf') return 'bi-file-earmark-pdf';
    if (['doc','docx'].includes(type)) return 'bi-file-earmark-word';
    if (['xls','xlsx'].includes(type)) return 'bi-file-earmark-excel';
    if (['png','jpg','jpeg'].includes(type)) return 'bi-file-earmark-image';
    return 'bi-file-earmark';
}
function formatFileSize(bytes) {
    if (!bytes) return '-';
    const kb = bytes / 1024;
    if (kb < 1024) return kb.toFixed(0) + ' KB';
    return (kb / 1024).toFixed(2) + ' MB';
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
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" data-i18n="close"></button>
    `);
    modalEl.find(".modal-body").html(`
        <div id="downloadHistoryList" class="d-flex flex-column gap-3"></div>
        <div class="text-center py-2" id="historyLoading" style="display:none;">
            <div class="spinner-border"></div>
        </div>
    `);
    loadDownloadHistory();
});
$(document).on('click', '.btn-download', function (e) {
    e.preventDefault();
    const btn  = $(this);
    const id   = btn.data('id');
    const path = btn.data('path');
    if (!id || !path) return;
    $.ajax({
        url: 'api/document-download',
        method: 'POST',
        dataType: 'json',
        data: { id: id },
        success: function (res) {
            triggerDownload(path);
        },
        error: function () {
            triggerDownload(path);
        }
    });
});
function loadDownloadHistory() {
    if (historyLoading || !historyHasMore) return;
    historyLoading = true;
    $('#historyLoading').show();
    $.ajax({
        url: 'api/document-download-history',
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
    let html = '';
    items.forEach((row) => {
        const device = parseUA(row.download_device);
        const icon = getDocIcon(row.document_type);
        const size = formatFileSize(row.document_size);
        html += `
        <div class="card shadow-sm mb-3">
            <div class="card-body py-3">
                <h6 class="card-title mb-2 text-truncate text-primary">
                    <i class="bi ${icon} me-1"></i>
                    ${row.document_name}
                </h6>
                <div class="small text-muted mb-1 d-flex flex-wrap gap-2 align-items-center">
                    <span class="badge bg-${(row.type_name === 'Met Mast') ? 'warning' : 'error'}-subtle text-${(row.type_name === 'Met Mast') ? 'warning' : 'error'}">
                        ${row.type_name}
                    </span>
                    <span>
                        <i class="bi bi-file-earmark"></i>
                        ${row.document_type.toUpperCase()}
                    </span>

                    <span>
                        <i class="bi bi-hdd"></i>
                        ${size}
                    </span>
                </div>
                <div class="small text-muted d-flex flex-wrap gap-3 align-items-center">
                    <span>
                        <i class="bi bi-calendar"></i>
                        ${row.download_date}
                    </span>
                    <span>
                        <i class="bi bi-download"></i>
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