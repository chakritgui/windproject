let pages     = 'news';
let newsPage     = 1;
let isLoading  = false;
let hasMore    = true;
let currentSort = 'desc';
$(document).ready(initNews);
$(document).on('click', '.sort-option', function() {
    const sortValue = $(this).data('sort');
    const label = $(this).data('label');
    currentSort = sortValue;
    $('#selectedSortLabel').text(langData[label]);
    newsPage = 1;
    hasMore = true;
    $('#listView').empty();
    initNews(); 
});
function initNews() {
    if (isLoading || !hasMore) return;
    isLoading = true;
    $.ajax({
        url: `${BASE_URL}/api/news.load`,
        method: 'POST',
        dataType: 'json',
        data: { 
            page: newsPage,
            order: currentSort
        },
        success: function (res) {
            if (res.status === true) {
                $('#docTotal').text(res.data.total);
                renderNews(res.data.items);
                hasMore = res.data.has_more;
                newsPage++;
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
function renderNews(items) {
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
    const $container = $('#listView');
    if (newsPage === 1) $container.empty();
    items.forEach(item => {
        const lang = sessionStorage.getItem('lang') || 'th';
        const subject = item[`subject_${lang}`] || item.subject_th || item.subject_en || 'No Title';
        let thumbHtml = '';
        if (item.cover_image) {
            thumbHtml = `<div class="news-thumbnail"><img src="${item.cover_image}" alt="news" loading="lazy"></div>`;
        } else {
            const colorMap = {
                'news': { bg: '#EEF2FF', text: '#4F46E5', icon: 'fa-newspaper' },
                'project': { bg: '#FFF7ED', text: '#EA580C', icon: 'fa-diagram-project' }
            };
            const style = colorMap[item.type] || colorMap['news'];
            thumbHtml = `
                <div class="news-thumbnail d-flex flex-column align-items-center justify-content-center" 
                    style="background-color: ${style.bg}; border-right: 4px solid ${style.text}22;">
                    <i class="fa-solid ${style.icon} mb-2" style="color: ${style.text}; font-size: 2.5rem; opacity: 0.6;"></i>
                    <span style="color: ${style.text}; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.8;">
                        ${langData[item.type]}
                    </span>
                </div>`;
        }
        const typeBadge = item.type === 'news' 
            ? `<span class="badge bg-primary-subtle text-primary shadow-sm" data-i18n="news"></span>`
            : `<span class="badge bg-warning-subtle text-warning shadow-sm" data-i18n="project"></span>`;
        const html = `
            <a href="javascript:void(0)" class="news-item" onclick="openContent('${item.content_slug}', 'view')">
                ${thumbHtml}
                <div class="news-content">
                    <div class="mb-2">
                        ${typeBadge}
                    </div>
                    <h6 class="news-title">${subject}</h6>
                    <div class="news-meta">
                        <div class="meta-left text-muted small">
                            <i class="fa-regular fa-calendar-check me-1"></i> ${item.created_at}
                        </div>
                        <div class="attachment-badges">
                            ${parseInt(item.count_attachment) > 0 ? '<span class="badge rounded-pill bg-danger-subtle text-danger me-1"><i class="fa-solid fa-paperclip me-1"></i><span data-i18n="document"></span></span>' : ''}
                            ${parseInt(item.count_image) > 0 ? '<span class="badge rounded-pill bg-info ms-2"><i class="fa-solid fa-images me-1"></i><span data-i18n="image"></span></span>' : ''}
                            ${parseInt(item.count_image360) > 0 ? '<span class="badge rounded-pill bg-success ms-2"><i class="fa-solid fa-vr-cardboard me-1"></i>VR</span>' : ''}
                        </div>
                    </div>
                </div>
            </a>
        `;
        $container.append(html);
    });
}
const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
        initNews();
    }
}, {
    root: null, 
    rootMargin: '200px',
});
observer.observe(document.getElementById('scrollEnd'));