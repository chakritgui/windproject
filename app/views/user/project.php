<script>
    const initialFolderPath = <?= json_encode($folderIds ?? []) ?>;
</script>
<link href="<?=BASE_URL?>/public/css/page.css?v=<?=time();?>" rel="stylesheet">
<link rel="stylesheet" href="<?=BASE_URL?>/public/css/news.css?v=<?=time();?>">
<link rel="stylesheet" href="<?=BASE_URL?>/public/css/project.css?v=<?=time();?>">
<div class="sky-wrap" id="skyWrap"></div>
<div class="container">  
    <div class="page">
        <div class="hero">
            <div class="wind-particles">
                <div class="particle pp-1"></div>
                <div class="particle pp-2"></div>
                <div class="particle pp-3"></div>
                <div class="particle pp-4"></div>
                <div class="particle pp-5"></div>
            </div>
            <div class="deco-cluster cluster-tl">
                <i class="fa-solid fa-diagram-project deco-1"></i> 
                <i class="fa-solid fa-wind deco-2"></i> 
            </div>
            <div class="deco-cluster cluster-br">
                <i class="fa-solid fa-map-location-dot deco-3"></i>
                <i class="fa-solid fa-list-check deco-4"></i>
                <i class="fa-solid fa-chart-line deco-5"></i>
            </div>
            <div class="hero-content">
                <div class="hero-icon"><i class="fa-solid fa-diagram-project text-white"></i></div>
                <div class="hero-text">
                    <h1 data-i18n="pstg_project"></h1>
                    <p data-i18n="header-project-subtitle"></p>
                    <div class="hero-accent"></div>
                </div>
            </div>
        </div>
        <div class="header-section toolbar">
            <div class="breadcrumb-area w-100 d-flex align-items-center justify-content-between flex-wrap">
                <nav aria-label="breadcrumb" class="breadcrumb-wrapper">
                    <ol class="breadcrumb mb-0" id="breadcrumb"></ol>
                </nav>
                <div class="header-stats">
                    <div class="view-group">
                        <button class="view-btn active" id="vList" onclick="setView('list')" title="List View">
                            <i class="fa-solid fa-list"></i> <span data-i18n="list"></span>
                        </button>
                        <button class="view-btn" id="vGrid" onclick="setView('grid')" title="Grid View">
                            <i class="fa-solid fa-th-large"></i> <span data-i18n="grid"></span>
                        </button>
                    </div>
                    <button class="toolbar-btn" id="sortBtn" onclick="toggleSort()">
                        <i class="fa-solid fa-sort"></i>
                        <span id="sortLabel" data-i18n="newest"></span>
                    </button>
                </div>
            </div>
        </div>
        <div id="listView"></div>
        <div id="loadingIndicator" class="text-center py-4 d-none">
            <div class="spinner-border text-blue spinner-border-sm" role="status"></div>
            <span class="ms-2 small text-muted" data-i18n="loading"></span>
        </div>
        <div id="emptyState" class="empty-state animated fadeIn">
            <span class="empty-icon">📂</span>
            <h3 data-i18n="no_items"></h3>
            <p data-i18n="no_items_subtitle"></p>
        </div>
    </div>
</div>
<div id="scrollEnd" style="height: 50px;"></div>
<script src="<?=BASE_URL?>/public/js/user/sky.js?v=<?=time();?>"></script>
<script src="<?=BASE_URL?>/public/js/user/project.js?v=<?=time();?>" defer></script>