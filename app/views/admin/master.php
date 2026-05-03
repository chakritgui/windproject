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
                            <th data-i18n="sort"></th>
                            <th data-i18n="show"></th>
                            <th data-i18n="contract_no"></th>
                            <th data-i18n="contract_name"></th>
                            <th data-i18n="display"></th>
                            <th data-i18n="startDate"></th>
                            <th data-i18n="endDate"></th>
                            <th data-i18n="create_at"></th>
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
                            <th data-i18n="sort"></th>
                            <th data-i18n="show"></th>
                            <th data-i18n="group_name"></th>
                            <th data-i18n="create_at"></th>
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
                            <th data-i18n="sort"></th>
                            <th data-i18n="show"></th>
                            <th data-i18n="color"></th>
                            <th data-i18n="project_status"></th>
                            <th data-i18n="create_at"></th>
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
                            <th data-i18n="sort"></th>
                            <th data-i18n="show"></th>
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
                            <th data-i18n="sort"></th>
                            <th data-i18n="show"></th>
                            <th data-i18n="icon"></th>
                            <th data-i18n="wind_measurement_equipment"></th>
                            <th data-i18n="display"></th>
                            <th data-i18n="create_at"></th>
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
                            <p><i class="fa-solid fa-tags me-2"></i><span data-i18n="wind_measurement_equipment"></span></p>
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
                            <th data-i18n="sort"></th>
                            <th data-i18n="show"></th>
                            <th data-i18n="project"></th>
                            <th data-i18n="wind_measurement_equipment"></th>
                            <th data-i18n="installation"></th>
                            <th data-i18n="display"></th>
                            <th data-i18n="create_at"></th>
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
                            <th data-i18n="sort"></th>
                            <th data-i18n="show"></th>
                            <th data-i18n="level"></th>
                            <th data-i18n="height_level"></th>
                            <th data-i18n="max_selection_reached"></th>
                            <th data-i18n="create_at"></th>
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
                            <p><i class="fa-solid fa-tags me-2"></i><span data-i18n="wind_measurement_equipment"></span></p>
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
                            <th data-i18n="sort"></th>
                            <th data-i18n="show"></th>
                            <th data-i18n="wind_speed"></th>
                            <th data-i18n="icon"></th>
                            <th data-i18n="pole_code"></th>
                            <th data-i18n="wind_measurement_equipment"></th>
                            <th data-i18n="project"></th>
                            <th data-i18n="pole_status"></th>
                            <th data-i18n="latitude"></th>
                            <th data-i18n="longitude"></th>
                            <th data-i18n="installation"></th>
                            <th data-i18n="create_at"></th>
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
                        <div class="col-sm-3 col-12 d-flex align-items-end">
                            <input type="text" id="search_windturbine" class="form-control" placeholder="Search...">
                        </div>
                    </div>
                </div>
            </div>
            <div class="mb-3 d-flex gap-2 flex-wrap">
                <a href="${BASE_URL}/excel/WindImportExample.xlsx" 
                class="btn btn-success btn-sm example-inport" target="_blank">
                    <i class="fa-solid fa-download me-2"></i><span data-i18n="example_import"></span>
                </a>
                <button class="btn btn-primary btn-sm import-windturbine">
                    <i class="fa-solid fa-plus me-2"></i><span data-i18n="import"></span>
                </button>
                <button class="btn btn-info btn-sm icon-windturbine">
                    <i class="fa-solid fa-gears me-2"></i><span data-i18n="icon"></span>
                </button>
                <button class="btn btn-danger btn-sm clear-windturbine">
                    <i class="fa-solid fa-trash-can me-2"></i><span data-i18n="clear_data"></span>
                </button>
            </div>
            <div id="windturbine_accordion"></div>
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
<style>
    #windturbine_accordion .accordion-item {
        border: 1px solid #e0e6ed !important;
        border-radius: 10px !important;
        overflow: hidden;
        transition: box-shadow 0.2s ease;
    }
    #windturbine_accordion .accordion-item:hover {
        box-shadow: 0 4px 16px rgba(0,0,0,0.10) !important;
    }
    #windturbine_accordion .accordion-button {
        background-color: #f8f9fa;
        color: #2c3e50;
        padding: 0.85rem 1.25rem;
        border-radius: 0 !important;
        transition: background-color 0.2s ease;
    }
    #windturbine_accordion .accordion-button:not(.collapsed) {
        background-color: #eaf1fb;
        color: #1a5fb4;
        box-shadow: none;
    }
    #windturbine_accordion .accordion-button:focus {
        box-shadow: none;
        border-color: transparent;
    }
    #windturbine_accordion .accordion-button::after {
        filter: none;
        opacity: 0.5;
    }
    #windturbine_accordion .accordion-button:not(.collapsed)::after {
        filter: invert(30%) sepia(80%) saturate(500%) hue-rotate(190deg);
        opacity: 1;
    }
    #windturbine_accordion .accordion-button .fa-folder-open {
        transition: color 0.2s;
    }
    #windturbine_accordion .accordion-button:not(.collapsed) .fa-folder-open {
        color: #f0a500 !important;
    }
    #windturbine_accordion .accordion-button .badge {
        padding: 0.3em 0.65em;
        border-radius: 20px;
        font-weight: 500;
    }
    #windturbine_accordion .accordion-body {
        padding: 0 !important;
        background-color: #fff;
    }
    #windturbine_accordion .table {
        margin-bottom: 0;
    }
    #windturbine_accordion .table thead th {
        background-color: #f1f5f9;
        color: #64748b;
        font-weight: 600;
        border-bottom: 2px solid #e2e8f0;
        padding: 0.6rem 1rem;
        white-space: nowrap;
    }
    #windturbine_accordion .table tbody tr {
        transition: background-color 0.15s ease;
    }
    #windturbine_accordion .table tbody tr:hover {
        background-color: #f0f7ff !important;
    }
    #windturbine_accordion .table tbody td {
        vertical-align: middle;
        padding: 0.6rem 1rem;
        border-bottom: 1px solid #f1f5f9;
        color: #374151;
    }
    #windturbine_accordion .table tbody td.text-muted {
        padding: 1.5rem;
    }
    #windturbine_accordion .form-check-input[type="checkbox"] {
        width: 2.2em;
        height: 1.2em;
        cursor: pointer;
        border-color: #ced4da;
        transition: background-color 0.2s, border-color 0.2s;
    }
    #windturbine_accordion .form-check-input:checked {
        background-color: #198754;
        border-color: #198754;
    }
    #windturbine_accordion .delete-windturbine {
        opacity: 0.5;
        transition: opacity 0.2s, transform 0.15s;
    }
    #windturbine_accordion .delete-windturbine:hover {
        opacity: 1;
        transform: scale(1.2);
        color: #dc3545 !important;
    }
    #windturbine_accordion .spinner-border {
        width: 2rem;
        height: 2rem;
    }
    #search_windturbine {
        border-radius: 8px;
        border: 1px solid #dee2e6;
        transition: border-color 0.2s, box-shadow 0.2s;
    }
    #search_windturbine:focus {
        border-color: #86b7fe;
        box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.15);
    }
    #filter_windturbine_project,#filter_windturbine_status {
        border-radius: 8px;
        border: 1px solid #dee2e6;
        transition: border-color 0.2s, box-shadow 0.2s;
    }
    #filter_windturbine_project:focus,#filter_windturbine_status:focus {
        border-color: #86b7fe;
        box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.15);
    }
    .import-windturbine,.icon-windturbine,.clear-windturbine,.example-inport {
        padding: 0.35rem 0.85rem;
        transition: transform 0.15s, box-shadow 0.15s;
    }
    .import-windturbine:hover,.icon-windturbine:hover,.clear-windturbine:hover,.example-inport:hover {
        transform: translateY(-1px);
        box-shadow: 0 3px 8px rgba(0,0,0,0.15);
    }
    @media (max-width: 576px) {
        #windturbine_accordion .accordion-button {
            padding: 0.7rem 1rem;
        }
        #windturbine_accordion .table thead th,
        #windturbine_accordion .table tbody td {
            padding: 0.5rem 0.6rem;
        }
    }
    #windturbine_accordion .accordion-header {
        display: flex;
        align-items: center;
    }
    #windturbine_accordion .accordion-header .accordion-button {
        flex: 1;
    }
    #windturbine_accordion .delete-windturbine-project {
        opacity: 0.35;
        transition: opacity 0.2s, transform 0.15s;
        text-decoration: none;
    }
    #windturbine_accordion .accordion-item:hover .delete-windturbine-project {
        opacity: 1;
    }
    #windturbine_accordion .delete-windturbine-project:hover {
        transform: scale(1.2);
        color: #dc3545 !important;
    }
</style>