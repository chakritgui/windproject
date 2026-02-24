let contentState = {
    pages: 'viewContent',
    type: '',
    lang: typeof currentLang !== 'undefined' ? currentLang : 'th',
    isInternalReferrer: document.referrer && document.referrer.includes(window.location.hostname)
};
function openContent(slugFromParam, modeFromParam) {
    const $modal = $("#windModal");
    const $dialog = $modal.find(".modal-dialog");
    $dialog.addClass("modal-fullscreen");
    $modal.find(".modal-footer").html(`
        <div class="d-flex justify-content-center align-items-center w-100"><img src="${BASE_URL}/public/images/iwind.png" alt="wind" class="footer-logo me-2">${footer}</div>
    `);
    const modalBody = $modal.find(".modal-body");
    modalBody.html(`
        <div class="container py-4" id="contentArea" style="opacity: 0; transition: opacity 0.3s;">
            <div id="contentCover"></div>
            <h5 id="contentTitle" class="fw-bold mb-2"></h5>
            <p class="text-muted small mb-4"><i class="fa-regular fa-calendar me-1"></i> <span id="contentDate"></span></p>
            <hr>
            <div id="contentBody" class="article-content mb-5"></div>
            <div id="multimediaArea"></div>
        </div>
        <div id="viewLoader" class="container py-4">
            <div class="skeleton-loader p-0">
                <div class="skeleton-rect mb-4 shadow-sm" style="height: 275px; border-radius: 1.5rem; background: #eee;"></div>
                <div class="skeleton-line mb-3" style="width: 70%; height: 30px; background: #eee; border-radius: 8px;"></div>
                <div class="skeleton-line mb-4" style="width: 30%; height: 20px; background: #eee; border-radius: 8px;"></div>
                <div class="skeleton-line mb-2" style="height: 15px; background: #eee; border-radius: 5px;"></div>
                <div class="skeleton-line mb-2" style="height: 15px; background: #eee; border-radius: 5px;"></div>
            </div>
        </div>
    `);
    $modal.find(".modal-header").html(`
        <div class="d-flex align-items-center w-100">
            <button type="button" class="btn btn-sm btn-light me-2" data-bs-dismiss="modal">
                <i class="fa-solid fa-arrow-left"></i>
            </button> 
        </div>
    `);
    $modal.modal('show');
    const urlParts = window.location.pathname.split('/');
    const finalSlug = slugFromParam || decodeURIComponent(urlParts[urlParts.length - 1]);
    const finalMode = modeFromParam || urlParts[urlParts.length - 2];
    $.ajax({
        url: `${BASE_URL}/api/content.slug`,
        method: 'POST',
        dataType: 'json',
        data: { 
            mode: finalMode, 
            slug: finalSlug
        },
        success: function (res) {
            if (res.status === 'success') {
                contentState.type = res.data.type;
                renderContent(res.data);
                const lang = (typeof currentLang !== 'undefined') ? currentLang : 'th';
                const title = res.data.title[lang] || res.data.title['th'] || res.data.title['en'] || 'Untitled';
            } else {
                $('#contentArea').html(`<div class="alert alert-danger">Content not found</div>`).css('opacity', 1);
                $('#viewLoader').hide();
            }
        },
        error: function () {
            $('#viewLoader').hide();
            if(typeof showError === 'function') showError(langData['cannot_load'] || 'Error loading content');
        }
    });
}
function renderContent(data) {
    const { lang, type } = contentState;
    const title = data.title[lang] || data.title['th'] || data.title['en'];
    let body = data.content[lang] || data.content['th'] || data.content['en'] || '';
    const fullBaseUrl = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`;
    body = body.replace(/src="(?!(http|https|\/\/))/g, `src="${fullBaseUrl}`);
    $('#contentTitle, #breadcrumbTitle').text(title);
    $('#contentDate').text(data.created_at);
    $('#contentBody').html(body);
    const breadcrumbLabel = langData[type] || 'News';
    $(".breadcrumb-item-first").html(
        `<a href="javascript:void(0)" class="text-primary text-decoration-none" onclick="closeOrRedirect()">${breadcrumbLabel}</a>`
    );
    setupFancybox();
    if (data.cover && data.cover_display === 'yes') {
        $('#contentCover').html(`
            <div class="position-relative mb-4 overflow-hidden shadow-sm rounded-4">
                <img src="${BASE_URL}/${data.cover}" class="img-fluid w-100 object-fit-cover" style="max-height: 400px; min-height: 275px;">
            </div>
        `);
    }
    renderMultimediaSections(data);
    $('#viewLoader').hide();
    $('#contentArea').animate({ opacity: 1 }, 500);
}
function setupFancybox() {
    $('#contentBody img').each(function() {
        const $img = $(this);
        if (!$img.parent('a').length) {
            $img.wrap(`<a href="${$img.attr('src')}" data-fancybox="content-images" class="content-img-link"></a>`);
            $img.css({ 'cursor': 'zoom-in', 'transition': 'opacity 0.2s' }).addClass('hover-opacity');
        }
    });
    if (typeof Fancybox !== 'undefined') {
        Fancybox.bind('[data-fancybox]', {
            Hash: false,
            Toolbar: { display: { left: ["infobar"], right: ["close"] } }
        });
    }
}
function renderMultimediaSections(data) {
    const sections = [
        { key: 'images360', id: 'vr-container', icon: 'fa-street-view text-info', label: 'vr_experience', type: 'vr' },
        { key: 'images', id: 'gallery-container', icon: 'fa-images text-primary', label: 'gallery', type: 'gallery' },
        { key: 'attachments', id: 'doc-container', icon: 'fa-paperclip text-danger', label: 'documents', type: 'docs' }
    ];
    let extraHtml = '';
    const LIMIT = 12;
    sections.forEach(sec => {
        const items = data[sec.key];
        if (items && items.length > 0) {
            extraHtml += `
                <section class="mt-5">
                    <h5 class="fw-bold mb-3 d-flex align-items-center">
                        <i class="fa-solid ${sec.icon} me-2"></i> ${langData[sec.label] || sec.label}
                    </h5>
                    <div class="row g-3" id="${sec.id}">
                        ${renderGridItems(sec.type, items.slice(0, LIMIT))}
                    </div>
                    ${items.length > LIMIT ? renderLoadMoreButton(sec, items.slice(LIMIT), data.cover) : ''}
                </section>`;
        }
    });
    $('#multimediaArea').html(extraHtml);
}
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
function renderGridItems(type, items) {
    return items.map(item => {
        const url = `${BASE_URL}/${item.url}`;
        if (type === 'docs') {
            const ext = item.name.split('.').pop().toLowerCase();
            return `
                <div class="col-lg-3 col-md-4 col-sm-6">
                    <a href="${url}" download class="text-decoration-none h-100 d-block">
                        <div class="d-flex align-items-center p-3 rounded-4 border bg-white shadow-sm hover-shadow h-100 transition-all">
                            <i class="fa-solid ${getFileIconClass(ext)} fs-2 me-3"></i>
                            <div class="overflow-hidden">
                                <div class="text-dark fw-bold text-truncate small">${item.name}</div>
                                <div class="text-muted extra-small">${langData['download'] || 'Download'}</div>
                            </div>
                        </div>
                    </a>
                </div>`;
        }
        const onClickAttr = type === 'vr' ? `onclick="openVRModal('${url}')"` : '';
        const fancyboxAttr = type === 'gallery' ? 'data-fancybox="gallery"' : '';
        const badge = type === 'vr' ? '<span class="badge bg-dark opacity-75 position-absolute top-0 start-0 m-2">360°</span>' : '';
        return `
            <div class="col-4 col-md-2">
                <div class="gallery-card rounded-3 overflow-hidden border shadow-sm position-relative cursor-pointer h-100" ${onClickAttr}>
                    <a href="${url}" ${fancyboxAttr} class="d-block ratio ratio-1x1">
                        <img src="${url}" class="object-fit-cover hover-zoom" loading="lazy">
                        ${badge}
                    </a>
                </div>
            </div>`;
    }).join('');
}
function renderEmptyState() {
    $('#contentArea').html(`
        <div class="empty-state-container animated fadeIn text-center py-5">
            <div class="empty-icon fs-1 mb-3"><i class="fa-regular fa-folder-open text-muted"></i></div>
            <h3 class="empty-title">${langData['no_items'] || 'No Content Found'}</h3>
        </div>
    `).css('opacity', 1);
    $('#viewLoader').hide();
}
function renderLoadMoreButton(sec, remainingItems, coverUrl) {
    const sectionData = encodeURIComponent(JSON.stringify({
        type: sec.type,
        items: remainingItems,
        cover: coverUrl
    }));
    return `
        <div class="text-center mt-4 load-more-wrapper">
            <button class="btn btn-outline-primary btn-sm px-4 rounded-pill fw-bold" 
                onclick="handleLoadMore(this, '${sectionData}', '${sec.id}')">
                <i class="fa-solid fa-plus me-1"></i> ${langData['view_more'] || 'View More'} (${remainingItems.length})
            </button>
        </div>`;
}
function handleLoadMore(btn, encodedData, containerId) {
    const data = JSON.parse(decodeURIComponent(encodedData));
    const html = renderGridItems(data.type, data.items);
    $(`#${containerId}`).append(html);
    $(btn).closest('.load-more-wrapper').remove(); 
    setupFancybox();
}