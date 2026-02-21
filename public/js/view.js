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
    const lang = (typeof currentLang !== 'undefined') ? currentLang : 'th';
    const title = data.title[lang] || data.title['th'] || data.title['en'] || 'Untitled';
    let body = data.content[lang] || data.content['th'] || data.content['en'] || '';
    const fullBaseUrl = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`;
    body = body.replace(/src="(?!(http|https|\/\/))/g, `src="${fullBaseUrl}`);
    const type = data.type || 'news';
    $(".breadcrumb-item-first").html(`<a href="${BASE_URL}/${type}" class="text-decoration-none">${(typeof langData !== 'undefined' ? langData[type] : null) || 'News'}</a>`);
    $('#contentTitle, #breadcrumbTitle').text(title);
    $('#contentBody').html(body);
    $('#contentDate').text(data.created_at);
    if (data.cover) {
        $('#contentCover').html(`
            <div class="position-relative mb-4 overflow-hidden rounded-4 shadow-sm">
                <img src="${fullBaseUrl}${data.cover}" class="img-fluid w-100 object-fit-cover" style="max-height: 350px; min-height: 250px;">
                <div class="position-absolute bottom-0 start-0 w-100 p-4 bg-dark bg-opacity-50 text-white d-md-none">
                    <h4 class="fw-bold mb-0">${title}</h4>
                </div>
            </div>
        `);
    } else {
        $('#contentCover').html(``);
    }
    let extraHtml = '';
    if (data.images360 && data.images360.length > 0) {
        extraHtml += `
        <section class="mt-5">
            <h5 class="fw-bold mb-3 d-flex align-items-center">
                <span class="p-2 bg-info bg-opacity-10 rounded-3 me-2"><i class="fa-solid fa-street-view text-info"></i></span>
                ${(typeof langData !== 'undefined' ? langData['vr_experience'] : '360° Experience')}
            </h5>
            <div class="row g-3">`;
        data.images360.forEach(vr => {
            const imageUrl = `${fullBaseUrl}${vr.url || data.cover}`;
            extraHtml += `
                <div class="col-6 col-md-3">
                    <div class="card border-0 shadow-sm rounded-4 overflow-hidden h-100 vr-card cursor-pointer" onclick="openVRModal('${imageUrl}')">
                        <div class="position-relative" style="height: 150px;">
                            <img src="${imageUrl}" class="w-100 h-100 object-fit-cover">
                            <div class="position-absolute top-50 start-50 translate-middle">
                                <div class="btn btn-light btn-sm rounded-pill shadow-sm fw-bold"><i class="fa-solid fa-expand"></i> View 360</div>
                            </div>
                        </div>
                    </div>
                </div>`;
        });
        extraHtml += `</div></section>`;
    }
    if (data.images && data.images.length > 0) {
        extraHtml += `
        <section class="mt-5">
            <h5 class="fw-bold mb-3 d-flex align-items-center">
                <span class="p-2 bg-primary bg-opacity-10 rounded-3 me-2"><i class="fa-solid fa-images text-primary"></i></span>
                Gallery
            </h5>
            <div class="row g-2">`;
        data.images.forEach(img => {
            extraHtml += `
                <div class="col-4 col-md-2">
                    <a href="${fullBaseUrl}${img.url}" data-fancybox="gallery" class="d-block ratio ratio-1x1 overflow-hidden rounded-3 border">
                        <img src="${fullBaseUrl}${img.url}" class="img-fluid object-fit-cover hover-zoom" loading="lazy">
                    </a>
                </div>`;
        });
        extraHtml += `</div></section>`;
    }
    if (data.attachments && data.attachments.length > 0) {
        extraHtml += `<section class="mt-5 mb-4"><h5 class="fw-bold mb-3">Documents</h5><div class="row g-3">`;
        data.attachments.forEach(file => {
            const extension = getFileIconClass(file.url.split('.').pop().toLowerCase());
            extraHtml += `
                <div class="col-md-4">
                    <a href="${fullBaseUrl}${file.url}" download class="text-decoration-none">
                        <div class="d-flex align-items-center p-3 rounded-3 border bg-white shadow-sm">
                            <i class="${extension} fs-3 me-3"></i>
                            <div class="text-dark fw-bold text-truncate small">${file.name || 'Download File'} ${extension}</div>
                            <i class="fa-solid fa-download ms-auto fa-2x text-muted"></i>
                        </div>
                    </a>
                </div>`;
        });
        extraHtml += `</div></section>`;
    }
    $('#multimediaArea').html(extraHtml);
    $('#viewLoader').hide();
    $('#contentArea').css('opacity', 1);
}
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