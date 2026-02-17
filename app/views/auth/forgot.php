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
                    <div id="dynamic_tab_nav"></div>
                    <div class="tab-content mt-3" id="dynamic_tab_content">
                        <div class="tab-pane fade" id="content_email">
                            <p class="small text-center text-muted mb-3" data-i18n="please_enter_email"></p>
                            <input type="email" class="form-control mb-3" id="email" placeholder="example@mail.com">
                            <button class="btn-login login-forgot w-100" data-i18n="continue"></button>
                        </div>
                        <div class="tab-pane fade" id="content_admin">
                            <div class="card border-0 bg-light rounded-3">
                                <div class="card-body p-3">
                                    <h6 class="fw-bold mb-3 text-center" data-i18n="contact_admin_to_reset"></h6>
                                    <div id="admin_list" class="list-group list-group-flush bg-transparent"></div>
                                </div>
                            </div>
                        </div>
                        <div class="tab-pane fade" id="content_form">
                            <p class="small text-center text-muted mb-3" data-i18n="fill_form_request"></p>
                            <div class="mb-2">
                                <label class="small mb-3 required"><i class="fa-solid fa-envelope"></i> <span data-i18n="username_or_email"></span></label>
                                <input type="email" class="form-control obj-required" id="request_email">
                            </div>
                            <div class="mb-3">
                                <label class="small mb-3 required"><i class="fa-solid fa-file-pen"></i> <span data-i18n="submission"></span></label>
                                <textarea class="form-control obj-required" id="request_remark" rows="4" style="height: 75px;"></textarea>
                            </div>
                            <div class="mb-1 request-result small"></div>
                            <button class="btn btn-primary w-100 rounded-pill py-2" id="btn_submit_request" data-i18n="send_system_request"></button>
                        </div>
                    </div>
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