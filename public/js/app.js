const pageLength = 50;
const lengthMenu = [[50, 100, 250, 500, 1000, -1], [50, 100, 250, 500, 1000, "All"]];
let currentLang = 'en';
let langData = {};
let website = { en: '', lo: '', th: '' };
let logo, icon, footer;
let date_format = 'DD/MM/YYYY';
const langInfo = {
    lo: { flag: 'la', label: 'LO', full: 'ລາວ' },
    en: { flag: 'gb', label: 'EN', full: 'English' },
    th: { flag: 'th', label: 'TH', full: 'ไทย' }
};
const VAPID_PUBLIC_KEY = 'BJyu1v7EXRhdUr1MnfK3sAjxitbj2wxpO5YZlQVbz1abX-fnNQwWU0-RHR791cmfoCg-6H7cuvGBa6ctsERVnho';
$(document).ready(initApp);
async function initApp() {
    try {
        await Promise.all([
            loadSetting(),
            loadLang(currentLang),
            loadNotification(),
            syncTimezone(),
            loadMenu()
        ]);
        bindSidebar();
        bindNotification();
        initAutoLanguageObserver();
        initMeta();
        refreshAllTables();
        if (isPWA() && USER) {
            try {
                await handlePWANotifications(true);
            } catch (error) {
                console.error('PWA Notification Error:', error);
            }
        }
    } catch (error) {
        console.error("Initialization failed:", error);
        showError(langData['process_failed']);
    }
}
async function syncTimezone() {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    try {
        await fetch(`${BASE_URL}/api/timezone.update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ timezone: tz })
        });
    } catch (e) {
        console.warn("Timezone sync failed", e);
    }
}
async function handlePWANotifications(force = false) {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (Notification.permission === 'denied') return;
    if (!force && localStorage.getItem('notification_asked_forever')) return;
    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.getSubscription();
    if (Notification.permission === 'default') {
        showNotificationModal(async () => {
            await requestAndSubscribe(registration);
            if (typeof checkInitialStatus === 'function') checkInitialStatus();
        }, () => {
            localStorage.setItem('notification_asked_forever', 'true');
            const toggle = document.querySelector('#pwaPushToggle');
            if (toggle) toggle.checked = false;
        });
    } else if (Notification.permission === 'granted' && !sub) {
        await requestAndSubscribe(registration);
        if (typeof checkInitialStatus === 'function') checkInitialStatus();
    }
}
async function requestAndSubscribe(registration) {
    try {
        localStorage.setItem('notification_asked_forever', 'true');
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;
        Swal.fire({
            html: `
                <div class="swal-loading-wrap">
                    <div class="swal-spinner"></div>
                    <div class="swal-loading-title">${langData['processing'] || 'Processing...'}</div>
                    <div class="swal-loading-sub">${langData['setting_up_your_notifications'] || 'Setting up your notifications'}</div>
                </div>
            `,
            allowOutsideClick: false,
            showConfirmButton: false,
            customClass: { popup: 'swal-pwa-popup' },
            didOpen: () => {
                injectPWAStyles();
            }
        });
        if (!VAPID_PUBLIC_KEY) throw new Error("VAPID Public Key is missing");
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
        const response = await fetch(`${BASE_URL}/api/push.subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription)
        });
        if (!response.ok) throw new Error("Server failed to save subscription");
        Swal.fire({
            html: `
                <div class="swal-result-wrap">
                    <div class="swal-result-icon success">
                        <i class="fa-solid fa-bell"></i>
                    </div>
                    <div class="swal-result-title">${langData['success'] || 'All set!'}</div>
                    <div class="swal-result-body">${langData['you_will_receive_notifications'] || 'You\'ll now receive push notifications.'}</div>
                </div>
            `,
            timer: 2500, 
            timerProgressBar: true,
            showConfirmButton: false,
            customClass: { popup: 'swal-pwa-popup' }
        });

    } catch (error) {
        console.error("Push Subscription Error:", error);
        Swal.fire({
            html: `
                <div class="swal-result-wrap">
                    <div class="swal-result-icon error">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                    </div>
                    <div class="swal-result-title">${langData['process_failed'] || 'Something went wrong'}</div>
                    <div class="swal-result-body">${error.message}</div>
                </div>
            `,
            showConfirmButton: true,
            confirmButtonText: 'OK',
            customClass: {
                popup: 'swal-pwa-popup',
                confirmButton: 'swal-pwa-btn-confirm'
            },
            buttonsStyling: false
        });
    }
}
async function showNotificationModal(onAllow, onLater) {
    injectPWAStyles();
    const result = await Swal.fire({
        html: `
            <div class="swal-notify-icon-wrap">
                <i class="fa-solid fa-bell"></i>
                <span class="swal-notify-badge"><i class="fa-solid fa-check"></i></span>
            </div>
            <div class="swal-notify-title">${langData['do_you_receive'] || 'Enable Notifications?'}</div>
            <div class="swal-notify-body">${langData['we_will_keep_you'] || 'We\'ll keep you updated with the latest alerts and updates.'}</div>
        `,
        showCancelButton: true,
        reverseButtons: true,
        confirmButtonText: `<i class="fa-solid fa-bell" style="margin-right:6px;"></i>${langData['enable'] || 'Enable'}`,
        cancelButtonText: langData['for_later'] || 'Maybe later',
        customClass: {
            popup:         'swal-pwa-popup',
            actions:       'swal-pwa-actions',
            confirmButton: 'swal-pwa-btn-confirm',
            cancelButton:  'swal-pwa-btn-cancel',
            htmlContainer: 'p-0'
        },
        buttonsStyling: false,
        showClass: {
            popup: 'animate__animated animate__fadeInDown animate__faster'
        },
        hideClass: {
            popup: 'animate__animated animate__fadeOutUp animate__faster'
        }
    });
    if (result.isConfirmed) {
        onAllow();
    } else {
        localStorage.setItem('notification_asked_forever', 'true');
        onLater();
    }
}
function injectPWAStyles() {
    if (document.getElementById('swal-pwa-styles')) return;
    const style = document.createElement('style');
    style.id = 'swal-pwa-styles';
    style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');
        .swal-pwa-popup {
            font-family: 'DM Sans', sans-serif !important;
            border-radius: 22px !important;
            padding: 36px 32px 28px !important;
            box-shadow: 0 24px 64px rgba(0,0,0,0.13) !important;
            border: 1px solid rgba(0,0,0,0.06) !important;
            background: #fff !important;
            max-width: 380px !important;
        }
        .swal-notify-icon-wrap {
            position: relative;
            width: 72px;
            height: 72px;
            border-radius: 50%;
            background: linear-gradient(135deg, #e8f4ff, #cce4ff);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            animation: notifyPulse 2.4s ease-in-out infinite;
        }
        .swal-notify-icon-wrap > i {
            font-size: 28px;
            color: #2d7dd2;
        }
        .swal-notify-badge {
            position: absolute;
            bottom: 2px;
            right: 2px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #2d7dd2;
            border: 2px solid #fff;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .swal-notify-badge i {
            font-size: 9px;
            color: #fff;
        }
        @keyframes notifyPulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(45,125,210,0.18); }
            50%       { box-shadow: 0 0 0 12px rgba(45,125,210,0); }
        }
        .swal-notify-title {
            font-size: 20px;
            font-weight: 600;
            color: #1a1a1a;
            letter-spacing: -0.3px;
            margin-bottom: 8px;
        }
        .swal-notify-body {
            font-size: 14px;
            color: #888;
            line-height: 1.65;
        }
        .swal-pwa-actions {
            margin-top: 28px !important;
            gap: 10px !important;
        }
        .swal-pwa-btn-confirm {
            background: linear-gradient(135deg, #2d7dd2, #1a5fa8) !important;
            color: #fff !important;
            border: none !important;
            border-radius: 12px !important;
            font-family: 'DM Sans', sans-serif !important;
            font-weight: 500 !important;
            font-size: 14px !important;
            padding: 11px 22px !important;
            box-shadow: 0 4px 14px rgba(26,95,168,0.35) !important;
            transition: all 0.2s ease !important;
            cursor: pointer !important;
        }
        .swal-pwa-btn-confirm:hover {
            transform: translateY(-1px) !important;
            box-shadow: 0 6px 18px rgba(26,95,168,0.45) !important;
        }
        .swal-pwa-btn-confirm:active {
            transform: translateY(0) !important;
        }
        .swal-pwa-btn-cancel {
            background: #f5f5f5 !important;
            color: #666 !important;
            border: none !important;
            border-radius: 12px !important;
            font-family: 'DM Sans', sans-serif !important;
            font-weight: 500 !important;
            font-size: 14px !important;
            padding: 11px 22px !important;
            transition: background 0.2s ease !important;
            cursor: pointer !important;
        }
        .swal-pwa-btn-cancel:hover {
            background: #ececec !important;
        }
        .swal-loading-wrap {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            padding: 8px 0;
        }
        .swal-spinner {
            width: 44px;
            height: 44px;
            border: 3px solid #e5eef8;
            border-top-color: #2d7dd2;
            border-radius: 50%;
            animation: spin 0.75s linear infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .swal-loading-title {
            font-size: 16px;
            font-weight: 600;
            color: #1a1a1a;
        }
        .swal-loading-sub {
            font-size: 13px;
            color: #aaa;
            margin-top: -6px;
        }
        .swal-result-wrap {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            padding: 4px 0;
        }
        .swal-result-icon {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 26px;
            margin-bottom: 4px;
        }
        .swal-result-icon.success {
            background: linear-gradient(135deg, #e6faf0, #c6f0d8);
            color: #1e9e57;
            animation: notifyPulse 2s ease-in-out infinite;
        }
        .swal-result-icon.error {
            background: linear-gradient(135deg, #fff0f0, #ffd8d8);
            color: #e03b3b;
        }
        .swal-result-title {
            font-size: 18px;
            font-weight: 600;
            color: #1a1a1a;
        }
        .swal-result-body {
            font-size: 13px;
            color: #999;
            line-height: 1.6;
        }
        .swal2-timer-progress-bar {
            background: rgba(45,125,210,0.45) !important;
        }
    `;
    document.head.appendChild(style);
}
async function unsubscribeUser() {
    if (!document.getElementById('swal-unsubscribe-styles')) {
        const style = document.createElement('style');
        style.id = 'swal-unsubscribe-styles';
        style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');
            .swal-unsubscribe-popup {
                font-family: 'DM Sans', sans-serif !important;
                border-radius: 20px !important;
                padding: 36px 32px 28px !important;
                box-shadow: 0 24px 60px rgba(0,0,0,0.15) !important;
                border: 1px solid rgba(0,0,0,0.06) !important;
                background: #fff !important;
            }
            .swal-unsubscribe-icon-wrap {
                width: 68px;
                height: 68px;
                border-radius: 50%;
                background: linear-gradient(135deg, #fff0f0, #ffe0e0);
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 20px;
                animation: iconPulse 2s ease-in-out infinite;
            }
            .swal-unsubscribe-icon-wrap i {
                font-size: 26px;
                color: #e03b3b;
            }
            @keyframes iconPulse {
                0%, 100% { box-shadow: 0 0 0 0 rgba(224,59,59,0.15); }
                50%       { box-shadow: 0 0 0 10px rgba(224,59,59,0); }
            }
            .swal-unsubscribe-title {
                font-size: 20px !important;
                font-weight: 600 !important;
                color: #1a1a1a !important;
                letter-spacing: -0.3px !important;
                margin-bottom: 8px !important;
            }
            .swal-unsubscribe-body {
                font-size: 14px;
                color: #888;
                line-height: 1.6;
                margin-top: 4px;
            }
            .swal-unsubscribe-actions {
                margin-top: 28px !important;
                gap: 10px !important;
            }
            .swal-unsubscribe-confirm {
                background: linear-gradient(135deg, #e03b3b, #c0392b) !important;
                border-radius: 12px !important;
                font-family: 'DM Sans', sans-serif !important;
                font-weight: 500 !important;
                font-size: 14px !important;
                padding: 11px 24px !important;
                box-shadow: 0 4px 14px rgba(192,57,43,0.35) !important;
                transition: all 0.2s ease !important;
                border: none !important;
            }
            .swal-unsubscribe-confirm:hover {
                transform: translateY(-1px) !important;
                box-shadow: 0 6px 18px rgba(192,57,43,0.45) !important;
            }
            .swal-unsubscribe-confirm:active {
                transform: translateY(0) !important;
            }
            .swal-unsubscribe-cancel {
                border-radius: 12px !important;
                font-family: 'DM Sans', sans-serif !important;
                font-weight: 500 !important;
                font-size: 14px !important;
                padding: 11px 24px !important;
                background: #f5f5f5 !important;
                color: #555 !important;
                border: none !important;
                transition: background 0.2s ease !important;
            }
            .swal-unsubscribe-cancel:hover {
                background: #ebebeb !important;
            }
            .swal-success-popup {
                font-family: 'DM Sans', sans-serif !important;
                border-radius: 20px !important;
                padding: 32px !important;
                box-shadow: 0 24px 60px rgba(0,0,0,0.12) !important;
            }
            .swal-success-title {
                font-size: 18px !important;
                font-weight: 600 !important;
                color: #1a1a1a !important;
            }
            .swal-success-text {
                font-size: 13px !important;
                color: #888 !important;
            }
        `;
        document.head.appendChild(style);
    }
    const result = await Swal.fire({
        html: `
            <div class="swal-unsubscribe-icon-wrap">
                <i class="fa-solid fa-bell-slash"></i>
            </div>
            <div class="swal-unsubscribe-title">${langData['disable_notifications'] || 'Disable Notifications?'}</div>
            <div class="swal-unsubscribe-body">
                ${langData['you_will_stop_receiving_push_notifications'] || 'You will stop receiving push notifications from this website.'}
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: langData['yes'],
        cancelButtonText: langData['cancel'],
        reverseButtons: true,
        customClass: {
            popup:   'swal-unsubscribe-popup',
            actions: 'swal-unsubscribe-actions',
            confirmButton: 'swal-unsubscribe-confirm',
            cancelButton:  'swal-unsubscribe-cancel',
            htmlContainer: 'p-0'
        },
        buttonsStyling: false,
        showClass: {
            popup: 'animate__animated animate__fadeInDown animate__faster'
        },
        hideClass: {
            popup: 'animate__animated animate__fadeOutUp animate__faster'
        }
    });
    if (!result.isConfirmed) return false;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
        await fetch(`${BASE_URL}/api/push.unsubscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: subscription.endpoint })
        });
        await subscription.unsubscribe();
        Swal.fire({
            icon: 'success',
            title: `${langData['notifications_disabled'] || 'Notifications Disabled'}`,
            text: `${langData['you_will_no_longer'] || 'You will no longer receive push notifications.'}`,
            timer: 2500,
            timerProgressBar: true,
            showConfirmButton: false,
            customClass: {
                popup: 'swal-success-popup',
                title: 'swal-success-title',
                htmlContainer: 'swal-success-text'
            }
        });
        return true;
    }
    return false;
}
function isPWA() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
function initMeta() {
    $.post(`${BASE_URL}/api/shortcut.get`).done(res => {
        if (res.status && res.data?.short_name) {
            $('meta[name="apple-mobile-web-app-title"]').attr('content', res.data.short_name);
        }
    }).fail(() => console.error("Failed to load shortcut meta"));
}
async function loadSetting() {
    try {
        const res = await $.ajax({
            url: `${BASE_URL}/api/settings.get`,
            method: 'POST',
            dataType: 'json'
        });
        if (!res.status || !res.data) {
            console.warn("Settings API returned false status");
            return;
        }
        const settingsArray = res.data.settings;
        settingsArray.forEach(handleSettingItem);
        const dbDefault = settingsArray.find(i => i.setting_type === 'language_default')?.setting_value;
        currentLang = res.data.user_lang || sessionStorage.getItem('lang') || dbDefault || 'en';
        sessionStorage.setItem('lang', currentLang);
        await loadLang(currentLang); 
        const forgot_system = res.data.forgot_system;
        if (!forgot_system) {
            $('.forgot-password-section').hide();
            return;
        }
        const isAllDisabled = 
            forgot_system.is_email_link_enabled == 0 && 
            forgot_system.is_admin_contact_enabled == 0 && 
            forgot_system.is_system_request_enabled == 0;
        if (isAllDisabled) {
            $('.forgot-password-link').addClass('d-none');
        } else {
            $('.forgot-password-link').removeClass('d-none');
        }
    } catch (err) {
        console.error("loadSetting Error:", err);
    }
}
function handleSettingItem(item) {
    const val = item.setting_value;
    switch (item.setting_type) {
        case 'logo':
            logo = `${BASE_URL}/${val || 'public/images/logo.png'}`;
            $('img.logo-full, img.logo').attr('src', logo);
            break;
        case 'icon':
            icon = `${BASE_URL}/${val || 'public/images/icon.png'}`;
            $('link[rel="icon"]').attr('href', icon);
            break;
        case 'website_en': website.en = val; break;
        case 'website_lo': website.lo = val; break;
        case 'website_th': website.th = val; break;
        case 'footer':
            footer = val || 'Copyright © iWind Corporation Limited';
            $('.footer-text').html(footer);
            break;
       case 'language':
            let languages = (val && val.trim() !== "") ? val : 'en';
            let langArray = languages.split(',').map(s => s.trim());
            if (typeof buildLanguageMenu === "function") {
                buildLanguageMenu(langArray);
            }
            break;
        case 'language_default':
            if (!currentLang) currentLang = val;
            break;
    }
}
async function loadLang(lang) {
    try {
        const res = await fetch(`${BASE_URL}/public/lang/${lang}.json?v=${Date.now()}`);
        if (!res.ok) throw new Error('Language file missing');
        langData = await res.json();
        applyLanguage(lang);
    } catch (e) {
        console.error("Error loading language file:", e);
    }
}
function applyLanguage(lang, root = document) {
    updateText(root);
    if (root === document) {
        updateDropdownLabel(lang);
        if (website[lang]) document.title = website[lang];
    }
}
function updateText(root = document) {
    $(root).find('[data-i18n]').each(function () {
        const key = $(this).data('i18n');
        if (langData[key]) {
            if ($(this).is('input, textarea')) {
                $(this).attr('placeholder', langData[key]);
            } else {
                $(this).text(langData[key]);
            }
        }
    });
}
function buildLanguageMenu(langs) {
    const menu = $('#languageMenu').empty();
    langs.forEach(lang => {
        const info = langInfo[lang];
        if (!info) return;
        const item = $(`
            <li>
                <a class="dropdown-item" href="javascript:void(0)" data-value="${lang}">
                    <img src="${BASE_URL}/public/flags/${info.flag}.png" width="15" class="me-2" loading="lazy">
                    ${info.full}
                </a>
            </li>
        `);
        item.on('click', () => changeLanguage(lang));
        menu.append(item);
    });
}
async function changeLanguage(lang) {
    if (currentLang === lang) return;
    currentLang = lang;
    sessionStorage.setItem('lang', lang);
    try {
        await $.ajax({
            url: `${BASE_URL}/api/member.lang`,
            method: 'POST',
            data: { language: lang },
            dataType: 'json'
        });
    } catch (err) {
        console.warn("Could not save language to DB (User might not be logged in)", err);
    }
    if (typeof loadLang === 'function') {
        await loadLang(lang);
    }
    if (typeof loadMenu === 'function') {
        await loadMenu();
    }
    if (typeof refreshAllTables === 'function') {
        refreshAllTables();
    }
    if (typeof fetchFolders === 'function') {
        fetchFolders(true);
    }
    $('.dropdown-menu').removeClass('show');
}
function initAutoLanguageObserver() {
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) {
                    if ($(node).attr('data-i18n') || $(node).find('[data-i18n]').length) {
                        applyLanguage(currentLang, node);
                    }
                }
            });
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
}
function updateDropdownLabel(lang) {
    const info = langInfo[lang] || langInfo.en;
    $('.dropdown-language .dropdown-toggle').html(`
        <img src="${BASE_URL}/public/flags/${info.flag}.png" width="15" class="me-1" loading="lazy">
        <span class="d-none d-md-inline">${info.label}</span>
    `);
}
function refreshAllTables() {
    const tableMappings = {
        'tb_member': typeof initMemberTable === 'function' ? initMemberTable : null,
        'tb_document': typeof initDocumentTable === 'function' ? initDocumentTable : null,
        'tb_notification': typeof initNotificationTable === 'function' ? initNotificationTable : null,
        'tb_contract': typeof initContractsTable === 'function' ? initContractsTable : null,
        'tb_installation': typeof initInstallationsTable === 'function' ? initInstallationsTable : null,
        'tb_pole': typeof initPolesTable === 'function' ? initPolesTable : null,
        'tb_project': typeof initProjectsTable === 'function' ? initProjectsTable : null,
        'tb_type': typeof initTypesTable === 'function' ? initTypesTable : null,
        'tb_news': typeof initNewsTable === 'function' ? initNewsTable : null,
        'tb_wind': typeof initWindTable === 'function' ? initWindTable : null,
        'tb_group': typeof initGroupTable === 'function' ? initGroupTable : null,
        'tb_group': typeof initProjectStatusTable === 'function' ? initProjectStatusTable : null,
        'tb_level': typeof initLevelTable === 'function' ? initLevelTable : null,
        'tb_history': typeof initHistoryTable === 'function' ? initHistoryTable : null
    };
    $('.dataTable').each(function () {
        const initFn = tableMappings[this.id];
        if (initFn) initFn();
    });
    if (typeof pages !== 'undefined') {
        if (pages === 'news' || $('#listView').length) {
            newsPage = 1;
            hasMore = true;
            if (typeof initNews === 'function') initNews();
        }
        if (pages === 'viewContent' && typeof initViewContent === 'function') {
            initViewContent();
        }
    }
}
function getTableLang() {
    return {
        search: langData.search || "Search",
        lengthMenu: langData.lengthMenu || "Show _MENU_ entries",
        zeroRecords: langData.zeroRecords || "No matching records found",
        info: langData.info || "Showing _START_ to _END_ of _TOTAL_ entries",
        infoEmpty: langData.infoEmpty || "Showing 0 to 0 of 0 entries",
        infoFiltered: langData.infoFiltered || "(filtered from _MAX_ total entries)",
        paginate: {
            first: langData.first || "First",
            last: langData.last || "Last",
            next: langData.next || "Next",
            previous: langData.previous || "Previous"
        }
    };
}
function bindSidebar() {
    $('#sidebarToggle').on('click', () => toggleSidebar(true));
    $('#sidebarClose, #sidebarOverlay').on('click', () => toggleSidebar(false));
}
function toggleSidebar(open) {
    $('#sidebar').toggleClass('open', open);
    $('#sidebarOverlay').toggleClass('show', open);
}
function bindNotification() {
    $(document).on('click', '.notification-item', function (e) {
        e.preventDefault();
        $(this).removeClass('unread').find('.badge').remove();
        updateNotificationCount();
    });
    $('#markAllRead').on('click', function (e) {
        e.preventDefault();
        $('.notification-item').removeClass('unread').find('.badge').remove();
        updateNotificationCount();
    });
}
function updateNotificationCount() {
    const count = $('.notification-item.unread').length;
    $('#notificationCount').toggle(count > 0).text(count);
}
$(document).on('shown.bs.modal', '.modal', function () {
    applyLanguage(currentLang, this);
});
$(document).on('hide.bs.dropdown', '.dropdown', function (e) {
    if ($(e.clickEvent?.target).closest('.custom-notification-menu').length) {
        e.preventDefault();
    }
});
$(document).on('click', '.btn-close-dropdown', function () {
    const trigger = $(this).closest('.dropdown').find('[data-bs-toggle="dropdown"]')[0];
    const dd = bootstrap.Dropdown.getInstance(trigger);
    if (dd) dd.hide();
});
$('#windModal').on('show.bs.modal', function () {
    $(document).on('hide.bs.dropdown.block-by-modal', '.dropdown', e => e.preventDefault());
}).on('hidden.bs.modal', function () {
    $(document).off('hide.bs.dropdown.block-by-modal');
});
$("input").attr("autocomplete", "off");
window.onload = function() {
    document.body.classList.add('loaded');
};
function renderErrorAlert(type, message) {
    return `<div class="p-5 text-center"><div class="alert alert-${type} shadow-sm rounded-4">${message}</div></div>`;
}
$(document).ready(function () {
    const $container = $(".main-container");
    const backToTopBtn = $("#btn-back-to-top");
    $container.on("scroll", function () {
        if ($(this).scrollTop() > 300) {
            backToTopBtn.fadeIn(300);
        } else {
            backToTopBtn.fadeOut(300);
        }
    });
    backToTopBtn.click(function () {
        $container.animate({ 
            scrollTop: 0 
        }, 600); 
        return false;
    });
});