<link rel="stylesheet" href="<?=BASE_URL?>/public/css/news.css?v=<?=time();?>">
<link rel="stylesheet" href="<?=BASE_URL?>/public/css/project.css?v=<?=time();?>">
<div class="container py-5 mt-5">  
    <div class="header-section mb-5">
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

    <div id="scrollEnd" style="height: 50px;"></div>
    <div id="emptyState" class="text-center py-5 d-none animated fadeIn">
        <i class="fa-solid fa-folder-open fa-4x text-light mb-3"></i>
        <h5 class="text-muted" data-i18n="no_data_found"></h5>
        <p class="text-secondary small" data-i18n="project_line1"></p>
    </div>
</div>
<div id="scrollEnd"></div>
<script src="<?=BASE_URL?>/public/js/user/project.js?v=<?=time();?>" defer></script>