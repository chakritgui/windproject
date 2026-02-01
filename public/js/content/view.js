let pages = 'viewContent';
$(document).ready(initViewContent);
function initViewContent() {
    const urlParts = window.location.pathname.split('/');
    const slug = decodeURIComponent(urlParts[urlParts.length - 1]);
    const mode = urlParts[urlParts.length - 2];
    $.ajax({
        url: `${BASE_URL}/api/content/getBySlug`,
        method: 'POST',
        dataType: 'json',
        data: { 
            mode: mode, 
            slug: slug
        },
        success: function (res) {
            if (res.status === 'success') {
                renderContent(res.data);
            } else {
                $('#contentArea').html(`<div class="alert alert-danger">Content not found</div>`).css('opacity', 1);
                $('#viewLoader').hide();
            }
        },
        error: function () {
            $('#viewLoader').hide();
            showError('Error', 'Cannot load content');
        }
    });
}
function renderContent(data) {
    const lang = currentLang || 'th';
    const title = data.title[lang] || data.title['th'] || data.title['en'];
    const body = data.content[lang] || data.content['th'] || data.content['en'];
    $('#contentTitle, #breadcrumbTitle').text(title);
    $('#contentBody').html(body);
    $('#contentDate').text(data.created_at);
    if (data.cover) {
        $('#contentCover').html(`
            <div class="position-relative mb-4 overflow-hidden rounded-4 shadow-sm">
                <img src="${BASE_URL}/${data.cover}" class="img-fluid w-100 object-fit-cover" style="max-height: 275px; min-height: 275px;">
                <div class="position-absolute bottom-0 start-0 w-100 p-4 bg-gradient-dark text-white d-md-none">
                    <h4 class="fw-bold mb-0">${title}</h4>
                </div>
            </div>
        `);
    }
    let extraHtml = '';
    if (data.images360 && data.images360.length > 0) {
        extraHtml += `
        <section class="mt-5">
            <h5 class="fw-bold mb-3 d-flex align-items-center">
                <span class="p-2 bg-info bg-opacity-10 rounded-3 me-2">
                    <i class="fa-solid fa-street-view text-info"></i>
                </span>
                ${langData['vr_experience'] || '360° Experience'}
            </h5>
            <div class="row g-3">`;
        data.images360.forEach(vr => {
            extraHtml += `
                <div class="col-6 col-md-4 col-lg-3">
                    <div class="card border-0 shadow-sm rounded-4 overflow-hidden h-100">
                        <div class="position-relative h-100">
                            <img src="${BASE_URL}/${vr.url || data.cover}" class="w-100 h-100 object-fit-cover">
                            <div class="position-absolute top-0 start-0 w-100 h-100 bg-dark bg-opacity-25 d-flex align-items-center justify-content-center">
                                <a href="${BASE_URL}/vr-viewer/${vr.id}" target="_blank" class="btn btn-light btn-sm rounded-pill shadow-sm fw-bold">
                                    <i class="fa-solid fa-vr-cardboard me-1"></i> ${langData['view'] || 'View'}
                                </a>
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
                <span class="p-2 bg-primary bg-opacity-10 rounded-3 me-2">
                    <i class="fa-solid fa-images text-primary"></i>
                </span>
                ${langData['gallery'] || 'Gallery'}
            </h5>
            <div class="row g-2">`;
        data.images.forEach(img => {
            extraHtml += `
                <div class="col-4 col-md-3 col-lg-2">
                    <a href="${BASE_URL}/${img.url}" target="_blank" class="d-block ratio ratio-1x1 overflow-hidden rounded-3 border">
                        <img src="${BASE_URL}/${img.url}" class="img-fluid object-fit-cover hover-zoom">
                    </a>
                </div>`;
        });
        extraHtml += `</div></section>`;
    }
    if (data.attachments && data.attachments.length > 0) {
        extraHtml += `
        <section class="mt-5 mb-4">
            <h5 class="fw-bold mb-3 d-flex align-items-center">
                <span class="p-2 bg-danger bg-opacity-10 rounded-3 me-2">
                    <i class="fa-solid fa-paperclip text-danger"></i>
                </span>
                ${langData['documents'] || 'Documents'}
            </h5>
            <div class="row row-cols-1 row-cols-md-2 g-3">`;
        data.attachments.forEach(file => {
            const isPdf = file.url.toLowerCase().endsWith('.pdf');
            extraHtml += `
                <div class="col-6 col-md-4 col-lg-3">
                    <a href="${BASE_URL}/${file.url}" target="_blank" class="text-decoration-none">
                        <div class="d-flex align-items-center p-3 rounded-4 border bg-white shadow-sm hover-shadow transition-all">
                            <div class="flex-shrink-0 me-3">
                                <i class="fa-regular ${isPdf ? 'fa-file-pdf text-danger' : 'fa-file-lines text-primary'} fs-2"></i>
                            </div>
                            <div class="flex-grow-1 overflow-hidden">
                                <div class="text-dark fw-bold text-truncate">${file.name}</div>
                                <div class="text-muted small">${isPdf ? 'PDF' : 'DOC'}</div>
                            </div>
                            <div class="ms-2 text-muted"><i class="fa-solid fa-chevron-right"></i></div>
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
function closeOrRedirect() {
    const hasHistory = window.history.length > 1;
    const isNewTab = !document.referrer || document.referrer.includes(window.location.hostname) === false;
    if (hasHistory && document.referrer) {
        window.history.back();
    } else {
        window.close();
        setTimeout(() => {
            window.location.href = "<?= BASE_URL ?>/news";
        }, 200);
    }
}