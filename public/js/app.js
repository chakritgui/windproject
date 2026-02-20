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
        if (isPWA()) {
            await handlePWANotifications();
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
async function handlePWANotifications() {
    if (Notification.permission === 'denied') return;
    if (sessionStorage.getItem('notification_asked_this_session')) {
        return;
    }
    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.getSubscription();
    if (Notification.permission === 'default') {
        showNotificationModal(async () => {
            await requestAndSubscribe(registration);
        }, () => {
            sessionStorage.setItem('notification_asked_this_session', 'true');
        });
    } else if (Notification.permission === 'granted' && !sub) {
        await requestAndSubscribe(registration);
    }
}
async function requestAndSubscribe(registration) {
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            Swal.fire({
                title: langData['processing'],
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); }
            });
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });
            const response = await fetch(`${BASE_URL}/api/push.subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription)
            });
            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: langData['success'],
                    text: langData['you_will_receive_notifications'],
                    timer: 2000,
                    showConfirmButton: false
                });
            } else {
                throw new Error("Server response failed");
            }
        }
    } catch (error) {
        console.error("Push Subscription Error:", error);
        showError(langData['process_failed']);
    }
}
async function showNotificationModal(onAllow, onLater) {
    const result = await Swal.fire({
        title: langData['do_you_receive'],
        text: langData['we_will_keep_you'],
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#aaa',
        confirmButtonText: langData['okay'],
        cancelButtonText: langData['for_later'],
        reverseButtons: true
    });
    if (result.isConfirmed) {
        onAllow();
    } else {
        onLater();
    }
}
async function unsubscribeUser() {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
        await fetch(`${BASE_URL}/api/push.unsubscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: subscription.endpoint })
        });
        await subscription.unsubscribe();
        showSuccess(langData['saved_successfully']);
    }
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
                    <img src="${BASE_URL}/public/flags/${info.flag}.png" width="15" class="me-2">
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
        <img src="${BASE_URL}/public/flags/${info.flag}.png" width="15" class="me-1">
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