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
$(document).ready(function() {
    initProject();
    setupObservers();
});
function initProject() {
    fetchFolders(true);
}
function fetchFolders(isNewSearch = false) {
    if (isLoading) return;
    if (isNewSearch) {
        offset = 0;
        isFull = false;
        cachedData = [];
        $('#listView').html(''); 
    }
    if (isFull) return;
    isLoading = true;
    $('#loadingIndicator').removeClass('d-none');
    $.ajax({
        url: `${BASE_URL}/api/project.info`,
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
                renderView(newData, isNewSearch);
                renderBreadcrumb();
                if (!result.hasMore || newData.length < limit) {
                    isFull = true;
                }
                offset += limit;
            } else {
                console.error('Data error');
            }
        },
        complete: function() {
            isLoading = false;
            $('#loadingIndicator').addClass('d-none');
        }
    });
}
function renderView(data, isNewSearch) {
    const $container = $('#listView');
    const $empty = $('#emptyState');
    if (isNewSearch && (!data || data.length === 0)) {
        $container.html('');
        $empty.removeClass('d-none');
        return;
    }
    $empty.addClass('d-none');
    let html = '';
    data.forEach((item, index) => {
        const globalIndex = (isNewSearch ? 0 : cachedData.length - data.length) + index;
        const isContent = item.type === 'content';
        let iconHtml = '';
        if (isContent) {
            iconHtml = item.cover 
                ? `<img src="${BASE_URL}/${item.cover}" class="rounded-2" style="width: 100%; height: 100%; object-fit: cover;">`
                : `<i class="fa-solid fa-file-lines text-primary fa-2x"></i>`;
        } else {
            iconHtml = `<i class="fa-solid fa-folder-open fa-2x"></i>`;
        }
        html += `
            <div class="card doc-item border-0 shadow-none mb-2" data-index="${globalIndex}" style="cursor: pointer;">
                ${isContent ? `
                    ${(isPWA()) ? `
                        <a onclick="openContent('${item.content_slug}', 'view')" style="text-decoration: none;">
                    ` : `
                        <a href="${BASE_URL}/content/preview/${item.content_slug}" target="_blank" style="text-decoration: none;">
                    `}
                    
                ` :``}
                <div class="card-body p-3">
                    <div class="d-flex align-items-center">
                        <div class="folder-icon-box me-3">
                            ${iconHtml}
                        </div>
                        <div class="flex-grow-1">
                            <div class="doc-title fw-bold">
                                ${item.folder_name || '-'}
                                ${item.child_count > 0 ? `<span class="badge rounded-pill bg-light text-primary border ms-1" style="font-size: 0.65rem;">${item.child_count}</span>` : ''}
                            </div>
                            ${isContent ? `
                                <div class="doc-meta d-flex align-items-center">
                                    <span class="text-truncate"><i class="fa-regular fa-calendar me-1"></i>${item.created_at || '-'}</span>
                                </div>
                                ` :``}
                            
                        </div>
                        <div class="ms-2">
                            ${isContent ? `` :`<i class="fa-solid fa-chevron-right btn-navigate"></i>`}
                        </div>
                    </div>
                </div>
                ${isContent ? `</a>` :``}
            </div>`;
    });
    if (isNewSearch) { $container.html(html); } 
    else { $container.append(html); }
    $container.find('.doc-item').off('click').on('click', function(e) {
        if ($(e.target).closest('a').length) return; 
        const index = $(this).data('index');
        const rowData = cachedData[index];
        if (rowData && rowData.type !== 'content') {
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
function renderBreadcrumb() {
    let html = '';
    currentPath.forEach((p, idx) => {
        const isHome = idx === 0;
        const isActive = idx === currentPath.length - 1;
        const homeIcon = isHome ? '<i class="fa-solid fa-house me-1"></i> ' : '';
        let displayName = p.name;
        if (!isActive && displayName.length > 25) {
            displayName = displayName.substring(0, 25) + '...';
        }
        html += `
            <li class="breadcrumb-item ${isActive ? 'active text-muted' : ''}">
                ${isActive ? `<span>${homeIcon}${displayName}</span>` : `<a href="javascript:void(0)" class="text-primary text-decoration-none fw-medium" data-idx="${idx}">${homeIcon}${displayName}</a>`}
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
        fetchFolders(true);
    });
}
function setupObservers() {
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !isLoading && !isFull) {
            fetchFolders(false);
        }
    }, { rootMargin: '200px' });
    const target = document.getElementById('scrollEnd');
    if (target) observer.observe(target);
}