<link href="<?=asset('public/css/page.css')?>" rel="stylesheet">
<link href="<?=asset('public/css/pole.css')?>" rel="stylesheet">
<input type="hidden" id="poles_id"  value="<?= htmlspecialchars($id ?? '', ENT_QUOTES, 'UTF-8') ?>">
<input type="hidden" id="start" value="<?= htmlspecialchars($startDate ?? '', ENT_QUOTES, 'UTF-8') ?>">
<input type="hidden" id="end" value="<?= htmlspecialchars($endDate ?? '', ENT_QUOTES, 'UTF-8') ?>">
<input type="hidden" id="height_id" value="<?= htmlspecialchars($height_id ?? '', ENT_QUOTES, 'UTF-8') ?>">
<input type="hidden" id="sensors" value="<?= htmlspecialchars(implode(',', $sensors ?? []), ENT_QUOTES, 'UTF-8') ?>">
<input type="hidden" id="levels" value="<?= htmlspecialchars(implode(',', $levels ?? []), ENT_QUOTES, 'UTF-8') ?>">
<div class="sky-wrap" id="skyWrap"></div>
<div class="container-fluid mt-3 mb-4" style="margin-top: 75px !important;">
    <div class="row">
        <div class="col-lg-12">
            <div class="p-2 rounded-4 bg-white shadow-sm border border-light-subtle d-flex align-items-center justify-content-between flex-wrap gap-3">
                <div class="flex-shrink-0">
                    <button class="btn btn-link text-decoration-none text-secondary fw-bold px-3 py-2 rounded-pill hover-bg-light transition-all close-page">
                        <i class="fa-solid fa-arrow-left-long me-2"></i><span data-i18n="back"></span>
                    </button>
                </div>
                <div class="d-flex align-items-center gap-2 ms-auto">
                    <button class="btn btn-blue rounded-pill px-4 py-2 fw-bold shadow-sm d-flex align-items-center gap-2 border-0 open-poles btn-gradient-primary" data-id="<?= htmlspecialchars($id ?? '', ENT_QUOTES, 'UTF-8') ?>">
                        <i class="fa-solid fa-sliders"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>
<div class="container-fluid mt-3 mb-3">
    <div class="report-section">
        <div class="d-flex align-items-center gap-3 mb-3">
            <div class="bg-primary bg-opacity-10 p-3 rounded-circle text-primary shadow-sm d-flex align-items-center justify-content-center" style="width: 56px; height: 56px; animation: iconFloat 3.5s ease-in-out infinite;">
                <i class="fa-solid fa-cloud-meatball fs-4"></i>
            </div>
            <h4 class="fw-bold mb-1 text-dark" data-i18n="weather_overview"></h4>
        </div>
        <div class="row g-2 mt-2" id="weatherContainer"></div>
    </div>
</div>
<div class="container-fluid mt-3 mb-3">
    <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div class="card-body p-3 p-lg-3">
            <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div class="d-flex align-items-center gap-3">
                    <div class="bg-primary bg-opacity-10 p-3 rounded-circle text-primary shadow-sm d-flex align-items-center justify-content-center" style="width: 56px; height: 56px; animation: iconFloat 3.5s ease-in-out infinite;">
                        <i class="fas fa-broadcast-tower fs-4"></i>
                    </div>
                    <div>
                        <h4 class="fw-bold mb-1 text-dark">
                            <span id="installations_name"></span>
                            <small class="text-muted fw-light ms-1">#<span id="code"></span></small>
                        </h4>
                        <div class="d-inline-flex align-items-center py-1">
                            <i class="fa-solid fa-circle-dot me-2 status_color small" style="animation: status-ripple 2s infinite ease-out;"></i>
                            <span id="status_name" class="fw-bold opacity-75"></span>
                        </div>
                    </div>
                </div>
            </div>
            <hr class="text-muted opacity-25 mb-4">
            <div class="row row-cols-1 row-cols-sm-2 row-cols-xl-4 g-4">
                <div class="col">
                    <div class="d-flex align-items-start gap-3 p-2 rounded-3 hover-bg-light transition">
                        <div class="text-primary opacity-50"><i class="fa-solid fa-diagram-project fs-4"></i></div>
                        <div>
                            <label class="d-block text-muted small fw-bold text-uppercase mb-1" data-i18n="project"></label>
                            <span id="project" class="text-dark fw-semibold"></span> 
                        </div>
                    </div>
                </div>
                <div class="col">
                    <div class="d-flex align-items-start gap-3 p-2 rounded-3 hover-bg-light transition">
                        <div class="text-info opacity-50"><i class="fas fa-arrows-alt-v fs-4"></i></div>
                        <div>
                            <label class="d-block text-muted small fw-bold text-uppercase mb-1" data-i18n="level"></label>
                            <span id="height" class="text-dark fw-semibold"></span>
                        </div>
                    </div>
                </div>
                <div class="col">
                    <div class="d-flex align-items-start gap-3 p-2 rounded-3 hover-bg-light transition">
                        <div class="text-success opacity-50"><i class="fas fa-map-marker-alt fs-4"></i></div>
                        <div>
                            <label class="d-block text-muted small fw-bold text-uppercase mb-1" data-i18n="location"></label>
                            <span id="location" class="text-dark fw-semibold d-block text-truncate" style="max-width: 180px;"></span>
                        </div>
                    </div>
                </div>
                <div class="col">
                    <div class="d-flex align-items-start gap-3 p-2 rounded-3 hover-bg-light transition">
                        <div class="text-warning opacity-50"><i class="fa-regular fa-calendar fs-4"></i></div>
                        <div>
                            <label class="d-block text-muted small fw-bold text-uppercase mb-1" data-i18n="monitoring_period"></label>
                            <div class="d-flex align-items-center gap-2">
                                <span id="period" class="text-dark fw-semibold small"></span>
                                <span class="badge rounded-pill bg-primary-subtle text-primary border border-primary-subtle fw-bold">
                                    <span id="total_days"></span> <span data-i18n="days"></span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="bg-dark bg-opacity-10 px-4 py-2 border-top border-light-subtle">
            <div class="d-flex align-items-center text-secondary small">
                <i class="fa-solid fa-circle-info me-2"></i>
                <span class="fw-bold me-1" data-i18n="report_remark"></span>
            </div>
        </div>
    </div>
