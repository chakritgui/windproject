<link rel="stylesheet" href="<?=BASE_URL?>/public/css/auth.css?v=<?=time();?>">
<img class="auth-bg-img-pc d-none d-md-block" alt="Background">
<img class="auth-bg-img-mobile d-block d-md-none" alt="Background Mobile">
<div class="container h-100 d-flex align-items-center justify-content-center">
    <div class="auth-main-card shadow-lg rounded-4 overflow-hidden w-100">
        <div class="row g-0 h-100 align-items-stretch"> 
            <div class="col-lg-4 col-md-5 d-flex align-items-center flex-column align-items-center justify-content-center p-3">
                <div class="logo-container w-100">
                    <div class="logo-header text-center">
                        <img class="logo">
                    </div>
                    <div class="login-title mb-3 text-center" data-i18n="sign_in_continue"></div>
                    <p data-i18n="username_or_email"></p>
                    <input type="text" class="form-control mb-3" id="username">
                    <p data-i18n="password"></p>
                    <div class="input-group mb-3">
                        <input type="password" class="form-control" id="password">
                        <span class="input-group-text" id="togglePassword" style="cursor:pointer;">
                            <i class="fa-solid fa-eye-slash" id="toggleIcon"></i>
                        </span>
                    </div>
                    <div class="form-check my-2">
                        <input class="form-check-input" type="checkbox" id="keepLoggedIn" checked>
                        <label class="form-check-label" for="keepLoggedIn" data-i18n="keep_me_login"></label>
                    </div>
                    <button type="button" class="btn-login login-btn w-100" data-i18n="login"></button>
                    <div class="mt-3 text-center">
                        <a href="forgot-password" class="text-white" data-i18n="forgot_password"></a>
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