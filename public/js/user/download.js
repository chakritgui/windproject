let deferredPrompt;
let isInstalled = false;
if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
    isInstalled = true;
}
const userAgent = navigator.userAgent.toLowerCase();
const isAndroid = /android/.test(userAgent);
const isIOS = () => {
    return /ipad|iphone|ipod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};
const isChrome = /chrome/.test(userAgent) && !/edg/.test(userAgent);
const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
const isEdge = /edg/.test(userAgent);
const isFirefox = /firefox/.test(userAgent);
const isOpera = /opr/.test(userAgent);
const isDesktop = !isAndroid && !isIOS();
async function initDownloadPage() {
    if ('getInstalledRelatedApps' in navigator) {
        try {
            const relatedApps = await navigator.getInstalledRelatedApps();
            if (relatedApps.length > 0) isInstalled = true;
        } catch (e) {
            console.log("Check related apps failed:", e);
        }
    }
    const supportStatus = checkSupport();
    displayDeviceBadge();
    displayInstructions(supportStatus);
    displayInstallButton(supportStatus);
    if (supportStatus === 'android' || supportStatus === 'desktop') {
        startPreparingTimeout();
    }
    if (supportStatus === 'ios') {
        $('#additionalInfo').html(`
            <div class="alert alert-light alert-custom border shadow-sm">
                <small class="text-muted">
                    <i class="fa-solid fa-lightbulb text-warning me-2"></i>
                    <strong data-i18n="tip:">Tip:</strong> <span data-i18n="download_line40">Adding to Home Screen provides a full-screen app experience.</span>
                </small>
            </div>
        `);
    }
    if (typeof updateText === 'function') updateText();
}
function checkSupport() {
    if (isInstalled) return 'installed';
    if (isAndroid && (isChrome || isEdge || isFirefox || isOpera)) return 'android';
    if (isIOS() && isSafari) return 'ios';
    if (isDesktop && (isChrome || isEdge || isOpera)) return 'desktop';
    return 'unsupported';
}
function displayDeviceBadge() {
    let badge = '';
    const container = $('#deviceBadge');
    if (isInstalled) {
        badge = `<span class="device-badge badge-success"><i class="fa-solid fa-circle-check me-2"></i><span data-i18n="download_line5">Installed</span></span>`;
    } else if (isAndroid) {
        badge = `<span class="device-badge badge-android"><i class="fa-brands fa-android me-2"></i><span data-i18n="download_line6">Android Device</span></span>`;
    } else if (isIOS()) {
        badge = `<span class="device-badge badge-ios"><i class="fa-brands fa-apple me-2"></i><span data-i18n="download_line7">iOS Device</span></span>`;
    } else {
        badge = `<span class="device-badge badge-desktop"><i class="fa-solid fa-laptop me-2"></i><span data-i18n="download_line8">Desktop / PC</span></span>`;
    }
    container.html(badge);
}
function displayInstructions(deviceType) {
    let html = '';
    const section = $('#featuresSection');
    switch(deviceType) {
        case 'installed':
            html = `
                <div class="already-installed text-center p-4">
                    <i class="fa-solid fa-circle-check text-success mb-3" style="font-size: 60px;"></i>
                    <h4 class="fw-bold" data-i18n="download_line9">App Installed</h4>
                    <p class="text-muted" data-i18n="download_line10">You're all set! Open the app from your home screen or use the button below.</p>
                </div>`;
            section.hide();
            break;
        case 'android':
            html = generateStepHTML('android');
            section.show();
            break;
        case 'ios':
            html = generateStepHTML('ios');
            section.show();
            break;
        case 'desktop':
            html = generateStepHTML('desktop');
            section.show();
            break;
        default:
            html = `
                <div class="alert alert-danger alert-custom mb-3">
                    <h6 class="fw-bold"><i class="fa-solid fa-triangle-exclamation me-2"></i><span data-i18n="download_line31">Not Supported</span></h6>
                    <p class="small mb-0" data-i18n="download_line32">Your browser doesn't support direct installation. Please use Chrome on Android or Safari on iOS.</p>
                </div>`;
            section.hide();
    }
    $('#instructions').html(html);
}
function generateStepHTML(type) {
    let steps = '';
    const header = `<h5 class="mb-4 fw-bold"><i class="fa-solid fa-circle-info text-blue me-2"></i><span data-i18n="download_line11">How to install</span></h5>`;
    if (type === 'android') {
        steps = `
            ${renderStep(1, 'download_line12', 'download_line13')}
            ${renderStep(2, 'download_line14', 'download_line15')}
            ${renderStep(3, 'download_line16', 'download_line17')}`;
    } else if (type === 'ios') {
        steps = `
            ${renderStep(1, 'download_line18', '', `Click the <strong>Share</strong> button <i class="fa-solid fa-arrow-up-from-bracket mx-1 text-blue"></i> in the browser bar.`)}
            ${renderStep(2, 'download_line21', 'download_line22')}
            ${renderStep(3, 'download_line23', 'download_line24')}`;
    } else if (type === 'desktop') {
        steps = `
            ${renderStep(1, 'download_line25', 'download_line26')}
            ${renderStep(2, 'download_line27', 'download_line28')}
            ${renderStep(3, 'download_line29', 'download_line30')}`;
    }
    return header + steps;
}
function renderStep(num, titleKey, descKey, customDesc = null) {
    return `
        <div class="instruction-step mb-4">
            <div class="d-flex align-items-start">
                <span class="step-number me-3 shadow-sm">${num}</span>
                <div class="flex-grow-1">
                    <h6 class="mb-1 fw-bold" data-i18n="${titleKey}"></h6>
                    <p class="mb-0 small text-muted" ${customDesc ? '' : `data-i18n="${descKey}"`}>${customDesc || ''}</p>
                </div>
            </div>
        </div>`;
}
function displayInstallButton(deviceType) {
    let html = '';
    const container = $('#installButtonContainer');
    if (deviceType === 'installed') {
        html = `<a href="/" class="btn btn-install btn-success shadow"><i class="fa-solid fa-arrow-up-right-from-square me-2"></i><span data-i18n="open_app">Open App</span></a>`;
    } else if (deviceType === 'android' || deviceType === 'desktop') {
        html = `<button id="installBtn" class="btn btn-install btn-blue shadow" disabled>
                    <i class="fa-solid fa-spinner fa-spin me-2"></i>
                    <span data-i18n="preparing...">Checking Support...</span>
                </button>`;
    } else if (deviceType === 'ios') {
        html = `
            <div class="alert alert-primary alert-custom text-center border-0 shadow-sm mb-0">
                <i class="fa-solid fa-hand-pointer mb-2 fs-4 text-blue"></i>
                <strong data-i18n="download_line34">Manual Install Required</strong><br>
                <small data-i18n="download_line35">Tap Share icon then 'Add to Home Screen'</small>
            </div>`;
    } else {
        html = `<button class="btn btn-install btn-secondary" disabled><i class="fa-solid fa-circle-xmark me-2"></i><span data-i18n="download_line36">Not Available</span></button>`;
    }
    container.html(html);
}
function startPreparingTimeout() {
    setTimeout(() => {
        const $btn = $('#installBtn');
        if ($btn.length && !deferredPrompt && $btn.prop('disabled')) {
            $btn.prop('disabled', false).removeClass('btn-blue').addClass('btn-outline-secondary').html(`<i class="fa-solid fa-circle-check me-2"></i><span data-i18n="check_home">Check your Apps</span>`);
            $btn.off('click').on('click', () => { window.location.href = '/'; });
        }
    }, 4000);
}
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const $btn = $('#installBtn');
    if ($btn.length) {
        $btn.prop('disabled', false).removeClass('btn-outline-secondary').addClass('btn-blue').html(`<i class="fa-solid fa-download me-2 animate__animated animate__bounceIn"></i><span data-i18n="install_app">Install Now</span>`);
        if (typeof updateText === 'function') updateText($btn);
    }
});
$(document).on('click', '#installBtn', async function() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    const statusSelector = $('#installStatus');
    if (outcome === 'accepted') {
        statusSelector.html(`<div class="alert alert-success alert-custom mb-3"><i class="fa-solid fa-circle-check me-2"></i><span data-i18n="download_line37">Installation started!</span></div>`);
        deferredPrompt = null;
        if (typeof updateText === 'function') updateText(statusSelector);
        setTimeout(() => location.reload(), 2500);
    }
});
window.addEventListener('appinstalled', () => {
    isInstalled = true;
    const statusSelector = $('#installStatus');
    statusSelector.html(`<div class="alert alert-success alert-custom mb-3"><i class="fa-solid fa-circle-check me-2"></i><span data-i18n="download_line39">Success! App is now on your device.</span></div>`);
    if (typeof updateText === 'function') updateText(statusSelector);
    setTimeout(() => location.reload(), 2000);
});
$(document).ready(function () {
    initDownloadPage();
});