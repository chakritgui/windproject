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
    let username = $("#username").val().trim();
    let password = $("#password").val().trim();
    if (!username) { showLoginWarning('username'); return; }
    if (!password) { showLoginWarning('password'); return; }
    showPageLoader();
    $.post('api/auth', {
        username: username,
        password: password
    }, function(res){
        if (res.status === 'success') {
            window.location.href = `${BASE_URL}`;
        } else {
            showError(langData['login_failed'], langData[res.message]);
        }

    }, 'json')
    .fail(function() {
        showError("Error", "Network error");
    })
    .always(function(){
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
    $.post('api/auth/forgot', {
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
        icon.removeClass("bi-eye-slash").addClass("bi-eye");
    } else {
        input.attr("type", "password");
        icon.removeClass("bi-eye").addClass("bi-eye-slash");
    }
});
