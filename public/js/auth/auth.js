function showLoginWarning(field) {
    let message = '';
    switch(field) {
        case 'username':
            message = langData['username_required'];
            break;
        case 'password':
            message = langData['password_required'];
            break;
        case 'email':
            message = langData['email_required'];
            break;
    }
    showWarning(message);
}
function doLogin() {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    let username = $("#username").val().trim();
    let password = $("#password").val().trim();
    let keepLoggedIn = $("#keepLoggedIn").is(':checked');
    if (!username) { showLoginWarning('username'); return; }
    if (!password) { showLoginWarning('password'); return; }
    showPageLoader();
    $.post(`${BASE_URL}/api/auth`, {
        username: username,
        password: password,
        timezone: tz,
        keepLoggedIn: keepLoggedIn
    }, function(res){
        if (res.status === 'success') {
            window.location.href = `${BASE_URL}/${res.location}`;
        } else {
            showError(langData[res.message] || res.message);
        }
    }, 'json').fail(function() {
        showError(langData['error']);
    }).always(function(){
        hidePageLoader();
    });
}
$(document).on('click', '.login-btn', function() {
    doLogin();
});
$(document).on('keydown', '#username, #password', function(e) {
    if (e.key === "Enter") {
        e.preventDefault();
        doLogin();
    }
});
$(document).on('click', '.login-forgot', function() {
    let $btn = $(this); 
    let email = $("#email").val().trim();
    if(email === "") {
        showLoginWarning('email');
        return;
    }
    let originalText = $btn.html();
    let loadingText = (currentLang === 'th') ? 'กำลังส่ง...' : (currentLang === 'lo') ? 'ກຳລັງສົ່ງ...' : 'Sending...';
    $btn.prop('disabled', true).html(loadingText);
    $('#loading').show(); 
    $.post(`${BASE_URL}/api/auth.forgot`, {
        email: email,
        lang: currentLang
    }, function(res){
        $('#loading').hide();
        $btn.prop('disabled', false).html(originalText);
        if(res.status === 'success'){
            showSuccess(langData['reset_success']);
            $("#email").val(""); 
        } else {
            showError(langData[res.message] || res.message);
        }
    }, 'json').fail(function() {
        $('#loading').hide();
        $btn.prop('disabled', false).html(originalText);
        showError("Connection error. Please try again.");
    });
});
$(document).on('click', '#togglePassword', function () {
    let input = $("#password");
    let icon = $("#toggleIcon");
    if (input.attr("type") === "password") {
        input.attr("type", "text");
        icon.removeClass("fa-solid fa-eye-slash").addClass("fa-solid fa-eye");
    } else {
        input.attr("type", "password");
        icon.removeClass("fa-solid fa-eye").addClass("fa-solid fa-eye-slash");
    }
});
$(document).on('click', '#btn_submit_request', function () {
    let errors = [];
    $('.obj-required').each(function () {
        let value = $(this).val()?.trim() || '';
        if (!value) {
            $(this).addClass('is-invalid');
            errors.push(this.name || this.id);
        } else {
            $(this).removeClass('is-invalid');
        }
    });
    if (errors.length) {
        showWarning(langData['required_star_message'] || 'Please fill all fields marked with *');
        $('.is-invalid').first().focus();
        return;
    }
    submitRequest();
});
function submitRequest() {
    const btn = $("#btn_submit_request");
    btn.prop("disabled", true);
    const formData = new FormData();
    formData.append("request_email", $("#request_email").val() || "");
    formData.append("request_remark", $("#request_remark").val() || "");
    formData.append("visitorId", visitorId || "");
    Swal.fire({
        title: langData['saving'] || 'Saving...',
        html: `
            <p>${langData['do_not_close'] || 'Please do not close this window.'}</p>
            <div class="progress mt-2">
                <div id="swal-progress" class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width:0%">0%</div>
            </div>
        `,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });
    $.ajax({
        url: `${BASE_URL}/api/request.save`,
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
            Swal.close();
            if (res.status === 'success') { 
                showSuccess(langData['request_success'] || 'Request Sent!');
                $('.obj-required').removeClass('is-invalid');
                $('.obj-required').val("");
            } else {
                showError(langData[res.message] || res.message);
            }
        },
        error: function (xhr, status, error) {
            Swal.close();
            btn.prop("disabled", false);
            let msg = langData['cannot_save'];
            try {
                let res = JSON.parse(xhr.responseText);
                if (res.message) msg += ": " + res.message;
            } catch (e) {}
            showError(msg);
        },
        complete: function() {
            btn.prop("disabled", false);
        }
    });
}
$(document).ready(initAuthApp);
const authState = {
    bg: null,
    mobileBg: null
};
let visitorId = '';
async function initAuthApp() {
    try {
        const fpPromise = import('https://openfpcdn.io/fingerprintjs/v4').then(FingerprintJS => FingerprintJS.load());
        const fp = await fpPromise;
        const result = await fp.get();
        visitorId = result.visitorId;
    } catch (error) {
        console.warn("FingerprintJS failed, using fallback...");
        visitorId = getFallbackId();
    }
    await loadAuthSetting();
    await loadAuthRquest();
    applyAuthBackground();
}
function getFallbackId() {
    let tempId = localStorage.getItem('fallback_visitor_id');
    if (!tempId) {
        tempId = 'fb-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('fallback_visitor_id', tempId);
    }
    return tempId;
}
let request_date = null;
let request_status = null;
let request_email = null;
let request_submission = null;
async function loadAuthRquest() {
    if (visitorId) {
        try {
            const res = await $.ajax({
                url: `${BASE_URL}/api/auth.request`,
                type: 'POST',
                data: { visitor_id: visitorId },
                dataType: 'json'
            });
            if (res.status === 'success' && res.data) {
                request_date = res.data.created_at;
                request_status = res.data.status;
                request_email = res.data.user_email;
                request_submission = res.data;
                if (res.data.user_email) {
                    $('#request_email').val(res.data.user_email);
                }
                if (res.data.user_note) {
                    $('#request_remark').val(res.data.user_note);
                }
                if (res.data && res.data.created_at) {
                    let badgeClass = 'bg-warning text-dark';
                    if (res.data.status === 'completed') badgeClass = 'bg-success';
                    if (res.data.status === 'rejected') badgeClass = 'bg-danger';
                    let html = `
                        <div class="alert alert-light border shadow-sm rounded-3 p-2 d-flex align-items-center justify-content-between mb-3">
                            <div class="d-flex align-items-center">
                                <div>
                                    <div class="text-muted extra-small" style="font-size: 0.75rem;">
                                        <i class="fa-regular fa-calendar-check me-1"></i> ${res.data.created_at}
                                    </div>
                                </div>
                            </div>
                            <span class="badge ${badgeClass} rounded-pill px-3 py-2" style="font-size: 0.65rem; letter-spacing: 0.5px;" data-i18n="${res.data.status}">${langData[res.data.status]}</span>
                        </div>
                    `;
                    $(".request-result").html(html).fadeIn();
                }
                $('#btn_submit_request').attr('data-i18n', 'update_system_request').text('Update Request');
            }
        } catch (err) {
            console.error("Load request failed", err);
        }
    }
}
async function loadAuthSetting() {
    try {
        const res = await $.ajax({
            url: `${BASE_URL}/api/settings.get`,
            type: 'POST',
            dataType: 'json'
        });
        if (!res.status || !res.data) {
            return;
        }
        if (res.data.settings && Array.isArray(res.data.settings)) {
            res.data.settings.forEach(parseAuthSetting);
        }
        const forgot = res.data.forgot_system;
        const hasData = forgot && (Array.isArray(forgot) ? forgot.length > 0 : Object.keys(forgot).length > 0);
        if (hasData) {
            renderForgotOptions(forgot);
        } else {
            $(".forgot-password-link").addClass("d-none");
        }
    } catch (err) {
        console.error('[AuthSetting]', err);
    }
}
function renderForgotOptions(data) {
    let methods = [];
    if (data.is_email_link_enabled == "1") {
        methods.push({ id: 'email', name: 'email', icon: 'fa-envelope' });
    }
    if (data.is_admin_contact_enabled == "1") {
        let allItems = [];
        if (data.admin_email) {
            allItems.push(`
                <a href="mailto:${data.admin_email}" class="list-group-item list-group-item-action border-0 mb-1 rounded-3 d-flex align-items-center bg-white shadow-sm py-2">
                    <div class="icon-box bg-danger-subtle text-danger rounded-circle me-3 d-flex align-items-center justify-content-center" style="width: 35px; height: 35px;">
                        <i class="fa-solid fa-envelope fs-4"></i>
                    </div>
                    <div>
                        <div class="fw-bold small text-dark" data-i18n="email">Email</div>
                        <div class="text-muted">${data.admin_email}</div>
                    </div>
                </a>`);
        }
        if (data.admin_line_oa) {
            let lineId = data.admin_line_oa.replace('@', '');
            allItems.push(`
                <a href="https://line.me/ti/p/~${lineId}" target="_blank" class="list-group-item list-group-item-action border-0 mb-1 rounded-3 d-flex align-items-center bg-white shadow-sm py-2">
                    <div class="icon-box bg-success-subtle text-success rounded-circle me-3 d-flex align-items-center justify-content-center" style="width: 35px; height: 35px;">
                        <i class="fa-brands fa-line fs-4"></i>
                    </div>
                    <div>
                        <div class="fw-bold small text-dark">Line Official</div>
                        <div class="text-muted">${data.admin_line_oa}</div>
                    </div>
                </a>`);
        }
        if (data.admin_telegram) {
            allItems.push(`
                <a href="https://t.me/${data.admin_telegram.replace('@', '')}" target="_blank" class="list-group-item list-group-item-action border-0 mb-1 rounded-3 d-flex align-items-center bg-white shadow-sm py-2">
                    <div class="icon-box bg-info-subtle text-info rounded-circle me-3 d-flex align-items-center justify-content-center" style="width: 35px; height: 35px;">
                        <i class="fa-brands fa-telegram fs-4"></i>
                    </div>
                    <div>
                        <div class="fw-bold small text-dark">Telegram</div>
                        <div class="text-muted">${data.admin_telegram}</div>
                    </div>
                </a>`);
        }
        if (data.admin_tel) {
            data.admin_tel.split(',').forEach(tel => {
                const cleanTel = tel.trim();
                if (cleanTel) {
                    allItems.push(`
                        <a href="tel:${cleanTel.replace(/\s+/g, '')}" class="list-group-item list-group-item-action border-0 mb-1 rounded-3 d-flex align-items-center bg-white shadow-sm py-2">
                            <div class="icon-box bg-primary-subtle text-primary rounded-circle me-3 d-flex align-items-center justify-content-center" style="width: 35px; height: 35px;">
                                <i class="fa-solid fa-phone fs-4"></i>
                            </div>
                            <div>
                                <div class="fw-bold small text-dark" data-i18n="contact_number">Phone</div>
                                <div class="text-muted">${cleanTel}</div>
                            </div>
                        </a>`);
                }
            });
        }
        if (data.admin_others) {
            data.admin_others.split(',').forEach(info => {
                const cleanInfo = info.trim();
                if (cleanInfo) {
                    allItems.push(`
                        <div class="list-group-item border-0 rounded-3 d-flex align-items-center bg-light py-2 mt-1">
                            <div class="icon-box bg-secondary-subtle text-secondary rounded-circle me-3 d-flex align-items-center justify-content-center" style="width: 35px; height: 35px;">
                                <i class="fa-solid fa-circle-info fs-4"></i>
                            </div>
                            <div class="text-muted">${cleanInfo}</div>
                        </div>`);
                }
            });
        }
        if (allItems.length > 0) {
            let adminHtml = '<div class="list-group list-group-flush border-0 rounded-3">';
            const displayItems = allItems.slice(0, 3);
            adminHtml += displayItems.join('');
            if (allItems.length > 3) {
                adminHtml += `
                    <button type="button" class="btn btn-outline-primary btn-sm mt-2 w-100 rounded-3" data-bs-toggle="modal" data-bs-target="#adminContactModal">
                        <i class="fa-solid fa-ellipsis-h me-1"></i> <span data-i18n="more_channels"></span>
                    </button>`;
                $('#adminContactModal .modal-body').html('<div class="list-group list-group-flush">' + allItems.join('') + '</div>');
            }
            adminHtml += '</div>';
            $('#admin_list').html(adminHtml);
            methods.push({ id: 'admin', name: 'admin', icon: 'fa-headset' });
        }
    }
    if (data.is_system_request_enabled == "1") {
        methods.push({ id: 'form', name: 'form', icon: 'fa-file-pen' });
    }
    if (methods.length === 0) return; 
    if (methods.length === 1) {
        $(`#content_${methods[0].id}`).addClass('show active').show();
        $('#dynamic_tab_nav').hide();
    } else {
        let navHtml = '<ul class="nav nav-pills nav-justified mb-4 bg-light p-1 rounded-pill" id="forgotTabs" role="tablist">';
        methods.forEach((m, index) => {
            const activeClass = index === 0 ? 'active' : '';
            navHtml += `
                <li class="nav-item">
                    <button class="nav-link ${activeClass} rounded-pill py-2" data-bs-toggle="pill" data-bs-target="#content_${m.id}">
                        <i class="fa-solid ${m.icon} me-1"></i> <span class="small" data-i18n="${m.name}">${langData[m.name]}</span>
                    </button>
                </li>`;
            if (index === 0) {
                $(`#content_${m.id}`).addClass('show active').show();
            } else {
                $(`#content_${m.id}`).removeClass('show active').hide();
            }
        });
        navHtml += '</ul>';
        $('#dynamic_tab_nav').html(navHtml).show();
        $(document).on('shown.bs.tab', 'button[data-bs-toggle="pill"]', function (e) {
            const target = $(e.target).data('bs-target');
            $('.tab-pane').hide().removeClass('show active');
            $(target).show().addClass('show active');
        });
    }
}
function parseAuthSetting(item) {
    const fullPath = item.setting_value ? `${BASE_URL}/${item.setting_value}` : null;
    switch (item.setting_type) {
        case 'login_bg':
            authState.bg = fullPath;
            if (fullPath) $('.auth-bg-img-pc').attr('src', fullPath);
            break;
        case 'login_mobile_bg':
            authState.mobileBg = fullPath;
            if (fullPath) $('.auth-bg-img-mobile').attr('src', fullPath);
            break;
        case 'site_assessment':
            if (item.setting_value) {
                $('.project-info').html(item.setting_value);
            }
            break;
        case 'infography':
            if (fullPath) {
                renderInfography(fullPath);
            }
            break;
    }
}
function renderInfography(path) {
    const ext = path.split('.').pop().toLowerCase();
    const videoExts = ['mp4', 'webm', 'ogg', 'mov'];
    let html = '';
    if (videoExts.includes(ext)) {
        html = `
            <video autoplay muted loop playsinline style="max-width: 100%; height: auto;">
                <source src="${path}" type="video/${ext === 'mov' ? 'quicktime' : ext}">
                Your browser does not support the video tag.
            </video>`;
    } else {
        html = `<img src="${path}" alt="Infography" style="max-width: 100%; height: auto;">`;
    }
    $('.infography').html(html);
}
function applyAuthBackground() {
    if (authState.bg) {
        $('.auth-bg-img-pc').attr('src', authState.bg);
    } else {
        $('.auth-bg-img-pc').css('display', 'none');
    }
    if (authState.mobileBg) {
        $('.auth-bg-img-mobile').attr('src', authState.mobileBg);
    } else {
        $('.auth-bg-img-mobile').css('display', 'none');
    }
}