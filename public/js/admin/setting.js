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
    login_bg: v => renderBg('loginPreview', v, 'pc'),
    login_mobile_bg: v => renderBg('loginMobilePreview', v, 'mobile'),
    login_icon: v => renderBg('loginIconPreview', v),
    infography: v => renderBg('infographyPreview', v, 'infography'),
    website_en: v => $('#nameEn').val(v),
    website_lo: v => $('#nameLo').val(v),
    website_th: v => $('#nameTh').val(v),
    footer_en: v => $('#footer_en').html(v),
    footer_lo: v => $('#footer_lo').html(v),
    footer_th: v => $('#footer_th').html(v),
    scrolling_en: v => $('#scrolling_en').html(v),
    scrolling_lo: v => $('#scrolling_lo').html(v),
    scrolling_th: v => $('#scrolling_th').html(v),
    site_assessment_en: v => $('#site_assessment_en').html(v),
    site_assessment_lo: v => $('#site_assessment_lo').html(v),
    site_assessment_th: v => $('#site_assessment_th').html(v),
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
    fd.append('footer_en', $('#footer_en').html());
    fd.append('footer_lo', $('#footer_lo').html());
    fd.append('footer_th', $('#footer_th').html());
    fd.append('scrolling_en', $('#scrolling_en').html());
    fd.append('scrolling_lo', $('#scrolling_lo').html());
    fd.append('scrolling_th', $('#scrolling_th').html());
    fd.append('site_assessment_en', $('#site_assessment_en').html());
    fd.append('site_assessment_lo', $('#site_assessment_lo').html());
    fd.append('site_assessment_th', $('#site_assessment_th').html());
    fd.append('logoInput', $('#logoInput')[0].files[0] || null);
    fd.append('iconInput', $('#iconInput')[0].files[0] || null);
    fd.append('loginIconInput', $('#loginIconInput')[0].files[0] || null);
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
$(document).on('click', '.disclaimer-tab', function() {
    initDisclaimerTable();
});
let tb_disclaimer;
function initDisclaimerTable() {
    let oldPage = 0;
    if ($.fn.DataTable.isDataTable('#tb_disclaimer')) {
        oldPage = $('#tb_disclaimer').DataTable().page();
        $('#tb_disclaimer').DataTable().destroy();
    }
    tb_disclaimer = $('#tb_disclaimer').DataTable({
        processing: true,
        serverSide: true,
        order: [[1, 'desc']],
        ajax: { 
            url: `${BASE_URL}/api/disclaimer.list`, 
            type: "POST",
        },
        columns: [{ 
            data: "version",
            className: 'align-middle text-center',
            render: function (data) {
                return `<span class="fw-bold"><span>${langData['version'] || 'Version'}</span> ${data}</span>`;
            }
        },{ 
            data: "is_active",
            className: 'align-middle text-center',
            render: function (data) {
                const badge = data == 1 ? { color: 'success', text: 'Enabled', icon: 'fa-check-circle', key: 'enabled' } : { color: 'secondary', text: 'Disabled', icon: 'fa-times-circle', key: 'disabled' };
                return `<span class="badge rounded-pill bg-${badge.color}-subtle text-${badge.color} px-3"><i class="fa-solid ${badge.icon} me-1"></i>${langData[badge.key] || badge.text}</span>`;
            }
        },{ 
            data: "require_accept",
            className: 'align-middle text-center',
            render: function (data) {
                return data == 1 ? `<i class="fa-solid fa-user-check text-primary" title="Required"></i>` : `<i class="fa-solid fa-minus text-muted"></i>`;
            }
        },{ 
            data: "show_mode",
            className: 'align-middle',
            render: function (data, type, row) {
                return `
                    <div class="d-flex flex-column">
                        <span class="text-dark fw-medium">${row.title_en || '-'}</span>
                        <small class="text-muted"><i class="fa-solid fa-eye me-1"></i>${langData[data] || data.replace('_', ' ')}</small>
                    </div>`;
            }
        },{ 
            data: "created_at",
            className: 'align-middle text-nowrap',
            render: function(data) {
                return `<small class="text-muted"><i class="fa-regular fa-calendar me-1"></i>${data}</small>`;
            }
        },{
            data: null,
            className: 'align-middle text-end',
            orderable: false,
            render: function(row) {
                return `
                    <div class="btn-group border rounded-3 bg-white">
                        <button class="btn btn-link text-warning py-1 manage-disclaimer" data-id="${row.id}">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn btn-link text-danger py-1 border-start delete-disclaimer" data-id="${row.id}">
                            <i class="fa-regular fa-trash-can"></i>
                        </button>
                    </div>`;
            }
        }],
        pageLength: pageLength,
        lengthMenu: lengthMenu,
        language: getTableLang(),
        initComplete: function() {
            let self = this.api();
            let $filter = $('#tb_disclaimer_filter');
            if ($filter.find('.manage-disclaimer').length === 0) {
                $filter.append(`
                    <button class="btn btn-primary btn-sm manage-disclaimer ms-2" data-id="0">
                        <i class="fa-solid fa-plus"></i> <span>${langData['version'] || 'Version'}</span>
                    </button>
                `);
            }
            let $input = $filter.find('input').unbind();
            $input.bind('keypress', function(e) {
                if (e.keyCode == 13) { self.search(this.value).draw(); }
            });
        }
    });
}
$(document).on('click', '.delete-disclaimer', function() {
    let disclaimer_id = $(this).data("id");
    showConfirm(langData['confirm'], langData['confirm_delete'], function(){
        $.ajax({
            url: `${BASE_URL}/api/disclaimer.delete`,
            method: 'POST',
            data: { id: disclaimer_id },
            dataType: 'json',
            success: function(res) {
                if(res.status === 'success'){
                    showSuccess(langData['deleted_successfully'] || 'Deleted successfully');
                    if ($.fn.DataTable.isDataTable('#tb_disclaimer')) {
                        $('#tb_disclaimer').DataTable().ajax.reload(null, false);
                    } else {
                        initDisclaimerTable();
                    }
                } else {
                    showError(langData['cannot_delete'] || 'Cannot delete');
                }   
            },
            error: function(){
                showError(langData['cannot_delete']);
            }
        });
    });
});
$(document).on('click', '.manage-disclaimer', function () {
    const disclaimer_id = $(this).data("id");
    const isEdit = !!disclaimer_id;
    $.ajax({
        url: `${BASE_URL}/api/disclaimer.info`,
        method: 'POST',
        data: { id: disclaimer_id },
        dataType: 'json',
        success: function (res) {
            if (res.status !== 'success') {
                showError(langData['cannot_load']);
                return;
            }
            const data = res.data;
            const modalEl = $('#windModal');
            const modal = new bootstrap.Modal(modalEl[0]);
            renderDisclaimerModalContent(modalEl, disclaimer_id, isEdit);
            if (data) {
                $('#disclaimer_id').val(data.id);
                $('#version').val(data.version);
                $('#is_active').prop('checked', data.is_active == 1);
                $('#require_accept').prop('checked', data.require_accept == 1);
                $('#show_mode').val(data.show_mode);
                if (data.translations) {
                    const languages = ['en', 'th', 'lo'];
                    languages.forEach(lang => {
                        const trans = data.translations[lang] || {};
                        $(`#title_${lang}`).val(trans.title || '');
                        const $content = $(`#content_${lang}`);
                        const contentHtml = trans.content || '';
                        if ($content.data('summernote')) {
                            $content.summernote('code', contentHtml);
                        } else {
                            $content.val(contentHtml);
                        }
                    });
                }
            } else {
                const rows = tb_disclaimer.rows().data().toArray();
                const lastVer = rows.length > 0 ? Math.max(...rows.map(r => parseInt(r.version))) : 0;
                $('#version').val(lastVer + 1);
            }
            modal.show();
        },
        error: () => showError(langData['cannot_load'])
    });
});
function renderDisclaimerModalContent(modalEl, id, isEdit) {
    modalEl.find(".modal-header").html(`
        <h5 class="modal-title"><i class="fa-solid fa-file-contract me-2 text-primary"></i>${langData['disclaimer'] || "Disclaimer"}</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
    `);
    modalEl.find(".modal-footer").html(`
        <button type="submit" class="btn btn-primary me-2 save-disclaimer">${langData['save'] || "Save"}</button>
        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">${langData['close'] || "Close"}</button>
    `);
    modalEl.find(".modal-body").html(`
        <input type="hidden" id="disclaimer_id" value="${id ?? ''}">
        <div class="row mb-4">
            <div class="col-md-4 mb-3">
                <label class="form-label fw-bold">${langData['version']}</label>
                <div class="input-group">
                    <span class="input-group-text bg-light text-primary fw-bold">v</span>
                    <input type="number" class="form-control fw-bold" id="version" ${isEdit ? 'readonly' : ''}>
                </div>
            </div>
            <div class="col-md-8 mb-3">
                <label class="form-label fw-bold">${langData['show_mode']}</label>
                <select class="form-select" id="show_mode">
                    <option value="version_change">${langData['when_version_changes'] || 'Show when version changes'}</option>
                    <option value="every_login">${langData['every_login'] || 'Every login'}</option>
                    <option value="once">${langData['show_once'] || 'Show once (Forever)'}</option>
                </select>
            </div>
        </div>
        <div class="row mb-4">
            <div class="col-sm-6 col-12">
                <div class="form-check form-switch p-3 border rounded bg-light shadow-sm">
                    <input class="form-check-input ms-0 me-3" type="checkbox" id="is_active">
                    <label class="form-check-label fw-bold" for="is_active">${langData['enable_disclaimer']}</label>
                </div>
            </div>
            <div class="col-sm-6 col-12">
                <div class="form-check form-switch p-3 border rounded bg-light shadow-sm">
                    <input class="form-check-input ms-0 me-3" type="checkbox" id="require_accept" checked>
                    <label class="form-check-label fw-bold" for="require_accept">${langData['require_user_acceptance']}</label>
                </div>
            </div>
        </div>
        <h6 class="fw-bold mb-3 mt-4 text-secondary-emphasis border-bottom pb-2">
            <i class="fa-solid fa-language me-2"></i>${langData['content_multi_language'] || 'Content (Multi-language)'}
        </h6>
        <ul class="nav nav-pills mb-3 bg-light p-1 rounded" id="disclaimerLangTab">
            <li class="nav-item flex-fill"><button class="nav-link active w-100 fw-bold" data-bs-toggle="tab" data-bs-target="#dis-en">English</button></li>
            <li class="nav-item flex-fill"><button class="nav-link w-100 fw-bold" data-bs-toggle="tab" data-bs-target="#dis-th">ไทย</button></li>
            <li class="nav-item flex-fill"><button class="nav-link w-100 fw-bold" data-bs-toggle="tab" data-bs-target="#dis-lo">ລາວ</button></li>
        </ul>
        <div class="tab-content border p-3 rounded shadow-sm">
            <div class="tab-pane fade show active" id="dis-en">
                <div class="mb-3">
                    <label class="form-label required small fw-bold">Title (EN)</label>
                    <input type="text" class="form-control" id="title_en" placeholder="Enter English title">
                </div>
                <div class="mb-0">
                    <label class="form-label required small fw-bold">Content (EN)</label>
                    <textarea class="form-control summernote" rows="8" id="content_en" placeholder="Enter disclaimer content..."></textarea>
                </div>
            </div>
            <div class="tab-pane fade" id="dis-th">
                <div class="mb-3">
                    <label class="form-label small fw-bold">หัวข้อ (TH)</label>
                    <input type="text" class="form-control" id="title_th" placeholder="ระบุหัวข้อภาษาไทย">
                </div>
                <div class="mb-0">
                    <label class="form-label small fw-bold">เนื้อหา (TH)</label>
                    <textarea class="form-control summernote" rows="8" id="content_th" placeholder="ระบุเนื้อหาข้อตกลง..."></textarea>
                </div>
            </div>
            <div class="tab-pane fade" id="dis-lo">
                <div class="mb-3">
                    <label class="form-label small fw-bold">หัวข้อ (LO)</label>
                    <input type="text" class="form-control" id="title_lo" placeholder="ລະບຸຫົວຂໍ້ພາສາລາວ">
                </div>
                <div class="mb-0">
                    <label class="form-label small fw-bold">เนื้อหา (LO)</label>
                    <textarea class="form-control summernote" rows="8" id="content_lo" placeholder="ລະບຸເນື້ອຫາ..."></textarea>
                </div>
            </div>
        </div>
        <div class="alert alert-info mt-3 py-2 small border-0">
            <i class="fa-solid fa-circle-info me-2"></i> ${langData['en_is_primary'] || 'English version is required for activation.'}
        </div>
    `);
    initSummernote();
}
$(document).on('click', '.save-disclaimer', function(e) {
    e.preventDefault();
    const fd = new FormData();
    const isForceNew = $('#forceNewVersion').is(':checked');
    const disclaimerId = $('#disclaimer_id').val() || 0;
    fd.append('id', isForceNew ? 0 : disclaimerId);
    fd.append('enable', $('#is_active').is(':checked') ? 1 : 0);
    fd.append('require_accept', $('#require_accept').is(':checked') ? 1 : 0);
    fd.append('show_mode', $('#show_mode').val());
    fd.append('version', $('#version').val());
    ['en', 'lo', 'th'].forEach(lang => {
        const $editor = $(`#content_${lang}`);
        const $title = $(`#title_${lang}`);
        if ($editor.length) {
            let htmlContent = $editor.summernote('code').trim();
            const hasText = htmlContent.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim().length > 0;
            const hasImage = htmlContent.includes('<img');
            if (hasText || hasImage) {
                fd.append(`content_${lang}`, htmlContent);
            } else {
                fd.append(`content_${lang}`, ''); 
            }
        }
        if ($title.length) {
            fd.append(`title_${lang}`, $title.val().trim());
        }
    });
    if ($('#is_active').is(':checked')) {
        if (!$('#title_en').val().trim() || !$('#content_en').val().trim()) {
            showError(langData['en_is_primary'] || 'English version is required for activation.');
            $('[data-bs-target="#dis-en"]').tab('show'); 
            return;
        }
    }
    uploadWithProgress(`/api/disclaimer.save`, fd, '.save-disclaimer').done(res => {
        if (res.status === true || res.status === 'success') {
            showSuccess(langData['saved_successfully'] || 'Saved successfully');
            $('#windModal').modal('hide');
            if (typeof tb_disclaimer !== 'undefined') {
                initDisclaimerTable();
            }
        } else {
            showError(res.message || langData['cannot_save']);
        }
    }).fail((xhr) => {
        console.error(xhr.responseText);
        showError(langData['cannot_save']);
    });
});