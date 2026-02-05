<script>
    let options = {
        lat: 16.5,
        lon: 106.0,
        zoom: 8
    };
    fetch(`${BASE_URL}/api/setting/getPublicConfig`)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.text();
        })
        .then(base64Data => {
            const config = JSON.parse(atob(base64Data));
            if (config.WINDY_KEY) {
                options.key = config.WINDY_KEY;
                const windyScript = document.createElement('script');
                windyScript.src = "https://api.windy.com/assets/map-forecast/libBoot.js";
                windyScript.onload = function() {
                    loadUserScripts();  
                    if (typeof initMap === 'function') {
                        initMap(options);
                    }
                };
                document.head.appendChild(windyScript);
            }
        })
        .catch(error => console.error('Error loading public config:', error));
    function loadUserScripts() {
        const scripts = [
            "<?=BASE_URL?>/public/js/user/map.js?v=<?=time();?>",
            "<?=BASE_URL?>/public/js/user/report.js?v=<?=time();?>"
        ];
        scripts.forEach(src => {
            const s = document.createElement('script');
            s.src = src;
            s.async = false; 
            document.body.appendChild(s);
        });
    }
</script>
<link rel="stylesheet" href="<?=BASE_URL?>/public/css/map.css?v=<?=time();?>">
<div id="wind-loading">
    <div class="wind-grid">
        <div class="wind-spacer"></div>
        <?php for($i=0; $i<120; $i++): ?>
            <img src="<?=BASE_URL?>/public/images/iwind.png" alt="wind">
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
<link rel="stylesheet" href="<?=BASE_URL?>/vendor/leaflet/1.4.0/dist/leaflet.css">
<script src="<?=BASE_URL?>/vendor/leaflet/1.4.0/dist/leaflet.js"></script>