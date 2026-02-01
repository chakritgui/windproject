<div class="container py-5 mt-5 position-relative">
    <a href="<?= BASE_URL ?>/news" class="btn btn-white shadow-sm rounded-circle d-md-none position-fixed start-0 top-0 m-3 z-3" style="width: 45px; height: 45px; display: flex; align-items: center; justify-content: center;">
        <i class="fa-solid fa-chevron-left"></i>
    </a>
    <div class="d-none d-md-flex align-items-center justify-content-between mb-4">
        <nav aria-label="breadcrumb">
            <ol class="breadcrumb mb-0">
                <li class="breadcrumb-item breadcrumb-item-first"></li>
                <li class="breadcrumb-item active text-truncate" id="breadcrumbTitle" style="max-width: 250px;">...</li>
            </ol>
        </nav>
        <button type="button" onclick="closeOrRedirect()" class="btn btn-link text-decoration-none text-muted">
            <i class="fa-solid fa-xmark me-1"></i> <span data-i18n="close">ปิดหน้าต่าง</span>
        </button>
    </div>
    <div id="previewBadge" class="d-none bg-warning text-dark text-center py-2 sticky-top shadow-sm fw-bold" style="z-index: 1060; font-size: 0.9rem;">
        <i class="fa-solid fa-eye me-2"></i> PREVIEW MODE : ข้อมูลนี้ยังไม่ได้เผยแพร่สู่สาธารณะ
    </div>
    <article class="news-full-content bg-white p-3 p-md-0 rounded-4" id="contentArea" style="opacity: 0; transition: opacity 0.3s ease;">
        <div id="contentCover"></div>
        <h4 class="fw-bolder mb-3" id="contentTitle"></h4>
        <div class="me-3">
            <i class="fa-regular fa-calendar me-2 text-primary"></i>
            <span id="contentDate"></span>
        </div>
        <section class="article-body lh-lg mb-5" id="contentBody" style="text-align: justify;"></section>
        <div id="multimediaArea"></div>
    </article>
    <div id="viewLoader" class="text-center py-5">
        <div class="spinner-grow text-primary" role="status"></div>
    </div>
</div>
<script src="<?=BASE_URL?>/public/js/content/view.js?v=<?=time();?>" defer></script>
<style>
    .bg-gradient-dark {
        background: linear-gradient(transparent, rgba(0,0,0,0.8));
    }
    .transition-all {
        transition: all 0.25s ease;
    }
    .hover-shadow:hover {
        transform: translateY(-4px);
        box-shadow: 0 .5rem 1.5rem rgba(0,0,0,.1) !important;
        border-color: var(--bs-primary) !important;
    }
    .hover-zoom {
        transition: transform 0.5s ease;
    }
    .hover-zoom:hover {
        transform: scale(1.1);
    }
    .article-body img {
        max-width: 100%;
        height: auto;
        border-radius: 1rem;
        margin: 1.5rem 0;
    }
    @media (max-width: 768px) {
        body {
            background-color: #f8f9fa;
        }
        #contentArea {
            background-color: transparent !important;
        }
    }
</style>