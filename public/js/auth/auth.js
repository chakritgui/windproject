function showLoginWarning(field) {
    let title = '', message = '';
    switch(field) {
        case 'username':
            title = langData['enter_username'];
            message = langData['username_required'];
            break;
        case 'password':
            title = langData['enter_password'];
            message = langData['password_required'];
            break;
        case 'email':
            title = langData['enter_email'];
            message = langData['email_required'];
            break;
    }
    showWarning(title, message);
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
            window.location.href = `${BASE_URL}`;
        } else {
            showError(langData['login_failed'], langData[res.message] || res.message);
        }
    }, 'json').fail(function() {
        showError("Error", "Network error");
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
    let email = $("#email").val().trim();
    if(email === "") {
        showLoginWarning('email');
        return;
    }
    $.post(`${BASE_URL}/api/auth/forgot`, {
        email: email
    }, function(res){
        $('#loading').hide();
        if(res.status === 'success'){
            showSuccess(langData['reset_success']);
        } else {
            showError(langData['reset_failed'], langData[res.message]);
        }
    }, 'json');
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
        if (!res.status) {
            showError('Error', langData['cannot_load']);
            return;
        }
        res.data.forEach(parseAuthSetting);
    } catch (err) {
        console.error('[AuthSetting]', err);
    }
}
function parseAuthSetting(item) {
    switch (item.setting_type) {
        case 'login_bg':
            authState.bg = item.setting_value ? `${BASE_URL}/${item.setting_value}` : null;
            break;
        case 'login_mobile_bg':
            authState.mobileBg = item.setting_value ? `${BASE_URL}/${item.setting_value}` : null;
            break;
        case 'site_assessment':
            if (item.setting_value) {
                $('.project-info').html(item.setting_value);
            }
            break;
    }
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