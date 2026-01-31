$(document).ready(function () {
    initSetting();
});
function initSetting() {
    $.ajax({
        url: `${BASE_URL}/api/setting/get`,
        method: 'POST',
        dataType: 'json',
        success: function(res) {
            if(res.status === true){
                res.data.forEach(item => {
                    switch(item.setting_type){
                        case 'logo':
                            if(item.setting_value !== null && item.setting_value !== ''){
                                document.getElementById('logoPreview').innerHTML = `
                                    <img src="${BASE_URL}/${item.setting_value}" class="preview-img">
                                `;
                            }
                            break;
                        case 'icon':
                            if(item.setting_value !== null && item.setting_value !== ''){
                                document.getElementById('iconPreview').innerHTML = `
                                    <img src="${BASE_URL}/${item.setting_value}" class="preview-img">
                                `;
                            }
                            break;
                        case 'login_mobile_bg':
                            if(item.setting_value !== null && item.setting_value !== ''){
                                document.getElementById('loginMobilePreview').innerHTML = `
                                    <img src="${BASE_URL}/${item.setting_value}" class="preview-img">
                                `;
                            }
                            break;
                        case 'login_bg':
                            if(item.setting_value !== null && item.setting_value !== ''){
                                document.getElementById('loginPreview').innerHTML = `
                                    <img src="${BASE_URL}/${item.setting_value}" class="preview-img">
                                `;
                            }
                            break;
                        case 'website_en':
                            $('#nameEn').val(item.setting_value);
                            break;
                        case 'website_lo':
                            $('#nameLo').val(item.setting_value);
                            break;
                        case 'website_th':
                            $('#nameTh').val(item.setting_value);
                            break;
                        case 'footer':
                            $('#footerText').val(item.setting_value);
                            break;
                        case 'site_assessment':
                            $('#site_assessment').val(item.setting_value);
                            break;
                        case 'language':
                            let l = item.setting_value;
                            setLanguagesFromDB(l);
                            break;
                    }
                });
            } else {
                showError('Error', langData['cannot_load']);
            }
        }
    });
}
function setLanguagesFromDB(languagesStr) {
    let arr = languagesStr.split(',');
    document.querySelectorAll('.lang-toggle').forEach(el => {
        const langId = el.id.replace('lang','').toLowerCase();
        const icon = el.querySelector('i');
        if(arr.includes(langId)) {
            el.classList.add('active');
            icon.className = 'fa-solid fa-circle-check fs-4';
        } else {
            el.classList.remove('active');
            icon.className = 'fa-regular fa-circle fs-4 text-muted';
        }
    });
}
$(document).on('click', '.save-setting-3', function () {
    let activeLangs = [];
    document.querySelectorAll('.lang-toggle.active').forEach(el => {
        let langId = el.id.replace('lang','').toLowerCase();
        activeLangs.push(langId);
    });
    if(activeLangs.length === 0){
        showError('Error', langData['one_language']);
        return;
    }
    let languagesStr = activeLangs.join(',');
    let formData = new FormData();
    formData.append('languages', languagesStr);
    $(".save-setting-3").attr("disable", true);
    $.ajax({
        url: `${BASE_URL}/api/setting/saveLang`, 
        type: 'POST',
        data: formData,
        contentType: false,
        processData: false,
        success: function(res){
            if(res.status === true){
                showSuccess('Success', langData['saved_successfully']);
                initSetting();
            } else {
                showError('Error', langData['cannot_save']);
            }
            $(".save-setting-3").attr("disable", false);
        },
        error: function(){
            showError('Error', langData['cannot_save']);
            $(".save-setting-3").attr("disable", false);
        }
    });
});
function previewImage(input, previewId) {
    const preview = document.getElementById(previewId);
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
        showError('Error', langData['allow_images_only']);
        input.value = '';
        return;
    }
    const reader = new FileReader();
    reader.onload = function (e) {
        preview.innerHTML = `
            <img src="${e.target.result}" class="preview-img" alt="Preview Image">
        `;
    };
    reader.readAsDataURL(file);
}
$(document).on('click', '.save-setting-1', function () {
    const nameEn = $("#nameEn").val();
    const nameLo = $("#nameLo").val();
    const nameTh = $("#nameTh").val();
    const footerText = $("#footerText").val();
    const site_assessment = $("#site_assessment").val();
    const logoInput = $("#logoInput")[0].files[0] || null;
    const iconInput = $("#iconInput")[0].files[0] || null;
    const formData = new FormData();
    formData.append("nameEn", nameEn);
    formData.append("nameLo", nameLo);
    formData.append("nameTh", nameTh);
    formData.append("footerText", footerText);
    formData.append("site_assessment", site_assessment);
    formData.append("logoInput", logoInput);
    formData.append("iconInput", iconInput);
    Swal.fire({
        title: 'Uploading...',
        html: `
            <div class="progress mt-2">
                <div id="swal-progress" class="progress-bar" role="progressbar" style="width:0%">0%</div>
            </div>
        `,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });
    $(".save-setting-1").attr("disable", true);
    $.ajax({
        url: "api/setting/saveInfo",
        type: "POST",
        data: formData,
        contentType: false,
        processData: false,
        xhr: function () {
            let xhr = new window.XMLHttpRequest();
            xhr.upload.addEventListener("progress", function (e) {
                if (e.lengthComputable) {
                    let percent = Math.round((e.loaded / e.total) * 100);
                    let bar = document.getElementById("swal-progress");
                    if (bar) {
                        bar.style.width = percent + "%";
                        bar.innerText = percent + "%";
                    }
                }
            });
            return xhr;
        },
        success: function (res) {
            if (res.status === true) {
                showSuccess('Success', langData['saved_successfully']);
                initSetting();
                $('#windModal').modal('hide');
            } else {
                showError('Error', langData['cannot_save']);
            }
            $(".save-setting-1").attr("disable", false);
        },
        error: function () {
            showError('Error', langData['cannot_save']);
            $(".save-setting-1").attr("disable", false);
        }
    });
});
$(document).on('click', '.save-setting-2', function () {
    const loginInput = $("#loginInput")[0].files[0] || null;
    const loginMobileInput = $("#loginMobileInput")[0].files[0] || null;
    const formData = new FormData();
    formData.append("loginInput", loginInput);
    formData.append("loginMobileInput", loginMobileInput);
    Swal.fire({
        title: 'Uploading...',
        html: `
            <div class="progress mt-2">
                <div id="swal-progress" class="progress-bar" role="progressbar" style="width:0%">0%</div>
            </div>
        `,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });
    $(".save-setting-2").attr("disable", true);
    $.ajax({
        url: "api/setting/saveBgImage",
        type: "POST",
        data: formData,
        contentType: false,
        processData: false,
        xhr: function () {
            let xhr = new window.XMLHttpRequest();
            xhr.upload.addEventListener("progress", function (e) {
                if (e.lengthComputable) {
                    let percent = Math.round((e.loaded / e.total) * 100);
                    let bar = document.getElementById("swal-progress");
                    if (bar) {
                        bar.style.width = percent + "%";
                        bar.innerText = percent + "%";
                    }
                }
            });
            return xhr;
        },
        success: function (res) {
            if (res.status === true) {
                showSuccess('Success', langData['saved_successfully']);
                initSetting();
                $('#windModal').modal('hide');
            } else {
                showError('Error', langData['cannot_save']);
            }
            $(".save-setting-2").attr("disable", false);
        },
        error: function () {
            showError('Error', langData['cannot_save']);
            $(".save-setting-1").attr("disable", false);
        }
    });
});
function toggleLanguage(lang) {
    const element = document.getElementById('lang' + lang.charAt(0).toUpperCase() + lang.slice(1));
    const isActive = element.classList.contains('active');
    const activeLanguages = document.querySelectorAll('.lang-toggle.active').length;
    if (isActive && activeLanguages === 1) {
        showError('Error', langData['one_language']);
        return;
    }
    element.classList.toggle('active');
    const icon = element.querySelector('i');
    if (element.classList.contains('active')) {
        icon.className = 'fa-solid fa-circle-check fs-4';
    } else {
        icon.className = 'fa-regular fa-circle fs-4 text-muted';
    }
}