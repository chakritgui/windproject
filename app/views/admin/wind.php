<div class="container-fluid mt-90 mb-5">
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 p-3 rounded-3 shadow-sm" style="background: #ffffff; border-left: 4px solid #0d6efd;">
        <div class="mb-2 mb-md-0">
            <h4 class="fw-bold mb-1 d-flex align-items-center" style="font-size: 1.35rem;">
                <i class="fa-solid fa-wind me-2 text-primary" style="font-size: 1.5rem;"></i>
                <span data-i18n="wind_management"></span>
            </h4>
            <nav aria-label="breadcrumb" style="margin-left: 25px;">
                <ol class="breadcrumb mb-0 small">
                    <li class="breadcrumb-item">
                        <span data-i18n="admin"></span>
                    </li>
                    <li class="breadcrumb-item active" aria-current="page">
                        <span data-i18n="wind"></span>
                    </li>
                </ol>
            </nav>
        </div>
    </div>
</div>
<div class="container-fluid mt-3 mb-5">
    <div class="row g-2 mb-3">
        <div class="col-sm-2">
            <p><i class="fa-regular fa-calendar"></i> <span data-i18n="date"></span></p>
            <input type="text" class="form-control filter" id="filter_date">
        </div>
        <div class="col-sm-2">
            <p><i class="fa-regular fa-calendar"></i> <span data-i18n="project"></span></p>
            <select id="filter_project" class="form-select filter"></select>
        </div>
        <div class="col-sm-2">
            <p><i class="fa-solid fa-location-dot"></i> <span data-i18n="pole"></span></p>
            <select id="filter_pole" class="form-select filter"></select>
        </div>
        <div class="col-sm-2">
            <p><i class="fa-regular fa-calendar"></i> <span data-i18n="type"></span></p>
            <select id="filter_type" class="form-select filter"></select>
        </div>
        <div class="col-sm-2">
            <p><i class="fa-regular fa-calendar"></i> <span data-i18n="installation"></span></p>
            <select id="filter_installation" class="form-select filter"></select>
        </div>
        <div class="col-sm-2">
            <p><i class="fa-regular fa-calendar"></i> <span data-i18n="height"></span></p>
            <select id="filter_height" class="form-select filter"></select>
        </div>
    </div>
</div>
<div class="container-fluid mt-3 mb-5">
    <div class="mb-3">
        <button class="btn btn-sm btn-primary import-history"><i class="fa-solid fa-clock-rotate-left"></i> <span data-i18n="import_history"></button> 
        <button class="btn btn-sm btn-danger clear-data"><i class="fa-solid fa-trash-can"></i> <span data-i18n="clear_data"></button> 
    </div>
    <div class="table-responsive">
        <table class="table table-hover" id="tb_wind">
            <thead>
                <tr>
                    <th data-i18n="no."></th>
                    <th data-i18n="code"></th>
                    <th data-i18n="project"></th>
                    <th data-i18n="type"></th>
                    <th data-i18n="installation"></th>
                    <th data-i18n="year"></th>
                    <th data-i18n="date"></th>
                    <th data-i18n="height"></th>
                    <th data-i18n="height_level"></th>
                    <th data-i18n="wind_speed"></th>
                    <th data-i18n="wind_direction"></th>
                    <th data-i18n="air_density"></th>
                    <th data-i18n="pressure"></th>
                    <th data-i18n="humidity"></th>
                    <th data-i18n="temperature"></th>
                    <th data-i18n="turbulence_intensity"></th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    </div>
</div>
<script src="<?=BASE_URL?>/public/js/admin/wind.js?v=<?=time()?>"></script>