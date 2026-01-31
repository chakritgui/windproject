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
        title: 'Uploading...',
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
                $('#swal-progress')
                    .css('width', percent + '%')
                    .text(percent + '%');
            };
            return xhr;
        }
    }).always(() => toggleButton(btnSelector, false));
};
$(document).ready(initSetting);
function initSetting() {
    apiPost('/api/setting/get', null, { contentType: true, processData: true }).done(res => {
        if (!res.status) {
            showError('Error', langData['cannot_load']);
            return;
        }
        res.data.forEach(applySetting);
    });
}
const settingHandlers = {
    logo: v => renderImage('logoPreview', v),
    icon: v => renderImage('iconPreview', v),
    login_mobile_bg: v => renderBg('loginMobilePreview', v, 'mobile'),
    login_bg: v => renderBg('loginPreview', v, 'pc'),
    website_en: v => $('#nameEn').val(v),
    website_lo: v => $('#nameLo').val(v),
    website_th: v => $('#nameTh').val(v),
    footer: v => $('#footerText').val(v),
    site_assessment: v => $('#site_assessment').val(v),
    language: v => setLanguagesFromDB(v)
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
    renderImage(previewId, path);
    $(`.btn-remove-${type}`).removeClass('d-none');
    $(`#oldLogin${type === 'mobile' ? 'Mobile' : ''}Bg`).val(path);
}
function previewImage(input, previewId, type) {
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        showError('Error', langData['allow_images_only']);
        input.value = '';
        return;
    }
    const reader = new FileReader();
    reader.onload = e => {
        $(`#${previewId}`).html(`
            <img src="${e.target.result}" class="preview-img">
        `);
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
            <p class="mt-2 text-muted"><span data-i18n="uploadFile"></span></p>
            <small class="text-muted">
                <span data-i18n="image"></span>
                (<span data-i18n="recommend"></span> ${size})
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
        showError('Error', langData['one_language']);
        return;
    }
    el.toggleClass('active');
    el.find('i').attr('class', el.hasClass('active') ? 'fa-solid fa-circle-check fs-4' : 'fa-regular fa-circle fs-4 text-muted');
}
$(document).on('click', '.save-setting-3', function () {
    const langs = $('.lang-toggle.active').map((_, el) => el.id.replace('lang', '').toLowerCase()).get();
    if (!langs.length) {
        showError('Error', langData['one_language']);
        return;
    }
    const fd = new FormData();
    fd.append('languages', langs.join(','));
    toggleButton('.save-setting-3', true);
    apiPost('/api/setting/saveLang', fd).done(res => {
        res.status ? (showSuccess('Success', langData['saved_successfully']), initSetting()) : showError('Error', langData['cannot_save']);
    }).always(() => toggleButton('.save-setting-3', false));
});
$(document).on('click', '.save-setting-1', function () {
    const fd = new FormData();
    fd.append('nameEn', $('#nameEn').val());
    fd.append('nameLo', $('#nameLo').val());
    fd.append('nameTh', $('#nameTh').val());
    fd.append('footerText', $('#footerText').val());
    fd.append('site_assessment', $('#site_assessment').val());
    fd.append('logoInput', $('#logoInput')[0].files[0] || null);
    fd.append('iconInput', $('#iconInput')[0].files[0] || null);
    uploadWithProgress('/api/setting/saveInfo', fd, '.save-setting-1').done(res => {
        res.status ? (showSuccess('Success', langData['saved_successfully']), initSetting(), $('#windModal').modal('hide')) : showError('Error', langData['cannot_save']);
    }).fail(() => showError('Error', langData['cannot_save']));
});
$(document).on('click', '.save-setting-2', function () {
    const fd = new FormData();
    fd.append('loginInput', $('#loginInput')[0].files[0] || null);
    fd.append('loginMobileInput', $('#loginMobileInput')[0].files[0] || null);
    fd.append('oldLoginBg', $('#oldLoginBg').val());
    fd.append('oldLoginMobileBg', $('#oldLoginMobileBg').val());
    uploadWithProgress('/api/setting/saveBgImage', fd, '.save-setting-2').done(res => {
        res.status ? (showSuccess('Success', langData['saved_successfully']), initSetting(), $('#windModal').modal('hide')) : showError('Error', langData['cannot_save']);
    }).fail(() => showError('Error', langData['cannot_save']));
});