<div class="container-fluid mt-3 mb-4">
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 p-3 rounded-3 shadow-sm" style="background: #ffffff; border-left: 4px solid #0d6efd;">
        <div class="mb-2 mb-md-0">
            <h4 class="fw-bold mb-1 d-flex align-items-center" style="font-size: 1.35rem;">
                <i class="fa-regular fa-circle-down me-2 text-primary" style="font-size: 1.5rem;"></i>
                <span data-i18n="shortcut_management"></span>
            </h4>
            <nav aria-label="breadcrumb" style="margin-left: 25px;">
                <ol class="breadcrumb mb-0 small">
                    <li class="breadcrumb-item">
                        <span data-i18n="admin"></span>
                    </li>
                    <li class="breadcrumb-item active" aria-current="page">
                        <span data-i18n="shortcut"></span>
                    </li>
                </ol>
            </nav>
        </div>
    </div>
</div>
<div class="container-fluid mt-4 mb-5">
    <form id="pwaForm">
        <div class="row g-4 mb-2">
            <div class="col-12">
                <div class="text-success shortcut-date"></div>
            </div>
        </div>
        <div class="row g-4 mb-4">
            <div class="col-12">
                <div class="p-4 border rounded-3 shadow-sm bg-white">
                    <div class="d-flex align-items-center justify-content-between mb-3">
                        <h6 class="fw-bold mb-0 d-flex align-items-center">
                            <i class="fa-solid fa-circle-info me-2 text-primary"></i>
                            <span data-i18n="basic_infomation"></span>
                        </h6>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label required">
                                <span data-i18n="app_name"></span>
                            </label>
                            <input type="text" class="form-control obj-required" id="appName" maxlength="12">
                            <div class="help-text" data-i18n="help-text1"></div>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label"><span data-i18n="app_full_name"></span></label>
                            <input type="text" class="form-control" id="appFullName">
                            <div class="help-text" data-i18n="help-text2"></div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label" data-i18n="description"></label>
                        <textarea class="form-control" id="description" rows="2"></textarea>
                    </div>
                    <div class="info-alert">
                        <i class="fa-solid fa-lightbulb me-2"></i>
                        <div data-i18n="help-text3"></div>
                    </div>
                </div>
            </div>
        </div>
        <div class="row g-4">
            <div class="col-md-6">
                <div class="p-3 border rounded-3 shadow-sm bg-white h-100">
                    <div class="card-header-custom mb-3">
                        <h6 class="fw-bold mb-0 text-dark d-flex align-items-center">
                            <i class="fa-brands fa-apple me-2"></i>
                            iOS
                        </h6>
                    </div>
                    <div class="mb-3">
                        <label class="form-label required"><span data-i18n="icon"></span> (180x180px)</label>
                        <div class="icon-preview" id="iosIconPreview">
                            <i class="fa-brands fa-apple"></i>
                        </div>
                        <input type="file" class="form-control obj-required" id="iosIcon" accept="image/png">
                        <div class="help-text" data-i18n="help-text4"></div>
                    </div>
                    <div class="section-divider">
                        <span class="section-divider-text" data-i18n="display_settings"></span>
                    </div>
                    <div class="mb-3">
                        <label class="form-label" data-i18n="status_bar_style"></label>
                        <select class="form-select" id="statusBarStyle">
                            <option value="default" selected data-i18n="default_black_text"></option>
                            <option value="black" data-i18n="black_solid_black"></option>
                            <option value="black-translucent" data-i18n="black_translucent"></option>
                        </select>
                        <div class="help-text" data-i18n="help-text5"></div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label" data-i18n="web_app_mode"></label>
                        <select class="form-select" id="appleWebAppCapable">
                            <option value="yes" selected data-i18n="yes_full_screen"></option>
                            <option value="no" data-i18n="no_open"></option>
                        </select>
                        <div class="help-text" data-i18n="help-text6"></div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="p-3 border rounded-3 shadow-sm bg-white h-100">
                    <div class="card-header-custom mb-3">
                        <h6 class="fw-bold mb-0 text-success d-flex align-items-center">
                            <i class="fa-brands fa-android me-2"></i>
                            Android
                        </h6>
                    </div>
                    <div class="mb-3">
                        <label class="form-label required"><span data-i18n="icon"></span> (512x512px)</label>
                        <div class="icon-preview" id="androidIconPreview">
                            <i class="fa-brands fa-android"></i>
                        </div>
                        <input type="file" class="form-control obj-required" id="androidIcon" accept="image/png">
                        <div class="help-text" data-i18n="help-text7"></div>
                    </div>
                    <div class="section-divider">
                        <span class="section-divider-text" data-i18n="theme"></span>
                    </div>
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label class="form-label" data-i18n="theme">Theme Color</label>
                            <div class="color-input-wrapper">
                                <input type="color" id="themeColor" value="#0d6efd">
                                <input type="text" class="form-control" id="themeColorHex" value="#0d6efd" pattern="^#[0-9A-Fa-f]{6}$">
                            </div>
                            <div class="help-text" data-i18n="help-text8"></div>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label" data-i18n="background_color"></label>
                            <div class="color-input-wrapper">
                                <input type="color" id="bgColor" value="#ffffff">
                                <input type="text" class="form-control" id="bgColorHex" value="#ffffff" pattern="^#[0-9A-Fa-f]{6}$">
                            </div>
                            <div class="help-text" data-i18n="help-text9"></div>
                        </div>
                    </div>
                    <div class="section-divider">
                        <span class="section-divider-text" data-i18n="display_options"></span>
                    </div>
                    <div class="mb-3">
                        <label class="form-label" data-i18n="display_mode"></label>
                        <select class="form-select" id="displayMode">
                            <option value="standalone" selected data-i18n="standalone"></option>
                            <option value="fullscreen" data-i18n="fullscreen"></option>
                            <option value="minimal-ui" data-i18n="minimal-ui"></option>
                            <option value="browser" data-i18n="browser"></option>
                        </select>
                        <div class="help-text" data-i18n="help-text10"></div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label" data-i18n="screen_orientation"></label>
                        <select class="form-select" id="orientation">
                            <option value="any" selected data-i18n="any"></option>
                            <option value="portrait" data-i18n="portrait"></option>
                            <option value="landscape" data-i18n="landscape"></option>
                            <option value="portrait-primary" data-i18n="portrait-primary"></option>
                            <option value="landscape-primary" data-i18n="landscape-primary"></option>
                        </select>
                        <div class="help-text" data-i18n="help-text11"></div>
                    </div>
                </div>
            </div>
        </div>
        <div class="text-end mt-4">
            <button type="submit" class="btn btn-primary px-4 save-shortcut">
                <i class="fa-solid fa-floppy-disk me-1"></i>
                <span data-i18n="save"></span>
            </button>
        </div>
    </form>
</div>
<link rel="stylesheet" href="<?=BASE_URL?>/public/css/shortcut.css?v=<?=time();?>">
<script src="<?=BASE_URL?>/public/js/admin/shortcut.js?v=<?=time()?>"></script>