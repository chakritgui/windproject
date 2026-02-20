const API_URL = `${BASE_URL}/api/project.info`;
const LIMIT = 20;
let state = {
    folderId: null,
    level: 1,
    refId: null,
    path: [{ id: null, slug: null, name: 'PSTG PROJECT', level: 1, ref_id: null }],
    sort: 'asc',
    offset: 0,
    isLoading: false,
    isFull: false,
    cachedData: []
};
let currentAjaxRequest = null;
$(document).ready(function () {
    restoreFromUrl();
    setupObservers();
    initEventListeners();
});
function initEventListeners() {
    $(document).on('click', '.sort-option', function() {
        state.sort = $(this).data('sort');
        $('#selectedSortLabel').text(langData[$(this).data('label')]);
        fetchFolders(true);
    });
    $('#listView').on('click', '.fetchFolder', function () {
        const index = $(this).data('index');
        const rowData = state.cachedData[index];
        if (!rowData || rowData.type === 'content') return;
        state.folderId = rowData.id;
        state.level = parseInt(rowData.level) + 1;
        state.refId = rowData.ref_id || null;
        state.path.push({
            id: rowData.id,
            slug: rowData.slug,
            name: rowData.folder_name,
            level: state.level,
            ref_id: state.refId
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
        state.refId = target.ref_id;
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
            ref_id: state.refId,
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
                const root = { id: null, slug: null, name: 'PSTG PROJECT', level: 1, ref_id: null };
                state.path = [root, ...breadcrumbs];
                const last = state.path[state.path.length - 1];
                state.folderId = last.id;
                state.level = state.path.length;
                state.refId = last.ref_id;
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
    if (isNewSearch && (!data || data.length === 0)) {
        $('#emptyState').removeClass('d-none');
        return;
    }
    let html = data.map((item, index) => {
        const globalIndex = isNewSearch ? index : (state.cachedData.length - data.length + index);
        const isContent = item.type === 'content';
        const badge = item.child_count > 0 ? `<span class="badge rounded-pill bg-light text-dark border ms-2" style="font-size: 0.7rem;">${item.child_count}</span>` : '';
        let folder_name = '-';
        if (item.type === 'content') {
            const subjects = {
                en: item.en_subject,
                th: item.th_subject,
                lo: item.lo_subject
            };
            folder_name =
                subjects[currentLang] ||
                subjects.en ||
                subjects.th ||
                subjects.lo ||
                '-';
        } else {
            folder_name = item.folder_name || '-';
        }
        const iconHtml = isContent
            ? (item.cover 
                ? `<img src="${BASE_URL}/${item.cover}" class="rounded-2" style="width:100%;height:100%;object-fit:cover;">`
                : `<i class="fa-regular fa-newspaper text-primary fa-3x"></i>`)
            : `<i class="fa-solid fa-folder-open fa-3x"></i>`;
        return `
            ${isContent ? `
                ${(isPWA()) ? `
                    <a onclick="openContent('${item.content_slug}', 'view')" style="text-decoration: none;">
                ` : `
                    <a href="${BASE_URL}/content/preview/${item.content_slug}" target="_blank" style="text-decoration: none;">
                `}
            ` :``}
                <div class="card doc-item ${(item.type === 'folder' || item.type === 'root') ? `fetchFolder` : ``} border-0 shadow-none mb-2" data-index="${globalIndex}" style="cursor:pointer;">
                    <div class="card-body p-3">
                        <div class="d-flex align-items-center">
                            <div class="folder-icon-box me-3 flex-shrink-0">${iconHtml}</div>
                            <div class="flex-grow-1" style="overflow: hidden; text-overflow: ellipsis;">
                                <div class="doc-title text-dark">${folder_name} ${badge}</div>
                                <div class="text-muted mt-2 small"><i class="fa-regular fa-calendar"></i> ${item.created_at}</div>
                            </div>
                            <div class="ms-2 flex-shrink-0">
                                ${isContent ? '' : '<i class="fa-solid fa-chevron-right text-muted"></i>'}
                            </div>
                        </div>
                    </div>
                </div>
            ${isContent ? `
                </a>    
            ` : ``}
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
    state.path = [{ id: null, slug: null, name: 'PSTG PROJECT', level: 1, ref_id: null }];
    if (parts.length > 1) {
        parts.slice(1).forEach((slug, index) => {
            state.path.push({
                id: null,
                slug: decodeURIComponent(slug),
                name: 'Loading...',
                level: index + 2,
                ref_id: null
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