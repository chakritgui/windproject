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
                    <div class="login-title text-center mb-3" data-i18n="forgot_your_password"></div>
                    <p class="text-center mb-2" data-i18n="please_enter_email"></p>
                    <input type="text" class="form-control mb-3" id="email">
                    <button type="button" class="btn-login login-forgot w-100" data-i18n="continue"></button>
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