let pages = 'viewContent';
let type = '';
$(document).ready(initViewContent);
function initViewContent() {
    const urlParts = window.location.pathname.split('/');
    const slug = decodeURIComponent(urlParts[urlParts.length - 1]);
    const mode = urlParts[urlParts.length - 2];
    $.ajax({
        url: `${BASE_URL}/api/content.slug`,
        method: 'POST',
        dataType: 'json',
        data: { 
            mode: mode, 
            slug: slug
        },
        success: function (res) {
            if (res.status === 'success' && res.data) {
                renderContent(res.data);
                type = res.data.type;
            } else {
                $('#contentArea').html(`
                    <div class="empty-state-container animated fadeIn">
                        <div class="empty-icon"><i class="fa-regular fa-folder-open"></i></div>
                        <h3 class="empty-title" data-i18n="no_items"></h3>
                        <p class="empty-subtitle" data-i18n="no_items_subtitle"></p>
                    </div>    
                `).css('opacity', 1);
                $('#viewLoader').hide();
            }
        },
        error: function () {
            $('#viewLoader').hide();
            showError(langData['cannot_load']);
        }
    });
}
function renderContent(data) {
    const lang = currentLang || 'th';
    const title = data.title[lang] || data.title['th'] || data.title['en'];
    let body = data.content[lang] || data.content['th'] || data.content['en'] || '';
    const fullBaseUrl = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`;
    body = body.replace(/src="(?!(http|https|\/\/))/g, `src="${fullBaseUrl}`);
    $('#contentTitle').text(title);
    $(".breadcrumb-item-first").html(`<a class="text-primary" onclick="closeOrRedirect()">${langData[type] || 'News'}</a>`);
    $('#contentTitle, #breadcrumbTitle').text(title);
    $('#contentBody').html(body);
    $('#contentBody img').each(function() {
        const $img = $(this);
        const src = $img.attr('src');
        if (!$img.parent('a').length) {
            $img.wrap(`<a href="${src}" data-fancybox="content-images" class="content-img-link"></a>`);
            $img.css({
                'cursor': 'zoom-in',
                'transition': 'opacity 0.2s'
            }).addClass('hover-opacity');
        }
    });
    if (typeof Fancybox !== 'undefined') {
        Fancybox.bind('[data-fancybox="content-images"]', {
            Toolbar: { display: { left: ["infobar"], right: ["close"] } }
        });
    }
    $('#contentDate').text(data.created_at);
    if (data.cover && data.cover_display === 'yes') {
        $('#contentCover').html(`
            <div class="position-relative mb-4 overflow-hidden shadow-sm rounded-4">
                <img src="${BASE_URL}/${data.cover}" class="img-fluid w-100 object-fit-cover" style="max-height: 400px; min-height: 275px;">
            </div>
        `);
    }
    let extraHtml = '';
    const DISPLAY_LIMIT = 12;
    const sections = [
        { key: 'images360', id: 'vr-container', icon: 'fa-street-view text-info', label: 'vr_experience', type: 'vr' },
        { key: 'images', id: 'gallery-container', icon: 'fa-images text-primary', label: 'gallery', type: 'gallery' },
        { key: 'attachments', id: 'doc-container', icon: 'fa-paperclip text-danger', label: 'documents', type: 'docs' }
    ];
    sections.forEach(sec => {
        const items = data[sec.key];
        if (items && items.length > 0) {
            const displayItems = items.slice(0, DISPLAY_LIMIT);
            const hasMore = items.length > DISPLAY_LIMIT;
            extraHtml += `
            <section class="mt-5">
                <h5 class="fw-bold mb-3 d-flex align-items-center">
                    <i class="fa-solid ${sec.icon} me-2"></i> ${langData[sec.label] || sec.label}
                </h5>
                <div class="row g-3" id="${sec.id}">
                    ${renderGridItems(sec.type, displayItems, data.cover)}
                </div>
                ${hasMore ? `
                    <div class="text-center mt-4" id="btn-container-${sec.type}">
                        <button class="btn btn-outline-primary rounded-pill px-5 py-2 shadow-sm transition-all" 
                                onclick="loadMoreItems('${sec.type}', ${JSON.stringify(items.slice(DISPLAY_LIMIT)).replace(/"/g, '&quot;')}, '${data.cover}')">
                            <i class="fa-solid fa-chevron-down me-2"></i> 
                            ${langData['view_more'] || 'View More'} ${items.length - DISPLAY_LIMIT} ${langData['item'] || 'Items'}
                        </button>
                    </div>
                ` : ''}
            </section>`;
        }
    });
    $('#multimediaArea').html(extraHtml);
    $('#viewLoader').hide();
    $('#contentArea').animate({opacity: 1}, 500);
}
function renderGridItems(type, items, defaultCover) {
    let html = '';
    items.forEach(item => {
        const url = `${BASE_URL}/${item.url}`;
        if (type === 'docs') {
            const isPdf = item.url.toLowerCase().endsWith('.pdf');
            html += `
                <div class="col-lg-3 col-md-4 col-sm-6 item-fade-in">
                    <a href="${url}" download class="text-decoration-none h-100 d-block">
                        <div class="d-flex align-items-center p-3 rounded-4 border bg-white shadow-sm hover-shadow h-100 transition-all">
                            <i class="fa-regular ${isPdf ? 'fa-file-pdf text-danger' : 'fa-file-lines text-primary'} fs-2 me-3"></i>
                            <div class="overflow-hidden">
                                <div class="text-dark fw-bold text-truncate small">${item.name}</div>
                                <div class="text-muted extra-small" data-i18n="download"></div>
                            </div>
                        </div>
                    </a>
                </div>`;
        } else if (type === 'vr') {
            html += `
                <div class="col-4 col-md-2 item-fade-in">
                    <div class="gallery-card rounded-3 overflow-hidden border shadow-sm position-relative cursor-pointer h-100" 
                         onclick="openVRModal('${url}')">
                        <div class="ratio ratio-1x1">
                            <img src="${url}" class="object-fit-cover hover-zoom" loading="lazy">
                        </div>
                        <div class="position-absolute top-0 start-0 m-1">
                            <span class="badge bg-dark opacity-75">360°</span>
                        </div>
                    </div>
                </div>`;
        } else {
            html += `
                <div class="col-4 col-md-2 item-fade-in">
                    <a href="${url}" data-fancybox="gallery" class="gallery-card d-block rounded-3 overflow-hidden border shadow-sm position-relative h-100">
                        <div class="ratio ratio-1x1">
                            <img src="${url}" class="object-fit-cover hover-zoom" loading="lazy">
                        </div>
                    </a>
                </div>`;
        }
    });
    return html;
}
function loadMoreItems(type, remainingItems, cover) {
    const containerId = `#${type === 'vr' ? 'vr-container' : (type === 'gallery' ? 'gallery-container' : 'doc-container')}`;
    const newHtml = renderGridItems(type, remainingItems, cover);
    $(`#btn-container-${type}`).fadeOut(300);
    $(containerId).append(newHtml);
    $('html, body').animate({ scrollTop: $(containerId).find('div').last().offset().top - 300 }, 600);
}
function closeOrRedirect() {
    const hasHistory = window.history.length > 1;
    const isNewTab = !document.referrer || document.referrer.includes(window.location.hostname) === false;
    if (hasHistory && document.referrer) {
        window.history.back();
    } else {
        window.close();
        setTimeout(() => {
            window.location.href = `${BASE_URL}/${type}`;
        }, 200);
    }
}
Fancybox.bind("[data-fancybox='gallery']", {
    Hash: false,
    Thumbs: { autoStart: false },
    Toolbar: {
        display: {
            left: ["infobar"],
            middle: [],
            right: ["iterateZoom", "close"],
        },
    },
});
let vrViewer = null;
function openVRModal(imgUrl) {
    const modal = new bootstrap.Modal(document.getElementById('vrModal'));
    modal.show();
    if (vrViewer) {
        vrViewer.destroy();
    }
    setTimeout(() => {
        vrViewer = pannellum.viewer('panorama-viewer', {
            "type": "equirectangular",
            "panorama": imgUrl,
            "autoLoad": true,
            "autoRotate": -2,
            "compass": true,
            "hfov": 110
        });
    }, 300);
}
$('#vrModal').on('hidden.bs.modal', function () {
    if (vrViewer) {
        vrViewer.destroy();
        vrViewer = null;
    }
});