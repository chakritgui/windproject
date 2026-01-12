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
    $('.dropdown-toggle').on('click', function (e) {
        e.preventDefault();
        const $el = $(this).next('.dropdown-menu');
        $el.toggleClass('show');
        $(this).attr('aria-expanded', $el.hasClass('show'));
        $('.dropdown-menu').not($el).removeClass('show');
        e.stopPropagation();
    });
    $(document).on('click', function (e) {
        if (!$(e.target).closest('.dropdown').length) {
            $('.dropdown-menu').removeClass('show');
        }
    });
}
function initMeta() {
    $.ajax({
        url: `${BASE_URL}/api/setting/shortcut`,
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
            url: `${BASE_URL}/api/setting/get`,
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
            url: `${BASE_URL}/api/notification/load`,
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
$(document).on('click', '.btn-notification', async function (e) {
    $('.notification-list').empty();
    e.preventDefault();
    const $el = $(this).next('.dropdown-menu');
    $el.toggleClass('show');
    $(this).attr('aria-expanded', $el.hasClass('show'));
    $('.dropdown-menu').not($el).removeClass('show');
    e.stopPropagation();
    updateUnreadBadge(0);
    await readNotification();
});
async function readNotification() {
    try {
        const res = await $.ajax({
            url: `${BASE_URL}/api/notification/read`,
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
            url: `${BASE_URL}/api/notification/load-list`,
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
    $('.dropdown-menu').removeClass('show');
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
        icon: 'info',
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
                const items = (data.items || []).map(item => {
                    return {
                        ...item,
                        text: langData[item.id] || item.text
                    };
                });
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
function initDatePicker(selector, minDate = null, maxDate = null) {
    $(selector).datepicker('destroy');
    $(selector).datepicker({
        format: "dd/mm/yyyy",
        autoclose: true,  
        todayHighlight: true,
        orientation: "auto",
        language: "en",
        startDate: minDate,
        endDate: maxDate 
    });
}
$("input").attr("autocomplete", "off");
function getFileIconClass(ext) {
    ext = ext.toLowerCase();
    if (["jpg","jpeg","png","gif","webp","svg"].includes(ext)) return "fa-solid fa-file-image text-info";
    if (["pdf"].includes(ext)) return "fa-solid fa-file-pdf text-danger";
    if (["doc","docx"].includes(ext)) return "fa-solid fa-file-word text-primary";
    if (["xls","xlsx","csv"].includes(ext)) return "fa-solid fa-file-excel text-success";
    if (["ppt","pptx"].includes(ext)) return "fa-solid fa-file-powerpoint text-orange";
    if (["zip","rar","7z"].includes(ext)) return "fa-solid fa-file-zipper text-secondary";
    if (["mp4","mov","avi","mkv"].includes(ext)) return "fa-solid fa-file-video text-purple";
    if (["mp3","wav","ogg"].includes(ext)) return "fa-solid fa-file-audio text-info";
    if (["txt","md","log"].includes(ext)) return "fa-solid fa-file-lines text-muted";
    return "fa-solid fa-file text-muted";
}
function readableSize(bytes) {
    if (bytes === 0) return "0 B";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return (bytes / Math.pow(1024, i)).toFixed(2) + " " + sizes[i];
}
function navigateTo(url, type) {
    if(type == 'self') {
        window.location.href = url;
    } else {
        if (isIOS()) {
            window.location.href = url;
        } else {
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}
function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}
function renderReport(poles_id, type) {
    let errors = [];
    $('.obj-required').each(function () {
        let value = ($(this).val() || '').toString().trim();
        if (!value) {
            $(this).addClass('is-invalid');
            errors.push(this.id);
        } else {
            $(this).removeClass('is-invalid');
        }
    });
    const sensors = [];
    $('.sensor-checkbox input:checked').each(function () {
        sensors.push($(this).attr('id').replace('sensor', ''));
    });
    if (sensors.length === 0) {
        $('.sensor-checkbox').addClass('border-danger');
        errors.push('sensors');
    } else {
        $('.sensor-checkbox').removeClass('border-danger');
    }
    if (errors.length) {
        const message = (sensors.length === 0 && errors.length === 1)
            ? (langData['select_sensor_message'] || 'Please select at least one sensor.')
            : (langData['required_star_message'] || 'Please fill all fields marked with *');
        showWarning(langData['validation_error'] || 'Validation Error', message);
        const el = $('.is-invalid').first()[0];
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }
    const reportData = {
        id: poles_id,
        start: $('#startDate').val(),
        end: $('#endDate').val(),
        h: $('#heightSelect').val(),
        s: sensors.join(',')
    };
    const encodedData = btoa(
        unescape(encodeURIComponent(JSON.stringify(reportData)))
    );
    const reportUrl = `${BASE_URL}/pole/${encodedData}`;
    navigateTo(reportUrl, type);
}
async function openFilterModal(poles_id, startDate = '', endDate = '', height_id = '') {
    const myModal = new bootstrap.Modal(document.getElementById('poleDetailModal'));
    myModal.show();
    $('#poleModalBody').html('<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>');
    try {
        const response = await fetch(`${BASE_URL}/api/pole-details`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                id: poles_id,
                start: startDate,
                end: endDate,
                height: height_id,
            })
        });
        const data = await response.json();
        const html = `
            <div class="header-card">
                <div class="row align-items-center">
                    <div class="col-lg-12">
                        <h5 class="mb-3"><i class="fas fa-broadcast-tower me-3"></i>${data.installations_name} #${data.poles_code}</h5>
                        <div class="mb-1 d-flex flex-wrap align-items-center gap-3">
                            <span><i class="fa-solid fa-diagram-project me2"></i> ${data.project_name}</span>
                            <span><i class="fa-regular fa-calendar me-2"></i> ${data.start_date} - ${data.end_date}</span>
                            <span><i class="fas fa-map-marker-alt me-2"></i> ${data.poles_lat}, ${data.poles_lng}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="filter-card" id="filterCard">
                <div class="filter-toggle" id="filterToggle">
                    <h5 class="mb-0"><i class="fas fa-filter me-2"></i><span data-i18n="filter"></h5>
                </div>
                <div class="filter-content" id="filterContent">
                    <div class="row">
                        <div class="col-md-6 col-lg-4 mb-3">
                            <label class="form-label required">
                                <i class="fas fa-calendar-day me-2"></i><span data-i18n="startDate"></span>
                            </label>
                            <input type="text" class="form-control obj-required" id="startDate" value="${data.min_datetime}">
                        </div>
                        <div class="col-md-6 col-lg-4 mb-3">
                            <label class="form-label required">
                                <i class="fas fa-calendar-day me-2"></i><span data-i18n="endDate"></span>
                            </label>
                            <input type="text" class="form-control obj-required" id="endDate" value="${data.max_datetime}">
                        </div>
                        <div class="col-md-6 col-lg-4 mb-3">
                            <label class="form-label required">
                                <i class="fas fa-arrows-alt-v me-2"></i><span data-i18n="height"></span>
                            </label>
                            <select class="form-select obj-required" id="heightSelect"></select>
                        </div>
                    </div>
                    <div class="row mt-3">
                        <div class="col-12">
                            <label class="form-label required">
                                <i class="fas fa-sensor me-2"></i><span data-i18n="sensor"></span>
                            </label>
                        </div>
                        <div class="col-md-6 col-lg-4">
                            <div class="sensor-checkbox">
                                <input type="checkbox" class="form-check-input me-3" id="sensor1" checked>
                                <label class="form-check-label" for="sensor1">
                                    <i class="fas fa-wind text-primary me-2"></i><span data-i18n="wind_speed"></span> (m/s)
                                </label>
                            </div>
                        </div>
                        <div class="col-md-6 col-lg-4">
                            <div class="sensor-checkbox">
                                <input type="checkbox" class="form-check-input me-3" id="sensor2" checked>
                                <label class="form-check-label" for="sensor2">
                                    <i class="fas fa-compass text-success me-2"></i><span data-i18n="wind_direction"></span> (<span data-i18n="degree"></span>)
                                </label>
                            </div>
                        </div>
                        <div class="col-md-6 col-lg-4">
                            <div class="sensor-checkbox">
                                <input type="checkbox" class="form-check-input me-3" id="sensor3">
                                <label class="form-check-label" for="sensor3">
                                    <i class="fas fa-weight text-info me-2"></i><span data-i18n="air_density"></span> (kg/m³)
                                </label>
                            </div>
                        </div>
                        <div class="col-md-6 col-lg-4">
                            <div class="sensor-checkbox">
                                <input type="checkbox" class="form-check-input me-3" id="sensor4">
                                <label class="form-check-label" for="sensor4">
                                    <i class="fas fa-tachometer-alt text-warning me-2"></i><span data-i18n="surface_pressure"></span> (hPa)
                                </label>
                            </div>
                        </div>
                        <div class="col-md-6 col-lg-4">
                            <div class="sensor-checkbox">
                                <input type="checkbox" class="form-check-input me-3" id="sensor5">
                                <label class="form-check-label" for="sensor5">
                                    <i class="fas fa-tint text-primary me-2"></i><span data-i18n="relative_humidity"></span> (%)
                                </label>
                            </div>
                        </div>
                        <div class="col-md-6 col-lg-4">
                            <div class="sensor-checkbox">
                                <input type="checkbox" class="form-check-input me-3" id="sensor6">
                                <label class="form-check-label" for="sensor6">
                                    <i class="fas fa-temperature-high text-danger me-2"></i><span data-i18n="turbulence_intensity"></span> (°C)
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        $('#poleModalBody').html(html);
        $('#poleModalLabel').text(data.installations_name);
        let minVal = data.min_datetime_val ? new Date(data.min_datetime_val) : null;
        let maxVal = data.max_datetime_val ? new Date(data.max_datetime_val) : null;
        initDatePicker('#startDate', minVal, maxVal);
        initDatePicker('#endDate', minVal, maxVal);
        initSelect2Remote('#heightSelect', 'api/height', { poles_id: poles_id });
        $('.modal-footer').html(`
            <button class="btn btn-primary py-2" onclick="renderReport(${poles_id}, 'default')">
                <i class="fas fa-chart-line me-2"></i><span data-i18n="report"></span>
            </button>
        `);
        if (data.levels_name && data.levels_id) {
            const newOption = new Option(data.levels_name, data.levels_id, true, true);
            $('#heightSelect').append(newOption).trigger('change');
        }
    } catch (err) {
        $('#poleModalBody').html('<div class="alert alert-danger">Cannot load data. Please try again.</div>');
    }
}