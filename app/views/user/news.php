<link rel="stylesheet" href="<?=BASE_URL?>/public/css/news.css?v=<?=time();?>">
<div class="container py-5 mt-5">  
    <div class="header-section mb-3">
        <div class="header-top">
            <div class="header-title-wrapper">
                <div class="header-icon">
                    <i class="fa-regular fa-newspaper"></i>
                </div>
                <div class="header-text">
                    <h2 class="header-title-main" data-i18n="news"></h2>
                    <p class="header-subtitle" data-i18n="header-news-subtitle"></p>
                </div>
            </div>
            <div class="header-stats d-flex align-items-center gap-3">
                <span class="badge-total shadow-sm">
                    <i class="fa-solid fa-layer-group me-1"></i> 
                    <span id="docTotal">0</span> <span data-i18n="items"></span>
                </span>
                <div class="dropdown">
                    <button class="btn btn-white border shadow-sm dropdown-toggle d-flex align-items-center" type="button" id="sortDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="fa-solid fa-sort me-2 text-secondary"></i> 
                        <span id="selectedSortLabel" data-i18n="newest" class="fw-medium"></span>
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
    <div id="listView"></div>
</div>
<div id="scrollEnd"></div>
<script src="<?=BASE_URL?>/public/js/user/news.js?v=<?=time();?>" defer></script>