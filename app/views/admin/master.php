<div class="container-fluid mt-90 mb-3">
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 p-3 rounded-3 shadow-sm" style="background: #ffffff; border-left: 4px solid #0d6efd;">
        <div class="mb-2 mb-md-0">
            <h4 class="fw-bold mb-1 d-flex align-items-center" style="font-size: 1.35rem;">
                <i class="fa-solid fa-database me-2 text-primary" style="font-size: 1.5rem;"></i>
                <span data-i18n="master_data"></span>
            </h4>
            <nav aria-label="breadcrumb" style="margin-left: 25px;">
                <ol class="breadcrumb mb-0 small">
                    <li class="breadcrumb-item" data-i18n="admin"></li>
                    <li class="breadcrumb-item active" aria-current="page" data-i18n="master_data"></li>
                </ol>
            </nav>
        </div>
    </div>
</div>
<div class="container-fluid mt-3 mb-5">
    <ul class="nav nav-pills mb-4" id="mainTabs" role="tablist">
        <li class="nav-item" role="presentation">
            <button class="nav-link active" id="contracts-tab" data-bs-toggle="pill" data-bs-target="#contracts" data-page="contracts" type="button">
                <i class="fa-solid fa-file-lines me-2"></i><span data-i18n="contracts"></span>
            </button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link" id="group-tab" data-bs-toggle="pill" data-bs-target="#groups" data-page="group" type="button">
                <i class="fa-solid fa-layer-group me-2"></i><span data-i18n="group"></span>
            </button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link" id="project-status-tab" data-bs-toggle="pill" data-bs-target="#project-status" data-page="project-status" type="button">
                <i class="fa-solid fa-circle-dot me-2"></i><span data-i18n="project_status"></span>
            </button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link" id="projects-tab" data-bs-toggle="pill" data-bs-target="#projects" data-page="projects" type="button">
                <i class="fa-solid fa-folder-tree me-2"></i><span data-i18n="projects"></span>
            </button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link" id="pole-types-tab" data-bs-toggle="pill" data-bs-target="#pole-types" data-page="types" type="button">
                <i class="fa-solid fa-tags me-2"></i><span data-i18n="wind_measurement_equipment"></span>
            </button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link" id="installation-tab" data-bs-toggle="pill" data-bs-target="#installation-tabs" data-page="installation" type="button">
                <i class="fa-solid fa-location-dot me-2"></i><span data-i18n="installation"></span>
            </button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link" id="level-tab" data-bs-toggle="pill" data-bs-target="#level" data-page="level" type="button">
                <i class="fa-solid fa-signal me-2"></i><span data-i18n="level"></span>
            </button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link" id="poles-tab" data-bs-toggle="pill" data-bs-target="#poles" data-page="poles" type="button">
                <i class="fa-solid fa-tower-broadcast me-2"></i><span data-i18n="poles"></span>
            </button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link" id="windturbine-tab" data-bs-toggle="pill" data-bs-target="#windturbine" data-page="windturbine" type="button">
                <i class="bi bi-fan me-2"></i><span data-i18n="windturbine"></span>
            </button>
        </li>
    </ul>
    <div class="tab-content" id="mainTabContent">
        <div class="tab-pane fade show active" id="contracts" role="tabpanel">
            <div class="card shadow-sm mb-4">
                <div class="card-body">
                    <div class="row g-2 mb-3">
                        <div class="col-sm-2">
                            <p><i class="fa-solid fa-circle-dot me-2"></i><span data-i18n="status"></span></p>
                            <select id="filter_status" class="form-select filter"></select>
                        </div>
                    </div>
                </div>
            </div>
            <div class="table-responsive">
                <table class="table table-striped table-hover" id="tb_contract">
                    <thead>
                        <tr>
                            <th data-i18n="no"></th>
                            <th data-i18n="contract_no"></th>
                            <th data-i18n="contract_name"></th>
                            <th data-i18n="display"></th>
                            <th data-i18n="startDate"></th>
                            <th data-i18n="endDate"></th>
                            <th data-i18n="create_at"></th>
                            <th data-i18n="status"></th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
        <div class="tab-pane fade" id="groups" role="tabpanel">
            <div class="card shadow-sm mb-4">
                <div class="card-body">
                    <div class="row g-2 mb-3">
                        <div class="col-sm-2">
                            <p><i class="fa-solid fa-circle-dot me-2"></i><span data-i18n="status"></span></p>
                            <select id="filter_group_status" class="form-select filter"></select>
                        </div>
                    </div>
                </div>
            </div>
            <div class="table-responsive">
                <table class="table table-striped table-hover" id="tb_group">
                    <thead>
                        <tr>
                            <th data-i18n="no"></th>
                            <th data-i18n="group_name"></th>
                            <th data-i18n="create_at"></th>
                            <th data-i18n="status"></th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
        <div class="tab-pane fade" id="project-status" role="tabpanel">
            <div class="card shadow-sm mb-4">
                <div class="card-body">
                    <div class="row g-2 mb-3">
                        <div class="col-sm-2">
                            <p><i class="fa-solid fa-circle-dot me-2"></i><span data-i18n="status"></span></p>
                            <select id="filter_projectstatus_status" class="form-select filter"></select>
                        </div>
                    </div>
                </div>
            </div>
            <div class="table-responsive">
                <table class="table table-striped table-hover" id="tb_project_status">
                    <thead>
                        <tr>
                            <th data-i18n="no"></th>
                            <th data-i18n="color"></th>
                            <th data-i18n="project_status"></th>
                            <th data-i18n="create_at"></th>
                            <th data-i18n="status"></th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
        <div class="tab-pane fade" id="projects" role="tabpanel">
            <div class="card shadow-sm mb-4">
                <div class="card-body">
                    <div class="row g-2 mb-3">
                        <div class="col-sm-2 col-6">
                            <p><i class="fa-solid fa-file-lines me-2"></i><span data-i18n="contracts"></span></p>
                            <select id="filter_contract" class="form-select filter"></select>
                        </div>
                        <div class="col-sm-2 col-6">
                            <p><i class="fa-solid fa-circle-dot me-2"></i><span data-i18n="project_status"></span></p>
                            <select id="filter_project_status" class="form-select filter"></select>
                        </div>
                        <div class="col-sm-2 col-12">
                            <p><i class="fa-solid fa-layer-group me-2"></i></i><span data-i18n="group"></span></p>
                            <select id="filter_group" class="form-select filter"></select>
                        </div>
                        <div class="col-sm-2 col-6">
                            <p><i class="fa-solid fa-circle-dot me-2"></i><span data-i18n="status"></span></p>
                            <select id="filter_p_status" class="form-select filter"></select>
                        </div>
                    </div>
                </div>
            </div>
            <div class="table-responsive">
                <table class="table table-striped table-hover" id="tb_project">
                    <thead>
                        <tr>
                            <th data-i18n="no"></th>
                            <th data-i18n="project_code"></th>
                            <th data-i18n="project_name"></th>
                            <th data-i18n="display"></th>
                            <th data-i18n="contract"></th>
                            <th data-i18n="group"></th>
                            <th data-i18n="startDate"></th>
                            <th data-i18n="endDate"></th>
                            <th data-i18n="create_at"></th>
                            <th data-i18n="project_status"></th>
                            <th data-i18n="background"></th>
                            <th data-i18n="status"></th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
        <div class="tab-pane fade" id="pole-types" role="tabpanel">
            <div class="card shadow-sm mb-4">
                <div class="card-body">
                    <div class="row g-2 mb-3">
                        <div class="col-sm-2">
                            <p><i class="fa-solid fa-circle-dot me-2"></i><span data-i18n="status"></span></p>
                            <select id="filter_type_status" class="form-select filter"></select>
                        </div>
                    </div>
                </div>
            </div>
            <div class="table-responsive">
                <table class="table table-striped table-hover" id="tb_type">
                    <thead>
                        <tr>
                            <th data-i18n="no"></th>
                            <th data-i18n="icon"></th>
                            <th data-i18n="type_name"></th>
                            <th data-i18n="display"></th>
                            <th data-i18n="create_at"></th>
                            <th data-i18n="status"></th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
        <div class="tab-pane fade" id="installation-tabs" role="tabpanel">
            <div class="card shadow-sm mb-4">
                <div class="card-body">
                    <div class="row g-2 mb-3">
                        <div class="col-sm-2">
                            <p><i class="fa-solid fa-folder-tree me-2"></i><span data-i18n="projects"></span></p>
                            <select id="filter_installation_project" class="form-select filter"></select>
                        </div>
                        <div class="col-sm-2 col-6">
                            <p><i class="fa-solid fa-tags me-2"></i><span data-i18n="type"></span></p>
                            <select id="filter_installation_type" class="form-select filter"></select>
                        </div>
                        <div class="col-sm-2 col-6">
                            <p><i class="fa-solid fa-circle-dot me-2"></i><span data-i18n="status"></span></p>
                            <select id="filter_installation_status" class="form-select filter"></select>
                        </div>
                    </div>
                </div>
            </div>
            <div class="table-responsive">
                <table class="table table-striped table-hover" id="tb_installation">
                    <thead>
                        <tr>
                            <th data-i18n="no"></th>
                            <th data-i18n="project"></th>
                            <th data-i18n="type"></th>
                            <th data-i18n="installation"></th>
                            <th data-i18n="display"></th>
                            <th data-i18n="create_at"></th>
                            <th data-i18n="status"></th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
        <div class="tab-pane fade" id="level" role="tabpanel">
            <div class="card shadow-sm mb-4">
                <div class="card-body">
                    <div class="row g-2 mb-3">
                        <div class="col-sm-2">
                            <p><i class="fa-solid fa-circle-dot me-2"></i><span data-i18n="status"></span></p>
                            <select id="filter_level_status" class="form-select filter"></select>
                        </div>
                    </div>
                </div>
            </div>
            <div class="table-responsive">
                <table class="table table-striped table-hover" id="tb_level">
                    <thead>
                        <tr>
                            <th data-i18n="no"></th>
                            <th data-i18n="level"></th>
                            <th data-i18n="height_level"></th>
                            <th data-i18n="max_selection_reached"></th>
                            <th data-i18n="create_at"></th>
                            <th data-i18n="status"></th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
        <div class="tab-pane fade" id="poles" role="tabpanel">
            <div class="card shadow-sm mb-4">
                <div class="card-body">
                    <div class="row g-2 mb-3">
                        <div class="col-sm-2 col-6">
                            <p><i class="fa-solid fa-folder-tree me-2"></i><span data-i18n="projects"></span></p>
                            <select id="filter_pole_project" class="form-select filter"></select>
                        </div>
                        <div class="col-sm-2 col-6">
                            <p><i class="fa-solid fa-circle-dot me-2"></i><span data-i18n="pole_status"></span></p>
                            <select id="filter_pole_project_status" class="form-select filter"></select>
                        </div>
                        <div class="col-sm-2 col-6">
                            <p><i class="fa-solid fa-tags me-2"></i><span data-i18n="type"></span></p>
                            <select id="filter_pole_type" class="form-select filter"></select>
                        </div>
                        <div class="col-sm-2 col-6">
                            <p><i class="fa-solid fa-location-dot me-2"></i><span data-i18n="installation"></span></p>
                            <select id="filter_pole_installation" class="form-select filter"></select>
                        </div>
                        <div class="col-sm-2 col-6">
                            <p><i class="fa-solid fa-circle-dot me-2"></i><span data-i18n="status"></span></p>
                            <select id="filter_pole_status" class="form-select filter"></select>
                        </div>
                    </div>
                </div>
            </div>
            <div class="table-responsive">
                <table class="table table-striped table-hover" id="tb_pole">
                    <thead>
                        <tr>
                            <th data-i18n="no"></th>
                            <th data-i18n="pole_code"></th>
                            <th data-i18n="type"></th>
                            <th data-i18n="project"></th>
                            <th data-i18n="pole_status"></th>
                            <th data-i18n="latitude"></th>
                            <th data-i18n="longitude"></th>
                            <th data-i18n="installation"></th>
                            <th data-i18n="create_at"></th>
                            <th data-i18n="status"></th>
                            <th data-i18n="content"></th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
        <div class="tab-pane fade" id="windturbine" role="tabpanel">
            <div class="card shadow-sm mb-4">
                <div class="card-body">
                    <div class="row g-2 mb-3">
                        <div class="col-sm-2 col-6">
                            <p><i class="fa-solid fa-folder-tree me-2"></i><span data-i18n="projects"></span></p>
                            <select id="filter_windturbine_project" class="form-select filter"></select>
                        </div>
                        <div class="col-sm-2 col-6">
                            <p><i class="fa-solid fa-circle-dot me-2"></i><span data-i18n="status"></span></p>
                            <select id="filter_windturbine_status" class="form-select filter"></select>
                        </div>
                    </div>
                </div>
            </div>
            <div class="mb-3">
                <a href="${BASE_URL}/excel/WindImportExample.xlsx" class="btn btn-success btn-sm example-inport ms-2" target="_blank">
                    <i class="fa-solid fa-download me-2"></i><span data-i18n="example_import"></span>
                </a>
                <?php if (isset($_SESSION['user']['role']) && $_SESSION['user']['role'] === 'administrator'): ?>
                    <button class="btn btn-danger btn-sm clear-windturbine ms-2">
                        <i class="fa-solid fa-trash-can me-2"></i><span><span data-i18n="clear_data"></span></span>
                    </button>
                <?php endif; ?>
            </div>
            <div class="table-responsive">
                <table class="table table-striped table-hover" id="tb_windturbine">
                    <thead>
                        <tr>
                            <th data-i18n="project"></th>
                            <th data-i18n="latitude"></th>
                            <th data-i18n="longitude"></th>
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
<script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/Sortable.min.js"></script>
<script src="<?=asset('public/js/admin/master.js')?>" defer></script>
<script src="<?=asset('public/js/admin/master/contracts.js')?>" defer></script>
<script src="<?=asset('public/js/admin/master/group.js')?>" defer></script>
<script src="<?=asset('public/js/admin/master/projects.js')?>" defer></script>
<script src="<?=asset('public/js/admin/master/types.js')?>" defer></script>
<script src="<?=asset('public/js/admin/master/installation.js')?>" defer></script>
<script src="<?=asset('public/js/admin/master/poles.js')?>" defer></script>
<script src="<?=asset('public/js/admin/master/project-status.js')?>" defer></script>
<script src="<?=asset('public/js/admin/master/level.js')?>" defer></script>
<script src="<?=asset('public/js/admin/master/windturbine.js')?>" defer></script>