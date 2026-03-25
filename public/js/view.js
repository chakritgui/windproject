let contentState = {
    pages: 'viewContent',
    type: '',
    lang: typeof currentLang !== 'undefined' ? currentLang : 'th',
    isInternalReferrer: document.referrer && document.referrer.includes(window.location.hostname)
};
let vrViewer = null;
function openContent(slugFromParam, modeFromParam) {
    injectCss();
    const $modal  = $('#windModal');
    const $dialog = $modal.find('.modal-dialog');
    $dialog.addClass('modal-fullscreen');
    $modal.find('.modal-header').html(`
        <div class="d-flex align-items-center gap-10 w-100" style="gap:10px;">
            <button type="button" class="cv-back-btn" data-bs-dismiss="modal">
                <i class="fa-solid fa-arrow-left" style="font-size:13px;"></i>
            </button>
            <div class="cv-breadcrumb">
                <span class="breadcrumb-item-first"></span>
                <span class="cv-breadcrumb-sep"></span>
                <span class="cv-breadcrumb-current" id="breadcrumbTitle"></span>
            </div>
        </div>
    `);
    $modal.find('.modal-body').html(`
        <div id="contentArea" style="opacity:0;transition:opacity 0.4s ease;">
            <div id="contentCover"></div>
            <div class="cv-title" id="contentTitle"></div>
            <div class="cv-meta">
                <i class="fa-regular fa-calendar-check"></i>
                <span id="contentDate"></span>
            </div>
            <div class="cv-divider"></div>
            <div class="cv-body article-content" id="contentBody"></div>
            <div id="multimediaArea"></div>
        </div>
        <div id="viewLoader">
            <div style="display:flex;flex-direction:column;gap:12px;">
                <div class="cv-skel" style="height:260px;border-radius:20px;"></div>
                <div class="cv-skel" style="height:24px;width:65%;"></div>
                <div class="cv-skel" style="height:16px;width:28%;border-radius:99px;"></div>
                <div class="cv-skel" style="height:13px;margin-top:8px;"></div>
                <div class="cv-skel" style="height:13px;width:90%;"></div>
                <div class="cv-skel" style="height:13px;width:80%;"></div>
            </div>
        </div>
    `);
    $modal.find('.modal-footer').html(`
        <div class="d-flex justify-content-center align-items-center w-100">
            ${typeof footer !== 'undefined' ? footer : ''}
        </div>
    `);
    $modal.modal('show');
    const urlParts  = window.location.pathname.split('/');
    const finalSlug = slugFromParam || decodeURIComponent(urlParts[urlParts.length - 1]);
    const finalMode = modeFromParam || urlParts[urlParts.length - 2];
    $.ajax({
        url: `${BASE_URL}/api/content.slug`,
        method: 'POST',
        dataType: 'json',
        data: { mode: finalMode, slug: finalSlug },
        success: function (res) {
            if (res.status === 'success') {
                contentState.type = res.data.type;
                renderContent(res.data);
            } else {
                $('#contentArea').html(`
                    <div class="cv-empty">
                        <i class="fa-regular fa-folder-open"></i>
                        <h3>${langData['no_items'] || 'Content not found'}</h3>
                    </div>`).css('opacity', 1);
                $('#viewLoader').hide();
            }
        },
        error: function () {
            $('#viewLoader').hide();
            if (typeof showError === 'function')
                showError(langData['cannot_load'] || 'Error loading content');
        }
    });
}
function renderContent(data) {
    const { lang, type } = contentState;
    const title = data.title[lang] || data.title['th'] || data.title['en'] || 'Untitled';
    let body = data.content[lang] || data.content['th'] || data.content['en'] || '';
    const fullBase = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`;
    body = body.replace(/src="(?!(http|https|\/\/))/g, `src="${fullBase}`);
    $('#contentTitle, #breadcrumbTitle').text(title);
    $('#contentDate').text(data.created_at);
    $('#contentBody').html(body);
    const breadcrumbLabel = langData[type] || 'News';
    $('.breadcrumb-item-first').html(
        `<a href="javascript:void(0)" onclick="closeOrRedirect()">${breadcrumbLabel}</a>`
    );
    setupFancybox();
    if (data.cover && data.cover_display === 'yes') {
        $('#contentCover').html(`
            <div class="cv-cover">
                <img src="${BASE_URL}/${data.cover}" loading="lazy" alt="cover">
                <div class="cv-cover-overlay"></div>
            </div>
        `);
    }
    renderMultimediaSections(data);
    $('#viewLoader').hide();
    $('#contentArea').animate({ opacity: 1 }, 500);
}
function setupFancybox() {
    $('#contentBody img').each(function () {
        const $img = $(this);
        $img.removeAttr('width height');
        let style = $img.attr('style') || '';
        style = style.replace(/width\s*:\s*[^;]+;?/gi, '').replace(/height\s*:\s*[^;]+;?/gi, '');
        $img.attr('style', style);
        if (!$img.parent('a').length) {
            $img.wrap(`<a href="${$img.attr('src')}" data-fancybox="content-images" class="content-img-link"></a>`);
        }
        $img.css({ cursor: 'zoom-in', transition: 'opacity 0.2s' }).addClass('hover-opacity').attr('loading', 'lazy');
    });
    if (typeof Fancybox !== 'undefined') {
        Fancybox.bind('[data-fancybox]', {
            Hash: false,
            Toolbar: { display: { left: ['infobar'], right: ['close'] } }
        });
    }
}
function renderMultimediaSections(data) {
    const LIMIT = 12;
    const sections = [
        { key: 'images360',   iconCls: 'cv-section-icon-vr',      faIcon: 'fa-street-view',  label: 'vr_experience', type: 'vr'      },
        { key: 'images',      iconCls: 'cv-section-icon-gallery',  faIcon: 'fa-images',       label: 'gallery',       type: 'gallery'  },
        { key: 'attachments', iconCls: 'cv-section-icon-docs',     faIcon: 'fa-paperclip',    label: 'documents',     type: 'docs'     },
    ];
    const html = sections.map(sec => {
        const items = data[sec.key];
        if (!items || !items.length) return '';
        const visibleItems = items.slice(0, LIMIT);
        const remaining = items.slice(LIMIT);
        const gridId = `cv-grid-${sec.type}`;
        return `
            <div class="cv-section">
                <div class="cv-section-header">
                    <div class="cv-section-icon ${sec.iconCls}">
                        <i class="fa-solid ${sec.faIcon}"></i>
                    </div>
                    <span>${langData[sec.label] || sec.label}</span>
                </div>
                <div id="${gridId}">
                    ${renderGridItems(sec.type, visibleItems)}
                </div>
                ${remaining.length > 0 ? renderLoadMoreButton(sec, remaining, gridId) : ''}
            </div>`;
    }).join('');
    $('#multimediaArea').html(html);
}
function renderGridItems(type, items) {
    if (type === 'docs') {
        const rows = items.map(item => {
            const url = `${BASE_URL}/${item.url}`;
            const ext = item.url.split('.').pop().toLowerCase();
            const isPdf = ext === 'pdf';
            const iconCls = typeof getFileIconClass === 'function' ? getFileIconClass(ext) : 'fa-file-lines';
            const docIconClass = isPdf ? 'cv-doc-icon-pdf' : 'cv-doc-icon-file';
            return `
                <a href="${url}" download class="cv-doc-item">
                    <div class="cv-doc-icon ${docIconClass}">
                        <i class="fa-solid ${iconCls}"></i>
                    </div>
                    <span class="cv-doc-name">${item.name}</span>
                    <i class="fa-solid fa-download cv-doc-dl"></i>
                </a>`;
        }).join('');
        return `<div class="cv-doc-grid">${rows}</div>`;
    }
    const thumbs = items.map(item => {
        const url        = `${BASE_URL}/${item.url}`;
        const isVR       = type === 'vr';
        const isGallery  = type === 'gallery';
        const badge = isVR
            ? `<div class="cv-vr-badge">
                   <i class="fa-solid fa-rotate" style="font-size:9px;animation:spin 2s linear infinite;"></i> 360°
               </div>`
            : '';
        const overlay = `<div class="cv-thumb-overlay">
            <i class="fa-solid ${isVR ? 'fa-vr-cardboard' : 'fa-magnifying-glass-plus'}"></i>
        </div>`;
        if (isGallery) {
            return `
                <a class="cv-thumb" href="${url}" data-fancybox="cv-gallery">
                    <img src="${url}" loading="lazy" alt="">
                    ${overlay}
                </a>`;
        }
        return `
            <div class="cv-thumb" onclick="openVRModal('${url}')">
                <img src="${url}" loading="lazy" alt="">
                ${badge}
                ${overlay}
            </div>`;
    }).join('');
    return `<div class="cv-thumb-grid">${thumbs}</div>`;
}
function renderLoadMoreButton(sec, remaining, gridId) {
    const encoded = encodeURIComponent(JSON.stringify({
        type:  sec.type,
        items: remaining,
    }));
    return `
        <div class="text-center load-more-wrapper" style="margin-top:12px;">
            <button class="cv-load-more" onclick="handleLoadMore(this,'${encoded}','${gridId}')">
                <i class="fa-solid fa-plus" style="font-size:11px;"></i>
                ${langData['view_more'] || 'View More'} (${remaining.length})
            </button>
        </div>`;
}
function handleLoadMore(btn, encodedData, gridId) {
    const data = JSON.parse(decodeURIComponent(encodedData));
    const newHtml = renderGridItems(data.type, data.items);
    const $grid = $(`#${gridId}`);
    if (data.type === 'docs') {
        $grid.find('.cv-doc-grid').append($(newHtml).find('.cv-doc-item'));
    } else {
        $grid.find('.cv-thumb-grid').append($(newHtml).find('.cv-thumb'));
    }
    $(btn).closest('.load-more-wrapper').remove();
    setupFancybox();
}
function renderEmptyState() {
    $('#contentArea').html(`
        <div class="cv-empty">
            <i class="fa-regular fa-folder-open"></i>
            <h3>${langData['no_items'] || 'No Content Found'}</h3>
        </div>`).css('opacity', 1);
    $('#viewLoader').hide();
}
function openVRModal(imgUrl) {
    const modal = new bootstrap.Modal(document.getElementById('vrModal'));
    modal.show();
    if (vrViewer) vrViewer.destroy();
    setTimeout(() => {
        vrViewer = pannellum.viewer('panorama-viewer', {
            type:        'equirectangular',
            panorama:    imgUrl,
            autoLoad:    true,
            autoRotate:  -2,
            compass:     true,
            hfov:        110,
        });
    }, 300);
}
$('#vrModal').on('hidden.bs.modal', function () {
    if (vrViewer) { vrViewer.destroy(); vrViewer = null; }
});
if (!document.getElementById('cv-spin-kf')) {
    const s = document.createElement('style');
    s.id = 'cv-spin-kf';
    s.textContent = '@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}';
    document.head.appendChild(s);
}
function injectCss() {
    if($("#tm-style").length) return;
    $("head").append(`<style id="tm-style">
        #windModal.modal-fullscreen .modal-content {
            border: none;
            border-radius: 0;
            background: #f4f9fe;
        }
        #windModal.modal-fullscreen .modal-header {
            background: linear-gradient(135deg,
                rgba(232,244,253,0.96) 0%,
                rgba(208,234,249,0.96) 100%);
            backdrop-filter: blur(16px);
            border-bottom: 1px solid rgba(91,184,245,0.20);
            padding: 10px 16px;
            min-height: unset;
        }
        #windModal.modal-fullscreen .modal-body {
            padding: 0;
            overflow-y: auto;
            background: #f4f9fe;
        }
        #windModal.modal-fullscreen .modal-footer {
            background: rgba(232,244,253,0.85);
            border-top: 1px solid rgba(91,184,245,0.18);
            padding: 10px 20px;
        }
        .cv-back-btn {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            padding: 7px 14px;
            border-radius: 10px;
            border: 1px solid rgba(45,127,193,0.22);
            background: rgba(255,255,255,0.75);
            color: var(--wind-dark, #1a4e7a);
            font-size: 0.82rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.22s ease;
            text-decoration: none;
        }
        .cv-back-btn:hover {
            background: linear-gradient(135deg,#5bb8f5,#2d7fc1);
            color: #fff; border-color: transparent;
        }
        .cv-breadcrumb {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.80rem;
            color: #5a7a96;
            overflow: hidden;
        }
        .cv-breadcrumb a {
            color: #2d7fc1; text-decoration: none; font-weight: 600; white-space: nowrap;
        }
        .cv-breadcrumb a:hover { color: #1a4e7a; }
        .cv-breadcrumb-sep {
            width: 5px; height: 5px; flex-shrink: 0;
            border-top: 1.5px solid #8faabb;
            border-right: 1.5px solid #8faabb;
            transform: rotate(45deg);
        }
        .cv-breadcrumb-current {
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            color: #1a2f45; font-weight: 600;
        }
        #viewLoader { padding: 28px 20px; max-width: 860px; margin: 0 auto; }
        .cv-skel {
            background: linear-gradient(90deg,
                rgba(91,184,245,0.10) 25%,
                rgba(91,184,245,0.22) 50%,
                rgba(91,184,245,0.10) 75%);
            background-size: 200% 100%;
            animation: cvShimmer 1.4s infinite;
            border-radius: 10px;
        }
        @keyframes cvShimmer {
            0%   { background-position:  200% 0; }
            100% { background-position: -200% 0; }
        }
        #contentArea {
            max-width: 860px;
            margin: 0 auto;
            padding: 28px 20px 60px;
            opacity: 0;
            transition: opacity 0.4s ease;
        }
        .cv-cover {
            position: relative;
            border-radius: 20px;
            overflow: hidden;
            margin-bottom: 28px;
            box-shadow: 0 8px 32px rgba(45,127,193,0.14);
        }
        .cv-cover img {
            width: 100%;
            max-height: 400px;
            min-height: 200px;
            object-fit: cover;
            display: block;
            transition: transform 0.5s ease;
        }
        .cv-cover:hover img { transform: scale(1.02); }
        .cv-cover-overlay {
            position: absolute; bottom: 0; left: 0; right: 0;
            height: 45%;
            background: linear-gradient(transparent, rgba(26,46,74,0.16));
            pointer-events: none;
        }
        .cv-title {
            font-weight: 800;
            font-size: clamp(1.2rem, 3vw, 1.6rem);
            color: #1a2f45;
            margin-bottom: 10px;
            line-height: 1.35;
        }
        .cv-meta {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.78rem;
            color: #5a7a96;
            background: rgba(91,184,245,0.08);
            border: 1px solid rgba(91,184,245,0.15);
            border-radius: 99px;
            padding: 5px 14px;
            width: fit-content;
            margin-bottom: 24px;
        }
        .cv-meta i { font-size: 11px; }
        .cv-divider {
            height: 2px;
            background: linear-gradient(90deg,
                rgba(91,184,245,0.40) 0%,
                rgba(45,127,193,0.20) 60%,
                transparent 100%);
            border-radius: 99px;
            margin-bottom: 24px;
        }
        .cv-body {
            font-size: 0.95rem;
            line-height: 1.85;
            color: #2d3f54;
        }
        .cv-body img {
            max-width: 100%;
            border-radius: 12px;
            margin: 10px 0;
        }
        .cv-body a { color: #2d7fc1; }
        .cv-section { margin-top: 40px; }
        .cv-section-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 16px;
            font-weight: 700;
            font-size: 0.92rem;
            color: #1a2f45;
            padding-bottom: 10px;
            border-bottom: 1px solid rgba(91,184,245,0.15);
        }
        .cv-section-icon {
            width: 34px; height: 34px;
            border-radius: 10px;
            display: flex; align-items: center; justify-content: center;
            font-size: 15px; flex-shrink: 0;
        }
        .cv-section-icon-vr      { background: rgba(6,182,212,0.12);  color: #0891b2; }
        .cv-section-icon-gallery  { background: rgba(45,127,193,0.12); color: #2d7fc1; }
        .cv-section-icon-docs     { background: rgba(220,38,38,0.10);  color: #dc2626; }
        .cv-thumb-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
            gap: 10px;
        }
        .cv-thumb {
            position: relative;
            border-radius: 12px;
            overflow: hidden;
            aspect-ratio: 1;
            cursor: pointer;
            border: 1px solid rgba(91,184,245,0.18);
            background: #e8f4fd;
            display: block;
            transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
            text-decoration: none;
        }
        .cv-thumb:hover {
            transform: translateY(-4px) scale(1.03);
            box-shadow: 0 8px 24px rgba(45,127,193,0.20);
            border-color: rgba(91,184,245,0.45);
        }
        .cv-thumb img {
            width: 100%; height: 100%;
            object-fit: cover; display: block;
            transition: transform 0.4s ease;
        }
        .cv-thumb:hover img { transform: scale(1.07); }
        .cv-thumb-overlay {
            position: absolute; inset: 0;
            background: rgba(26,78,122,0.30);
            display: flex; align-items: center; justify-content: center;
            color: #fff; font-size: 18px;
            opacity: 0; transition: opacity 0.2s;
        }
        .cv-thumb:hover .cv-thumb-overlay { opacity: 1; }
        .cv-vr-badge {
            position: absolute; top: 6px; left: 6px;
            background: rgba(0,0,0,0.60);
            color: #fff; font-size: 10px; font-weight: 700;
            padding: 2px 7px; border-radius: 99px;
            display: flex; align-items: center; gap: 4px;
            backdrop-filter: blur(4px);
        }
        .cv-doc-grid {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .cv-doc-item {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 12px 16px;
            border-radius: 14px;
            border: 1px solid rgba(91,184,245,0.18);
            background: rgba(255,255,255,0.85);
            text-decoration: none;
            transition: all 0.22s cubic-bezier(0.34,1.56,0.64,1);
        }
        .cv-doc-item:hover {
            transform: translateX(5px);
            box-shadow: 0 4px 16px rgba(45,127,193,0.12);
            border-color: rgba(91,184,245,0.38);
            background: rgba(255,255,255,0.98);
        }
        .cv-doc-icon {
            width: 44px; height: 44px; flex-shrink: 0;
            border-radius: 12px;
            display: flex; align-items: center; justify-content: center;
            font-size: 20px;
        }
        .cv-doc-icon-pdf  { background: rgba(220,38,38,0.10);  color: #dc2626; border: 1px solid rgba(220,38,38,0.18); }
        .cv-doc-icon-file { background: rgba(45,127,193,0.10); color: #2d7fc1; border: 1px solid rgba(45,127,193,0.18); }
        .cv-doc-name {
            font-weight: 600; font-size: 0.86rem; color: #1a2f45;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;
        }
        .cv-doc-dl {
            color: #8faabb; font-size: 15px; flex-shrink: 0;
            transition: color 0.2s, transform 0.2s;
        }
        .cv-doc-item:hover .cv-doc-dl { color: #2d7fc1; transform: translateY(2px); }
        .cv-load-more {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            padding: 9px 22px;
            border-radius: 99px;
            border: 1.5px solid rgba(45,127,193,0.28);
            background: rgba(255,255,255,0.80);
            color: #2d7fc1;
            font-size: 0.82rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.22s cubic-bezier(0.34,1.56,0.64,1);
            margin-top: 14px;
        }
        .cv-load-more:hover {
            background: linear-gradient(135deg,#5bb8f5,#2d7fc1);
            color: #fff; border-color: transparent;
            transform: translateY(-2px);
            box-shadow: 0 6px 18px rgba(45,127,193,0.30);
        }
        .cv-empty {
            text-align: center;
            padding: 60px 20px;
            color: #5a7a96;
        }
        .cv-empty i { font-size: 3rem; opacity: 0.35; margin-bottom: 14px; display: block; }
        .cv-empty h3 {
            font-weight: 700;
            font-size: 1.1rem; color: #1a4e7a; margin-bottom: 6px;
        }
        @media (max-width: 576px) {
            #contentArea { padding: 20px 14px 48px; }
            .cv-thumb-grid { grid-template-columns: repeat(auto-fill, minmax(80px,1fr)); gap: 7px; }
        }
    </style>`);
}