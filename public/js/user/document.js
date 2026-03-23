'use strict';
let docPage     = 1;
let isLoading   = false;
let hasMore     = true;
let currentView = 'list';
let currentSort = 'desc';
const ICON_MAP = {
    pdf:  { cls: 'icon-pdf',  emoji: '📑' }, 
    xlsx: { cls: 'icon-xlsx', emoji: '📊' },
    xls:  { cls: 'icon-xlsx', emoji: '📊' },
    docx: { cls: 'icon-docx', emoji: '📄' }, 
    doc:  { cls: 'icon-docx', emoji: '📄' },
    zip:  { cls: 'icon-zip',  emoji: '🗜️' }, 
    rar:  { cls: 'icon-zip',  emoji: '🗜️' },
    txt:  { cls: 'icon-txt',  emoji: '📃' },
    csv:  { cls: 'icon-csv',  emoji: '🧾' }, 
    ppt:  { cls: 'icon-ppt',  emoji: '📽️' }, 
    pptx: { cls: 'icon-ppt',  emoji: '📽️' },
    jpg:  { cls: 'icon-img',  emoji: '🖼️' },
    jpeg: { cls: 'icon-img',  emoji: '🖼️' },
    png:  { cls: 'icon-img',  emoji: '🖼️' },
    gif:  { cls: 'icon-img',  emoji: '🖼️' },
    mp4:  { cls: 'icon-video', emoji: '🎬' },
    mov:  { cls: 'icon-video', emoji: '🎬' },
    mp3:  { cls: 'icon-audio', emoji: '🎵' },
    wav:  { cls: 'icon-audio', emoji: '🎵' },
    default: { cls: 'icon-file', emoji: '📁' } 
}
function getIcon(type = '') {
    return ICON_MAP[type.toLowerCase()] || { cls: 'icon-other', emoji: '📁' };
}
function formatFileSize(bytes) {
    if (!bytes || isNaN(bytes)) return '-';
    if (bytes < 1024)       return bytes + ' B';
    if (bytes < 1048576)    return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    return (bytes / 1073741824).toFixed(1) + ' GB';
}
function createBadge(text, iconClass) {
    if (!text) return '';
    return `<span class="doc-badge"><i class="${iconClass}"></i>${escapeHtml(text)}</span>`;
}
function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function triggerDownload(url, fileName = '') {
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', fileName || '');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
function renderDocuments(items) {
    const container = document.getElementById('docContainer');
    if (!items || !items.length) {
        container.innerHTML = `
            <div class="empty-state animated fadeIn">
                <span class="empty-icon">📂</span>
                <h3 data-i18n="no_items"></h3>
                <p data-i18n="no_items_subtitle"></p>
            </div>
        `;
        return;
    }
    if (currentView === 'grid') {
        renderGridView(items);
    } else {
        renderListView(items);
    }
}
function renderListView(items) {
    const container = document.getElementById('docContainer');
    container.className = 'doc-list';
    const html = items.map(item => {
        const ic   = getIcon(item.document_type);
        const size = formatFileSize(item.document_size);
        return `
            <div class="doc-item">
                <div class="doc-icon-wrap ${ic.cls}">${ic.emoji}</div>
                <div class="doc-info">
                    <div class="doc-name" title="${escapeHtml(item.document_name)}">${escapeHtml(item.document_name)}</div>
                    <div class="doc-meta-row mt-2">
                        ${createBadge(item.contract_name, 'fa-solid fa-file-lines')}
                        ${createBadge(item.project_name, 'fa-solid fa-folder-tree')}
                        ${createBadge(item.type_name, 'fa-solid fa-tags')}
                        ${createBadge(item.installations_name,'fa-solid fa-location-dot')}
                        ${createBadge(item.poles_code, 'fa-solid fa-tower-broadcast')}
                    </div>
                    <div class="doc-meta-row mt-2">
                        <span class="doc-date">
                            <i class="fa-regular fa-calendar"></i>
                            ${escapeHtml(item.document_start || '-')}
                            ${item.document_end ? ' – ' + escapeHtml(item.document_end) : ''}
                            &nbsp;·&nbsp; ${size}
                            &nbsp;·&nbsp; ${escapeHtml((item.document_type || '').toUpperCase())}
                        </span>
                    </div>
                </div>
                <div class="doc-actions">
                    <button class="dl-btn download-btn" data-id="${item.document_id}" data-path="${escapeHtml(item.document_path)}" data-file-name="${escapeHtml(item.document_file_name || '')}">
                        <i class="fa-solid fa-download"></i>
                        <span data-i18n="download">${langData['download'] || 'Download'}</span>
                    </button>
                </div>
            </div>`;
    }).join('');
    container.insertAdjacentHTML('beforeend', html);
}
function renderGridView(items) {
    const container = document.getElementById('docContainer');
    container.className = 'doc-grid';
    const html = items.map(item => {
        const ic   = getIcon(item.document_type);
        const size = formatFileSize(item.document_size);
        return `
            <div class="doc-card">
                <div class="doc-icon-wrap ${ic.cls}">${ic.emoji}</div>
                <div class="doc-name" title="${escapeHtml(item.document_name)}">${escapeHtml(item.document_name)}</div>
                <div class="doc-meta-row">
                    <span class="doc-badge" style="font-size:0.65rem;">${escapeHtml((item.document_type || '').toUpperCase())} · ${size}</span>
                </div>
                <div class="doc-meta-row">
                    ${createBadge(item.project_name, 'fa-solid fa-folder-tree')}
                    ${createBadge(item.type_name,    'fa-solid fa-tags')}
                </div>
                <button class="dl-btn download-btn" data-id="${item.document_id}" data-path="${escapeHtml(item.document_path)}" data-file-name="${escapeHtml(item.document_file_name || '')}">
                    <i class="fa-solid fa-download"></i>
                    <span data-i18n="download">${langData['download'] || 'Download'}</span>
                </button>
         </div>`;
    }).join('');
    container.insertAdjacentHTML('beforeend', html);
}
function loadDocuments() {
    if (isLoading || !hasMore) return;
    isLoading = true;
    showSkeletons();
    var payload = {
        page:          docPage,
        contract:      $('#filter_contract').val() || '',
        project:       $('#filter_project').val() || '',
        type:          $('#filter_type').val() || '',
        installations: $('#filter_installations').val() || '',
        poles:         $('#filter_poles').val() || '',
        date:          $('#filter_date').val() || '',
        keyword:       $('#filter_keyword').val() || '',
        order:         currentSort
    };
    $.ajax({
        url: (typeof BASE_URL !== 'undefined' ? BASE_URL : '') + '/api/document.get',
        type: 'POST',
        data: JSON.stringify(payload),
        contentType: 'application/json',
        dataType: 'json',
        success: function(res) {
            removeSkeletons();
            if (res.status === true) {
                $('#docTotal').text(res.data.total);
                renderDocuments(res.data.items);

                hasMore = res.data.has_more;
                docPage++;
            } else {
                showError();
            }
        },
        error: function() {
            removeSkeletons();
            showError();
        },
        complete: function() {
            isLoading = false;
        }
    });
}
function showError() {
    const msg = typeof langData !== 'undefined' ? langData['cannot_load'] : 'ไม่สามารถโหลดข้อมูลได้';
    console.error(msg);
}
function showSkeletons(count = 3) {
    const container = document.getElementById('docContainer');
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `
            <div class="skel-item" id="skel-${i}">
                <div class="skel" style="width:48px;height:48px;border-radius:14px;flex-shrink:0;"></div>
                <div style="flex:1;display:flex;flex-direction:column;gap:8px;">
                    <div class="skel" style="height:14px;width:70%;"></div>
                    <div class="skel" style="height:10px;width:45%;"></div>
                </div>
                <div class="skel" style="width:100px;height:36px;border-radius:11px;flex-shrink:0;"></div>
            </div>`;
    }
    container.insertAdjacentHTML('beforeend', html);
}
function removeSkeletons() {
    document.querySelectorAll('[id^="skel-"]').forEach(el => el.remove());
}
function setView(view) {
    if (currentView === view) return;
    currentView = view;
    document.getElementById('vList').classList.toggle('active', view === 'list');
    document.getElementById('vGrid').classList.toggle('active', view === 'grid');
    resetAndLoad();
}
function toggleSort() {
    currentSort = currentSort === 'desc' ? 'asc' : 'desc';
    const label = document.getElementById('sortLabel');
    if (label) {
        label.textContent = currentSort === 'desc' ? (typeof langData !== 'undefined' ? langData['newest'] : 'Newest') : (typeof langData !== 'undefined' ? langData['oldest'] : 'เก่าสุด');
    }
    resetAndLoad();
}
function resetAndLoad() {
    docPage = 1;
    hasMore = true;
    const container = document.getElementById('docContainer');
    container.innerHTML = '';
    loadDocuments();
}
document.addEventListener('click', function (e) {
    const btn = e.target.closest('.download-btn');
    if (!btn) return;
    const id       = btn.dataset.id;
    const path     = btn.dataset.path;
    const fileName = btn.dataset.fileName || '';
    if (!id || !path) return;
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังโหลด...';
    btn.disabled  = true;
    fetch(`${typeof BASE_URL !== 'undefined' ? BASE_URL : ''}/api/document.download`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id }),
    }).catch(() => {}).finally(() => {
        triggerDownload(path, fileName);
        btn.innerHTML = '<i class="fa-solid fa-check"></i> สำเร็จ!';
        btn.style.background = 'linear-gradient(135deg,#34d399,#059669)';
        setTimeout(() => {
            btn.innerHTML        = orig;
            btn.style.background = '';
            btn.disabled         = false;
        }, 1800);
    });
});
document.addEventListener('change', function (e) {
    if (e.target.classList.contains('filter')) {
        resetAndLoad();
    }
});
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
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('btnSearch')?.addEventListener('click', resetAndLoad);
    document.getElementById('filter_keyword')?.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); resetAndLoad(); }
    });
    document.getElementById('filter_keyword')?.addEventListener('input', function () {
        if (this.value.trim() === '') resetAndLoad();
    });
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
        resetAndLoad();
    });
    $('#btnSearch').on('click', function () {
        docPage = 1;
        hasMore = true;
        $('#gridView, #listView').empty();
        resetAndLoad();
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
$('.filter').on('change', function () {
    docPage = 1;
    hasMore = true;
    $('#gridView, #listView').empty();
    resetAndLoad();
});
const scrollSentinel = document.getElementById('scrollEnd');
if (scrollSentinel) {
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) loadDocuments();
    }, { rootMargin: '200px' });
    observer.observe(scrollSentinel);
}
let historyPage = 1;
let historyLoading = false;
let historyHasMore = true;
$(document).on('click', '.history-download', function (e) {
    historyPage = 1;
    historyLoading = false;
    historyHasMore = true;
    const $modalEl = $('#windModal');
    $modalEl.find(".modal-header").html(`
        <h6 class="modal-title">
            <i class="fa-solid fa-clock-rotate-left"></i> <span data-i18n="history_download"></span>
        </h6>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
    `);
    $modalEl.find(".modal-body").attr('style', 'background:#f0f8ff; padding:20px; max-height: 70vh; overflow-y: auto;').html(`
        <div id="downloadHistoryList" style="display: flex; flex-direction: column; gap: 12px;}"></div>
        <div class="text-center py-3 d-none" id="historySpinner">
            <div class="spinner-border" style="color:#2d7fc1;"></div>
        </div>
    `);
    $modalEl.find(".modal-footer").html(`
        <button type="button" class="btn btn-outline-secondary" style="border-radius:10px;" data-bs-dismiss="modal" data-i18n="close">ปิด</button>
    `);
    $modalEl.find(".modal-body").off('scroll').on('scroll', function () {
        if (this.scrollTop + this.clientHeight >= this.scrollHeight - 60) {
            loadDownloadHistory();
        }
    });
    const modalInstance = bootstrap.Modal.getOrCreateInstance($modalEl[0]);
    modalInstance.show();
    if (window.i18next) {
        $modalEl.localize();
    }
    loadDownloadHistory();
});
function loadDownloadHistory() {
    if (historyLoading || !historyHasMore) return;
    historyLoading = true;
    const spinner = document.getElementById('historySpinner');
    spinner?.classList.remove('d-none');
    const apiUrl = (typeof BASE_URL !== 'undefined' ? BASE_URL : '') + '/api/document.history';
    fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: historyPage }),
    }).then(r => r.json()).then(res => {
        if (res.status && res.data) {
            renderHistoryRows(res.data.items);
            historyHasMore = res.data.has_more;
            historyPage++;
        }
    }).catch(err => console.error("Error loading history:", err)).finally(() => {
        historyLoading = false;
        spinner?.classList.add('d-none');
    });
}
function renderHistoryRows(items) {
    const list = document.getElementById('downloadHistoryList');
    if (!list) return;
    if (historyPage === 1 && (!items || items.length === 0)) {
        list.innerHTML = `
            <div class="text-center py-5">
                <span style="font-size: 3rem;">📂</span>
                <h5 class="mt-2 text-muted">ไม่พบประวัติการดาวน์โหลด</h5>
            </div>`;
        return;
    }
    const html = items.map(item => {
        const ic = getIcon(item.document_type);
        const size = formatFileSize(item.document_size);
        return `
            <div class="doc-item">
                <div class="doc-icon-wrap ${ic.cls}">${ic.emoji}</div>
                <div class="doc-info">
                    <div class="doc-name" title="${escapeHtml(item.document_name)}">${escapeHtml(item.document_name)}</div>
                    <div class="doc-meta-row mt-2">
                        ${createBadge(item.contract_name, 'fa-solid fa-file-lines')}
                        ${createBadge(item.project_name, 'fa-solid fa-folder-tree')}
                        ${createBadge(item.type_name, 'fa-solid fa-tags')}
                        ${createBadge(item.installations_name,'fa-solid fa-location-dot')}
                        ${createBadge(item.poles_code, 'fa-solid fa-tower-broadcast')}
                    </div>
                    <div class="doc-meta-row mt-2">
                        <span class="doc-date">
                            <i class="fa-solid fa-download me-1"></i>
                            ${escapeHtml(item.download_date || '-')}
                            &nbsp;·&nbsp; ${size}
                            &nbsp;·&nbsp; ${escapeHtml((item.document_type || '').toUpperCase())}
                        </span>
                        </div>
                    </div>
                </div>
            </div>`;
    }).join('');
    list.insertAdjacentHTML('beforeend', html);
}