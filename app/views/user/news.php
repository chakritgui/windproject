<link rel="stylesheet" href="<?=BASE_URL?>/public/css/news.css?v=<?=time();?>">
<div class="container py-5 mt-5">  
    <div class="header-section mb-5">
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
            <div class="header-stats">
                <span class="badge-total"><i class="fa-solid fa-layer-group"></i> <span id="docTotal">0</span> <span data-i18n="items"></span></span>
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
<script src="<?=BASE_URL?>/public/js/view.js?v=<?=time();?>" defer></script>