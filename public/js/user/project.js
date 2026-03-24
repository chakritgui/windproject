const API_URL = `${BASE_URL}/api/project.info`;
const LIMIT = 20;
let state = {
    folderId: null,
    level: 1,
    refId: null,
    path: [{ id: null, slug: null, name: 'PSTG PROJECT', level: 1}],
    sort: 'desc',
    offset: 0,
    isLoading: false,
    isFull: false,
    cachedData: [],
    viewMode: 'grid'
};
let currentAjaxRequest = null;
$(document).ready(function () {
    const savedView = localStorage.getItem('viewMode');
    state.viewMode = savedView || 'grid';
    if (state.viewMode === 'grid') {
        $('#vGrid').addClass('active');
        $('#vList').removeClass('active');
    } else {
        $('#vList').addClass('active');
        $('#vGrid').removeClass('active');
    }
    restoreFromUrl();
    setupObservers();
    initEventListeners();
});
function toggleSort() {
    state.sort = state.sort === 'desc' ? 'asc' : 'desc';
    const label = document.getElementById('sortLabel');
    if (label) {
        label.textContent =  state.sort === 'desc' ? (typeof langData !== 'undefined' ? langData['newest'] : 'Newest') : (typeof langData !== 'undefined' ? langData['oldest'] : 'เก่าสุด');
    }
    fetchFolders(true);
}
function initEventListeners() {
    $('#listView').on('click', '.fetchFolder', function () {
        const index = $(this).data('index');
        const rowData = state.cachedData[index];
        if (!rowData || rowData.type === 'content') return;
        state.folderId = rowData.id;
        state.level = parseInt(rowData.level) + 1;
        state.path.push({
            id: rowData.id,
            slug: rowData.slug,
            name: rowData.folder_name,
            level: state.level,
        });
        updateUrlPath();
        fetchFolders(true);
    });
    $('#breadcrumb').on('click', 'a[data-idx], .dropdown-item[data-idx]', function (e) {
        e.preventDefault();
        const idx = $(this).data('idx');
        state.path = state.path.slice(0, idx + 1);
        const target = state.path[idx];
        state.folderId = target.id;
        state.level = (idx === 0) ? 1 : (Number(target.level) + 1);
        updateUrlPath();
        fetchFolders(true);
    });
}
function fetchFolders(isNewSearch = false) {
    if (state.isLoading && !isNewSearch) return;
    if (currentAjaxRequest) currentAjaxRequest.abort();
    if (isNewSearch) {
        state.offset = 0;
        state.isFull = false;
        state.cachedData = [];
        $('#listView').empty();
        $('#emptyState').addClass('d-none');
    }
    if (state.isFull) return;
    state.isLoading = true;
    $('#loadingIndicator').removeClass('d-none');
    currentAjaxRequest = $.ajax({
        url: API_URL,
        method: 'POST',
        data: {
            level: state.level,
            start: state.offset,
            length: LIMIT,
            path: state.path.map(p => p.slug).filter(Boolean),
            currentSort: state.sort
        },
        dataType: 'json',
        success: function (res) {
            if (!res.status) return;
            const { data: result, breadcrumbs } = res;
            const newData = result.data;
            if (breadcrumbs && breadcrumbs.length > 0) {
                const root = { id: null, slug: null, name: 'PSTG PROJECT', level: 1 };
                state.path = [root, ...breadcrumbs];
                const last = state.path[state.path.length - 1];
                state.folderId = last.id;
                state.level = state.path.length;
            }
            state.cachedData = isNewSearch ? newData : state.cachedData.concat(newData);
            renderView(newData, isNewSearch);
            renderBreadcrumb();
            if (!result.hasMore || newData.length < LIMIT) {
                state.isFull = true;
            }
            state.offset += LIMIT;
        },
        complete: function () {
            state.isLoading = false;
            currentAjaxRequest = null;
            $('#loadingIndicator').addClass('d-none');
        }
    });
}
function renderView(data, isNewSearch) {
    const $container = $('#listView');
    if (isNewSearch) {
        $container.empty();
        $container
            .removeClass('list-view grid-view')
            .addClass(state.viewMode === 'grid' ? 'grid-view' : 'list-view');
    }
    if (isNewSearch && (!data || data.length === 0)) {
        $('#emptyState').removeClass('d-none');
        return;
    } else {
        $('#emptyState').addClass('d-none');
    }
    let html = data.map((item, index) => {
        const globalIndex = isNewSearch
            ? index
            : (state.cachedData.length - data.length + index);
        const isContent = item.type === 'content';
        let title = '-';
        if (isContent) {
            const subjects = {
                en: item.en_subject,
                th: item.th_subject,
                lo: item.lo_subject
            };
            title =
                subjects[currentLang] ||
                subjects.en ||
                subjects.th ||
                subjects.lo ||
                '-';
        } else {
            title = item.folder_name || '-';
        }
        const badge = item.child_count > 0
            ? `<span class="badge rounded-pill bg-light text-dark border ms-2 small">${item.child_count}</span>`
            : '';
        let badgeHtml = '';
        if (isContent) {
            if (+item.count_attachment > 0) {
                badgeHtml += `<span class="badge rounded-pill bg-danger-subtle text-danger me-1">
                    <i class="fa-solid fa-file-pdf me-1"></i>${langData['document'] || 'Document'}
                </span>`;
            }
            if (+item.count_image > 0) {
                badgeHtml += `<span class="badge rounded-pill bg-primary-subtle text-blue me-1">
                    <i class="fa-solid fa-images me-1"></i>${langData['image'] || 'Image'}
                </span>`;
            }
            if (+item.count_image360 > 0) {
                badgeHtml += `<span class="badge rounded-pill bg-success-subtle text-success me-1">
                    <i class="fa-solid fa-vr-cardboard me-1"></i>${langData['vr'] || 'VR'}
                </span>`;
            }
        }
        const typeHtml = item.sub_type === 'news'
            ? `<span class="badge rounded-pill text-bg-primary"><i class="fa-regular fa-newspaper"></i> ${langData['news'] || 'News'}</span>`
            : `<span class="badge rounded-pill text-bg-warning"><i class="fa-solid fa-diagram-project"></i> ${langData['project'] || 'Project'}</span>`;
        const icon = item.sub_type === 'news' ? `<i class="fa-regular fa-newspaper fa-2x"></i>` : `<i class="fa-solid fa-diagram-project fa-2x"></i>`;
        const card_class = isContent ? (item.sub_type === 'news' ? `card-news` : `card-project`) : ``;
        const thumb = isContent
            ? (item.cover
                ? `<img src="${BASE_URL}/${item.cover}" loading="lazy">`
                : icon)
            : (item.cover
                ? `<img src="${BASE_URL}/${item.cover}" loading="lazy">`
                : `<i class="fa-solid fa-folder-open fa-2x text-warning"></i>`);
        if (state.viewMode === 'grid') {
            return `
            <div class="grid-card ${(item.type === 'folder' || item.type === 'root') ? 'fetchFolder' : ''}"  data-index="${globalIndex}" style="cursor:pointer;">
                ${isContent ? `<div onclick="openContent('${item.content_slug}', 'view')">` : ''}
                    <div class="grid-thumb ${card_class}">${thumb}</div>
                    <div class="grid-body">
                        <div class="grid-title">${title} ${badge}</div>
                        ${isContent ? `
                            <div class="small text-muted mt-1">
                                <i class="fa-regular fa-calendar"></i> ${item.created_at}
                            </div>
                            <div class="mt-2">${typeHtml}</div>
                            <div class="mt-2">${badgeHtml}</div>
                        ` : `
                            <div class="small text-muted mt-1">
                                <i class="fa-regular fa-calendar"></i> ${item.created_at}
                            </div>
                        `}
                    </div>
                ${isContent ? `</div>` : ''}
            </div>
            `;
        }
        return `
        ${isContent ? `<a onclick="openContent('${item.content_slug}', 'view')" style="text-decoration:none;">` : ''}
        <div class="card doc-item ${(item.type === 'folder' || item.type === 'root') ? 'fetchFolder' : ''} border-0 shadow-none mb-2" data-index="${globalIndex}" style="cursor:pointer;">
            <div class="card-body p-3">
                <div class="d-flex align-items-center">
                    <div class="folder-icon-box me-3 flex-shrink-0">${thumb}</div>
                    <div class="flex-grow-1 overflow-hidden">
                        <div class="doc-title">${title} ${badge}</div>
                        ${isContent ? `
                            <div class="row g-2 mt-2">
                                <div class="col-12 col-sm-6">
                                    ${typeHtml}
                                    <span class="small ms-2 text-muted">
                                        <i class="fa-regular fa-calendar"></i> ${item.created_at}
                                    </span>
                                </div>
                                <div class="col-12 col-sm-6 text-sm-end">
                                    ${badgeHtml}
                                </div>
                            </div>
                        ` : `
                            <div class="small text-muted mt-2">
                                <i class="fa-regular fa-calendar"></i> ${item.created_at}
                            </div>
                        `}
                    </div>
                    <div class="ms-2">
                        ${isContent ? '' : '<i class="fa-solid fa-chevron-right text-muted"></i>'}
                    </div>
                </div>
            </div>
        </div>
        ${isContent ? `</a>` : ''}
        `;
    }).join('');
    $container.append(html);
}
function renderBreadcrumb() {
    const maxItems = 4;
    const len = state.path.length;
    let html = '';
    let itemsToRender = [];
    if (len <= maxItems) {
        itemsToRender = state.path.map((p, i) => ({ ...p, originalIndex: i }));
    } else {
        itemsToRender = [
            { ...state.path[0], originalIndex: 0 },
            { isEllipsis: true, hiddenItems: state.path.slice(1, -2) },
            { ...state.path[len - 2], originalIndex: len - 2 },
            { ...state.path[len - 1], originalIndex: len - 1 }
        ];
    }
    itemsToRender.forEach(p => {
        if (p.isEllipsis) {
            const dropdownHtml = p.hiddenItems.map(item => {
                const realIdx = state.path.indexOf(item);
                return `<li><a class="dropdown-item py-2" href="#" data-idx="${realIdx}">${item.name}</a></li>`;
            }).join('');
            html += `
                <li class="breadcrumb-item dropdown">
                    <a class="dropdown-toggle btn btn-link btn-sm p-0 text-decoration-none" data-bs-toggle="dropdown">
                        <i class="fa-solid fa-ellipsis px-1"></i>
                    </a>
                    <ul class="dropdown-menu shadow-sm border-0 animate slideIn">${dropdownHtml}</ul>
                </li>`;
        } else {
            const isActive = p.originalIndex === len - 1;
            const icon = p.originalIndex === 0 ? '<i class="fa-solid fa-house me-1"></i>' : '';
            html += `
                <li class="breadcrumb-item ${isActive ? 'active' : ''}">
                    ${isActive 
                        ? `<span class="fw-bold text-dark">${icon}${p.name}</span>`
                        : `<a href="#" data-idx="${p.originalIndex}" class="link-primary text-decoration-none">${icon}${p.name}</a>`}
                </li>`;
        }
    });
    $('#breadcrumb').html(html);
}
function updateUrlPath() {
    let url = BASE_URL + '/pstg';
    state.path.forEach((p, i) => {
        if (i !== 0 && p.slug) url += '/' + p.slug;
    });
    history.pushState(null, '', url);
}
window.addEventListener('popstate', restoreFromUrl);
function restoreFromUrl() {
    const baseUrlPath = BASE_URL.replace(window.location.origin, '');
    const cleanPath = window.location.pathname.replace(baseUrlPath, '');
    const parts = cleanPath.split('/').filter(Boolean);
    state.path = [{ id: null, slug: null, name: 'PSTG PROJECT', level: 1 }];
    if (parts.length > 1) {
        parts.slice(1).forEach((slug, index) => {
            state.path.push({
                id: null,
                slug: decodeURIComponent(slug),
                name: 'Loading...',
                level: index + 2,
            });
        });
    }
    state.folderId = null;
    state.level = state.path.length;
    state.refId = null;
    fetchFolders(true);
}
function setupObservers() {
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !state.isLoading && !state.isFull) {
            fetchFolders(false);
        }
    }, { rootMargin: '200px' });
    const target = document.getElementById('scrollEnd');
    if (target) observer.observe(target);
}
function setView(mode) {
    if (state.viewMode === mode) return;
    state.viewMode = mode;
    $('.view-btn').removeClass('active');
    if (mode === 'grid') {
        $('#vGrid').addClass('active');
    } else {
        $('#vList').addClass('active');
    }
    localStorage.setItem('viewMode', mode);
    renderView(state.cachedData, true);
}