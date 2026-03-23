<link href="<?=BASE_URL?>/public/css/page.css?v=<?=time();?>" rel="stylesheet">
<link rel="stylesheet" href="<?=BASE_URL?>/public/css/download.css?v=<?=time();?>">
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
                <i class="fa-solid fa-download deco-1"></i>
                <i class="fa-solid fa-share-nodes deco-2"></i>
            </div>
            <div class="deco-cluster cluster-br">
                <i class="fa-brands fa-apple deco-3"></i>
                <i class="fa-brands fa-android deco-4"></i>
                <i class="fa-solid fa-laptop deco-5"></i>
            </div>
            <div class="hero-content">
                <div class="hero-icon"><i class="fa-solid fa-download text-white"></i></div>
                <div class="hero-text">
                    <h1 data-i18n="install_our_app"></h1>
                    <p data-i18n="get_the_best_experience"></p>
                    <div class="hero-accent"></div>
                </div>
            </div>
        </div>
        <div class="install-container">
            <div class="install-card">
                <div class="p-4">
                    <div id="installStatus"></div>
                    <div id="featuresSection" class="mb-4">
                        <h5 class="mb-3" data-i18n="why_install"></h5>
                        <div class="feature-item">
                            <i class="fa-solid fa-bolt-lightning"></i>
                            <span data-i18n="download_line1"></span>
                        </div>
                        <div class="feature-item">
                            <i class="fa-brands fa-intercom"></i>
                            <span data-i18n="download_line2"></span>
                        </div>
                        <div class="feature-item">
                            <i class="fa-solid fa-bell"></i>
                            <span data-i18n="download_line3"></span>
                        </div>
                        <div class="feature-item">
                            <i class="fa-solid fa-download"></i>
                            <span data-i18n="download_line4"></span>
                        </div>
                    </div>
                    <div id="instructions"></div>
                    <div id="installButtonContainer" class="text-center mt-4"></div>
                    <div id="additionalInfo" class="mt-4"></div>
                </div>
            </div>
        </div>
    </div>
</div>
<script src="<?=BASE_URL?>/public/js/user/sky.js?v=<?=time();?>"></script>
<script src="<?=BASE_URL?>/public/js/user/download.js?v=<?=time();?>" defer></script>