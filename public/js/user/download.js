let deferredPrompt;
let isInstalled = false;
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
if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
    isInstalled = true;
}
function initDownloadPage() {
    const supportStatus = checkSupport();
    displayDeviceBadge();
    displayInstructions(supportStatus);
    displayInstallButton(supportStatus);
    if (supportStatus === 'ios') {
        $('#additionalInfo').html(`
            <div class="alert alert-light alert-custom">
                <small class="text-muted">
                    <i class="fa-solid fa-lightbulb me-2"></i>
                    <strong data-i18n="tip:"></strong> <span data-i18n="download_line40"></span>
                </small>
            </div>
        `);
    }
    if (typeof updateText === 'function') {
        updateText();
    }
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
    if (isInstalled) {
        badge = '<span class="device-badge badge-android"><i class="fa-solid fa-circle-check me-2"></i><span data-i18n="download_line5"></span></span>';
    } else if (isAndroid) {
        badge = '<span class="device-badge badge-android"><i class="fa-brands fa-android me-2"></i><span data-i18n="download_line6"></span></span>';
    } else if (isIOS()) {
        badge = '<span class="device-badge badge-ios"><i class="fa-brands fa-apple me-2"></i><span data-i18n="download_line7"></span></span>';
    } else {
        badge = '<span class="device-badge badge-desktop"><i class="fa-solid fa-laptop me-2"></i><span data-i18n="download_line8"></span></span>';
    }
    $('#deviceBadge').html(badge);
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
                </div>`;
            $('#featuresSection').hide();
            break;
        case 'android':
            html = generateStepHTML('android');
            break;
        case 'ios':
            html = generateStepHTML('ios');
            break;
        case 'desktop':
            html = generateStepHTML('desktop');
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
                </div>`;
            $('#featuresSection').hide();
            break;
    }
    $('#instructions').html(html);
}
function generateStepHTML(type) {
    let steps = '';
    if (type === 'android') {
        steps = `
            ${renderStep(1, 'download_line12', 'download_line13')}
            ${renderStep(2, 'download_line14', 'download_line15')}
            ${renderStep(3, 'download_line16', 'download_line17')}`;
    } else if (type === 'ios') {
        steps = `
            ${renderStep(1, 'download_line18', '', '<span data-i18n="download_line19"></span> <i class="fa-solid fa-arrow-up-from-bracket"></i> <span data-i18n="download_line20"></span>')}
            ${renderStep(2, 'download_line21', 'download_line22')}
            ${renderStep(3, 'download_line23', 'download_line24')}`;
    } else if (type === 'desktop') {
        steps = `
            ${renderStep(1, 'download_line25', 'download_line26')}
            ${renderStep(2, 'download_line27', 'download_line28')}
            ${renderStep(3, 'download_line29', 'download_line30')}`;
    }
    return `<h5 class="mb-3"><i class="fa-solid fa-circle-info text-primary me-2"></i><span data-i18n="download_line11"></span></h5>${steps}`;
}
function renderStep(num, titleKey, descKey, customDesc = null) {
    const desc = customDesc ? customDesc : `<span data-i18n="${descKey}"></span>`;
    return `
        <div class="instruction-step">
            <div class="d-flex">
                <span class="step-number">${num}</span>
                <div>
                    <strong data-i18n="${titleKey}"></strong>
                    <p class="mb-0 mt-1 small text-muted">${desc}</p>
                </div>
            </div>
        </div>`;
}
function displayInstallButton(deviceType) {
    let html = '';
    if (deviceType === 'installed') {
        html = `<a href="/" class="btn btn-install"><i class="fa-solid fa-arrow-up-right-from-square me-2"></i><span data-i18n="open_app"></span></a>`;
    } else if (deviceType === 'android' || deviceType === 'desktop') {
        html = `<button id="installBtn" class="btn btn-install" disabled><i class="fa-solid fa-download me-2"></i><span data-i18n="preparing..."></span></button>`;
    } else if (deviceType === 'ios') {
        html = `
            <div class="alert alert-info alert-custom">
                <i class="fa-solid fa-circle-info me-2"></i>
                <strong data-i18n="download_line34"></strong><br>
                <small data-i18n="download_line35"></small>
            </div>`;
    } else {
        html = `<button class="btn btn-install" disabled><i class="fa-solid fa-circle-xmark me-2"></i><span data-i18n="download_line36"></span></button>`;
    }
    $('#installButtonContainer').html(html);
}
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const $btn = $('#installBtn');
    if ($btn.length) {
        $btn.prop('disabled', false).html('<i class="fa-solid fa-download me-2"></i><span data-i18n="install_app"></span>');
        if (typeof updateText === 'function') updateText($btn);
    }
});
$(document).on('click', '#installBtn', async function() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    const statusSelector = $('#installStatus');
    if (outcome === 'accepted') {
        statusSelector.html(`<div class="alert alert-success alert-custom mb-3"><i class="fa-solid fa-circle-check me-2"></i><span data-i18n="download_line37"></span></div>`);
        setTimeout(() => location.reload(), 2000);
    } else {
        statusSelector.html(`<div class="alert alert-warning alert-custom mb-3"><i class="fa-solid fa-circle-info me-2"></i><span data-i18n="download_line38"></span></div>`);
    }
    if (typeof updateText === 'function') updateText(statusSelector);
    deferredPrompt = null;
});
window.addEventListener('appinstalled', () => {
    const statusSelector = $('#installStatus');
    statusSelector.html(`<div class="alert alert-success alert-custom mb-3"><i class="fa-solid fa-circle-check me-2"></i><span data-i18n="download_line39"></span></div>`);
    if (typeof updateText === 'function') updateText(statusSelector);
    setTimeout(() => location.reload(), 2000);
});
$(document).ready(function () {
    initDownloadPage();
});