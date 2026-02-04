<link rel="stylesheet" href="<?=BASE_URL?>/public/css/auth.css?v=<?=time();?>">
<img class="auth-bg-img-pc d-none d-md-block" alt="Background">
<img class="auth-bg-img-mobile d-block d-md-none" alt="Background Mobile">
<div class="container h-100 position-relative content-wrapper background">
    <div class="row h-100 align-items-center">
        <div class="col-lg-5 col-md-12 col-12 d-flex flex-column align-items-center mb-4 mb-lg-0">
            <div class="logo-container bg-white shadow rounded-4">
                <div class="logo-header">
                    <img class="logo">
                </div>
                <div class="login-title mb-3" data-i18n="reset_password_title"></div>
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
                        <li><input type="checkbox" class="form-check-input me-2 pwc" id="pw_len" disabled><span data-i18n="pw_line1"></span></li>
                        <li><input type="checkbox" class="form-check-input me-2 pwc" id="pw_only" disabled><span data-i18n="pw_line2"></span></li>
                        <li><input type="checkbox" class="form-check-input me-2 pwc" id="pw_upper" disabled><span data-i18n="pw_line3"></span></li>
                        <li><input type="checkbox" class="form-check-input me-2 pwc" id="pw_lower" disabled><span data-i18n="pw_line4"></span></li>
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
                <button type="button" class="btn-login btn-reset-submit" data-i18n="save_password"></button>
                <div class="mt-3 text-center">
                    <a href="login" class="text-primary" data-i18n="return_to_login"></a>
                </div>
            </div>
            <div class="text-white mt-3 text-center project-info"></div>
        </div>
        <div class="col-lg-7 col-md-12 text-center text-white"></div>
    </div>
</div>
<script src="<?=BASE_URL?>/public/js/auth/auth.js?v=<?=time()?>"></script>
<script src="<?=BASE_URL?>/public/js/auth/reset.js?v=<?=time()?>"></script>