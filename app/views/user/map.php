<link rel="stylesheet" href="<?=BASE_URL?>/public/css/map.css?v=<?=time();?>">
<div id="ui">
    <div class="wind-toggle-card">
        <div class="wind-icon">
            <i class="fa-solid fa-fan"></i>
        </div>
        <div class="wind-label">WIND MAP</div>
        <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" id="windSwitch" checked>
        </div>
    </div>
</div>
<div id="windy"></div>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.4.0/dist/leaflet.css">
<script src="https://unpkg.com/leaflet@1.4.0/dist/leaflet.js"></script>
<script src="https://api.windy.com/assets/map-forecast/libBoot.js"></script>
<script src="<?=BASE_URL?>/public/js/user/map.js?v=<?=time();?>" defer></script>