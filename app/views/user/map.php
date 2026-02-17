<link rel="stylesheet" href="<?=BASE_URL?>/vendor/leaflet/1.4.0/dist/leaflet.css">
<script src="<?=BASE_URL?>/vendor/leaflet/1.4.0/dist/leaflet.js"></script>
<script>
    let options = { lat: 16.5, lon: 106.0, zoom: 8, labels: false };
    let DEFAULT_LEVEL = '100m';
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = src;
            s.onload = resolve;
            s.onerror = reject;
            document.body.appendChild(s);
        });
    }
    fetch(`${BASE_URL}/api/configs.get`).then(response => response.text()).then(async base64Data => {
        const config = JSON.parse(atob(base64Data));
        DEFAULT_LEVEL = config.DEFAULT_LEVEL;
        if (config.WINDY_KEY) {
            options.key = config.WINDY_KEY;
            await loadScript("https://api.windy.com/assets/map-forecast/libBoot.js");
            await loadScript("<?=BASE_URL?>/public/js/user/map.js?v=<?=time();?>");
            await loadScript("<?=BASE_URL?>/public/js/user/report.js?v=<?=time();?>"); 
        }
    }).catch(err => console.error("Config error:", err));
</script>
<link rel="stylesheet" href="<?=BASE_URL?>/public/css/map.css?v=<?=time();?>">
<link rel="stylesheet" href="<?=BASE_URL?>/public/css/pole.css?v=<?=time();?>">
<div id="wind-loading">
    <div class="wind-grid">
        <div class="wind-spacer"></div>
        <?php for($i=0; $i<120; $i++): ?>
            <?php if($i % 2 == 0): ?>
                <img src="<?=BASE_URL?>/public/images/iwind.png" alt="wind">
            <?php else: ?>
                <img src="<?=BASE_URL?>/public/images/logo.png" alt="logo">
            <?php endif; ?>
        <?php endfor; ?>
    </div>
</div>
<div id="ui">
    <div class="wind-toggle-card">
        <div class="wind-icon"><i class="fa-solid fa-fan"></i></div>
        <div class="wind-label">WIND MAP</div>
        <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" id="windSwitch" checked>
        </div>
    </div>
</div>
<div id="windy"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js"></script>
<script src="<?=BASE_URL?>/public/js/user/pole.js?v=<?=time();?>" defer></script>