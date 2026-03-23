'use strict';
let newsPage    = 1;
let isLoading   = false;
let hasMore     = true;
let currentSort = 'desc';
const lang = sessionStorage.getItem('lang') || 'th';
let scrollObserver = null;
function toggleSort() {
    currentSort = currentSort === 'desc' ? 'asc' : 'desc';
    const label = document.getElementById('sortLabel');
    if (label) {
        label.textContent = currentSort === 'desc' ? (typeof langData !== 'undefined' ? langData['newest'] : 'Newest') : (typeof langData !== 'undefined' ? langData['oldest'] : 'เก่าสุด');
    }
    resetAndLoad();
}
function initScrollObserver() {
    const sentinel = document.getElementById('scrollEnd');
    if (!sentinel) return;
    if (scrollObserver) { scrollObserver.disconnect(); scrollObserver = null; }
    scrollObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !isLoading && hasMore) {
            initNews();
        }
    }, { rootMargin: '200px' });
    scrollObserver.observe(sentinel);
}
function stopScrollObserver() {
    if (scrollObserver) { scrollObserver.disconnect(); scrollObserver = null; }
}
function clearEndOfList() {
    const el = document.getElementById('scrollEnd');
    if (el) el.innerHTML = '';
}
function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function t(key) {
    return (typeof langData !== 'undefined' && langData[key]) ? langData[key] : key;
}
function buildThumbnail(item) {
    if (item.cover_image) {
        return `<div class="news-thumbnail"><img src="${escapeHtml(item.cover_image)}" alt="news" loading="lazy"></div>`;
    }
    const styles = {
        news:    { bg: 'linear-gradient(135deg,#daeeff,#bcd9f1)', color: '#1a4e7a', icon: 'fa-newspaper' },
        project: { bg: 'linear-gradient(135deg,#fff0e6,#ffd4b0)', color: '#c2410c', icon: 'fa-diagram-project' },
    };
    const s = styles[item.type] || styles.news;
    return `<div class="news-thumbnail">
        <div class="news-thumb-placeholder" style="background:${s.bg};">
            <i class="fa-solid ${s.icon}" style="color:${s.color};"></i>
            <span style="color:${s.color};">${escapeHtml(t(item.type))}</span>
        </div>
    </div>`;
}
function buildTypeBadge(type) {
    if (type === 'project') {
        return `<span class="news-badge news-badge-project">
            <i class="fa-solid fa-diagram-project" style="font-size:9px;"></i>
            <span data-i18n="project">${t('project')}</span>
        </span>`;
    }
    return `<span class="news-badge news-badge-news">
        <i class="fa-regular fa-newspaper" style="font-size:9px;"></i>
        <span data-i18n="news">${t('news')}</span>
    </span>`;
}
function buildAttachments(item) {
    let html = '';
    if (parseInt(item.count_attachment) > 0) {
        html += `<span class="att-badge att-badge-doc">
            <i class="fa-solid fa-paperclip" style="font-size:9px;"></i>
            <span data-i18n="document">${t('document')}</span>
        </span>`;
    }
    if (parseInt(item.count_image) > 0) {
        html += `<span class="att-badge att-badge-img">
            <i class="fa-solid fa-images" style="font-size:9px;"></i>
            <span data-i18n="image">${t('image')}</span>
        </span>`;
    }
    if (parseInt(item.count_image360) > 0) {
        html += `<span class="att-badge att-badge-vr">
            <i class="fa-solid fa-vr-cardboard" style="font-size:9px;"></i> VR
        </span>`;
    }
    return html;
}
function renderNews(items) {
    const container = document.getElementById('listView');
    if (!container) return;
    if (!items || !items.length) {
        if (newsPage === 1) {
            container.innerHTML = `
                <div class="empty-state animated fadeIn">
                    <span class="empty-icon">📂</span>
                    <h3 data-i18n="no_items"></h3>
                    <p data-i18n="no_items_subtitle"></p>
                </div>
            `;
        }
        return;
    }
    const html = items.map(item => {
        const subject = item[`subject_${lang}`] || item.subject_th || item.subject_en || 'No Title';
        return `
            <a href="javascript:void(0)" class="news-item" onclick="openContent('${escapeHtml(item.content_slug)}', 'view')">
                ${buildThumbnail(item)}
                <div class="news-content">
                    <div class="news-type-badges">${buildTypeBadge(item.type)}</div>
                    <h6 class="news-title" title="${escapeHtml(subject)}">${escapeHtml(subject)}</h6>
                    <div class="news-meta">
                        <div class="news-date">
                            <i class="fa-regular fa-calendar-check"></i>
                            ${escapeHtml(item.created_at || '-')}
                        </div>
                        <div class="attachment-badges">${buildAttachments(item)}</div>
                    </div>
                </div>
            </a>`;
    }).join('');
    container.insertAdjacentHTML('beforeend', html);
}
function showSkeletons(count = 4) {
    const container = document.getElementById('listView');
    if (!container) return;
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `
            <div class="skel-news" id="nskel-${i}">
                <div class="skel" style="width:190px;flex-shrink:0;border-radius:0;"></div>
                <div style="flex:1;padding:18px 22px;display:flex;flex-direction:column;gap:10px;">
                    <div class="skel" style="height:12px;width:30%;border-radius:99px;"></div>
                    <div class="skel" style="height:15px;width:80%;"></div>
                    <div class="skel" style="height:13px;width:60%;"></div>
                    <div style="margin-top:auto;display:flex;gap:8px;">
                        <div class="skel" style="height:10px;width:80px;border-radius:99px;"></div>
                    </div>
                </div>
            </div>`;
    }
    container.insertAdjacentHTML('beforeend', html);
}
function removeSkeletons() {
    document.querySelectorAll('[id^="nskel-"]').forEach(el => el.remove());
}
function initNews() {
    if (isLoading || !hasMore) return;
    isLoading = true;
    showSkeletons();
    $.ajax({
        url: BASE_URL + '/api/news.load',
        method:   'POST',
        dataType: 'json',
        data: {
            page:  newsPage,
            order: currentSort,
        },
        success: function (res) {
            removeSkeletons();
            if (res.status === true) {
                const totalEl = document.getElementById('docTotal');
                if (totalEl) totalEl.textContent = res.data.total;
                renderNews(res.data.items);
                hasMore = res.data.has_more;
                newsPage++;
                if (!hasMore) {
                    stopScrollObserver();
                }
            } else {
                showError(t('cannot_load'));
            }
        },
        error: function () {
            removeSkeletons();
            showError(t('cannot_load'));
        },
        complete: function () {
            isLoading = false;
        },
    });
}
function resetAndLoad() {
    newsPage = 1;
    hasMore  = true;
    const container = document.getElementById('listView');
    if (container) container.innerHTML = '';
    clearEndOfList();
    initScrollObserver();
    initNews();
}
$(document).on('click', '.sort-option', function () {
    currentSort = $(this).data('sort');
    const label = $(this).data('label');
    $('#selectedSortLabel').text(t(label));
    resetAndLoad();
});
function showError(msg) {
    console.error(msg || 'Cannot load data');
}
$(document).ready(function () {
    initNews();
    initScrollObserver();
});