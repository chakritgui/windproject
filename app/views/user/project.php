<link rel="stylesheet" href="<?=BASE_URL?>/public/css/news.css?v=<?=time();?>">
<link rel="stylesheet" href="<?=BASE_URL?>/public/css/project.css?v=<?=time();?>">
<div class="container py-5 mt-5">  
    <div class="header-section mb-3">
        <div class="header-top">
            <div class="header-title-wrapper">
                <div class="header-icon">
                    <i class="fa-solid fa-diagram-project"></i>
                </div>
                <div class="header-text">
                    <h2 class="header-title-main" data-i18n="project"></h2>
                    <p class="header-subtitle" data-i18n="header-project-subtitle"></p>
                </div>
            </div>
        </div>
        <div class="header-divider">
            <div class="divider-line"></div>
            <div class="divider-dot"></div>
        </div>
    </div>
    <nav aria-label="breadcrumb" class="breadcrumb-wrapper mb-4">
        <ol class="breadcrumb mb-0" id="breadcrumb"></ol>
    </nav>
    <div id="listView"></div>
    <div id="loadingIndicator" class="text-center py-4 d-none">
        <div class="spinner-border text-primary spinner-border-sm" role="status"></div>
        <span class="ms-2 small text-muted" data-i18n="loading"></span>
    </div>
    <div id="emptyState" class="empty-state-container animated fadeIn">
        <div class="empty-icon"><i class="fa-regular fa-folder-open"></i></div>
        <h3 class="empty-title" data-i18n="no_items"></h3>
        <p class="empty-subtitle" data-i18n="no_items_subtitle"></p>
    </div>
</div>
<div id="scrollEnd" style="height: 50px;"></div>
<script src="<?=BASE_URL?>/public/js/user/project.js?v=<?=time();?>" defer></script>
<script src="<?=BASE_URL?>/public/js/view.js?v=<?=time();?>" defer></script>