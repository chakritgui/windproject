<div class="container h-100 position-relative content-wrapper">
    <div class="row h-100 align-items-center">
        <div class="col-lg-5 col-md-12 col-12 d-flex flex-column align-items-center mb-4 mb-lg-0">
            <div class="logo-container bg-white shadow rounded-4">
                <div class="logo-header">
                    <img src="<?=BASE_URL?>public/images/logo.png" alt="" class="logo">
                    <div class="logo-text">
                        <h4 class="text-success">ກຸ່ມບໍລິສັດ ພົງຊັບທະວີ</h4>
                        <p>PHONGSUPTHAVY <span class="text-success">GROUP</span></p>
                    </div>
                </div>
                <div class="login-title mb-3" data-i18n="forgot_your_password"></div>
                <input type="text" class="form-control mb-3" id="email">
                <button type="button" class="btn-login login-forgot" data-i18n="continue"></button>
                <div class="mt-3 text-center">
                    <a href="login" class="text-primary" data-i18n="return_to_login"></a>
                </div>
            </div>
            <div class="text-white mt-3 text-center" data-i18n="project-info"></div>
        </div>
        <div class="col-lg-7 col-md-12 text-center text-white">
            <h2 class="main-title" data-i18n="main_title"></h2>
            <p class="subtitle" data-i18n="subtitle"></p>
            <div class="row g-3 justify-content-center mt-4">
                <div class="col-4 col-md-2 text-center">
                    <div class="feature-icon"><i class="fas fa-wind"></i></div>
                    <div class="feature-label" data-i18n="wind_energy"></div>
                </div>
                <div class="col-4 col-md-2 text-center">
                    <div class="feature-icon"><i class="fas fa-solar-panel"></i></div>
                    <div class="feature-label" data-i18n="solar_cell"></div>
                </div>
                <div class="col-4 col-md-2 text-center">
                    <div class="feature-icon"><i class="fas fa-leaf"></i></div>
                    <div class="feature-label" data-i18n="biomass"></div>
                </div>
                <div class="col-4 col-md-2 text-center">
                    <div class="feature-icon"><i class="fas fa-recycle"></i></div>
                    <div class="feature-label" data-i18n="renewable"></div>
                </div>
                <div class="col-4 col-md-2 text-center">
                    <div class="feature-icon"><i class="fas fa-battery-full"></i></div>
                    <div class="feature-label" data-i18n="battery"></div>
                </div>
            </div>
        </div>
    </div>
</div>
<script src="<?=BASE_URL?>/public/js/auth/auth.js?v=<?=time()?>"></script>