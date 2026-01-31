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
    <ul class="nav nav-pills mb-4" role="tablist">
        <li class="nav-item" role="presentation">
            <button class="nav-link active" data-bs-toggle="pill" data-bs-target="#general" type="button"><i class="fa-solid fa-house-chimney me-2"></i><span data-i18n="information"></span></button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link" data-bs-toggle="pill" data-bs-target="#languages" type="button"><i class="fa-solid fa-language me-2"></i><span data-i18n="language"></span></button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link" data-bs-toggle="pill" data-bs-target="#background" type="button"><i class="fa-solid fa-images me-2"></i><span data-i18n="background"></span></button>
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
                    </div>
                </div>
            </div>
            <div class="text-end mt-4">
                <button class="btn btn-lg btn-primary save-setting-2">
                    <i class="fa-solid fa-floppy-disk me-2"></i><span data-i18n="save"></span>
                </button>
            </div>
        </div>
    </div>
</div>
<link rel="stylesheet" href="<?=BASE_URL?>/public/css/setting.css?v=<?=time();?>">
<script src="<?=BASE_URL?>/public/js/admin/setting.js?v=<?=time()?>"></script>