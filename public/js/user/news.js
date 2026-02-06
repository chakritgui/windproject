let pages     = 'news';
let newsPage     = 1;
let isLoading  = false;
let hasMore    = true;
$(document).ready(initNews);
function initNews() {
    if (isLoading || !hasMore) return;
    isLoading = true;
    $.ajax({
        url: `${BASE_URL}/api/new-list`,
        method: 'POST',
        dataType: 'json',
        data: { 
            page: newsPage,
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
    const $container = $('#listView');
    if (newsPage === 1) {
        $container.empty();
        if (!items || items.length === 0) {
            const emptyHtml = `
                <div class="empty-state-container animated fadeIn">
                    <div class="empty-icon"><i class="fa-regular fa-folder-open"></i></div>
                    <h3 class="empty-title">${langData['no_items'] || 'No items'}</h3>
                    <p class="empty-subtitle"${langData['no_items_subtitle'] || 'No items available.'}</p>
                    <button onclick="location.reload()" class="btn-refresh">
                        <i class="fa-solid fa-rotate-right"></i> <span>${langData['refresh'] || 'Refresh'}</span>
                    </button>
                </div>
            `;
            $container.html(emptyHtml);
            return;
        }
    }
    items.forEach(item => {
        const lang = sessionStorage.getItem('lang') || 'th';
        const fallback = {
            'en': item.subject_en || item.subject_lo || item.subject_th,
            'lo': item.subject_lo || item.subject_th || item.subject_en,
            'th': item.subject_th || item.subject_lo || item.subject_en
        };
        const subject = fallback[lang] || langData['no_title'];
        let thumbHtml = '';
        if (item.cover_image) {
            thumbHtml = `<div class="news-thumbnail"><img src="${item.cover_image}" alt="cover"></div>`;
        } else {
            thumbHtml = `<div class="news-thumbnail no-image"><img src="${BASE_URL}/public/images/noimage.jpg" alt="cover"></div>`;
        }
        let badgeHtml = '';
        if (parseInt(item.count_attachment) > 0) 
            badgeHtml += `<span class="badge-tag tag-pdf"><i class="fa-solid fa-file-pdf"></i> <span>${langData['document'] || 'Document'}</span></span>`;
        if (parseInt(item.count_image) > 0) 
            badgeHtml += `<span class="badge-tag tag-img"><i class="fa-solid fa-images"></i> <span>${langData['image'] || 'Image'}</span></span>`;
        if (parseInt(item.count_image360) > 0) 
            badgeHtml += `<span class="badge-tag tag-vr"><i class="fa-solid fa-vr-cardboard"></i> <span>${langData['vr'] || 'VR'}</span></span>`;
        const isRead = parseInt(item.is_read) === 1;
        const html = `
            ${(isPWA()) ? `
                <a class="news-item ${isRead ? '' : 'unread'}" onclick="openContent('${item.content_slug}', 'view')">
            ` : `
                <a class="news-item ${isRead ? '' : 'unread'}" href="${BASE_URL}/content/preview/${item.content_slug}" target="_blank">
            `}
                ${thumbHtml}
                <div class="news-content">
                    <div class="news-header">
                        <h6 class="news-title">${subject}</h6>
                        ${isRead ? '' : '<div class="unread-dot"></div>'}
                    </div>
                    <div class="news-meta">
                        <div class="meta-item"><i class="fa-regular fa-calendar"></i> ${item.created_at}</div>
                    </div>
                    <div class="attachment-badges">
                        ${badgeHtml}
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