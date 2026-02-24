let resetToken = null; 
function initResetApp() {
    resetToken = $("#reset_token").val();
    if (!resetToken) {
        console.error("Token is missing");
    }
}
$(document).on('click', '#togglePasswordNew, #togglePasswordConfirm', function () {
    const isNew = $(this).attr('id') === 'togglePasswordNew';
    const input = isNew ? $("#new_password") : $("#confirm_password");
    const icon = isNew ? $("#toggleIconNew") : $("#toggleIconConfirm");
    if (input.attr("type") === "password") {
        input.attr("type", "text");
        icon.removeClass("fa-eye-slash").addClass("fa-eye");
    } else {
        input.attr("type", "password");
        icon.removeClass("fa-eye").addClass("fa-eye-slash");
    }
});
$(document).on('keyup', '#new_password', function () {
    let pw = $(this).val();
    $('#pw_len').prop('checked', pw.length >= 5 && pw.length <= 10);
    $('#pw_only').prop('checked', /^[A-Za-z0-9]+$/.test(pw));
    $('#pw_upper').prop('checked', /[A-Z]/.test(pw));
});
$(document).on('click', '.btn-reset-submit', function() {
    const newPassword = $("#new_password").val();
    const confirmPassword = $("#confirm_password").val();
    if (!$('#pw_len').is(':checked') || !$('#pw_only').is(':checked')) {
        showError(langData['password_invalid_format']);
        return;
    }
    if (newPassword !== confirmPassword) {
        showError(langData['password_mismatch']);
        return;
    }
    let $btn = $(this);
    let originalText = $btn.html();
    $btn.prop('disabled', true).text(langData['processing...']);
    $.post(`${BASE_URL}/api/auth.update`, {
        token: resetToken,
        password: newPassword,
        lang: currentLang
    }, function(res) {
        $btn.prop('disabled', false).html(originalText);
        if (res.status === 'success') {
            showSuccess(langData['password_updated_success']);
            setTimeout(() => { window.location.href = `${BASE_URL}/login`; }, 2000);
        } else {
            showError(langData[res.message] || res.message);
        }
    }, 'json').fail(function() {
        $btn.prop('disabled', false).html(originalText);
        showError(langData['connection_error']);
    });
});
$(document).ready(initResetApp);