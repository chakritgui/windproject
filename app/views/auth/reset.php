<link href="<?=asset('public/css/auth.css')?>" rel="stylesheet">
<img class="auth-bg-img-pc d-none d-md-block" alt="Background">
<img class="auth-bg-img-mobile d-block d-md-none" alt="Background Mobile">
<div class="sky-wrap" id="skyWrap"></div>
<div class="auth-page" id="authPage">
    <div class="auth-card">
        <div class="auth-form-panel">
            <div class="auth-logo-wrap">
                <img class="auth-logo logo" alt="Logo">
            </div>
            <div class="auth-divider"></div>
            <div class="auth-title mb-3" data-i18n="reset_password_title"></div>
            <input type="hidden" id="reset_token" value="<?= $_GET['t'] ?? '' ?>">
            <div class="w-100 mb-3 text-start">
                <label class="form-label" data-i18n="new_password"></label>
                <div class="input-group mb-3">
                    <input type="password" class="form-control" id="new_password" placeholder="••••••••">
                    <span class="input-group-text" id="togglePasswordNew" style="cursor:pointer;">
                        <i class="fa-solid fa-eye-slash" id="toggleIconNew"></i>
                    </span>
                </div>
                <ul id="pw-rules" class="list-unstyled rules-container">
                    <li><input type="checkbox" class="form-check-input me-2 pwc" id="pw_len" disabled><span data-i18n="limit_5_10_characters"></span></li>
                    <li><input type="checkbox" class="form-check-input me-2 pwc" id="pw_only" disabled><span data-i18n="letters_and_number_only"></span></li>
                    <li><input type="checkbox" class="form-check-input me-2 pwc" id="pw_upper" disabled><span data-i18n="at_least_1_uppercase_letter"></span></li>
                </ul>
            </div>
            <div class="w-100 mb-4 text-start">
                <label class="form-label" data-i18n="confirm_password"></label>
                <div class="input-group mb-3">
                    <input type="password" class="form-control" id="confirm_password" placeholder="••••••••">
                    <span class="input-group-text" id="togglePasswordConfirm" style="cursor:pointer;">
                        <i class="fa-solid fa-eye-slash" id="toggleIconConfirm"></i>
                    </span>
                </div>
            </div>
            <button type="button" class="btn-login login-btn" data-i18n="save_password"></button>
            <div class="auth-forgot-link forgot-password-link mt-2">
                <a href="login" data-i18n="return_to_login"></a>
            </div>
            <div class="auth-project-info project-info"></div>
        </div>
        <div class="auth-info-panel">
            <div id="infographyContainer" class="infography w-100 h-100"></div>
        </div>
    </div>
</div>
<script src="<?=asset('public/js/user/sky.js')?>"></script>
<script src="<?=asset('public/js/auth/auth.js')?>" defer></script>
<script src="<?=asset('public/js/auth/reset.js')?>" defer></script>