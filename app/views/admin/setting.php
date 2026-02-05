<style>
    input[type="radio"]:disabled {
        cursor: not-allowed;
        opacity: 0.5;
    }
    input[type="radio"]:disabled + span, 
    tr:has(input:disabled) td {
        color: #ccc; 
    }
    .lang-toggle {
        cursor: pointer;
        border: 2px solid #eee;
        transition: all 0.3s ease;
    }
    .lang-toggle.active {
        border-color: #0d6efd;
        background-color: #f0f7ff;
    }
</style>
<div class="container-fluid mt-90 mb-5">
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 p-3 rounded-3 shadow-sm" style="background: #ffffff; border-left: 4px solid #0d6efd;">
        <div class="mb-2 mb-md-0">
            <h4 class="fw-bold mb-1 d-flex align-items-center" style="font-size: 1.35rem;">
                <i class="fas fa-map-marked-alt me-2 text-primary" style="font-size: 1.5rem;"></i>
                <span data-i18n="website_management"></span>
            </h4>
            <nav aria-label="breadcrumb" style="margin-left: 25px;">
                <ol class="breadcrumb mb-0 small">
                    <li class="breadcrumb-item">
                        <span data-i18n="admin"></span>
                    </li>
                    <li class="breadcrumb-item active" aria-current="page">
                        <span data-i18n="setting"></span>
                    </li>
                </ol>
            </nav>
        </div>
    </div>
