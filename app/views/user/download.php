<link rel="stylesheet" href="<?=BASE_URL?>/public/css/download.css?v=<?=time();?>">
<div class="container py-5 mt-5">
    <div class="install-container">
        <div class="install-card">
            <div class="text-center p-4 bg-light">
                <div class="app-icon">
                    <i class="fa-solid fa-download"></i>
                </div>
                <h2 class="mt-3 mb-2" data-i18n="install_our_app"></h2>
                <p class="text-muted mb-3" data-i18n="get_the_best_experience"></p>
                <div id="deviceBadge"></div>
            </div>
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
<script src="<?=BASE_URL?>/public/js/user/download.js?v=<?=time();?>" defer></script>