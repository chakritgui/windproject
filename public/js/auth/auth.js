function showLoginWarning(field) {
    let title = '', message = '';
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
            window.location.href = `${BASE_URL}/`;
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
    $.post(`${BASE_URL}/api/auth/forgot`, {
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
$(document).ready(initAuthApp);
const authState = {
    bg: null,
    mobileBg: null
};
async function initAuthApp() {
    await loadAuthSetting();
    applyAuthBackground();
}
async function loadAuthSetting() {
    try {
        const res = await $.ajax({
            url: `${BASE_URL}/api/setting/get`,
            type: 'POST',
            dataType: 'json'
        });
        if (!res.status || !res.data) {
            return;
        }
        if (res.data.settings && Array.isArray(res.data.settings)) {
            res.data.settings.forEach(parseAuthSetting);
        }
    } catch (err) {
        console.error('[AuthSetting]', err);
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