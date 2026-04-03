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
            <div class="auth-title mb-3" data-i18n="sign_in_continue"></div>
            <div>
                <label class="auth-label">
                    <i class="fa-regular fa-circle-user"></i>
                    <span data-i18n="username"></span>
                </label>
                <input type="text" class="auth-input" id="username" autocomplete="username">
                <label class="auth-label">
                    <i class="fa-solid fa-lock"></i>
                    <span data-i18n="password"></span>
                </label>
                <div class="auth-pw-group">
                    <input type="password" class="auth-input" id="password" autocomplete="current-password">
                    <button class="auth-pw-toggle" id="togglePassword" type="button" tabindex="-1">
                        <i class="fa-solid fa-eye-slash" id="toggleIcon"></i>
                    </button>
                </div>
                <div class="auth-check-row">
                    <input type="checkbox" id="keepLoggedIn" checked>
                    <label for="keepLoggedIn" data-i18n="keep_me_login"></label>
                </div>
                <button type="button" class="btn-login login-btn" data-i18n="login"></button>
                <div class="auth-forgot-link forgot-password-link mt-2">
                    <a href="forgot-password" data-i18n="forgot_password"></a>
                </div>
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
<link rel="preload" href="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js" as="script">
<link rel="preload" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.4.0/leaflet.css" as="style">
<link rel="preload" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.4.0/leaflet.js" as="script">
<link rel="preload" href="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js" as="script">
<link rel="preload" href="https://api.windy.com/assets/map-forecast/libBoot.js" as="script">
<link rel="preload" href="https://threejs.org/examples/textures/land_ocean_ice_cloud_2048.jpg" as="image">
<link rel="preload" href="https://threejs.org/examples/sprites/circle.png" as="image">
<script>
    window.addEventListener('load', function() {
        const textures = [
            'https://threejs.org/examples/textures/land_ocean_ice_cloud_2048.jpg',
            'https://threejs.org/examples/sprites/circle.png'
        ];
        textures.forEach(url => {
            const img = new Image();
            img.src = url;
        });
        console.log("Background preloading started...");
    });
</script>