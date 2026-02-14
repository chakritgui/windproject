<div class="container py-5 mt-5 mb-5 position-relative">
    <a onclick="closeOrRedirect()" class="btn btn-white shadow-sm rounded-circle d-md-none position-fixed start-0 m-3 z-3" style="width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; margin-top: -40px !important; box-shadow: 0 .5rem 1.5rem rgba(0,0,0,.1) !important; z-index: 1060;">
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
    <article class="news-full-content bg-white p-md-0" id="contentArea" style="opacity: 0; transition: opacity 0.3s ease;">
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
    .transition-all { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
    .hover-shadow:hover { 
        box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important; 
        transform: translateY(-3px); 
    }
    .hover-zoom { transition: transform 0.5s; }
    .hover-zoom:hover { transform: scale(1.1); }
    .item-fade-in {
        animation: itemReveal 0.6s ease forwards;
    }
    @keyframes itemReveal {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
    }
    .extra-small { font-size: 0.75rem; }
</style>