</div>
<div class="container-fluid mt-3 mb-5">
    <ul class="nav nav-pills mb-4" role="tablist" id="mainTabs">
        <li class="nav-item" role="presentation">
            <button class="nav-link active" data-bs-toggle="pill" data-bs-target="#general" type="button"><i class="fa-solid fa-house-chimney me-2"></i><span data-i18n="information"></span></button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link" data-bs-toggle="pill" data-bs-target="#languages" type="button"><i class="fa-solid fa-language me-2"></i><span data-i18n="language"></span></button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link" data-bs-toggle="pill" data-bs-target="#background" type="button"><i class="fa-solid fa-images me-2"></i><span data-i18n="background"></span></button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link" data-bs-toggle="pill" data-bs-target="#configuration" type="button"><i class="fa-solid fa-gears me-2"></i><span data-i18n="configuration"></span></button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link" data-bs-toggle="pill" data-bs-target="#notifications" type="button"><i class="fa-solid fa-bell me-2"></i><span data-i18n="notifications"></span></button>
        </li>
    </ul>
    <div class="tab-content">
        <div class="tab-pane fade show active" id="general">
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title mb-3"><i class="fa-solid fa-images text-primary me-2"></i><span data-i18n="logo"></span></h5>
                    <div class="row">
                        <div class="col-md-4">
                            <label class="form-label" data-i18n="logo"></label>
                            <div class="preview-box" id="logoPreview">
                                <div class="text-center">
                                    <i class="fa-solid fa-cloud-arrow-up fs-1 text-muted"></i>
                                    <p class="mt-2 text-muted"><span data-i18n="uploadFile"></span></p>
                                    <small class="text-muted"><span data-i18n="image"></span> (<span data-i18n="recommend"></span> 200 x 200px)</small>
                                </div>
                            </div>
                            <input type="file" id="logoInput" class="d-none" accept="image/*" onchange="previewImage(this, 'logoPreview')">
                            <button class="btn btn-outline-primary w-100 mt-3 upload-btn" onclick="document.getElementById('logoInput').click()"><i class="fa-solid fa-upload me-2"></i><span data-i18n="choose"></span></button>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label" data-i18n="icon"></label>
                            <div class="preview-box" id="iconPreview">
                                <div class="text-center">
                                    <i class="a-cloud-arrow-up fs-1 text-muted"></i>
                                    <p class="mt-2 text-muted"><span data-i18n="uploadFile"></span></p>
                                    <small class="text-muted"><span data-i18n="image"></span> (<span data-i18n="recommend"></span> 200 x 200px)</small>
                                </div>
                            </div>
                            <input type="file" id="iconInput" class="d-none" accept="image/*" onchange="previewImage(this, 'iconPreview')">
                            <button class="btn btn-outline-primary w-100 mt-3 upload-btn" onclick="document.getElementById('iconInput').click()"><i class="fa-solid fa-upload me-2"></i><span data-i18n="choose"></span></button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title mb-3"><i class="fa-solid fa-align-left text-primary me-2"></i><span data-i18n="website_name"></span></h5>
                    <div class="row g-3">
                        <div class="col-md-4">
                            <label class="form-label">
                                <img src="<?=BASE_URL?>/public/flags/gb.png" alt="EN" height="25"> English
                            </label>
                            <input type="text" class="form-control" id="nameEn">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">
                                <img src="<?=BASE_URL?>/public/flags/la.png" alt="LO" height="25"> ພາສາລາວ
                            </label>
                            <input type="text" class="form-control" id="nameLo">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">
                                <img src="<?=BASE_URL?>/public/flags/th.png" alt="TH" height="25"> ภาษาไทย
                            </label>
                            <input type="text" class="form-control" id="nameTh">
                        </div>
                    </div>
                </div>
            </div>
            <div class="card">
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-4">
                            <h5 class="card-title mb-3"><i class="fa-solid fa-align-left text-primary me-2"></i><span data-i18n="footer"></span></h5>
                            <input type="text" class="form-control" id="footerText">
                        </div>
                        <div class="col-md-4">
                            <h5 class="card-title mb-3"><i class="fa-solid fa-align-left text-primary me-2"></i><span data-i18n="site_assessment"></span></h5>
                            <input type="text" class="form-control" id="site_assessment">
                        </div>
                    </div>
                </div>
            </div>
            <div class="text-end mt-4">
                <button class="btn btn-lg btn-primary save-setting-1">
                    <i class="fa-solid fa-floppy-disk me-2"></i><span data-i18n="save"></span>
                </button>
            </div>
        </div>
        <div class="tab-pane fade" id="languages">
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title mb-3"><i class="fa-solid fa-globe text-primary me-2"></i><span data-i18n="language-switch"></span></h5>
                    <p class="text-muted" data-i18n="choose_language_display"></p>
                    <div class="row g-3 mt-3">
                        <div class="col-md-4">
                            <div class="lang-toggle" id="langEn" onclick="toggleLanguage('en')">
                                <div class="d-flex align-items-center justify-content-between">
                                    <div>
                                        <img src="<?=BASE_URL?>/public/flags/gb.png" alt="EN" class="me-3" height="35">
                                        <strong>English</strong>
                                    </div>
                                    <i class="fa-solid fa-circle fs-4 text-muted"></i>
                                </div>
                                <small class="d-block mt-2 opacity-75">English Language</small>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="lang-toggle" id="langLo" onclick="toggleLanguage('lo')">
                                <div class="d-flex align-items-center justify-content-between">
                                    <div>
                                        <img src="<?=BASE_URL?>/public/flags/la.png" alt="LO" class="me-3" height="35">
                                        <strong>ພາສາລາວ</strong>
                                    </div>
                                    <i class="fa-solid fa-circle fs-4 text-muted"></i>
                                </div>
                                <small class="d-block mt-2 opacity-75">Lao Language</small>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="lang-toggle" id="langTh" onclick="toggleLanguage('th')">
                                <div class="d-flex align-items-center justify-content-between">
                                    <div>
                                        <img src="<?=BASE_URL?>/public/flags/th.png" alt="TH" class="me-3" height="35">
                                        <strong>ภาษาไทย</strong>
                                    </div>
                                    <i class="fa-solid fa-circle fs-4 text-muted"></i>
                                </div>
                                <small class="d-block mt-2 opacity-75">Thai Language</small>
                            </div>
                        </div>
                    </div>
                    <hr class="my-4">
                    <h5 class="card-title mb-3"><i class="fa-solid fa-gears text-primary me-2"></i><span data-i18n="system_default_settings"></span></h5>
                    <div class="table-responsive">
                        <table class="table table-hover align-middle border">
                            <thead class="table-light">
                                <tr>
                                    <th style="width: 50%;"></th>
                                    <th class="text-center">English</th>
                                    <th class="text-center">ລາວ</th>
                                    <th class="text-center">ไทย</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><span data-i18n="language_website_default"></span></td>
                                    <td class="text-center"><input type="radio" name="language_default" value="en" class="form-check-input" checked></td>
                                    <td class="text-center"><input type="radio" name="language_default" value="lo" class="form-check-input"></td>
                                    <td class="text-center"><input type="radio" name="language_default" value="th" class="form-check-input"></td>
                                </tr>
                                <tr>
                                    <td><span data-i18n="language_content_default"></span></td>
                                    <td class="text-center"><input type="radio" name="language_content" value="en" class="form-check-input"></td>
                                    <td class="text-center"><input type="radio" name="language_content" value="lo" class="form-check-input" checked></td>
                                    <td class="text-center"><input type="radio" name="language_content" value="th" class="form-check-input"></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="alert alert-primary mt-4" role="alert">
                        <i class="fa-solid fa-circle-info me-2"></i>
                        <span data-i18n="language_note"></span>
                    </div>
                </div>
            </div>
            <div class="text-end mt-4">
                <button class="btn btn-lg btn-primary save-setting-3">
                    <i class="fa-solid fa-floppy-disk me-2"></i><span data-i18n="save"></span>
                </button>
            </div>
        </div>
        <div class="tab-pane fade" id="background">
            <div class="card">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-4">
                            <label class="form-label" data-i18n="login_pc"></label>
                            <div class="preview-box" id="loginPreview">
                                <div class="text-center">
                                    <i class="fa-solid fa-cloud-arrow-up fs-1 text-muted"></i>
                                    <p class="mt-2 text-muted"><span data-i18n="uploadFile"></span></p>
                                    <small class="text-muted"><span data-i18n="image"></span> (<span data-i18n="recommend"></span> 2560 × 1440px)</small>
                                </div>
                            </div>
                            <input type="file" id="loginInput" class="d-none" accept="image/*" onchange="previewImage(this, 'loginPreview')">
                            <input type="hidden" id="oldLoginBg">
                            <div style="display: flex; gap: 10px;">
                                <button class="btn btn-outline-primary w-100 mt-3 upload-btn" onclick="document.getElementById('loginInput').click()"><i class="fa-solid fa-upload me-2"></i><span data-i18n="choose"></span></button>
                                <button class="btn btn-outline-danger w-100 mt-3 btn-remove-pc d-none" onclick="removeImage('loginPreview', 'loginInput')"><i class="fa-solid fa-trash-can me-2"></i><span data-i18n="remove"></span></button> 
                            </div>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label" data-i18n="login_mobile"></label>
                            <div class="preview-box" id="loginMobilePreview">
                                <div class="text-center">
                                    <i class="fa-solid fa-cloud-arrow-up fs-1 text-muted"></i>
                                    <p class="mt-2 text-muted"><span data-i18n="uploadFile"></span></p>
                                    <small class="text-muted"><span data-i18n="image"></span> (<span data-i18n="recommend"></span> 1080 × 1920px)</small>
                                </div>
                            </div>
                            <input type="file" id="loginMobileInput" class="d-none" accept="image/*" onchange="previewImage(this, 'loginMobilePreview')">
                            <input type="hidden" id="oldLoginMobileBg">
                            <div style="display: flex; gap: 10px;">
                                <button class="btn btn-outline-primary w-100 mt-3 upload-btn" onclick="document.getElementById('loginMobileInput').click()"><i class="fa-solid fa-upload me-2"></i><span data-i18n="choose"></span></button> 
                                <button class="btn btn-outline-danger w-100 mt-3 btn-remove-mobile d-none" onclick="removeImage('loginMobilePreview', 'loginMobileInput')"><i class="fa-solid fa-trash-can me-2"></i><span data-i18n="remove"></span></button> 
                            </div>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label" data-i18n="infography"></label>
                            <div class="preview-box" id="infographyPreview">
                                <div class="text-center">
                                    <i class="fa-solid fa-cloud-arrow-up fs-1 text-muted"></i>
                                    <p class="mt-2 text-muted"><span data-i18n="uploadFile"></span></p>
                                    <small class="text-muted" data-i18n="image/video"></small>
                                </div>
                            </div>
                            <input type="file" id="infographyInput" class="d-none" accept="image/*,video/*" onchange="previewImage(this, 'infographyPreview', 'infography')">
                            <input type="hidden" id="oldinfographyBg">
                            <div style="display: flex; gap: 10px;">
                                <button class="btn btn-outline-primary w-100 mt-3 upload-btn" onclick="document.getElementById('infographyInput').click()">
                                    <i class="fa-solid fa-upload me-2"></i><span data-i18n="choose"></span>
                                </button> 
                                <button class="btn btn-outline-danger w-100 mt-3 btn-remove-infography d-none" onclick="removeImage('infographyPreview', 'infographyInput', 'infography')">
                                    <i class="fa-solid fa-trash-can me-2"></i><span data-i18n="remove"></span>
                                </button> 
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="text-end mt-4">
                <button class="btn btn-lg btn-primary save-setting-2">
                    <i class="fa-solid fa-floppy-disk me-2"></i><span data-i18n="save"></span>
                </button>
            </div>
        </div>
        <div class="tab-pane fade" id="configuration">
            <div class="card border-0 shadow-sm rounded-4">
                <div class="card-header bg-white py-3">
                    <ul class="nav nav-pills card-header-pills" id="mainTabs" role="tablist">
                        <li class="nav-item" role="presentation">
                            <button class="nav-link active" id="general-tab" data-bs-toggle="tab" data-bs-target="#general-config" type="button" role="tab">
                                <i class="fa-solid fa-earth-asia me-2"></i><span data-i18n="general_settings"></span>
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="email-tab" data-bs-toggle="tab" data-bs-target="#email-config" type="button" role="tab">
                                <i class="fa-solid fa-envelope me-2"></i><span data-i18n="email_settings"></span>
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="api-tab" data-bs-toggle="tab" data-bs-target="#api-config" type="button" role="tab">
                                <i class="fa-solid fa-key me-2"></i><span data-i18n="api_settings"></span>
                            </button>
                        </li>
                    </ul>
                </div>
                <div class="card-body p-4">
                    <form id="systemConfigForm">
                        <div class="tab-content" id="configTabContent">
                            <div class="tab-pane fade show active" id="general-config" role="tabpanel">
                                <div class="row g-3">
                                    <div class="col-md-12">
                                        <label class="form-label fw-bold" data-i18n="domain_name"></label>
                                        <input type="url" name="DOMAIN_NAME" class="form-control" placeholder="https://yourdomain.com">
                                        <div class="form-text" data-i18n="specify_the_system's_main_URL."></div>
                                    </div>
                                </div>
                            </div>
                            <div class="tab-pane fade" id="email-config" role="tabpanel">
                                <div class="row g-3">
                                    <div class="col-md-8">
                                        <label class="form-label fw-bold" data-i18n="mail_host"></label>
                                        <input type="text" name="MAIL_HOST" class="form-control" placeholder="smtp.gmail.com">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label fw-bold" data-i18n="mail_port"></label>
                                        <input type="number" name="MAIL_PORT" class="form-control" placeholder="587">
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label fw-bold" data-i18n="mail_user"></label>
                                        <input type="email" name="MAIL_USER" class="form-control" placeholder="example@mail.com">
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label fw-bold" data-i18n="mail_pass"></label>
                                        <div class="input-group">
                                            <input type="password" name="MAIL_PASS" id="mail_pass_input" class="form-control">
                                            <button class="btn btn-outline-secondary" type="button" onclick="toggleVisibility('mail_pass_input')"><i class="fa-solid fa-eye"></i></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="tab-pane fade" id="api-config" role="tabpanel">
                                <div class="row g-3">
                                    <div class="col-md-12">
                                        <label class="form-label fw-bold" data-i18n="windy_key"></label>
                                        <input type="text" name="WINDY_KEY" class="form-control">
                                    </div>
                                    <div class="col-md-12">
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" id="enableTranslate" name="ENABLE_TRANSLATE" value="1">
                                            <label class="form-check-label fw-bold" for="enableTranslate" data-i18n="use_a_translate"></label>
                                        </div>
                                    </div>
                                    <div class="col-md-12" id="googleApiKeyContainer" style="display: none;">
                                        <label class="form-label fw-bold" data-i18n="google_api_key_for_translate"></label>
                                        <input type="text" name="GOOGLE_API_KEY" class="form-control">
                                    </div>
                                </div>
                            </div>
                        </div>
                        <hr class="my-4">
                        <div class="text-end mt-4">
                            <button class="btn btn-lg btn-primary save-configuration">
                                <i class="fa-solid fa-floppy-disk me-2"></i><span data-i18n="save"></span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        <div class="tab-pane fade" id="notifications">
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title mb-4">
                        <i class="fa-solid fa-bell text-primary me-2"></i>
                        <span data-i18n="notification"></span>
                    </h5>
                    <form id="notificationSettingForm">
                        <div class="row g-4">
                            <div class="col-md-6">
                                <div class="p-3 border rounded-3 bg-light">
                                    <div class="form-check form-switch d-flex align-items-center justify-content-between p-0">
                                        <div>
                                            <label class="form-check-label fw-bold fs-5" for="notifyEmail" data-i18n="email_notification"></label>
                                            <p class="text-muted small mb-0" data-i18n="receive_notifications_email"></p>
                                        </div>
                                        <input class="form-check-input ms-0" type="checkbox" name="NOTIFY_EMAIL" id="notifyEmail" style="width: 2.5em; height: 1.25em;">
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="p-3 border rounded-3 bg-light">
                                    <div class="form-check form-switch d-flex align-items-center justify-content-between p-0">
                                        <div>
                                            <label class="form-check-label fw-bold fs-5" for="notifyPwa" data-i18n="notifyPwa"></label>
                                            <p class="text-muted small mb-0" data-i18n="receive_notifications_pwa"></p>
                                        </div>
                                        <input class="form-check-input ms-0" type="checkbox" name="NOTIFY_PWA" id="notifyPwa" style="width: 2.5em; height: 1.25em;">
                                    </div>
                                </div>
                            </div>
                            <div class="col-12 mt-4">
                                <div class="alert alert-info border-0 shadow-sm">
                                    <i class="fa-solid fa-clock-rotate-left me-2"></i>
                                    <strong data-i18n="queuing_system"></strong> <span data-i18n="email_tip"></span>
                                </div>
                            </div>
                        </div>
                        <div class="text-end mt-4">
                            <button type="button" class="btn btn-lg btn-primary save-notification">
                                <i class="fa-solid fa-floppy-disk me-2"></i><span data-i18n="save"></span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>
<link rel="stylesheet" href="<?=BASE_URL?>/public/css/setting.css?v=<?=time();?>">
<script src="<?=BASE_URL?>/public/js/admin/setting.js?v=<?=time()?>"></script>