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
$(document).ready(initApp);
async function initApp() {
    try {
        await loadSetting();
        await loadLang(currentLang);
        await loadNotification();
        bindSidebar();
        bindNotification();
        initAutoLanguageObserver();
        initMeta();
        refreshAllTables();
    } catch (error) {
        console.error("Initialization failed:", error);
    }
}
function initMeta() {
    $.post(`${BASE_URL}/api/setting/shortcut`).done(res => {
        if (res.status && res.data?.short_name) {
            $('meta[name="apple-mobile-web-app-title"]').attr('content', res.data.short_name);
        }
    }).fail(() => console.error("Failed to load shortcut meta"));
}
async function loadSetting() {
    try {
        const res = await $.ajax({
            url: `${BASE_URL}/api/setting/get`,
            method: 'POST',
            dataType: 'json'
        });
        if (!res.status || !res.data) {
            console.warn("Settings API returned false status");
            return;
        }
        res.data.forEach(handleSettingItem);
        const dbDefault = res.data.find(i => i.setting_type === 'language_default')?.setting_value;
        currentLang = sessionStorage.getItem('lang') || dbDefault || 'en';
        await loadLang(currentLang); 
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
            $('img.logo-small').attr('src', icon);
            $('link[rel="icon"]').attr('href', icon);
            break;
        case 'website_en': website.en = val; break;
        case 'website_lo': website.lo = val; break;
        case 'website_th': website.th = val; break;
        case 'footer':
            footer = val || 'Copyright © 2025 iWind Corporation Limited';
            $('.footer').html(footer);
            break;
        case 'language':
            if (val) buildLanguageMenu(val.split(',').map(s => s.trim()));
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
    await loadLang(lang);
    refreshAllTables();
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
        ${info.label}
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
        'tb_wind': typeof initWindTable === 'function' ? initWindTable : null
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