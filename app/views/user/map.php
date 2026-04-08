<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.4.0/leaflet.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.4.0/leaflet.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/Turf.js/6.5.0/turf.min.js"></script>
<link href="<?=asset('public/css/page.css')?>" rel="stylesheet">
<script src="<?=asset('public/js/user/mapConfig.js')?>"></script>
<script src="<?=asset('public/js/user/mapHelper.js')?>"></script>
<script>
    let windyAPI, map, poleLayerGroup;
    let DEFAULT_LEVEL = '100m';
    let options = { 
        lat: 16.5, 
        lon: 106.0, 
        zoom: 13, 
        preferCanvas: true,
        updateWhenZooming: true,
        updateWhenIdle: false,
        updateInterval: 16, 
        zoomAnimation: true,
        fadeAnimation: true,
        markerZoomAnimation: true,
        keepBuffer: 2, 
        zoomSnap: 0.25,
        zoomDelta: 0.5,
        wheelPxPerZoomLevel: 120,
        labels: false, 
        maxZoom: 14,
    };
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = src;
            s.async = true;
            s.onload = resolve;
            s.onerror = reject;
            document.body.appendChild(s);
        });
    }
    (function() {
        const hasSeenGlobe = sessionStorage.getItem('globe_shown');
        if (!hasSeenGlobe) {
            window.location.replace("<?=BASE_URL?>/intro"); 
            return;
        }
    })();
    (async function initSystem() {
        try {
            const response = await fetch(`${BASE_URL}/api/configs.get`);
            const base64Data = await response.text();
            const config = JSON.parse(atob(base64Data));
            if (config.WINDY_KEY) {
                options.key = config.WINDY_KEY;
                DEFAULT_LEVEL = config.DEFAULT_LEVEL || '100m';
                await loadScript("https://api.windy.com/assets/map-forecast/libBoot.js");
                await Promise.all([
                    loadScript(`<?=asset('public/js/user/map.js')?>`),
                    loadScript(`<?=asset('public/js/user/report.js')?>`)
                ]); 
            }
        } catch (err) {
            console.error("Initialization error:", err);
        }
    })();
</script>
<link rel="stylesheet" href="<?=asset('public/css/map.css')?>">
<link rel="stylesheet" href="<?=asset('public/css/pole.css')?>">
<div id="wind-loading">
    <div class="wind-grid">
        <?php 
        $cols = 12;
        $total_icons = 120;
        for($i=0; $i<$total_icons; $i++): 
            $row = floor($i / $cols);
            $is_even_row = ($row % 2 == 0);
            $display_logic = $is_even_row ? ($i % 2 == 0) : ($i % 2 != 0);    
            if($display_logic): ?>
                <img src="<?=BASE_URL?>/public/images/logo.png" alt="logo">
            <?php else: ?>
                <img src="<?=BASE_URL?>/public/images/iwind.png" alt="wind">
            <?php endif; ?>
        <?php endfor; ?>
    </div>
</div>
<div id="area-panel" class="collapsed">
    <button id="area-panel-tab" onclick="toggleAreaPanel()">
        <span class="tab-arrow">
            <i class="fa fa-chevron-right"></i>
        </span>
    </button>
    <div class="ap-inner">
        <div class="ap-header"><i class="fa-solid fa-diagram-project me-2"></i><span data-i18n="project"></span></div>
        <div class="ap-list" id="ap-list">
            <div class="p-4 text-center">
                <div class="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
                <div class="small text-muted" data-i18n="loading"></div>
            </div>
        </div>
    </div>
