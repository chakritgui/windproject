<div class="container-fluid mt-90 mb-5">
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 p-3 rounded-3 shadow-sm" style="background: #ffffff; border-left: 4px solid #0d6efd;">
        <div class="mb-2 mb-md-0">
            <h4 class="fw-bold mb-1 d-flex align-items-center" style="font-size: 1.35rem;">
                <i class="fa-solid fa-users-line me-2 text-primary" style="font-size: 1.5rem;"></i>
                <span data-i18n="member_management"></span>
            </h4>
            <nav aria-label="breadcrumb" style="margin-left: 25px;">
                <ol class="breadcrumb mb-0 small">
                    <li class="breadcrumb-item">
                        <span data-i18n="admin"></span>
                    </li>
                    <li class="breadcrumb-item active" aria-current="page">
                        <span data-i18n="member"></span>
                    </li>
                </ol>
            </nav>
        </div>
    </div>
</div>
<div class="container-fluid mt-3 mb-5">
    <ul class="nav nav-pills mb-4" id="mainTabs" role="tablist">
         <li class="nav-item" role="presentation">
            <button class="nav-link active" id="member-tab" data-bs-toggle="pill" data-bs-target="#member_management" data-page="member" type="button">
                <i class="fa-solid fa-users me-2"></i><span data-i18n="member"></span>
            </button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link" id="history-tab" data-bs-toggle="pill" data-bs-target="#login_history" data-page="history" type="button">
                <i class="fa-solid fa-clock-rotate-left me-2"></i><span data-i18n="usage_history"></span>
            </button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link" id="request-tab" data-bs-toggle="pill" data-bs-target="#change_request" data-page="request" type="button">
                <i class="fa-solid fa-user-lock me-2"></i><span data-i18n="password_change_request"></span>
            </button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link" id="setting-tab" data-bs-toggle="pill" data-bs-target="#setting" data-page="setting" type="button">
                <i class="fa-solid fa-list-check me-2"></i><span data-i18n="permission_edit_data"></span>
            </button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link" id="user-privileges-tab" data-bs-toggle="pill" data-bs-target="#privileges_tab" data-page="privileges" type="button">
                <i class="fa-solid fa-user-shield me-2"></i><span data-i18n="user_privileges"></span>
            </button>
        </li>
    </ul>
    <div class="tab-content" id="mainTabContent">
        <div class="tab-pane fade show active" id="member_management" role="tabpanel">
            <div class="card shadow-sm mb-4">
                <div class="card-body">
                    <div class="row g-2 mb-3">
                        <div class="col-sm-2">
                            <p><i class="fa-solid fa-user-gear"></i> <span data-i18n="role"></span></p>
                            <select id="filter_role" class="form-select filter"></select>
                        </div>
                        <div class="col-sm-2">
                            <p><i class="fa-solid fa-user-shield me-2"></i> <span data-i18n="user_privileges"></span></p>
                            <select id="filter_privileges" class="form-select filter"></select>
                        </div>
                        <div class="col-sm-2">
                            <p><i class="fa-solid fa-circle-dot"></i> <span data-i18n="status"></span></p>
                            <select id="filter_status" class="form-select filter"></select>
                        </div>
                    </div>
                </div>
            </div>
            <div class="table-responsive">
                <table class="table table-striped table-hover" id="tb_member">
                    <thead>
                        <tr>
                            <th></th>
                            <th data-i18n="full_name"></th>
                            <th data-i18n="email"></th>
                            <th data-i18n="mobile"></th>
                            <th data-i18n="role"></th>
                            <th data-i18n="user_privileges"></th>
                            <th data-i18n="create_at"></th>
                            <th data-i18n="last_login"></th>
                            <th data-i18n="status"></th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
        <div class="tab-pane fade" id="login_history" role="tabpanel">
            <div class="card shadow-sm mb-4">
                <div class="card-body">
                    <div class="row g-2 mb-3">
                        <div class="col-sm-2">
                            <p><i class="fa-regular fa-calendar"></i> <span data-i18n="date"></span></p>
                            <input type="text" class="form-control filter-history" id="filter_history_date" autocomplete="off">
                        </div>
                        <div class="col-sm-2">
                            <p><i class="fa-solid fa-user"></i> <span data-i18n="member"></span></p>
                            <select id="filter_history_member" class="form-select filter-history"></select>
                        </div>
                        <div class="col-sm-2 col-6">
                            <p><i class="fa-solid fa-user-gear"></i> <span data-i18n="role"></span></p>
                            <select id="filter_history_role" class="form-select filter-history"></select>
                        </div>
                        <div class="col-sm-2 col-6">
                            <p><i class="fa-solid fa-arrow-right-to-bracket"></i> <span data-i18n="device"></span></p>
                            <select id="filter_history_device" class="form-select filter-history"></select>
                        </div>
                        <div class="col-sm-2 col-6">
                            <p><i class="fa-regular fa-window-maximize"></i> <span data-i18n="browsers"></span></p>
                            <select id="filter_history_browser" class="form-select filter-history"></select>
                        </div>
                        <div class="col-sm-2 col-6">
                            <p><i class="fa-regular fa-clock"></i> <span data-i18n="timezone"></span></p>
                            <select id="filter_history_timezone" class="form-select filter-history"></select>
                        </div>
                    </div>
                </div>
            </div>
            <div class="table-responsive">
                <table class="table table-striped table-hover" id="tb_history">
                    <thead>
                        <tr>
                            <th data-i18n="member"></th>
                            <th data-i18n="role"></th>
                            <th data-i18n="login"></th>
                            <th data-i18n="logout"></th>
                            <th data-i18n="usage"></th>
                            <th data-i18n="ip_address"></th>
                            <th data-i18n="device"></th>
                            <th data-i18n="browsers"></th>
                            <th data-i18n="timezone"></th>
                            <th data-i18n="location"></th>
                            <th data-i18n="status"></th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
        <div class="tab-pane fade" id="change_request" role="tabpanel">
            <div class="card shadow-sm mb-4">
                <div class="card-body">
                    <div class="row g-2 mb-3">
                        <div class="col-sm-2">
                            <p><i class="fa-regular fa-calendar"></i> <span data-i18n="date"></span></p>
                            <input type="text" class="form-control filter-request" id="filter_request_date" autocomplete="off">
                        </div>
                        <div class="col-sm-2">
                            <p><i class="fa-solid fa-user"></i> <span data-i18n="member"></span></p>
                            <select id="filter_request_member" class="form-select filter-request"></select>
                        </div>
                        <div class="col-sm-2">
                            <p><i class="fa-solid fa-user-gear"></i> <span data-i18n="role"></span></p>
                            <select id="filter_request_role" class="form-select filter-request"></select>
                        </div>
                    </div>
                </div>
            </div>
            <div class="mt-4 mb-3">
                <div class="btn-group w-100 shadow-sm" role="group" aria-label="Status selection">
                    <input type="radio" class="btn-check" name="status" id="pending" value="pending" autocomplete="off" checked>
                    <label class="btn btn-outline-warning" for="pending">
                        <i class="fa-solid fa-hourglass-half"></i> <span data-i18n="pending"></span>
                    </label>
                    <input type="radio" class="btn-check" name="status" id="approved" value="approved" autocomplete="off">
                    <label class="btn btn-outline-success" for="approved">
                        <i class="fa-solid fa-check"></i> <span data-i18n="approved"></span>
                    </label>
                    <input type="radio" class="btn-check" name="status" id="rejected" value="rejected" autocomplete="off">
                    <label class="btn btn-outline-danger" for="rejected">
                        <i class="fa-solid fa-xmark"></i> <span data-i18n="rejected"></span>
                    </label>
                </div>
            </div>
            <div class="table-responsive">
                <table class="table table-striped table-hover" id="tb_request">
                    <thead>
                        <tr>
                            <th data-i18n="member"></th>
                            <th data-i18n="role"></th>
                            <th data-i18n="email"></th>
                            <th data-i18n="username"></th>
                            <th data-i18n="status"></th>
                            <th data-i18n="submission"></th>
                            <th data-i18n="date"></th>
                            <th data-i18n="status"></th>
                            <th data-i18n="remark"></th>
                            <th data-i18n="status_date"></th>
                            <th></th>
                        </tr>
                    </thead>
                </table>
            </div>
        </div>
        <div class="tab-pane fade" id="setting" role="tabpanel">
            <div class="card shadow-sm">
                <div class="card-header bg-light d-flex justify-content-between align-items-center">
                    <h5 class="mb-0" data-i18n="edit_permission"></h5>
                </div>
                <div class="card-body">
                    <form id="permissionForm">
                        <ul class="list-group list-group-flush">
                            <li class="list-group-item d-flex justify-content-between align-items-center px-0">
                                <div>
                                    <div class="fw-bold" data-i18n="firstname"></div>
                                </div>
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" id="allowName">
                                </div>
                            </li>
                            <li class="list-group-item d-flex justify-content-between align-items-center px-0">
                                <div>
                                    <div class="fw-bold" data-i18n="lastname"></div>
                                </div>
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" id="allowLastName">
                                </div>
                            </li>
                            <li class="list-group-item d-flex justify-content-between align-items-center px-0">
                                <div>
                                    <div class="fw-bold" data-i18n="mobile"></div>
                                </div>
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" id="allowPhone">
                                </div>
                            </li>
                            <li class="list-group-item d-flex justify-content-between align-items-center px-0">
                                <div>
                                    <div class="fw-bold" data-i18n="email"></div>
                                </div>
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" id="allowEmail">
                                </div>
                            </li>
                            <li class="list-group-item d-flex justify-content-between align-items-center px-0">
                                <div>
                                    <div class="fw-bold" data-i18n="username"></div>
                                </div>
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" id="allowUsername">
                                </div>
                            </li>
                            <li class="list-group-item d-flex justify-content-between align-items-center px-0">
                                <div>
                                    <div class="fw-bold" data-i18n="password"></div>
                                </div>
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" id="allowPassword">
                                </div>
                            </li>
                        </ul>
                        <div class="mt-4 pt-3 border-top text-end">
                            <button type="submit" class="btn btn-primary save-permission px-4" data-i18n="save"></button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        <div class="tab-pane fade" id="privileges_tab" role="tabpanel">
            <div class="table-responsive">
                <table class="table table-striped table-hover" id="tb_privileges">
                    <thead>
                        <tr>
                            <th data-i18n="user_privileges"></th>
                            <th data-i18n="create_at"></th>
                            <th data-i18n="status"></th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
    </div>
</div>
<script src="<?=BASE_URL?>/public/js/admin/member.js?v=<?=time()?>"></script>