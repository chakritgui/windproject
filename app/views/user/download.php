<style>
    .install-container {
        max-width: 500px;
        margin: 0 auto;
    }
    .install-card {
        background: white;
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        overflow: hidden;
        animation: slideUp 0.5s ease-out;
    }
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    .app-icon {
        width: 100px;
        height: 100px;
        margin: 0 auto;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
    }
    .app-icon i {
        font-size: 50px;
        color: white;
    }
    .device-badge {
        display: inline-block;
        padding: 6px 16px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 600;
    }
    .badge-android {
        background: #3ddc84;
        color: #1a1a1a;
    }
    .badge-ios {
        background: #007aff;
        color: white;
    }
    .badge-desktop {
        background: #0d6efd;
        color: white;
    }
    .badge-unsupported {
        background: #dc3545;
        color: white;
    }
    .instruction-step {
        background: #f8f9fa;
        border-left: 4px solid #667eea;
        padding: 15px;
        margin-bottom: 15px;
        border-radius: 8px;
    }
    .instruction-step .step-number {
        display: inline-flex;
        width: 28px;
        height: 28px;
        background: #667eea;
        color: white;
        border-radius: 50%;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
        margin-right: 12px;
    }
    .btn-install {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        padding: 14px 40px;
        font-size: 18px;
        font-weight: 600;
        border-radius: 12px;
        color: white;
        transition: transform 0.2s, box-shadow 0.2s;
    }
    .btn-install:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
        color: white;
    }
    .btn-install:disabled {
        background: #6c757d;
        cursor: not-allowed;
    }
    .alert-custom {
        border-radius: 12px;
        border: none;
    }
    .feature-item {
        display: flex;
        align-items: center;
        margin-bottom: 12px;
    }
    .feature-item i {
        color: #667eea;
        font-size: 20px;
        margin-right: 12px;
    }
    .already-installed {
        background: #d1e7dd;
        color: #0f5132;
        padding: 20px;
        border-radius: 12px;
        text-align: center;
    }
</style>
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