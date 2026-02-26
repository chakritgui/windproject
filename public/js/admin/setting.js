const version = new Date().getTime();
const apiPost = (url, data, options = {}) => {
    return $.ajax({
        url: `${BASE_URL}${url}`,
        type: 'POST',
        data,
        dataType: options.dataType || 'json',
        contentType: options.contentType ?? false,
        processData: options.processData ?? false,
        xhr: options.xhr
    });
};
const toggleButton = (selector, disabled) => {
    $(selector).prop('disabled', disabled);
};
const showUploadProgress = () => {
    Swal.fire({
        title: langData['saving'],
        html: `
            <div class="progress mt-2">
                <div id="swal-progress" class="progress-bar" style="width:0%">0%</div>
            </div>
        `,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });
};
const uploadWithProgress = (url, formData, btnSelector) => {
    showUploadProgress();
    toggleButton(btnSelector, true);
    return apiPost(url, formData, {
        xhr: () => {
            const xhr = new XMLHttpRequest();
            xhr.upload.onprogress = e => {
                if (!e.lengthComputable) return;
                const percent = Math.round((e.loaded / e.total) * 100);
                $('#swal-progress').css('width', percent + '%').text(percent + '%');
            };
            return xhr;
        }
    }).always(() => toggleButton(btnSelector, false));
};
$(document).ready(initSetting);
$(document).on('change', '#enableTranslate', function() {
    if ($(this).is(':checked')) {
        $('#googleApiKeyContainer').slideDown();
    } else {
        $('#googleApiKeyContainer').slideUp();
    }
});
function initSetting() {
    const levels = [
        "100m", "950h", "925h", "900h", "850h", "800h", "700h", 
        "600h", "500h", "400h", "300h", "250h", "200h", "150h", "10h"
    ];
    const labels = [
        "100m (330ft)", "950hPa (600m)", "925hPa (750m)", "900hPa (900m)",
        "850hPa (1.5km)", "800hPa (2km)", "700hPa (3km)", "600hPa (4.2km)",
        "500hPa (5.5km)", "400hPa (7km)", "300hPa (9km)", "250hPa (10km)",
        "200hPa (11.7km)", "150hPa (13.5km)", "10hPa (30km)"
    ];
    apiPost(`/api/settings.get`, null).done(res => {
        if (!res.status || !res.data) {
            showError(langData['cannot_load']);
            return;
        }
        const settingsArray = res.data.settings;
        if (Array.isArray(settingsArray)) {
            settingsArray.forEach(applySetting);
        }
        const systemConfigs = res.data.system_configs;
        if (systemConfigs && typeof systemConfigs === 'object') {
            Object.keys(systemConfigs).forEach(key => {
                const value = systemConfigs[key];
                if (key === 'DEFAULT_LEVEL') {
                    const levelIndex = levels.indexOf(value);
                    if (levelIndex !== -1) {
                        $('#heightSlider').val(levelIndex);
                        $('#height-display').text(labels[levelIndex]);
                        $('#actual_level').val(value);
                    }
                }
                const $el = $(`#systemConfigForm [name="${key}"], #notificationSettingForm [name="${key}"]`);
                if ($el.length) {
                    if ($el.is(':checkbox')) {
                        const isChecked = (value == 1 || value == "1" || value === true);
                        $el.prop('checked', isChecked).trigger('change');
                    } else {
                        $el.val(value).trigger('change');
                    }
                }
            });
        }
        const dbDefault = settingsArray.find(i => i.setting_type === 'language_default')?.setting_value;
        const targetLang = res.data.user_lang || sessionStorage.getItem('lang') || dbDefault || 'en';
        if (typeof currentLang !== 'undefined' && currentLang !== targetLang) {
            currentLang = targetLang;
            sessionStorage.setItem('lang', currentLang);
            if (typeof loadLang === 'function') loadLang(currentLang);
        }
        const forgot_system = res.data.forgot_system;
        if (forgot_system && typeof forgot_system === 'object') {
            Object.keys(forgot_system).forEach(key => {
                const value = forgot_system[key];
                const $el = $(`#passwordResetForm [name="${key}"], #passwordResetForm [id="${key}"]`);
                if ($el.length) {
                    if ($el.is(':checkbox')) {
                        const isChecked = (value == 1 || value == "1");
                        $el.prop('checked', isChecked).trigger('change');
                    } else {
                        $el.val(value || '').trigger('change');
                    }
                }
            });
        }
    });
    $('#heightSlider').on('input change', function() {
        const index = $(this).val();
        const selectedValue = levels[index];
        const displayLabel = labels[index];
        $('#height-display').text(displayLabel);
        $('#actual_level').val(selectedValue);
    });
}
const settingHandlers = {
    logo: v => renderImage('logoPreview', v),
    icon: v => renderImage('iconPreview', v),
    login_mobile_bg: v => renderBg('loginMobilePreview', v, 'mobile'),
    login_bg: v => renderBg('loginPreview', v, 'pc'),
    infography: v => renderBg('infographyPreview', v, 'infography'),
    website_en: v => $('#nameEn').val(v),
    website_lo: v => $('#nameLo').val(v),
    website_th: v => $('#nameTh').val(v),
    footer: v => $('#footerText').val(v),
    site_assessment: v => $('#site_assessment').val(v),
    language: v => setLanguagesFromDB(v),
    language_default: v => setLanguagesDefaultFromDB(v),
    language_content: v => setLanguagesContentFromDB(v)
};
function applySetting(item) {
    if (!item.setting_value) return;
    settingHandlers[item.setting_type]?.(item.setting_value);
}
function renderImage(previewId, path) {
    $(`#${previewId}`).html(`
        <img src="${BASE_URL}/${path}?v=${version}" class="preview-img">
    `);
}
function renderBg(previewId, path, type) {
    if (!path) return;
    const extension = path.split('.').pop().toLowerCase();
    const videoExtensions = ['mp4', 'webm', 'ogg'];
    const isVideo = videoExtensions.includes(extension);
    if (isVideo) {
        $(`#${previewId}`).html(`
            <video class="preview-video" controls style="width:100%; height:100%; object-fit:contain;">
                <source src="${path}?v=${version}" type="video/${extension}">
            </video>
        `);
    } else {
        $(`#${previewId}`).html(`<img src="${path}?v=${version}" class="preview-img" style="width:100%; height:100%; object-fit:contain;">`);
    }
    $(`.btn-remove-${type}`).removeClass('d-none');
    const hiddenInputId = type === 'infography' ? '#oldinfographyBg' : (type === 'mobile' ? '#oldLoginMobileBg' : '#oldLoginBg');
    $(hiddenInputId).val(path);
}
function previewImage(input, previewId, type) {
    const file = input.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) {
        showError(langData['allow_images_and_videos_only']);
        input.value = '';
        return;
    }
    const reader = new FileReader();
    reader.onload = e => {
        let previewHtml = '';
        if (isImage) {
            previewHtml = `<img src="${e.target.result}" class="preview-img" style="width:100%; height:100%; object-fit:contain;">`;
        } else if (isVideo) {
            previewHtml = `
                <video class="preview-video" controls style="width:100%; height:100%; object-fit:contain;">
                    <source src="${e.target.result}" type="${file.type}">
                    Your browser does not support the video tag.
                </video>`;
        }
        $(`#${previewId}`).html(previewHtml);
        $(`.btn-remove-${type}`).removeClass('d-none');
    };
    reader.readAsDataURL(file);
}
function removeImage(previewId, inputId, type) {
    const hiddenMap = {
        pc: '#oldLoginBg',
        mobile: '#oldLoginMobileBg',
        infography: '#oldinfographyBg'
    };
    $(`#${previewId}`).empty();
    $(`#${inputId}`).val('');
    $(`.btn-remove-${type}`).addClass('d-none');
    if (hiddenMap[type]) {
        $(hiddenMap[type]).val('');
    }
    $(`#${previewId}`).html(getUploadPlaceholder(type));
}

