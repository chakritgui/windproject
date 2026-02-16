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
        <img src="${BASE_URL}/${path}" class="preview-img">
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
                <source src="${path}" type="video/${extension}">
            </video>
        `);
    } else {
        $(`#${previewId}`).html(`<img src="${path}" class="preview-img" style="width:100%; height:100%; object-fit:contain;">`);
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
function removeImage(previewId, inputId) {
    $(`#${previewId}`).empty();
    $(`#${inputId}`).val('');
    const isMobile = inputId.toLowerCase().includes('mobile');
    const type = isMobile ? 'mobile' : 'pc';
    $(`.btn-remove-${type}`).addClass('d-none');
    $(`#oldLogin${isMobile ? 'Mobile' : ''}Bg`).val('');
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