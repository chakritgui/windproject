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
                <div class="login-title mb-3" data-i18n="sign_in_continue"></div>
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
                    <input class="form-check-input" type="checkbox" id="keepLoggedIn">
                    <label class="form-check-label" for="keepLoggedIn" data-i18n="keep_me_login"></label>
                </div>
                <button type="button" class="btn-login login-btn" data-i18n="login"></button>
                <div class="mt-3 text-center">
                    <a href="forgot-password" class="text-primary" data-i18n="forgot_password"></a>
                </div>
            </div>
            <div class="text-white mt-3 text-center project-info"></div>
        </div>
        <div class="col-lg-7 col-md-12 text-center text-white"></div>
    </div>
</div>
<script src="<?=BASE_URL?>/public/js/auth/auth.js?v=<?=time()?>"></script>