function getUploadPlaceholder(type) {
    const size = type === 'mobile' ? '1080 × 1920px' : '2560 × 1440px';
    return `
        <div class="text-center">
            <i class="fa-solid fa-cloud-arrow-up fs-1 text-muted"></i>
            <p class="mt-2 text-muted"><span>${langData['uploadFile'] || "Upload File"}</span></p>
            <small class="text-muted">
                <span>${langData['image'] || "Image"}</span>
                (<span>${langData['recommend'] || "Recommend"}</span> ${size})
            </small>
        </div>
    `;
}
function setLanguagesFromDB(languagesStr) {
    const langs = languagesStr.split(',');
    $('.lang-toggle').each(function () {
        const lang = this.id.replace('lang', '').toLowerCase();
        const icon = $(this).find('i');
        if (langs.includes(lang)) {
            $(this).addClass('active');
            icon.attr('class', 'fa-solid fa-circle-check fs-4');
        } else {
            $(this).removeClass('active');
            icon.attr('class', 'fa-regular fa-circle fs-4 text-muted');
        }
    });
}
function toggleLanguage(lang) {
    const el = $('#lang' + lang.charAt(0).toUpperCase() + lang.slice(1));
    const isActive = el.hasClass('active');
    const activeCount = $('.lang-toggle.active').length;
    if (isActive && activeCount === 1) {
        showError(langData['one_language']);
        return;
    }
    el.toggleClass('active');
    const nowActive = el.hasClass('active'); 
    el.find('i').attr('class', nowActive ? 'fa-solid fa-circle-check fs-4' : 'fa-regular fa-circle fs-4 text-muted');
    const targetRadios = $(`input[value="${lang.toLowerCase()}"]`);
    if (!nowActive) {
        targetRadios.prop('disabled', true).prop('checked', false);
        ensureAtLeastOneChecked();
    } else {
        targetRadios.prop('disabled', false);
    }
}
function ensureAtLeastOneChecked() {
    ['language_default', 'language_content'].forEach(name => {
        const checkedNum = $(`input[name="${name}"]:checked:not(:disabled)`).length;
        if (checkedNum === 0) {
            $(`input[name="${name}"]:not(:disabled)`).first().prop('checked', true);
        }
    });
}
function setLanguagesDefaultFromDB(defaultValue = 'en') {
    $("input[name='language_default']").each(function() {
        const lang = $(this).val();
        const parentToggle = $('#lang' + lang.charAt(0).toUpperCase() + lang.slice(1));
        const isDisabled = !parentToggle.hasClass('active');
        $(`input[value="${lang}"]`).prop('disabled', isDisabled);
        if (isDisabled) {
            $(`input[value="${lang}"]`).prop('checked', false);
        }
    });
    selectBestAvailable('language_default', defaultValue);
}
function setLanguagesContentFromDB(defaultValue = 'en') {
    $("input[name='language_content']").each(function() {
        const lang = $(this).val();
        const parentToggle = $('#lang' + lang.charAt(0).toUpperCase() + lang.slice(1));
        const isDisabled = !parentToggle.hasClass('active');
        $(`input[value="${lang}"]`).prop('disabled', isDisabled);
        if (isDisabled) {
            $(`input[value="${lang}"]`).prop('checked', false);
        }
    });
    selectBestAvailable('language_content', defaultValue);
}
function selectBestAvailable(name, preferredValue) {
    const preferred = $(`input[name="${name}"][value="${preferredValue.toLowerCase()}"]:not(:disabled)`);
    if (preferred.length) {
        preferred.prop('checked', true);
    } else {
        $(`input[name="${name}"]:not(:disabled)`).first().prop('checked', true);
    }
}
$(document).on('click', '.save-language', function () {
    const langs = $('.lang-toggle.active').map((_, el) => el.id.replace('lang', '').toLowerCase()).get();
    if (!langs.length) {
        showError(langData['one_language']);
        return;
    }
    const fd = new FormData();
    fd.append('languages', langs.join(','));
    fd.append("language_default", $("input[name=language_default]:checked").val() || 'en');
    fd.append("language_content", $("input[name=language_content]:checked").val() || 'en');
    toggleButton('.save-language', true);
    apiPost(`/api/settings.lang`, fd).done(res => {
        res.status ? (showSuccess(langData['saved_successfully']), initSetting()) : showError(langData['cannot_save']);
    }).always(() => toggleButton('.save-language', false));
});
$(document).on('click', '.save-information', function () {
    const fd = new FormData();
    fd.append('nameEn', $('#nameEn').val());
    fd.append('nameLo', $('#nameLo').val());
    fd.append('nameTh', $('#nameTh').val());
    fd.append('footerText', $('#footerText').val());
    fd.append('site_assessment', $('#site_assessment').val());
    fd.append('logoInput', $('#logoInput')[0].files[0] || null);
    fd.append('iconInput', $('#iconInput')[0].files[0] || null);
    uploadWithProgress(`/api/settings.info`, fd, '.save-information').done(res => {
        res.status ? (showSuccess(langData['saved_successfully']), initSetting(), $('#windModal').modal('hide')) : showError(langData['cannot_save']);
    }).fail(() => showError(langData['cannot_save']));
});
$(document).on('click', '.save-background', function () {
    const fd = new FormData();
    fd.append('loginInput', $('#loginInput')[0].files[0] || null);
    fd.append('loginMobileInput', $('#loginMobileInput')[0].files[0] || null);
    fd.append('infographyInput', $('#infographyInput')[0].files[0] || null);
    fd.append('oldLoginBg', $('#oldLoginBg').val());
    fd.append('oldLoginMobileBg', $('#oldLoginMobileBg').val());
    fd.append('oldinfographyBg', $('#oldinfographyBg').val());
    uploadWithProgress(`/api/settings.bg`, fd, '.save-background').done(res => {
        res.status ? (showSuccess(langData['saved_successfully']), initSetting(), $('#windModal').modal('hide')) : showError(langData['cannot_save']);
    }).fail(() => showError(langData['cannot_save']));
});
function toggleVisibility(id) {
    const input = document.getElementById(id);
    const icon = event.currentTarget.querySelector('i');
    if (input.type === "password") {
        input.type = "text";
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = "password";
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}
$(document).on('click', '.save-configuration', function () {
    const fd = new FormData();
    const formId = '#systemConfigForm';
    $(formId).find('input, select, textarea').each(function() {
        const name = $(this).attr('name');
        if (!name) return;
        let value;
        if ($(this).is(':checkbox')) {
            value = $(this).is(':checked') ? 1 : 0;
        } else {
            value = $(this).val();
        }
        fd.append(name, value);
    });
    uploadWithProgress(`/api/settings.config`, fd, '.save-configuration').done(res => {
        if (res.status) {
            showSuccess(langData['saved_successfully']);
            if (typeof initSetting === 'function') initSetting(); 
        } else {
            showError(langData['cannot_save']);
        }
    }).fail(() => showError(langData['cannot_save']));
});
$(document).on('click', '.save-notification', function () {
    const fd = new FormData();
    const formId = '#notificationSettingForm';
    $(formId).find('input').each(function() {
        const name = $(this).attr('name');
        if (!name) return;
        let value;
        if ($(this).is(':checkbox')) {
            value = $(this).is(':checked') ? 1 : 0;
        } else {
            value = $(this).val();
        }
        fd.append(name, value);
    });
    uploadWithProgress(`/api/settings.notification`, fd, '.save-notification').done(res => {
        if (res.status) {
            showSuccess(langData['saved_successfully']);
            if (typeof initSetting === 'function') initSetting(); 
        } else {
            showError(langData['cannot_save']);
        }
    }).fail(() => showError(langData['cannot_save']));
});
$(document).on('click', '.save-passwordreset', function () {
    const fd = new FormData();
    const $form = $('#passwordResetForm');
    $form.find('input').each(function() {
        const name = $(this).attr('name');
        if (name) {
            if ($(this).is(':checkbox')) {
                fd.append(name, $(this).prop('checked') ? 1 : 0);
            } else {
                fd.append(name, $(this).val());
            }
        }
    });
    uploadWithProgress(`/api/settings.password`, fd, '.save-passwordreset').done(res => {
        if (res.status) {
            showSuccess(langData['saved_successfully']);
            initSetting();
        } else {
            showError(langData['cannot_save']);
        }
    }).fail(() => showError(langData['cannot_save']));
});
$(document).on('click', '.get-menus', function () {
    loadMenus();
});
function loadMenus() {
    apiPost(`/api/settings.menu`, null).done(res => {
        if (res.status) {
            renderMenuTable(res.data);
        }
    });
}
function createMenuRow(item, isNew = false) {
    const trans = item.translations || { th: '', en: '', lo: '' };
    const isDefault = item.is_default == 1;
    const isActive = item.is_active == 1;
    const rowId = isNew ? `new_${Date.now()}` : item.id;
    return `
        <tr data-id="${rowId}" class="menu-row ${isNew ? 'is-editing new-record table-info' : ''} ${!isActive ? 'table-light opacity-75' : ''}">
            <td class="sort-handle"><i class="fa-solid fa-grip-vertical text-muted cursor-move"></i></td>
            <td class="text-center">
                <div class="view-mode ${isNew ? 'd-none' : ''}">
                    <i class="${item.icon || 'bi-question-circle'} fs-4"></i>
                </div>
                <div class="edit-mode ${isNew ? '' : 'd-none'}">
                    <div class="dropdown icon-picker-container">
                        <button class="btn btn-sm btn-light border dropdown-toggle w-100" type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                            <i class="${item.icon || 'bi-question-circle'} fs-4 icon-preview"></i>
                            <input type="hidden" class="edit-icon-val" value="${item.icon || 'bi-question-circle'}">
                        </button>
                        <div class="dropdown-menu p-2 shadow" style="width: 250px;">
                            <input type="text" class="form-control form-control-sm mb-2 search-icon" placeholder="">
                            <div class="icon-list-grid d-flex flex-wrap gap-1" style="max-height: 200px; overflow-y: auto;"></div>
                        </div>
                    </div>
                </div>
            </td>
            <td>
                <div class="view-mode ${isNew ? 'd-none' : ''}">
                    <div class="mb-2"><img src="${BASE_URL}/public/flags/gb.png" height="10"> ${trans.en || '-'}</div>
                    <div class="mb-2"><img src="${BASE_URL}/public/flags/th.png" height="10"> ${trans.th || '-'}</div>
                    <div><img src="${BASE_URL}/public/flags/la.png" height="10"> ${trans.lo || '-'}</div>
                </div>
                <div class="edit-mode ${isNew ? '' : 'd-none'}">
                    <label class="form-label mb-2 mt-2 required">
                        <img src="${BASE_URL}/public/flags/gb.png" alt="EN" height="10"> English
                    </label>
                    <input type="text" class="form-control form-control-sm mb-1 edit-en" value="${trans.en || ''}" placeholder="English">
                    <label class="form-label mb-2 mt-2">
                        <img src="${BASE_URL}/public/flags/th.png" alt="EN" height="10"> ภาษาไทย
                    </label>
                    <input type="text" class="form-control form-control-sm mb-1 edit-th" value="${trans.th || ''}" placeholder="ไทย">
                    <label class="form-label mb-2 mt-2">
                        <img src="${BASE_URL}/public/flags/la.png" alt="EN" height="10"> ພາສາລາວ
                    </label>
                    <input type="text" class="form-control form-control-sm edit-lo" value="${trans.lo || ''}" placeholder="ລາວ">
                </div>
            </td>
            <td>
                <div class="view-mode ${isNew ? 'd-none' : ''}">${item.path || ''}</div>
                <div class="edit-mode ${isNew ? '' : 'd-none'}">
                    <label class="form-label required mb-2 mt-2" data-i18n="path"></label>
                    <input type="text" class="form-control form-control-sm edit-path" value="${item.path || ''}" ${isDefault ? 'disabled' : ''} placeholder="/path">
                </div>
            </td>
            <td>
                <div class="view-mode ${isNew ? 'd-none' : ''}">
                    ${isActive 
                        ? '<span class="badge rounded-pill bg-success-subtle text-success border border-success-subtle px-3" data-i18n="active"></span>' 
                        : '<span class="badge rounded-pill bg-secondary-subtle text-secondary border border-secondary-subtle px-3" data-i18n="inactive"></span>'
                    }
                </div>
                <div class="edit-mode ${isNew ? '' : 'd-none'}">
                    <div class="form-check form-switch">
                        <input class="form-check-input toggle-active" type="checkbox" role="switch" ${isActive || isNew ? 'checked' : ''}>
                    </div>
                </div>
            </td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary btn-edit ${isNew ? 'd-none' : ''}"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="btn btn-sm btn-success btn-save-row ${isNew ? '' : 'd-none'}"><i class="fa-solid fa-check"></i></button>
                    <button class="btn btn-sm btn-light border btn-cancel-row ${isNew ? '' : 'd-none'}"><i class="fa-solid fa-xmark"></i></button>
                    ${!isDefault && !isNew ? `<button class="btn btn-sm btn-outline-danger btn-delete-row"><i class="fa-solid fa-trash-can"></i></button>` : ''}
                </div>
            </td>
        </tr>`;
}
const bootstrapIcons = [
    'bi-house', 'bi-house-gear', 'bi-gear', 'bi-wrench-adjustable', 'bi-shield-lock', 'bi-key', 
    'bi-person', 'bi-people', 'bi-person-badge', 'bi-person-gear', 'bi-person-lock',
    'bi-graph-up', 'bi-graph-down', 'bi-pie-chart', 'bi-bar-chart', 'bi-table', 'bi-database',
    'bi-file-earmark-text', 'bi-folder', 'bi-layers', 'bi-collection',
    'bi-envelope', 'bi-chat-dots', 'bi-megaphone', 'bi-bell', 'bi-telephone', 'bi-share',
    'bi-map', 'bi-geo-alt', 'bi-compass', 'bi-flag', 'bi-pin-map',
    'bi-plus-circle', 'bi-dash-circle', 'bi-check-circle', 'bi-exclamation-triangle', 
    'bi-info-circle', 'bi-question-circle', 'bi-search', 'bi-sliders', 'bi-trash', 'bi-pencil',
    'bi-image', 'bi-camera', 'bi-play-circle', 'bi-grid', 'bi-window', 'bi-layout-sidebar',
    'bi-cart', 'bi-credit-card', 'bi-wallet2', 'bi-calendar-event', 'bi-tag', 'bi-hand-index-thumb'
];
function loadIconPicker(container) {
    const listGrid = container.find('.icon-list-grid');
    const currentIcon = container.find('.edit-icon-val').val();
    const html = bootstrapIcons.map(icon => `
        <div class="btn btn-sm btn-outline-secondary select-icon ${currentIcon === icon ? 'active' : ''}" 
             data-icon="${icon}" title="${icon}" 
             style="width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
            <i class="bi ${icon}"></i>
        </div>
    `).join('');
    listGrid.html(html);
}
$(document).on('input', '.search-icon', function(e) {
    e.stopPropagation();
    const val = $(this).val().toLowerCase();
    const container = $(this).closest('.dropdown');
    container.find('.select-icon').each(function() {
        const iconName = $(this).data('icon').toLowerCase();
        $(this).toggle(iconName.includes(val));
    });
});
$(document).on('click', '.select-icon', function(e) {
    e.preventDefault();
    e.stopPropagation();
    const iconClass = $(this).data('icon');
    const container = $(this).closest('.dropdown');
    container.find('.icon-preview').attr('class', `bi ${iconClass} fs-4 icon-preview`);
    container.find('.edit-icon-val').val(iconClass);
    const dropdownBtn = container.find('.dropdown-toggle')[0];
    const instance = bootstrap.Dropdown.getOrCreateInstance(dropdownBtn);
    instance.hide();
});
function renderMenuTable(data) {
    $('#table-user-menu tbody').html(data.filter(m => m.target_group === 'user').map(m => createMenuRow(m)).join(''));
    $('#table-admin-menu tbody').html(data.filter(m => m.target_group === 'admin').map(m => createMenuRow(m)).join(''));
    initSortable();
}
$(document).on('click', '.btn-cancel-row', function() {
    const row = $(this).closest('tr');
    if (row.hasClass('new-record')) {
        row.remove();
    } else {
        row.removeClass('is-editing');
        row.find('.edit-mode, .btn-save-row, .btn-cancel-row').addClass('d-none');
        row.find('.view-mode, .btn-edit, .btn-delete-row').removeClass('d-none');
    }
});
function initSortable() {
    $(".menu-sortable").each(function() {
        if (Sortable.get(this)) Sortable.get(this).destroy();
        new Sortable(this, {
            handle: '.sort-handle', 
            animation: 150,
            filter: 'input, button, .is-editing', 
            preventOnFilter: false,
            onUpdate: () => $('.save-ordering').removeClass('d-none')
        });
    });
}
$(document).on('click', '.btn-edit', function() {
    const row = $(this).closest('tr');
    row.addClass('is-editing');
    row.find('.view-mode, .btn-edit, .btn-delete-row').addClass('d-none');
    row.find('.edit-mode, .btn-save-row, .btn-cancel-row').removeClass('d-none');
    loadIconPicker(row.find('.icon-picker-container'));
    setTimeout(() => {
        row.find('.edit-en').focus(); 
    }, 150);
});
$(document).on('click', '.add-menu-row', function() {
    const activeTabGroup = $('#menu-type-tab button.active').data('group') || 'user';
    const tbody = $(`.menu-sortable[data-group="${activeTabGroup}"]`);
    const newRowHtml = createMenuRow({}, true);
    const $newRow = $(newRowHtml);
    tbody.append($newRow);
    loadIconPicker($newRow.find('.icon-picker-container'));
    setTimeout(() => {
        $newRow.find('.edit-en').focus();
        $newRow[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
    $('.save-ordering').addClass('d-none');
});
$(document).on('click', '.save-ordering', function() {
    const btn = $(this);
    const activeTabGroup = $('#menu-type-tab button.active').data('group') || 'user';
    const tbody = $(`.menu-sortable[data-group="${activeTabGroup}"]`);
    let items = [];
    tbody.find('tr').each(function(index) {
        const id = $(this).attr('data-id');
        if (id && !id.startsWith('new_')) {
            items.push({
                id: id,
                sort_order: index + 1
            });
        }
    });
    if (items.length === 0) return;
    btn.prop('disabled', true);
    apiPost('/api/settings.save_menu_order', { 
       orders: items,
        target_group: activeTabGroup
    }, { processData: true, contentType: 'application/x-www-form-urlencoded; charset=UTF-8' }).done(res => {
        if (res.status) {
            showSuccess(langData['saved_successfully']);
            btn.addClass('d-none');
        } else {
            showError(langData['cannot_save']);
        }
    }).always(() => {
        btn.prop('disabled', false);
    });
});
$(document).on('click', '.btn-save-row', function() {
    const row = $(this).closest('tr');
    const group = row.closest('tbody').data('group');
    let rowId = row.attr('data-id') || row.data('id');
    const data = {
        id: rowId,
        target_group: group,
        icon: row.find('.edit-icon-val').val(),
        path: row.find('.edit-path').val().trim(),
        name_en: row.find('.edit-en').val().trim(),
        name_th: row.find('.edit-th').val().trim(),
        name_lo: row.find('.edit-lo').val().trim(),
        is_active: row.find('.toggle-active').is(':checked') ? 1 : 0
    };
    if (!data.name_en || !data.path) {
        return showWarning(langData['required_star_message'] || 'Please fill all required fields');
    }
    const btn = $(this);
    btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span>');
    apiPost(
        '/api/settings.save_single_menu', 
        data,
        {
            processData: true, 
            contentType: 'application/x-www-form-urlencoded; charset=UTF-8'
        }
    ).done(res => {
        if(res.status) {
            showSuccess(langData['saved_successfully']);
            loadMenus(); 
        } else {
            showError(langData['cannot_save']);
            btn.prop('disabled', false).html('<i class="fa-solid fa-check"></i>');
        }
    }).fail(() => {
        showError(langData['cannot_save']);
        btn.prop('disabled', false).html('<i class="fa-solid fa-check"></i>');
    });
});
$(document).on('click', '.btn-delete-row', function() {
    const row = $(this).closest('tr');
    const menuId = row.data('id');
    showConfirm(langData['confirm'], langData['confirm_delete'], function(){
        apiPost(
            '/api/settings.delete_menu', 
            { id: menuId },
            {
                processData: true, 
                contentType: 'application/x-www-form-urlencoded; charset=UTF-8'
            }
        ).done(res => {
            if (res.status) {
                showSuccess(langData['delete_successfully']);
                loadMenus(); 
            }
        });
    });
});