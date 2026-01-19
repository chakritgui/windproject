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
<script>
    $(document).ready(function() {
        let deferredPrompt;
        let isInstalled = false;
        const userAgent = navigator.userAgent.toLowerCase();
        const isAndroid = /android/.test(userAgent);
        const isIOS = /iphone|ipad|ipod/.test(userAgent);
        const isChrome = /chrome/.test(userAgent) && !/edg/.test(userAgent);
        const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
        const isEdge = /edg/.test(userAgent);
        const isFirefox = /firefox/.test(userAgent);
        const isOpera = /opr/.test(userAgent);
        const isDesktop = !isAndroid && !isIOS;
        if (window.matchMedia('(display-mode: standalone)').matches || 
            window.navigator.standalone === true) {
            isInstalled = true;
        }
        function displayDeviceBadge() {
            let badge = '';
            if (isInstalled) {
                badge = '<span class="device-badge badge-android"><i class="fa-solid fa-circle-check me-2"></i><span data-i18n="download_line5"></span></span>';
            } else if (isAndroid) {
                badge = '<span class="device-badge badge-android"><i class="fa-brands fa-android me-2"></i><span data-i18n="download_line6"></span></span></span>';
            } else if (isIOS) {
                badge = '<span class="device-badge badge-ios"><i class="fa-brands fa-apple me-2"></i><span data-i18n="download_line7"></span></span></span>';
            } else {
                badge = '<span class="device-badge badge-desktop"><i class="fa-solid fa-laptop me-2"></i><span data-i18n="download_line8"></span></span>';
            }
            $('#deviceBadge').html(badge);
        }
        function checkSupport() {
            if (isInstalled) {
                return 'installed';
            }
            if (isAndroid && (isChrome || isEdge || isFirefox || isOpera)) {
                return 'android';
            }
            if (isIOS && isSafari) {
                return 'ios';
            }
            if (isDesktop && (isChrome || isEdge || isOpera)) {
                return 'desktop';
            }
            return 'unsupported';
        }
        function displayInstructions(deviceType) {
            let html = '';
            switch(deviceType) {
                case 'installed':
                    html = `
                        <div class="already-installed">
                            <i class="fa-solid fa-circle-check me-2" style="font-size: 48px;"></i>
                            <h4 class="mt-3" data-i18n="download_line9"></h4>
                            <p class="mb-0" data-i18n="download_line10"></p>
                        </div>
                    `;
                    $('#featuresSection').hide();
                    break;
                case 'android':
                    html = `
                        <h5 class="mb-3"><i class="fa-solid fa-circle-info text-primary me-2"></i><span data-i18n="download_line11"></span></h5>
                        <div class="instruction-step">
                            <div class="d-flex">
                                <span class="step-number">1</span>
                                <div>
                                    <strong data-i18n="download_line12"></strong>
                                    <p class="mb-0 mt-1 small text-muted" data-i18n="download_line13"></p>
                                </div>
                            </div>
                        </div>
                        <div class="instruction-step">
                            <div class="d-flex">
                                <span class="step-number">2</span>
                                <div>
                                    <strong data-i18n="download_line14"></strong>
                                    <p class="mb-0 mt-1 small text-muted" data-i18n="download_line15"></p>
                                </div>
                            </div>
                        </div>
                        <div class="instruction-step">
                            <div class="d-flex">
                                <span class="step-number">3</span>
                                <div>
                                    <strong data-i18n="download_line16"></strong>
                                    <p class="mb-0 mt-1 small text-muted" data-i18n="download_line17"></p>
                                </div>
                            </div>
                        </div>
                    `;
                    break;
                case 'ios':
                    html = `
                        <h5 class="mb-3"><i class="fa-solid fa-circle-info text-primary me-2"></i><span data-i18n="download_line11"></span></h5>
                        <div class="instruction-step">
                            <div class="d-flex">
                                <span class="step-number">1</span>
                                <div>
                                    <strong data-i18n="download_line18"></strong>
                                    <p class="mb-0 mt-1 small text-muted"><span data-i18n="download_line19"></span> <i class="fa-solid fa-arrow-up-from-bracket"></i> <span data-i18n="download_line20"></span></p>
                                </div>
                            </div>
                        </div>
                        <div class="instruction-step">
                            <div class="d-flex">
                                <span class="step-number">2</span>
                                <div>
                                    <strong data-i18n="download_line21"></strong>
                                    <p class="mb-0 mt-1 small text-muted" data-i18n="download_line22"></p>
                                </div>
                            </div>
                        </div>
                        <div class="instruction-step">
                            <div class="d-flex">
                                <span class="step-number">3</span>
                                <div>
                                    <strong data-i18n="download_line23"></strong>
                                    <p class="mb-0 mt-1 small text-muted" data-i18n="download_line24"></p>
                                </div>
                            </div>
                        </div>
                    `;
                    break;
                case 'desktop':
                    html = `
                        <h5 class="mb-3"><i class="fa-solid fa-circle-info text-primary me-2"></i><span data-i18n="download_line11"></span></h5>
                        <div class="instruction-step">
                            <div class="d-flex">
                                <span class="step-number">1</span>
                                <div>
                                    <strong data-i18n="download_line25"></strong>
                                    <p class="mb-0 mt-1 small text-muted" data-i18n="download_line26"></p>
                                </div>
                            </div>
                        </div>
                        <div class="instruction-step">
                            <div class="d-flex">
                                <span class="step-number">2</span>
                                <div>
                                    <strong data-i18n="download_line27"></strong>
                                    <p class="mb-0 mt-1 small text-muted" data-i18n="download_line28"></p>
                                </div>
                            </div>
                        </div>
                        <div class="instruction-step">
                            <div class="d-flex">
                                <span class="step-number">3</span>
                                <div>
                                    <strong data-i18n="download_line29"></strong>
                                    <p class="mb-0 mt-1 small text-muted" data-i18n="download_line30"></p>
                                </div>
                            </div>
                        </div>
                    `;
                    break;
                case 'unsupported':
                    html = `
                        <div class="alert alert-danger alert-custom">
                            <div class="d-flex align-items-center">
                                <i class="fa-solid fa-triangle-exclamation" style="font-size: 24px; margin-right: 12px;"></i>
                                <div>
                                    <h6 class="mb-1" data-i18n="download_line31"></h6>
                                    <p class="mb-0 small" data-i18n="download_line32"></p>
                                </div>
                            </div>
                        </div>
                        <div class="mt-3">
                            <h6 data-i18n="download_line33"></h6>
                            <ul class="small">
                                <li><strong>Android:</strong> Chrome, Edge, Firefox, Opera</li>
                                <li><strong>iOS:</strong> Safari (use the share button method)</li>
                                <li><strong>Desktop:</strong> Chrome, Edge, Opera</li>
                            </ul>
                        </div>
                    `;
                    $('#featuresSection').hide();
                    break;
            }
            $('#instructions').html(html);
        }
        function displayInstallButton(deviceType) {
            let html = '';
            if (deviceType === 'installed') {
                html = `
                    <a href="/" class="btn btn-install">
                        <i class="fa-solid fa-arrow-up-right-from-square me-2"></i><span data-i18n="open_app"></span>
                    </a>
                `;
            } else if (deviceType === 'android' || deviceType === 'desktop') {
                html = `
                    <button id="installBtn" class="btn btn-install" disabled>
                        <i class="fa-solid fa-download me-2"></i><span data-i18n="preparing..."></span>
                    </button>
                `;
            } else if (deviceType === 'ios') {
                html = `
                    <div class="alert alert-info alert-custom">
                        <i class="fa-solid fa-circle-info me-2"></i>
                        <strong data-i18n="download_line34"></strong><br>
                        <small data-i18n="download_line35"></small>
                    </div>
                `;
            } else {
                html = `
                    <button class="btn btn-install" disabled>
                        <i class="bfa-solid fa-circle-xmark me-2"></i><span data-i18n="download_line36"></span>
                    </button>
                `;
            }
            $('#installButtonContainer').html(html);
        }
        const supportStatus = checkSupport();
        displayDeviceBadge();
        displayInstructions(supportStatus);
        displayInstallButton(supportStatus);
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            $('#installBtn').prop('disabled', false).html('<i class="fa-solid fa-download me-2"></i><span data-i18n="install_app"></span>');
        });
        $(document).on('click', '#installBtn', async function() {
            if (!deferredPrompt) {
                return;
            }
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                $('#installStatus').html(`
                    <div class="alert alert-success alert-custom mb-3">
                        <i class="fa-solid fa-circle-check me-2"></i>
                        <span data-i18n="download_line37"></span>
                    </div>
                `);
                setTimeout(() => {
                    location.reload();
                }, 2000);
            } else {
                $('#installStatus').html(`
                    <div class="alert alert-warning alert-custom mb-3">
                        <i class="fa-solid fa-circle-info me-2"></i>
                        <span data-i18n="download_line38"></span>
                    </div>
                `);
            }
            deferredPrompt = null;
        });
        window.addEventListener('appinstalled', () => {
            $('#installStatus').html(`
                <div class="alert alert-success alert-custom mb-3">
                    <i class="fa-solid fa-circle-check me-2"></i>
                    <span data-i18n="download_line39"></span>
                </div>
            `);
            setTimeout(() => {
                location.reload();
            }, 2000);
        });
        if (supportStatus === 'ios') {
            $('#additionalInfo').html(`
                <div class="alert alert-light alert-custom">
                    <small class="text-muted">
                        <i class="fa-solid fa-lightbulb me-2"></i>
                        <strong data-i18n="tip:">Tip:</strong> <span data-i18n="download_line40"></span>
                    </small>
                </div>
            `);
        }
    });
</script>