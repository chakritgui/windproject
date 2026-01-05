const pageLength = 50;
const lengthMenu = [[50, 100, 250, 500, 1000, -1], [50, 100, 250, 500, 1000, "All"]];
let currentLang = sessionStorage.getItem('lang') || 'en';
let langData = {};
let website = { en: '', lo: '', th: '' };
let logo, icon, footer;
const langInfo = {
    lo: { flag: 'la', label: 'LO', full: 'ລາວ' },
    en: { flag: 'gb', label: 'EN', full: 'English' },
    th: { flag: 'th', label: 'TH', full: 'ไทย' }
};
$(document).ready(initApp);
async function initApp() {
    await loadSetting();
    await loadNotification();
    bindSidebar();
    bindNotification();
    initAutoLanguageObserver();
}
async function loadSetting() {
    try {
        const res = await $.ajax({
            url: 'api/setting/get',
            method: 'POST',
            dataType: 'json'
        });
        if (!res.status) {
            showError('Error', langData['cannot_load']);
            return;
        }
        res.data.forEach(handleSettingItem);
    } catch (err) {
        console.error(err);
    }
}
async function loadNotification() {
    try {
        const res = await $.ajax({
            url: 'api/notification/load',
            method: 'POST',
            dataType: 'json'
        });
        if (!res.status) {
            showError('Error', langData['cannot_load']);
            return;
        }
        res.data.forEach(handleSettingItem);
    } catch (err) {
        console.error(err);
    }
}
function handleSettingItem(item) {
    switch (item.setting_type) {
        case 'logo':
            logo = `${BASE_URL}/${item.setting_value || 'public/images/logo.png'}`;
            $('img.logo-full').attr('src', logo);
            $('img.logo').attr('src', logo);
            break;
        case 'icon':
            icon = `${BASE_URL}/${item.setting_value || 'public/images/icon.png'}`;
            $('img.logo-small').attr('src', icon);
            $('link[rel="icon"]').attr('href', icon);
            break;
        case 'website_en':
            website.en = item.setting_value;
            break;
        case 'website_lo':
            website.lo = item.setting_value;
            break;
        case 'website_th':
            website.th = item.setting_value;
            break;
        case 'footer':
            footer = item.setting_value || 'Copyright © 2025 iWind Corporation Limited';
            $('.footer').html(footer);
            break;
        case 'language':
            initLanguage(item.setting_value || 'en');
            break;
    }
}
async function initLanguage(languagesStr) {
    const langs = languagesStr.split(',').map(s => s.trim());
    currentLang = sessionStorage.getItem('lang') || langs[0];
    buildLanguageMenu(langs);
    await loadLang(currentLang);
}
function buildLanguageMenu(langs) {
    const menu = $('#languageMenu').empty();
    langs.forEach(lang => {
        if (!langInfo[lang]) return;
        const item = $(`
            <li>
                <a class="dropdown-item" data-value="${lang}">
                    <img src="${BASE_URL}/public/flags/${langInfo[lang].flag}.png" width="20" class="me-2">
                    ${langInfo[lang].full}
                </a>
            </li>
        `);
        item.on('click', async function () {
            changeLanguage(lang);
        });
        menu.append(item);
    });
}
async function changeLanguage(lang) {
    currentLang = lang;
    sessionStorage.setItem('lang', lang);
    await loadLang(lang);
    refreshAllTables();
}
async function loadLang(lang) {
    try {
        const res = await fetch(`${BASE_URL}/public/lang/${lang}.json?v=${Date.now()}`);
        if (!res.ok) throw new Error('Language file missing');
        langData = await res.json();
        applyLanguage(lang);
    } catch (e) {
        console.error(e);
    }
}
function applyLanguage(lang, root = document) {
    updateText(root);
    if (root === document) {
        updateDropdownLabel(lang);
        if (website[lang]) {
            document.title = website[lang];
        }
    }
}
function updateText(root = document) {
    $(root).find('[data-i18n]').each(function () {
        const key = $(this).data('i18n');
        if (langData[key]) $(this).text(langData[key]);
    });
}
function initAutoLanguageObserver() {
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1 && langData && node.querySelector?.('[data-i18n]')) {
                    applyLanguage(currentLang, node);
                }
            });
        });
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}
function updateDropdownLabel(lang) {
    const info = langInfo[lang] || langInfo.en;
    $('.dropdown-language .dropdown-toggle').html(`
        <img src="${BASE_URL}/public/flags/${info.flag}.png" width="20" class="me-1">
        ${info.label}
    `);
}
function refreshAllTables() {
    $('.dataTable').each(function () {
        const id = this.id;
        if (id === 'tb_member') initMemberTable();
        if (id === 'tb_document') initDocumentTable();
        if (id === 'tb_notification') initNotificationTable();
    });
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
function showSuccess(msg, confirm = true) {
    Swal.fire({
        icon: 'success',
        title: langData.success || 'Success',
        text: msg,
        showConfirmButton: confirm,
        confirmButtonText: langData.ok || 'OK'
    });
}
function showError(title, msg, confirm = true) {
    Swal.fire({
        icon: 'error',
        title,
        text: msg,
        showConfirmButton: confirm,
        confirmButtonText: langData.ok || 'OK'
    });
}
function showConfirm(title, msg, yes, no) {
    Swal.fire({
        icon: 'warning',
        title,
        text: msg,
        showCancelButton: true,
        confirmButtonText: langData.yes || 'Yes',
        cancelButtonText: langData.no || 'No'
    }).then(r => {
        if (r.isConfirmed && yes) yes();
        if (!r.isConfirmed && no) no();
    });
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
    $('.notification-item').on('click', function (e) {
        e.preventDefault();
        $(this).removeClass('unread').find('.badge').remove();
        updateNotificationCount();
    });
    $('#markAllRead').on('click', function (e) {
        e.preventDefault();
        $('.notification-item').removeClass('unread').find('.badge').remove();
        $('#notificationCount').hide().text('0');
    });
}
function updateNotificationCount() {
    const count = $('.notification-item.unread').length;
    $('#notificationCount').toggle(count > 0).text(count);
}
function showPageLoader() {
    $('#pageLoader').removeClass('d-none');
}
function hidePageLoader() {
    $('#pageLoader').addClass('d-none');
}
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
$(document).on('shown.bs.modal', '.modal', function () {
    applyLanguage(currentLang, this);
});