$(document).ready(function () {
    initSetting();
});
function initSetting() {
    $.ajax({
        url: 'api/setting/get',
        method: 'POST',
        dataType: 'json',
        success: function(res) {
            if(res.status === true){
                res.data.forEach(item => {
                    switch(item.setting_type){
                        case 'logo':
                            document.getElementById('logoPreview').innerHTML = `
                                <img src="${BASE_URL}/${item.setting_value}" class="preview-img">
                            `;
                            break;
                        case 'icon':
                            document.getElementById('iconPreview').innerHTML = `
                                <img src="${BASE_URL}/${item.setting_value}" class="preview-img">
                            `;
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
        const icon = el.querySelector('i.bi');
        if(arr.includes(langId)) {
            el.classList.add('active');
            icon.className = 'bi bi-check-circle-fill fs-4';
        } else {
            el.classList.remove('active');
            icon.className = 'bi bi-circle fs-4 text-muted';
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
    $.ajax({
        url: 'api/setting/save3', 
        type: 'POST',
        data: formData,
        contentType: false,
        processData: false,
        success: function(res){
            if(res.status === true){
                showSuccess('Success', langData['saved_successfully']);
            } else {
                showError('Success', langData['cannot_save']);
            }
        },
        error: function(){
            showError('Success', langData['cannot_save']);
        }
    });

});
function previewLogo(input) {
    const preview = document.getElementById('logoPreview');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `
                <img src="${e.target.result}" class="preview-img" alt="Logo Preview">
            `;
        };
        reader.readAsDataURL(input.files[0]);
    }
}
function previewIcon(input) {
    const preview = document.getElementById('iconPreview');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `
                <img src="${e.target.result}" class="preview-img" alt="Icon Preview">
            `;
        };
        reader.readAsDataURL(input.files[0]);
    }
}
$(document).on('click', '.save-setting-1', function () {
    const nameEn = $("#nameEn").val();
    const nameLo = $("#nameLo").val();
    const nameTh = $("#nameTh").val();
    const footerText = $("#footerText").val();
    const logoInput = $("#logoInput")[0].files[0] || null;
    const iconInput = $("#iconInput")[0].files[0] || null;
    const formData = new FormData();
    formData.append("nameEn", nameEn);
    formData.append("nameLo", nameLo);
    formData.append("nameTh", nameTh);
    formData.append("footerText", footerText);
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
    $.ajax({
        url: "api/setting/save1",
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
                initDocumentTable();
                $('#windModal').modal('hide');
            } else {
                showError('Error', langData['cannot_save']);
            }
        },
        error: function () {
            showError('Error', langData['cannot_save']);
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
    const icon = element.querySelector('i.bi');
    if (element.classList.contains('active')) {
        icon.className = 'bi bi-check-circle-fill fs-4';
    } else {
        icon.className = 'bi bi-circle fs-4 text-muted';
    }
}