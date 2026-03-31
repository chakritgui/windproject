<link href="<?=asset('public/css/page.css')?>" rel="stylesheet">
<link href="<?=asset('public/css/account.css')?>" rel="stylesheet">
<div class="sky-wrap" id="skyWrap"></div>
<div class="container profile-container">
    <div class="page">
        <div class="hero">
            <div class="wind-particles">
                <div class="particle pp-1"></div>
                <div class="particle pp-2"></div>
                <div class="particle pp-3"></div>
                <div class="particle pp-4"></div>
                <div class="particle pp-5"></div>
            </div>
            <div class="deco-cluster cluster-tl">
                <i class="fa-solid fa-user-pen deco-1"></i>
                <i class="fa-solid fa-address-book deco-2"></i>
            </div>
            <div class="deco-cluster cluster-br">
                <i class="fa-solid fa-unlock-keyhole deco-3"></i>
                <i class="fa-solid fa-envelope-open-text deco-4"></i>
                <i class="fa-solid fa-phone-volume deco-5"></i>
            </div>
            <div class="hero-content">
                <div class="hero-icon"><i class="fa-solid fa-circle-user text-white"></i></div>
                <div class="hero-text">
                    <h1 data-i18n="member_profile"></h1>
                    <p data-i18n="manage_your_personal"></p>
                    <div class="hero-accent"></div>
                </div>
            </div>
        </div>
        <div class="profile-card">
            <div class="profile-body">
                <ul class="nav nav-pills mb-4 d-flex flex-nowrap" role="tablist">
                    <li class="nav-item flex-fill" role="presentation">
                        <button class="nav-link active w-100 py-3 py-md-2" id="info-tab" data-bs-toggle="tab" data-bs-target="#info" type="button" role="tab">
                            <i class="fa-solid fa-clipboard-user icon-responsive"></i>
                            <span class="d-none d-md-inline ms-2" data-i18n="personal_information"></span>
                        </button>
                    </li>
                    <li class="nav-item flex-fill" role="presentation">
                        <button class="nav-link w-100 py-3 py-md-2" id="history-tab" data-bs-toggle="tab" data-bs-target="#history" type="button" role="tab">
                            <i class="fa-solid fa-clock-rotate-left icon-responsive"></i>
                            <span class="d-none d-md-inline ms-2" data-i18n="usage_history"></span>
                        </button>
                    </li>
                    <li class="nav-item flex-fill is-pwa d-none" role="presentation">
                        <button class="nav-link w-100 py-3 py-md-2" id="notification-tab" data-bs-toggle="tab" data-bs-target="#notification" type="button" role="tab">
                            <i class="fa-solid fa-bell icon-responsive"></i>
                            <span class="d-none d-md-inline ms-2" data-i18n="notification"></span>
                        </button>
                    </li>
                </ul>
                <div class="tab-content" id="profileTabContent">
                    <div class="tab-pane fade show active" id="info" role="tabpanel">
                        <div class="info-section">
                            <h6><i class="fa-regular fa-user"></i><span data-i18n="personal_information"></span></h6>
                            <div class="info-row" id="row-firstName">
                                <div class="info-label">
                                    <i class="fa-solid fa-user"></i>
                                    <span data-i18n="firstname"></span>
                                </div>
                                <div class="info-value">
                                    <span class="info-text" id="display-firstName"></span>
                                    <button class="btn-edit allowName d-none" onclick="editField('firstName')">
                                        <i class="fa-solid fa-pen-to-square"></i>
                                        <span data-i18n="edit"></span>
                                    </button>
                                </div>
                            </div>
                            <div class="info-row" id="row-lastName">
                                <div class="info-label">
                                    <i class="fa-solid fa-user"></i>
                                    <span data-i18n="lastname"></span>
                                </div>
                                <div class="info-value">
                                    <span class="info-text" id="display-lastName"></span>
                                    <button class="btn-edit allowLastName d-none" onclick="editField('lastName')">
                                        <i class="fa-solid fa-pen-to-square"></i>
                                        <span data-i18n="edit"></span>
                                    </button>
                                </div>
                            </div>
                            <div class="info-row" id="row-phone">
                                <div class="info-label">
                                    <i class="fa-solid fa-phone"></i>
                                    <span data-i18n="mobile"></span>
                                </div>
                                <div class="info-value">
                                    <span class="info-text" id="display-phone"></span>
                                    <button class="btn-edit allowPhone d-none" onclick="editField('phone')">
                                        <i class="fa-solid fa-pen-to-square"></i>
                                        <span data-i18n="edit"></span>
                                    </button>
                                </div>
                            </div>
                            <div class="info-row" id="row-email">
                                <div class="info-label">
                                    <i class="fa-solid fa-envelope"></i>
                                    <span data-i18n="email"></span>
                                </div>
                                <div class="info-value">
                                    <span class="info-text" id="display-email"></span>
                                    <button class="btn-edit allowEmail d-none" onclick="editField('email')">
                                        <i class="fa-solid fa-pen-to-square"></i>
                                        <span data-i18n="edit"></span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="info-section">
                            <h6>
                                <i class="fa-solid fa-user-shield"></i>
                                <span data-i18n="account"></span>
                            </h6>
                            <div class="info-row" id="row-username">
                                <div class="info-label">
                                    <i class="fa-regular fa-circle-user"></i>
                                    <span data-i18n="username"></span>
                                </div>
                                <div class="info-value">
                                    <span class="info-text" id="display-username"></span>
                                    <button class="btn-edit allowUsername d-none" onclick="editField('username')">
                                        <i class="fa-solid fa-pen-to-square"></i>
                                        <span data-i18n="edit"></span>
                                    </button>
                                </div>
                            </div>
                            <div class="info-row" id="row-password">
                                <div class="info-label">
                                    <i class="fa-solid fa-lock"></i>
                                    <span data-i18n="password"></span>
                                </div>
                                <div class="info-value">
                                    <span class="info-text password-value" id="display-password">••••••••••••</span>
                                    <button class="btn-edit allowPassword d-none" onclick="editField('password')">
                                        <i class="fa-solid fa-pen-to-square"></i>
                                        <span data-i18n="edit"></span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="tab-pane fade" id="history" role="tabpanel">
                        <div id="activityHistory"></div>
                        <div id="scrollEnd"></div>
                    </div>
                    <div class="tab-pane fade" id="notification" role="tabpanel">
                        <div class="notif-card">
                            <div class="notif-card-header">
                                <div class="notif-icon-wrap">
                                <i class="fa-solid fa-bell"></i>
                            </div>
                            <div>
                            <h5 data-i18n="notifications_on_the_device"></h5>
                            <p data-i18n="manage_notifications_for_this_app_on_your_device."></p>
                        </div>
                    </div>
                    <div class="notif-toggle-row">
                        <div>
                            <div class="notif-toggle-label" data-i18n="enable_push_notifications."></div>
                            <div id="pwa-status-text" class="notif-toggle-sub" data-i18n="disabled"></div>
                        </div>
                        <div class="form-check form-switch mb-0">
                            <input class="form-check-input pwa-noti-toggle" type="checkbox" role="switch" id="pwaPushToggle" style="transform: scale(1.2);">
                        </div>
                    </div>
                    <div id="permission-warning" class="d-none" style="padding: 0 18px 14px;">
                        <div class="alert alert-warning d-flex align-items-start mb-0" role="alert">
                            <i class="fa-solid fa-triangle-exclamation me-2 mt-1" style="flex-shrink:0;"></i>
                            <small data-i18n="you_have_blocked_notifications"></small>
                        </div>
                    </div>
                    <p class="notif-hint">* <span data-i18n="this_setting_will_only_take_effect_in_the_browser"></span></p>
                </div>
            </div>
        </div>
    </div>
</div>
<script src="<?=asset('public/js/user/sky.js')?>"></script>
<script src="<?=asset('public/js/account.js')?>" defer></script>