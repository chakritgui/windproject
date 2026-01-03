<div class="container-fluid mt-3 mb-5">
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
            <button class="nav-link active" data-bs-toggle="pill" data-bs-target="#general" type="button"><i class="bi bi-house-fill me-2"></i><span data-i18n="information"></span></button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link" data-bs-toggle="pill" data-bs-target="#backgrounds" type="button"><i class="bi bi-image-fill me-2"></i><span data-i18n="background"></span></button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link" data-bs-toggle="pill" data-bs-target="#languages" type="button"><i class="bi bi-translate me-2"></i><span data-i18n="language"></span></button>
        </li>
    </ul>
    <div class="tab-content">
        <div class="tab-pane fade show active" id="general">
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title mb-3"><i class="bi bi-image text-primary me-2"></i><span data-i18n="logo"></span></h5>
                    <div class="row">
                        <div class="col-md-4">
                            <label class="form-label" data-i18n="logo"></label>
                            <div class="preview-box" id="logoPreview">
                                <div class="text-center">
                                    <i class="bi bi-cloud-upload fs-1 text-muted"></i>
                                    <p class="mt-2 text-muted"><span data-i18n="uploadFile"></span></p>
                                    <small class="text-muted">PNG, JPG (<span data-i18n="recommend"></span> 200x200px)</small>
                                </div>
                            </div>
                            <input type="file" id="logoInput" class="d-none" accept="image/*" onchange="previewLogo(this)">
                            <button class="btn btn-outline-primary w-100 mt-3 upload-btn" onclick="document.getElementById('logoInput').click()"><i class="bi bi-upload me-2"></i><span data-i18n="choose"></span></button>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label" data-i18n="icon"></label>
                            <div class="preview-box" id="iconPreview">
                                <div class="text-center">
                                    <i class="bi bi-cloud-upload fs-1 text-muted"></i>
                                    <p class="mt-2 text-muted"><span data-i18n="uploadFile"></span></p>
                                    <small class="text-muted">PNG, JPG (<span data-i18n="recommend"></span> 200x200px)</small>
                                </div>
                            </div>
                            <input type="file" id="iconInput" class="d-none" accept="image/*" onchange="previewIcon(this)">
                            <button class="btn btn-outline-primary w-100 mt-3 upload-btn" onclick="document.getElementById('iconInput').click()"><i class="bi bi-upload me-2"></i><span data-i18n="choose"></span></button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title mb-3"><i class="bi bi-text-left text-primary me-2"></i><span data-i18n="website_name"></span></h5>
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
            <div class="text-end mt-4">
                <button class="btn btn-lg btn-success save-setting-1">
                    <i class="bi bi-save me-2"></i><span data-i18n="save"></span>
                </button>
            </div>
        </div>
        <div class="tab-pane fade" id="backgrounds">
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title mb-3"><i class="bi bi-images text-primary me-2"></i>รูปพื้นหลังแต่ละหน้า</h5>
                    <p class="text-muted">อัปโหลดรูปภาพพื้นหลังสำหรับแต่ละหน้าของเว็บไซต์</p>
                    <div class="row g-4">
                        <div class="col-md-6">
                            <div class="card border">
                                <div class="card-header bg-light">
                                    <h6 class="mb-0"><i class="bi bi-house-door me-2"></i>หน้าแรก (Home)</h6>
                                </div>
                                <div class="card-body">
                                    <div class="preview-box" id="bgHome">
                                        <div class="text-center">
                                            <i class="bi bi-image fs-2 text-muted"></i>
                                            <p class="mt-2 mb-0 text-muted">อัปโหลดพื้นหลัง</p>
                                        </div>
                                        <button class="remove-btn" onclick="removeBackground('bgHome')">
                                            <i class="bi bi-x"></i>
                                        </button>
                                    </div>
                                    <input type="file" id="bgHomeInput" class="d-none" accept="image/*" onchange="previewBackground('bgHome', this)">
                                    <button class="btn btn-sm btn-outline-primary w-100 mt-2" onclick="document.getElementById('bgHomeInput').click()">
                                        <i class="bi bi-upload me-2"></i>เลือกรูป
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card border">
                                <div class="card-header bg-light">
                                    <h6 class="mb-0"><i class="bi bi-info-circle me-2"></i>เกี่ยวกับเรา (About)</h6>
                                </div>
                                <div class="card-body">
                                    <div class="preview-box" id="bgAbout">
                                        <div class="text-center">
                                            <i class="bi bi-image fs-2 text-muted"></i>
                                            <p class="mt-2 mb-0 text-muted">อัปโหลดพื้นหลัง</p>
                                        </div>
                                        <button class="remove-btn" onclick="removeBackground('bgAbout')">
                                            <i class="bi bi-x"></i>
                                        </button>
                                    </div>
                                    <input type="file" id="bgAboutInput" class="d-none" accept="image/*" onchange="previewBackground('bgAbout', this)">
                                    <button class="btn btn-sm btn-outline-primary w-100 mt-2" onclick="document.getElementById('bgAboutInput').click()">
                                        <i class="bi bi-upload me-2"></i>เลือกรูป
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card border">
                                <div class="card-header bg-light">
                                    <h6 class="mb-0"><i class="bi bi-briefcase me-2"></i>บริการของเรา (Services)</h6>
                                </div>
                                <div class="card-body">
                                    <div class="preview-box" id="bgServices">
                                        <div class="text-center">
                                            <i class="bi bi-image fs-2 text-muted"></i>
                                            <p class="mt-2 mb-0 text-muted">อัปโหลดพื้นหลัง</p>
                                        </div>
                                        <button class="remove-btn" onclick="removeBackground('bgServices')">
                                            <i class="bi bi-x"></i>
                                        </button>
                                    </div>
                                    <input type="file" id="bgServicesInput" class="d-none" accept="image/*" onchange="previewBackground('bgServices', this)">
                                    <button class="btn btn-sm btn-outline-primary w-100 mt-2" onclick="document.getElementById('bgServicesInput').click()"><i class="bi bi-upload me-2"></i>เลือกรูป</button>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card border">
                                <div class="card-header bg-light">
                                    <h6 class="mb-0"><i class="bi bi-envelope me-2"></i>ติดต่อเรา (Contact)</h6>
                                </div>
                                <div class="card-body">
                                    <div class="preview-box" id="bgContact">
                                        <div class="text-center">
                                            <i class="bi bi-image fs-2 text-muted"></i>
                                            <p class="mt-2 mb-0 text-muted">อัปโหลดพื้นหลัง</p>
                                        </div>
                                        <button class="remove-btn" onclick="removeBackground('bgContact')"><i class="bi bi-x"></i></button>
                                    </div>
                                    <input type="file" id="bgContactInput" class="d-none" accept="image/*" onchange="previewBackground('bgContact', this)">
                                    <button class="btn btn-sm btn-outline-primary w-100 mt-2" onclick="document.getElementById('bgContactInput').click()"><i class="bi bi-upload me-2"></i>เลือกรูป</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="tab-pane fade" id="languages">
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title mb-3"><i class="bi bi-globe text-primary me-2"></i><span data-i18n="language-switch"></span></h5>
                    <p class="text-muted" data-i18n="choose_language_display"></p>
                    <div class="row g-3 mt-3">
                        <div class="col-md-4">
                            <div class="lang-toggle" id="langEn" onclick="toggleLanguage('en')">
                                <div class="d-flex align-items-center justify-content-between">
                                    <div>
                                        <img src="<?=BASE_URL?>/public/flags/gb.png" alt="EN" class="me-3" height="35">
                                        <strong>English</strong>
                                    </div>
                                    <i class="bi bi-circle fs-4 text-muted"></i>
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
                                    <i class="bi bi-circle fs-4 text-muted"></i>
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
                                    <i class="bi bi-circle fs-4 text-muted"></i>
                                </div>
                                <small class="d-block mt-2 opacity-75">Thai Language</small>
                            </div>
                        </div>
                    </div>
                    <div class="alert alert-info mt-4" role="alert">
                        <i class="bi bi-info-circle-fill me-2"></i>
                        <span data-i18n="language_note"></span>
                    </div>
                </div>
            </div>
            <div class="text-end mt-4">
                <button class="btn btn-lg btn-success save-setting-3">
                    <i class="bi bi-save me-2"></i><span data-i18n="save"></span>
                </button>
            </div>
        </div>
    </div>
</div>
<link rel="stylesheet" href="<?=BASE_URL?>/public/css/setting.css?v=<?=time();?>">
<script src="<?=BASE_URL?>/public/js/admin/setting.js?v=<?=time()?>"></script>