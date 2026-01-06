const pageLength = 50;
const lengthMenu = [[50, 100, 250, 500, 1000, -1], [50, 100, 250, 500, 1000, "All"]];
let currentLang = sessionStorage.getItem('lang') || 'en';
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
    await loadSetting();
    await loadNotification();
    bindSidebar();
    bindNotification();
    initAutoLanguageObserver();
    initMeta();
}
function initMeta() {
    $.ajax({
        url: 'api/setting/shortcut',
        method: 'POST',
        dataType: 'json',
        success: function(res) {
            if (res.status === true && res.data) {
                const d = res.data;
                if (d.short_name) {
                    $('meta[name="apple-mobile-web-app-title"]').attr('content', d.short_name);
                }
            } else {
                showError('Error', langData['cannot_load']);
            }
        }
    });
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
        if (!res || res.status !== true) {
            showError('Error', langData['cannot_load']);
            return;
        }
        updateUnreadBadge(res.data.unread);
    } catch (err) {
        showError('Error', langData['cannot_load']);
    }
}
$(document).on('shown.bs.dropdown', '.btn-notification', async function () {
    $('.notification-list').empty();
    updateUnreadBadge(0);
    await readNotification();
});
async function readNotification() {
    try {
        const res = await $.ajax({
            url: 'api/notification/read',
            method: 'POST',
            dataType: 'json'
        });
        if (!res || res.status !== true) {
            showError('Error', langData['cannot_load']);
            return;
        }
        notifyPage = 1;
        notifyFinished = false;
        await loadNotificationItem();
    } catch (err) {
        showError('Error', langData['cannot_load']);
    }
}
let notifyPage = 1;
let notifyLoading = false;
let notifyFinished = false;
async function loadNotificationItem() {
    if (notifyLoading || notifyFinished) return;
    notifyLoading = true;
    try {
        const res = await $.ajax({
            url: 'api/notification/load-list',
            method: 'POST',
            data: {
                page: notifyPage,
                limit: 10
            },
            dataType: 'json'
        });
        if (!res || res.status !== true) {
            showError('Error', langData['cannot_load']);
            return;
        }
        const items = res.data.data ?? [];
        handleNotificationItem(items);
        notifyPage++;
    } catch (err) {
        console.error('Notification load error:', err);
        showError('Error', langData['cannot_load']);
    } finally {
        notifyLoading = false;
    }
}
function handleNotificationItem(items) {
    const $list = $('.notification-list');
    $(".show-notification-count").html(items.length);
    $list.empty();
    if (!items || items.length === 0) {
        const emptyHtml = `
            <li class="text-center py-4 text-muted">
                <div class="d-flex flex-column align-items-center">
                    <i class="bi bi-bell-slash fs-2 mb-2"></i>
                    <div data-i18n="no_notification"></div>
                </div>
            </li>
        `;
        $list.append(emptyHtml);
        return;
    }
    items.forEach(item => {
        const isUnread = !item.read_at ? 'unread' : '';
        let title = '';
        switch(currentLang) {
            case 'en':
                title = item.title_en;
                break;
            case 'lo':
                title = item.title_lo || item.title_en;
                break;
            case 'th':
                title = item.title_th || item.title_en;
                break;
        }
        const html = `
            <li>
                <a class="dropdown-item py-3 border-bottom notification-item ${isUnread}" data-id="${item.notifications_item}" data-target="${item.notifications_target}">
                    <div class="d-flex align-items-start">
                        <div class="flex-shrink-0 me-3">
                            <div class="bg-${item.notifications_target == 'project' ? `primary` : `warning`} bg-opacity-10 rounded-circle p-2">
                                <i class="${item.notifications_target == 'project' ? `fa-solid fa-diagram-project` : `fa-solid fa-bell`} fa-2x text-${item.notifications_target == 'project' ? `primary` : `warning`}"></i>
                            </div>
                        </div>
                        <div class="flex-grow-1">
                            <div class="mb-1 fw-semibold">${title}</div>
                            <p class="mb-1 small text-muted" data-i18n="${item.notifications_target}"></p>
                            <small class="text-muted">
                                <i class="bi bi-clock me-1"></i>${item.notification_at}
                            </small>
                        </div>
                        ${!item.read_at ? `<span class="badge bg-danger rounded-pill ms-2" data-i18n="new"></span>` : ''}
                    </div>
                </a>
            </li>
        `;
        $list.append(html);
    });
    $(".notification-item").click(function() {
        let id = $(this).data("id");
        let target = $(this).data("target");
        notificatinInfo(id, 'view', target);
    });
}
function notificatinInfo(id, type, target = 'notifications') {
    $.ajax({
        url: "api/news/get",
        method: "POST",
        data: { id },
        dataType: "json",
        success(res) {
            let $modal = $("#windModal");
            let modal = new bootstrap.Modal($modal[0]);
            $modal.find(".modal-header").html(`
                <button class="btn-close" data-bs-dismiss="modal"></button>
            `);
            if(type == 'preview') {
                $modal.find(".modal-body").html(`
                    <ul class="nav nav-tabs mb-2">
                        <li class="nav-item"><a class="nav-link active" data-bs-toggle="tab" href="#v_en">English</a></li>
                        <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#v_lo">ລາວ</a></li>
                        <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#v_th">ไทย</a></li>
                    </ul>
                    <div class="tab-content p-2">
                        <div class="tab-pane fade show active" id="v_en">
                            <h5>${res.data.title?.en ?? ""}</h5>
                            <div>${res.data.content?.en ?? ""}</div>
                        </div>
                        <div class="tab-pane fade" id="v_lo">
                            <h5>${res.data.title?.lo ?? ""}</h5>
                            <div>${res.data.content?.lo ?? ""}</div>
                        </div>
                        <div class="tab-pane fade" id="v_th">
                            <h5>${res.data.title?.th ?? ""}</h5>
                            <div>${res.data.content?.th ?? ""}</div>
                        </div>
                    </div>
                `);
            } else {
                let title = '';
                let content = '';
                switch(currentLang) {
                    case 'en':
                        title = res.data.title?.en;
                        content = res.data.content?.en;
                        break;
                    case 'lo':
                        title = res.data.title?.lo || res.data.title?.en;
                        content = res.data.content?.lo || res.data.content?.en;
                        break;
                    case 'th':
                        title = res.data.title?.th || res.data.title?.en;
                        content = res.data.content?.th || res.data.content?.en;
                        break;
                }
                $modal.find(".modal-body").html(`
                    <h5>${title ?? ""}</h5>
                    <div>${content ?? ""}</div>
                `);
            }
            $modal.find(".modal-footer").html(`
                <button class="btn btn-secondary" data-bs-dismiss="modal" data-i18n="close"></button>
            `);
            $modal.find(".modal-body img").addClass("img-fluid");
            modal.show();
        }
    });
}
$('.notification-list').on('scroll', async function () {
    const el = this;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
        await loadNotificationItem();
    }
});
function updateUnreadBadge(unread) {
    if(unread > 0) {
        if(unread < 100) {
            unread = unread;
        } else {
            unread = '99+';
        }
        $(".notification-badge").removeClass("d-none");
        $("#notificationCount").html(unread);
    } else {
        $(".notification-badge").addClass("d-none");
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
function showWarning(title, msg, confirm = true) {
    Swal.fire({
        icon: 'warning',
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
$(document).on('hide.bs.dropdown', '.dropdown', function (e) {
    if ($(e.clickEvent?.target).closest('.custom-notification-menu').length) {
        e.preventDefault();
    }
});
$(document).on('click', '.btn-close-dropdown', function () {
    const trigger = $(this).closest('.dropdown').find('[data-bs-toggle="dropdown"]')[0];
    const dd = bootstrap.Dropdown.getInstance(trigger);
    dd.hide();
});
$('#windModal').on('show.bs.modal', function () {
    $(document).on('hide.bs.dropdown.block-by-modal', '.dropdown', function (e) {
        e.preventDefault();
    });
});
$('#windModal').on('hidden.bs.modal', function () {
    $(document).off('hide.bs.dropdown.block-by-modal');
});
function initSelect2Remote(selector, apiUrl, extraData = {}) {
    $(selector).select2({
        theme: 'bootstrap-5',
        width: '100%',
        allowClear: true,
        ajax: {
            url: apiUrl,
            type: 'POST',
            dataType: 'json',
            delay: 250,
            data: function (params) {
                return $.extend({
                    searchTerm: params.term,
                    page: params.page || 1,
                    limit: 10
                }, extraData);
            },
            processResults: function (res, params) {
                params.page = params.page || 1;
                const data = res.data || res.status || {};
                const items = data.items || [];
                const total = parseInt(data.total_count || 0);
                return {
                    results: items,
                    pagination: {
                        more: (params.page * 10) < total
                    }
                };
            },
            cache: true
        },
        language: {
            searching: () => langData['searching'] || "Searching...",
            noResults: () => langData['no_results'] || "No results found",
            inputTooShort: () => langData['input_too_short'] || "Please enter more characters"
        },
        placeholder: langData['select_option'] || 'Select an option',
        minimumInputLength: 0
    });
}
function initDateRangePicker(selector, callback) {
    $(selector).daterangepicker({
        opens: 'left',
        autoUpdateInput: false,
        alwaysShowCalendars: true, 
        ranges: {
            [langData['this_week'] || 'This Week']: [moment().startOf('week'), moment().endOf('week')],
            [langData['last_week'] || 'Last Week']: [moment().subtract(1, 'week').startOf('week'), moment().subtract(1, 'week').endOf('week')],
            [langData['this_month'] || 'This Month']: [moment().startOf('month'), moment().endOf('month')],
            [langData['last_month'] || 'Last Month']: [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
            [langData['this_year'] || 'This Year']: [moment().startOf('year'), moment().endOf('year')],
            [langData['last_year'] || 'Last Year']: [moment().subtract(1, 'year').startOf('year'), moment().subtract(1, 'year').endOf('year')]
        },
        locale: {
            format: date_format,
            applyLabel: langData['apply'] || 'Apply',
            cancelLabel: langData['clear'] || 'Clear',
            customRangeLabel: langData['custom_range'] || 'Custom Range'
        }
    });
    $(selector).on('apply.daterangepicker', function(ev, picker) {
        let selectedDate = picker.startDate.format(date_format) + ' - ' + picker.endDate.format(date_format);
        $(this).val(selectedDate);
        if (typeof callback === 'function') {
            callback(selectedDate); 
        }
    });
    $(selector).on('cancel.daterangepicker', function(ev, picker) {
        $(this).val('');
        if (typeof callback === 'function') {
            callback('');
        }
    });
}
function initDatePicker(selector) {
    $(selector).datepicker({
        format: "dd/mm/yyyy",
        autoclose: true,  
        todayHighlight: true,
        orientation: "auto",
        language: "en"
    });
}
$("input").attr("autocomplete", "off");