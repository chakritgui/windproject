<link rel="stylesheet" href="<?=BASE_URL?>/public/css/admin/dashboard.css?v=<?php echo time(); ?>">
<div class="container-fluid mt-90 mb-5">
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 p-3 rounded-3 shadow-sm" style="background: #ffffff; border-left: 4px solid #0d6efd;">
        <div class="mb-2 mb-md-0">
            <h4 class="fw-bold mb-1 d-flex align-items-center" style="font-size: 1.35rem;">
                <i class="fa-solid fa-chart-line text-primary" style="font-size: 1.5rem;"></i>
                <span data-i18n="dashboard"></span>
            </h4>
            <nav aria-label="breadcrumb" style="margin-left: 25px;">
                <ol class="breadcrumb mb-0 small">
                    <li class="breadcrumb-item">
                        <span data-i18n="admin"></span>
                    </li>
                    <li class="breadcrumb-item active" aria-current="page">
                        <span data-i18n="dashboard"></span>
                    </li>
                </ol>
            </nav>
        </div>
    </div>
</div>
<div class="container-fluid mt-3 mb-5">
    <div class="row g-4 mb-4">
        <div class="col-xl-3 col-sm-6">
            <div class="card stat-card h-100 text-white" style="background: var(--primary-gradient)">
                <div class="card-body p-4">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <div class="stat-label" data-i18n="member"></div>
                            <div class="stat-number" id="memberCount">0</div>
                        </div>
                        <div class="icon-box"><i class="fa-solid fa-users"></i></div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-xl-3 col-sm-6">
            <div class="card stat-card h-100 text-white" style="background: var(--success-gradient)">
                <div class="card-body p-4">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <div class="stat-label" data-i18n="contract"></div>
                            <div class="stat-number" id="contractCount">0</div>
                        </div>
                        <div class="icon-box"><i class="fa-solid fa-file-signature"></i></div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-xl-3 col-sm-6">
            <div class="card stat-card h-100 text-white" style="background: var(--info-gradient)">
                <div class="card-body p-4">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <div class="stat-label" data-i18n="project"></div>
                            <div class="stat-number" id="projectCount">0</div>
                        </div>
                        <div class="icon-box"><i class="fa-solid fa-diagram-project"></i></div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-xl-3 col-sm-6">
            <div class="card stat-card h-100 text-white" style="background: var(--warning-gradient)">
                <div class="card-body p-4">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <div class="stat-label" data-i18n="installation"></div>
                            <div class="stat-number" id="installCount">0</div>
                        </div>
                        <div class="icon-box"><i class="fa-solid fa-map-location-dot"></i></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="row g-3 mb-4">
        <div class="col-6 col-md-3">
            <div class="mini-stat-card">
                <i class="fa-solid fa-map-pin"></i>
                <div class="h4 fw-bold mb-0" id="poleTypeCount">0</div>
                <div class="small text-muted" data-i18n="pole_types"></div>
            </div>
        </div>
        <div class="col-6 col-md-3">
            <div class="mini-stat-card">
                <i class="fa-solid fa-tower-broadcast"></i>
                <div class="h4 fw-bold mb-0" id="poleCount">0</div>
                <div class="small text-muted" data-i18n="pole"></div>
            </div>
        </div>
        <div class="col-6 col-md-3">
            <div class="mini-stat-card">
                <i class="fa-solid fa-folder-open"></i>
                <div class="h4 fw-bold mb-0" id="documentCount">0</div>
                <div class="small text-muted" data-i18n="documents"></div>
            </div>
        </div>
        <div class="col-6 col-md-3">
            <div class="mini-stat-card">
                <i class="fa-solid fa-newspaper"></i>
                <div class="h4 fw-bold mb-0" id="newsCount">0</div>
                <div class="small text-muted" data-i18n="news"></div>
            </div>
        </div>
    </div>
    <div class="row g-4 mb-4">
        <div class="col-lg-12">
            <div class="card custom-card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0 fw-bold"><i class="fa-solid fa-wind text-info me-2"></i> <span data-i18n="wind_analytics"></span></h5>
                    <span class="badge bg-light text-dark rounded-pill border" data-i18n="Real-timeData"></span>
                </div>
                <div class="card-body p-4">
                    <div class="row g-3 mb-4 text-center">
                        <div class="col-md-4">
                            <div class="p-3 rounded-4 bg-light">
                                <i class="fa-solid fa-file-import text-success mb-2 fs-4"></i>
                                <h4 class="fw-bold mb-0" id="windImportCount">0</h4>
                                <small class="text-muted" data-i18n="import"></small>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="p-3 rounded-4 bg-light">
                                <i class="fa-solid fa-database text-primary mb-2 fs-4"></i>
                                <h4 class="fw-bold mb-0" id="windRowCount">0</h4>
                                <small class="text-muted" data-i18n="row_recorded"></small>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="p-3 rounded-4 bg-light">
                                <i class="fa-regular fa-clock text-danger mb-2 fs-4"></i>
                                <h4 class="fw-bold mb-0" id="windUpdate" style="font-size: 1.1rem;">-</h4>
                                <small class="text-muted" data-i18n="last_update"></small>
                            </div>
                        </div>
                    </div>
                    <div class="row mb-4">
                        <div class="col-12 mb-4">
                            <div class="card custom-card">
                                <div class="card-body" style="height: 350px;"> <canvas id="windDataChart"></canvas>
                                </div>
                            </div>
                        </div>
                        <div class="col-xl-2 col-md-4 col-sm-6 mb-3">
                            <div class="mini-chart-container p-2 bg-white rounded shadow-sm">
                                <small class="text-muted d-block text-center"><span data-i18n="direction"></span> (°)</small>
                                <div style="height: 120px;"><canvas id="chart-direction"></canvas></div>
                            </div>
                        </div>
                        <div class="col-xl-2 col-md-4 col-sm-6 mb-3">
                            <div class="mini-chart-container p-2 bg-white rounded shadow-sm">
                                <small class="text-muted d-block text-center"><span data-i18n="temperature"></span> (°C)</small>
                                <div style="height: 120px;"><canvas id="chart-temp"></canvas></div>
                            </div>
                        </div>
                        <div class="col-xl-2 col-md-4 col-sm-6 mb-3">
                            <div class="mini-chart-container p-2 bg-white rounded shadow-sm">
                                <small class="text-muted d-block text-center"><span data-i18n="humidity"></span> (%)</small>
                                <div style="height: 120px;"><canvas id="chart-humidity"></canvas></div>
                            </div>
                        </div>
                        <div class="col-xl-2 col-md-4 col-sm-6 mb-3">
                            <div class="mini-chart-container p-2 bg-white rounded shadow-sm">
                                <small class="text-muted d-block text-center"><span data-i18n="pressure"></span> (hPa)</small>
                                <div style="height: 120px;"><canvas id="chart-pressure"></canvas></div>
                            </div>
                        </div>
                        <div class="col-xl-4 col-md-8 col-sm-12 mb-3"> <div class="mini-chart-container p-2 bg-white rounded shadow-sm">
                                <small class="text-muted d-block text-center"><span data-i18n="air_density"></span> (kg/m³)</small>
                                <div style="height: 120px;"><canvas id="chart-density"></canvas></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="card custom-card">
        <div class="card-header">
            <h5 class="mb-0 fw-bold"><i class="fa-solid fa-clock-rotate-left text-info me-2"></i> <span data-i18n="usage_history"></span></h5>
        </div>
        <div class="card-body p-0">
            <div class="table-responsive">
                <table id="loginHistoryTable" class="table table-hover align-middle mb-0">
                    <thead>
                        <tr>
                            <th class="ps-4" data-i18n="member"></th>
                            <th data-i18n="login_time"></th>
                            <th class="hide-mobile" data-i18n="logout_time"></th>
                            <th data-i18n="ip_address"></th>
                            <th class="hide-mobile" data-i18n="device"></th>
                            <th class="text-center pe-4" data-i18n="tatus"></th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
    </div>
</div>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<script src="<?=BASE_URL?>/public/js/admin/dashboard.js?v=<?=time()?>"></script>