</div>
<div id="windy"></div>
<div class="side-control-panel" id="sideControlPanel">
    <div class="scp-header">
        <div class="scp-title">
            <i class="fa-solid fa-sliders"></i>
            <span data-i18n="map_controls"></span>
        </div>
        <button class="btn-collapse d-none d-md-flex" id="toggleExpandBtn" onclick="togglePanelCollapse()">
            <i class="fa-solid fa-chevron-down"></i>
        </button>
    </div>
    <div class="scp-body" id="scpBody">
        <div class="scp-section">
            <div class="control-row">
                <div class="ctrl-label">
                    <i class="fa-solid fa-fan wind-icon-anim" id="wind-status-icon"></i>
                    <span data-i18n="show_wind_values"></span>
                </div>
                <label class="tog">
                    <input type="checkbox" id="toggle-wind-values">
                    <span class="tog-track"></span>
                </label>
            </div>
            <div class="control-row">
                <div class="ctrl-label">
                    <i class="fa-solid fa-crosshairs"></i>
                    <span data-i18n="focus_mode"></span>
                </div>
                <label class="tog">
                    <input type="checkbox" id="toggle-focus">
                    <span class="tog-track"></span>
                </label>
            </div>
            <div class="control-row">
                <div class="ctrl-label">
                    <i class="fa-solid fa-up-right-and-down-left-from-center"></i>
                    <span data-i18n="reset_view"></span>
                </div>
                <button class="btn-reset-view" onclick="resetView()">
                    <i class="fa-solid fa-up-right-and-down-left-from-center"></i>
                </button>
            </div>
        </div>
        <div class="scp-section">
            <div class="control-row">
                <div class="ctrl-label">
                    <i class="fas fa-broadcast-tower"></i>
                    <span data-i18n="wind_measurement_equipment"></span>
                </div>
                <label class="tog">
                    <input class="equipment-switch" type="checkbox" id="toggle-equipment">
                    <span class="tog-track"></span>
                </label>
            </div>
            <div class="control-row">
                <div class="ctrl-label">
                    <i class="bi bi-fan"></i>
                    <span data-i18n="windturbine"></span>
                </div>
                <label class="tog">
                    <input class="windturbine-switch" type="checkbox" id="toggle-windturbine">
                    <span class="tog-track"></span>
                </label>
            </div>
            <div class="control-row">
                <div class="ctrl-label">
                    <i class="fa-solid fa-wind"></i>
                    <span data-i18n="wind_animation"></span>
                </div>
                <label class="tog">
                    <input class="animation-switch" type="checkbox" id="toggle-animation">
                    <span class="tog-track"></span>
                </label>
            </div>
            <div class="control-row">
                <div class="ctrl-label">
                    <i class="fa-solid fa-location-dot"></i>
                    <span data-i18n="show_place_label"></span>
                </div>
                <label class="tog">
                    <input class="custom-switch" type="checkbox" id="toggle-label">
                    <span class="tog-track"></span>
                </label>
            </div>
        </div>
        <div class="scp-section">
            <div class="map-mode-wrap">
                <div class="map-mode-card" id="mapModeWind" onclick="setMapMode('wind')">
                    <img src="<?=BASE_URL?>/public/images/wind-thumb.jpg" alt="Satellite view" class="thumb-sat">
                    <div class="mode-check"><i class="fa-solid fa-check"></i></div>
                    <div class="mode-label">
                        <i class="fa-solid fa-wind me-2"></i><span data-i18n="wind"></span>
                    </div>
                </div>
                <div class="map-mode-card" id="mapModeSat" onclick="setMapMode('satellite')">
                    <img src="<?=BASE_URL?>/public/images/satellite-thumb.jpg" alt="Satellite view" class="thumb-sat">
                    <div class="mode-check"><i class="fa-solid fa-check"></i></div>
                    <div class="mode-label">
                        <i class="fa-solid fa-earth-asia me-2"></i><span data-i18n="satellite"></span>
                    </div>
                </div>
            </div>
        </div>
        <div class="scp-section">
            <div class="control-row" style="margin-bottom:0">
                <div class="ctrl-label">
                    <i class="fa-solid fa-gauge"></i>
                    <span data-i18n="wind_speed"></span>
                </div>
                <div class="unit-group">
                    <button class="btn-unit-select" onclick="setWindUnit(0)">m/s</button>
                    <button class="btn-unit-select" onclick="setWindUnit(1)">km/h</button>
                    <button class="btn-unit-select" onclick="setWindUnit(2)">kt</button>
                </div>
            </div>
            <div class="legend-bar"></div>
            <div class="legend-labels">
                <span id="legend-0">0</span>
                <span id="legend-5">5</span>
                <span id="legend-10">10</span>
                <span id="legend-15">15</span>
                <span id="legend-20">20+</span>
            </div>
        </div>
        <div class="scp-section" style="border-bottom:none">
            <div class="mini-card-grid-3">
                <div class="mini-card">
                    <div class="mini-card-label" data-i18n="max_wind_speed">Max speed</div>
                    <div class="mini-card-value text-warning" id="stat-max-wind">
                        <span class="stat-max-wind-val">0.0</span>
                        <small class="stat-unit-label">m/s</small>
                    </div>
                </div>
                <div class="mini-card">
                    <div class="mini-card-label" data-i18n="avg_wind_speed">Avg speed</div>
                    <div class="mini-card-value text-success" id="stat-avg-wind">
                        <span class="stat-avg-wind-val">0.0</span>
                        <small class="stat-unit-label">m/s</small>
                    </div>
                </div>
                <div class="mini-card">
                    <div class="mini-card-label" data-i18n="min_wind_speed">Min speed</div>
                    <div class="mini-card-value text-info" id="stat-min-wind">
                        <span class="stat-min-wind-val">0.0</span>
                        <small class="stat-unit-label">m/s</small>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<button class="mobile-fab btn" id="fabToggle"><i class="fa-solid fa-layer-group"></i></button>
<div class="panel-overlay" id="panelOverlay"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js"></script>
<script src="<?=asset('public/js/user/pole.js')?>" defer></script>