</div>
<div class="container-fluid mt-3 mb-5">
    <div id="reportSection">
        <div class="report-section">
            <div class="d-flex align-items-center gap-3 mb-3">
                <div class="bg-primary bg-opacity-10 p-3 rounded-circle text-primary shadow-sm d-flex align-items-center justify-content-center" style="width: 56px; height: 56px; animation: iconFloat 3.5s ease-in-out infinite;">
                    <i class="fas fa-chart-bar fs-4"></i>
                </div>
                <h4 class="fw-bold mb-1 text-dark" data-i18n="average_summary"></h4>
            </div>
            <div class="row g-2 mt-2" id="statsContainer"></div>
        </div>
        <div class="report-section">
            <div class="d-flex align-items-center gap-3 mb-3">
                <div class="bg-primary bg-opacity-10 p-3 rounded-circle text-primary shadow-sm d-flex align-items-center justify-content-center" style="width: 56px; height: 56px; animation: iconFloat 3.5s ease-in-out infinite;">
                    <i class="fas fa-chart-line fs-4"></i>
                </div>
                <h4 class="fw-bold mb-1 text-dark" data-i18n="visualization"></h4>
            </div>
            <div class="row" id="chartRow">
                <div class="col-lg-4 mb-4 chart-box p-3" data-chart="wind-speed">
                    <h6 class="text-center" data-i18n="wind_speed"></h6>
                    <div class="chart-container">
                        <canvas id="lineChart"></canvas>
                    </div>
                </div>
                <div class="col-lg-4 mb-4 chart-box p-3" data-chart="wind-speed-hist">
                    <h6 class="text-center" data-i18n="wind_speed_distribution"></h6>
                    <div class="chart-container">
                        <canvas id="barChart"></canvas>
                    </div>
                </div>
                <div class="col-lg-4 mb-4 chart-box p-3" data-chart="wind-direction">
                    <h6 class="text-center" data-i18n="wind_rose"></h6>
                    <div class="chart-container">
                        <canvas id="radarChart"></canvas>
                    </div>
                </div>
                <div class="col-lg-4 mb-4 chart-box p-3" data-chart="weather">
                    <h6 class="text-center" data-i18n="weather_overview"></h6>
                    <div class="chart-container">
                        <canvas id="weatherChart"></canvas>
                    </div>
                </div>
                <div class="col-lg-4 mb-4 chart-box p-3" data-chart="air">
                    <h6 class="text-center" data-i18n="air_density_turbulence"></h6>
                    <div class="chart-container">
                        <canvas id="airChart"></canvas>
                    </div>
                </div>
                <div class="col-lg-4 mb-4 chart-box p-3" data-chart="surface-pressure">
                    <h6 class="text-center" data-i18n="surface_pressure"></h6>
                    <div class="chart-container">
                        <canvas id="pressureChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js"></script>
<script src="<?=asset('public/js/user/sky.js')?>"></script>
<script src="<?=asset('public/js/user/pole.js')?>" defer></script>
<script src="<?=asset('public/js/user/report.js')?>" defer></script>