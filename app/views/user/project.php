<script>
    const initialFolderPath = <?= json_encode($folderIds ?? []) ?>;
</script>
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
            <div class="header-stats d-flex align-items-center gap-3">
                <div class="dropdown d-none">
                    <button class="btn btn-white border shadow-sm dropdown-toggle d-flex align-items-center" type="button" id="sortDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="fa-solid fa-sort me-2 text-secondary"></i> 
                        <span id="selectedSortLabel" data-i18n="oldest" class="fw-medium"></span>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0" aria-labelledby="sortDropdown">
                        <li>
                            <a class="dropdown-item sort-option py-2" href="javascript:void(0)" data-sort="desc" data-label="newest">
                                <i class="fa-solid fa-arrow-down-9-1 me-2 text-muted"></i><span data-i18n="newest"></span>
                            </a>
                        </li>
                        <li>
                            <a class="dropdown-item sort-option py-2" href="javascript:void(0)" data-sort="asc" data-label="oldest">
                                <i class="fa-solid fa-arrow-up-1-9 me-2 text-muted"></i><span data-i18n="oldest"></span>
                            </a>
                        </li>
                    </ul>
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