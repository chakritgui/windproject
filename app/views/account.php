<link rel="stylesheet" href="<?=BASE_URL?>/public/css/account.css?v=<?=time();?>">
<div class="container py-5 mt-5 profile-container">
    <div class="profile-card">
        <div class="profile-header">
            <h1 class="profile-title">
                <i class="fa-solid fa-circle-user me-2"></i><span data-i18n="member_profile"></span>
            </h1>
            <p class="profile-subtitle mb-0"><span data-i18n="manage_your_personal"></span></p>
        </div>
        <div class="profile-body">
            <ul class="nav nav-pills mb-4" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link active" id="info-tab" data-bs-toggle="tab" data-bs-target="#info" type="button" role="tab"><i class="fa-solid fa-clipboard-user me-2"></i><span data-i18n="personal_information"></span></button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="history-tab" data-bs-toggle="tab" data-bs-target="#history" type="button" role="tab"><i class="fa-solid fa-clock-rotate-left me-2"></i><span data-i18n="usage_history"></span></button>
                </li>
                <li class="nav-item is-pwa d-none" role="presentation">
                    <button class="nav-link" id="notification-tab" data-bs-toggle="tab" data-bs-target="#notification" type="button" role="tab"><i class="fa-solid fa-bell me-2"></i><span data-i18n="notification"></span></button>
                </li>
            </ul>
            <div class="tab-content" id="profileTabContent">
                <div class="tab-pane fade show active" id="info" role="tabpanel">
                    <div class="info-section">
                        <h3 class="section-title"><i class="fa-regular fa-user"></i><span data-i18n="personal_information"></span></h3>
                        <div class="info-row" id="row-firstName">
                            <div class="info-label"><i class="fa-solid fa-user"></i><span data-i18n="firstname"></span></div>
                            <div class="info-value">
                                <span class="info-text" id="display-firstName"></span>
                                <button class="btn-edit allowName d-none" onclick="editField('firstName')"><i class="fa-solid fa-pen-to-square me-1"></i><span data-i18n="edit"></span></button>
                            </div>
                        </div>
                        <div class="info-row" id="row-lastName">
                            <div class="info-label"><i class="fa-solid fa-user"></i><span data-i18n="lastname"></span></div>
                            <div class="info-value">
                                <span class="info-text" id="display-lastName"></span>
                                <button class="btn-edit allowLastName d-none" onclick="editField('lastName')"><i class="fa-solid fa-pen-to-square me-1"></i><span data-i18n="edit"></span></button>
                            </div>
                        </div>
                        <div class="info-row" id="row-phone">
                            <div class="info-label"><i class="fa-solid fa-phone"></i><span data-i18n="mobile"></span></div>
                            <div class="info-value">
                                <span class="info-text" id="display-phone"></span>
                                <button class="btn-edit allowPhone d-none" onclick="editField('phone')"><i class="fa-solid fa-pen-to-square me-1"></i><span data-i18n="edit"></span></button>
                            </div>
                        </div>
                        <div class="info-row" id="row-email">
                            <div class="info-label"><i class="fa-solid fa-envelope"></i><span data-i18n="email"></span></div>
                            <div class="info-value">
                                <span class="info-text" id="display-email"></span>
                                <button class="btn-edit allowEmail d-none" onclick="editField('email')"><i class="fa-solid fa-pen-to-square me-1"></i><span data-i18n="edit"></span></button>
                            </div>
                        </div>
                    </div>
                    <div class="info-section">
                        <h3 class="section-title"><i class="fa-solid fa-user-shield"></i><span data-i18n="account"></span></h3>
                        <div class="info-row" id="row-username">
                            <div class="info-label"><i class="fa-regular fa-circle-user"></i><span data-i18n="username"></span></div>
                            <div class="info-value">
                                <span class="info-text" id="display-username"></span>
                                <button class="btn-edit allowUsername d-none" onclick="editField('username')"><i class="fa-solid fa-pen-to-square me-1"></i><span data-i18n="edit"></span></button>
                            </div>
                        </div>
                        <div class="info-row" id="row-password">
                            <div class="info-label"><i class="fa-solid fa-lock"></i><span data-i18n="password"></span></div>
                            <div class="info-value">
                                <span class="info-text password-value" id="display-password">••••••••••••</span>
                                <button class="btn-edit allowPassword d-none" onclick="editField('password')"><i class="fa-solid fa-pen-to-square me-1"></i><span data-i18n="edit"></span></button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="tab-pane fade" id="history" role="tabpanel">
                    <div id="activityHistory"></div>
                    <div id="scrollEnd"></div>
                </div>
                <div class="tab-pane fade" id="notification" role="tabpanel">
                    <div class="card border-0 shadow-sm">
                        <div class="card-body p-4">
                            <div class="d-flex align-items-center mb-4">
                                <div class="flex-shrink-0 bg-primary-subtle text-primary p-3 rounded-3">
                                    <i class="fa-solid fa-bell fs-4"></i>
                                </div>
                                <div class="ms-3">
                                    <h5 class="mb-1 fw-bold" data-i18n="notifications_on_the_device"></h5>
                                    <p class="text-muted small mb-0" data-i18n="manage_notifications_for_this_app_on_your_device."></p>
                                </div>
                            </div>
                            <div class="list-group list-group-flush border rounded-3 overflow-hidden">
                                <div class="list-group-item p-3">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div>
                                            <div class="fw-bold" data-i18n="enable_push_notifications."></div>
                                            <div id="pwa-status-text" class="small text-muted" data-i18n="disabled"></div>
                                        </div>
                                        <div class="form-check form-switch">
                                            <input class="form-check-input pwa-noti-toggle" type="checkbox" role="switch" id="pwaPushToggle" style="transform: scale(1.2);">
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div id="permission-warning" class="mt-3 d-none">
                                <div class="alert alert-warning d-flex align-items-start mb-0" role="alert">
                                    <i class="bi bi-exclamation-triangle-fill me-2 mt-1"></i>
                                    <div><span class="small" data-i18n="you_have_blocked_notifications"></span></div>
                                </div>
                            </div>
                            <p class="text-muted mt-3 x-small italic" style="font-size: 0.75rem;">* <span data-i18n="this_setting_will_only_take_effect_in_the_browser"></span></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<script src="<?=BASE_URL?>/public/js/account.js?v=<?=time();?>" defer></script>