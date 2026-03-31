<link href="<?=asset('public/css/page.css')?>" rel="stylesheet">
<link href="<?=asset('public/css/news.css')?>" rel="stylesheet">
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
                <i class="fa-solid fa-paper-plane deco-1"></i>
                <i class="fa-solid fa-bullhorn deco-2"></i>
            </div>
            <div class="deco-cluster cluster-br">
                <i class="fa-solid fa-envelope-open-text deco-3"></i>
                <i class="fa-solid fa-rss deco-4"></i>
                <i class="fa-solid fa-bolt-lightning deco-5"></i>
            </div>
            <div class="hero-content">
                <div class="hero-icon">
                    <i class="fa-solid fa-newspaper text-white"></i>
                </div>
                <div class="hero-text">
                    <h1 data-i18n="news_updates"></h1>
                    <p data-i18n="header-news-subtitle"></p>
                    <div class="hero-accent"></div>
                </div>
            </div>
        </div>
        <div class="toolbar">
            <div class="d-flex align-items-center gap-2">
                <div class="dropdown">
                    <button class="toolbar-btn" id="sortBtn" onclick="toggleSort()">
                        <i class="fa-solid fa-sort"></i>
                        <span id="sortLabel" data-i18n="newest"></span>
                    </button>
                </div>
            </div>
            <div class="ms-auto d-flex align-items-center gap-2">
                <span class="total-badge">
                    <i class="fa-solid fa-layer-group me-1"></i>
                    <strong id="docTotal">0</strong>
                    <span data-i18n="items"></span>
                </span>
            </div>
        </div>
        <div id="listView"></div>
        <div id="scrollEnd"></div>
    </div>
</div>
<script src="<?=asset('public/js/user/sky.js')?>"></script>
<script src="<?=asset('public/js/user/news.js')?>" defer></script>