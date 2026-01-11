<link rel="stylesheet" href="<?=BASE_URL?>/public/css/pole.css?v=<?=time();?>">
<div class="container-fluid mt-3 mb-5">
    <div class="header-card">
        <div class="row align-items-center">
            <div class="col-lg-12">
                <h5 class="mb-3"><i class="fas fa-broadcast-tower me-3"></i>Met Mast 2 #SPW MM2</h5>
                <div class="mb-1 d-flex flex-wrap align-items-center gap-3">
                    <span><i class="fa-solid fa-diagram-project me2"></i> Sepon Wind Farm</span>
                    <span>
                        <i class="fa-regular fa-calendar me-1"></i>
                        01/11/2025 - 12/12/2025
                    </span>
                    <span>
                        <i class="fas fa-arrows-alt-v me-1"></i>
                        MET MAST 75
                    </span>
                    <span>
                        <i class="fas fa-map-marker-alt me-1"></i>
                        16.6934980, 106.3742420
                    </span>
                </div>
            </div>
        </div>
    </div>
</div>
<div class="container-fluid mt-3 mb-5">
    <div id="reportSection">
        <div class="report-section">
            <h5 class="report-title"><i class="fas fa-chart-bar me-2"></i><span data-i18n="average_summary"></span></h5>
            <div class="row" id="statsContainer"></div>
        </div>
        <div class="report-section">
            <h5 class="report-title">
                <i class="fas fa-chart-line me-2"></i><span data-i18n="visualization"></span>
            </h5>
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