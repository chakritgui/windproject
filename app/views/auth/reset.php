<link rel="stylesheet" href="<?=BASE_URL?>/public/css/auth.css?v=<?=time();?>">
<img class="auth-bg-img-pc d-none d-md-block" alt="Background">
<img class="auth-bg-img-mobile d-block d-md-none" alt="Background Mobile">
<div class="container d-flex align-items-center justify-content-center">
    <div class="auth-main-card shadow-lg rounded-4 overflow-hidden w-100">
        <div class="row g-0 align-items-stretch"> 
            <div class="col-lg-4 col-md-5 d-flex flex-column align-items-center justify-content-center p-3">
                <div class="logo-container w-100">
                    <div class="logo-header text-center">
                        <img class="logo">
                    </div>
                    <div class="text-center login-title mb-3" data-i18n="reset_password_title"></div>
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
                    <button type="button" class="btn-login btn-reset-submit w-100" data-i18n="save_password"></button>
                    <div class="mt-3 text-center">
                        <a href="login" data-i18n="return_to_login"></a>
                    </div>
                </div>
                <div class="text-dark mt-3 text-center project-info"></div>
            </div>
            <div class="col-lg-8 col-md-7 d-flex align-items-center justify-content-center bg-dark-overlay p-3">
                <div class="infography w-100 h-100"></div>
            </div>
        </div>
    </div>
</div>
<script src="<?=BASE_URL?>/public/js/auth/auth.js?v=<?=time()?>"></script>
<script src="<?=BASE_URL?>/public/js/auth/reset.js?v=<?=time()?>"></script>