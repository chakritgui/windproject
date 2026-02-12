<link rel="stylesheet" href="<?=BASE_URL?>/public/css/pole.css?v=<?=time();?>">
<input type="hidden" id="poles_id"  value="<?= htmlspecialchars($id ?? '', ENT_QUOTES, 'UTF-8') ?>">
<input type="hidden" id="start" value="<?= htmlspecialchars($startDate ?? '', ENT_QUOTES, 'UTF-8') ?>">
<input type="hidden" id="end"   value="<?= htmlspecialchars($endDate ?? '', ENT_QUOTES, 'UTF-8') ?>">
<input type="hidden" id="height_id" value="<?= htmlspecialchars($height_id ?? '', ENT_QUOTES, 'UTF-8') ?>">
<input type="hidden" id="sensors"   value="<?= htmlspecialchars(implode(',', $sensors ?? []), ENT_QUOTES, 'UTF-8') ?>">
<div class="container-fluid mt-5 mb-3" style="margin-top: 100px !important;">
    <div class="row">
        <div class="col-lg-12">
            <div class="d-none d-md-flex justify-content-between align-items-center">
                <button class="btn btn-outline-secondary btn-sm close-page">
                    <i class="fa-solid fa-chevron-left me-1"></i> 
                    <span data-i18n="back">Back</span>
                </button>
                <button class="btn btn-primary btn-sm open-poles" data-id="<?= htmlspecialchars($id ?? '', ENT_QUOTES, 'UTF-8') ?>">
                    <i class="fa-solid fa-filter me-1"></i> 
                    <span data-i18n="filter">Filter</span>
                </button>
            </div>
            <div class="mobile-fab-container d-md-none">
                <button class="fab-button btn-sm fab-back close-page">
                    <i class="fa-solid fa-chevron-left"></i>
                </button>
                <button class="fab-button btn-sm fab-filter open-poles" data-id="<?= htmlspecialchars($id ?? '', ENT_QUOTES, 'UTF-8') ?>">
                    <i class="fa-solid fa-filter"></i>
                </button>
            </div>
        </div>
    </div>
</div>
<div class="container-fluid mt-3 mb-3">
    <div class="header-card">
        <div class="row align-items-center">
            <div class="col-lg-12">
                <h5 class="mb-3"><i class="fas fa-broadcast-tower me-3"></i><span id="installations_name"></span> #<span id="code"></span></h5>
                <div class="mb-1 d-flex flex-wrap align-items-center gap-3">
                    <span><i class="fa-solid fa-diagram-project me2"></i> <span id="project"></span></span>
                    <span>
                        <i class="fas fa-arrows-alt-v me-1"></i>
                        <span id="level"></span>
                    </span>
                    <span>
                        <i class="fas fa-map-marker-alt me-1"></i>
                        <span id="location"></span>
                    </span>
                    <span>
                        <i class="fa-regular fa-calendar me-1"></i>
                        <span id="period"></span> <span class="badge-days mx-1"> <span id="total_days"></span> <span data-i18n="days"></span></span>
                    </span>
                </div>
            </div>
        </div>
        <div class="mt-1 border-opacity-25">
            <div class="d-flex align-items-center text-white">
                <i class="fa-solid fa-circle-info me-2 small"></i>
                <div class="fw-bold" data-i18n="report_remark"></div>
            </div>
        </div>
    </div>
</div>
<div class="container-fluid mt-3 mb-3">
    <div class="report-section">
        <h6 class="report-title"><i class="fa-solid fa-cloud-meatball me-2"></i><span data-i18n="weather_overview"></span></h6>
        <div class="row g-2 mt-2" id="weatherContainer"></div>
    </div>
</div>
<div class="container-fluid mt-3 mb-3">
    <div id="reportSection">
        <div class="report-section">
            <h6 class="report-title"><i class="fa-solid fa-cloud-meatball me-2"></i><span data-i18n="weather_overview"></span></h6>
            <div class="row g-3" id="statsContainer"></div>
        </div>
        <div class="report-section">
            <h6 class="report-title"><i class="fas fa-chart-line me-2"></i><span data-i18n="visualization"></span></h6>
            <div class="row" id="chartRow">
                <div class="col-lg-4 mb-4 chart-box" data-chart="wind-speed">
                    <h6 class="text-center" data-i18n="wind_speed_trend"></h6>
                    <div class="chart-container">
                        <canvas id="lineChart"></canvas>
                    </div>
                </div>
                <div class="col-lg-4 mb-4 chart-box" data-chart="wind-speed-area">
                    <h6 class="text-center" data-i18n="wind_speed_area"></h6>
                    <div class="chart-container">
                        <canvas id="areaChart"></canvas>
                    </div>
                </div>
                <div class="col-lg-4 mb-4 chart-box" data-chart="wind-speed-hist">
                    <h6 class="text-center" data-i18n="wind_speed_distribution"></h6>
                    <div class="chart-container">
                        <canvas id="barChart"></canvas>
                    </div>
                </div>
                <div class="col-lg-4 mb-4 chart-box" data-chart="wind-direction">
                    <h6 class="text-center" data-i18n="wind_rose"></h6>
                    <div class="chart-container">
                        <canvas id="radarChart"></canvas>
                    </div>
                </div>
                <div class="col-lg-4 mb-4 chart-box" data-chart="weather">
                    <h6 class="text-center" data-i18n="weather_overview"></h6>
                    <div class="chart-container">
                        <canvas id="weatherChart"></canvas>
                    </div>
                </div>
                <div class="col-lg-4 mb-4 chart-box" data-chart="air">
                    <h6 class="text-center" data-i18n="air_density_turbulence"></h6>
                    <div class="chart-container">
                        <canvas id="airChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js"></script>
<script src="<?=BASE_URL?>/public/js/user/pole.js?v=<?=time();?>" defer></script>
<script src="<?=BASE_URL?>/public/js/user/report.js?v=<?=time();?>" defer></script>