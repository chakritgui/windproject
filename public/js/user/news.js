let newsPage     = 1;
let isLoading  = false;
let hasMore    = true;
$(document).ready(function() {
    initNews();
});
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

function renderNews(items) {
    const $container = $('#listView');
    if (newsPage === 1) $container.empty();

    if (!items.length && newsPage === 1) {
        $container.html('<div class="text-center py-5 text-muted">ไม่พบข้อมูลข่าวสาร</div>');
        return;
    }

    items.forEach(item => {
        // 1. จัดการเรื่องหัวข้อข่าว (เลือกภาษาตามความเหมาะสม)
        const subject = item.subject_th || item.subject_en || 'ไม่มีหัวข้อ';
        
        // 2. จัดการรูปภาพ (ถ้าไม่มีให้ใช้คลาส no-image)
        let thumbHtml = '';
        if (item.cover_image) {
            thumbHtml = `<div class="news-thumbnail"><img src="${item.cover_image}" alt="cover"></div>`;
        } else {
            thumbHtml = `<div class="news-thumbnail no-image"><i class="bi bi-newspaper"></i></div>`;
        }

        // 3. เตรียม Badge ไฟล์แนบต่างๆ
        let badgeHtml = '';
        if (parseInt(item.count_attachment) > 0) 
            badgeHtml += `<span class="badge-tag tag-pdf"><i class="fa-solid fa-file-pdf"></i> เอกสาร</span>`;
        if (parseInt(item.count_image) > 0) 
            badgeHtml += `<span class="badge-tag tag-img"><i class="fa-solid fa-images"></i> รูปภาพ</span>`;
        if (parseInt(item.count_image360) > 0) 
            badgeHtml += `<span class="badge-tag tag-vr"><i class="fa-solid fa-vr-cardboard"></i> 360°</span>`;

        // 4. สร้างโครงสร้าง HTML (สังเกตคลาส unread)
        const isRead = parseInt(item.is_read) === 1;
        const html = `
            <a href="${BASE_URL}/news/detail/${item.content_id}" class="news-item ${isRead ? '' : 'unread'}">
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