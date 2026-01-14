<script src='https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js'></script>
<link href='https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css' rel='stylesheet' />
<script src='https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-draw/v1.4.0/mapbox-gl-draw.js'></script>
<link rel='stylesheet' href='https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-draw/v1.4.0/mapbox-gl-draw.css' type='text/css' />
<style>
    #map { 
        height: 600px; 
        border-radius: 8px; 
        box-shadow: 0 2px 8px rgba(0,0,0,0.1); 
    }
    .control-panel { 
        background: white; 
        padding: 20px; 
        border-radius: 8px; 
        box-shadow: 0 2px 8px rgba(0,0,0,0.1); 
        margin-bottom: 20px; 
    }
    .toolbar { 
        background: white; 
        padding: 15px; 
        border-radius: 8px; 
        margin-bottom: 15px; 
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .btn-mode { 
        margin-right: 10px; 
    }
    .polygon-item, .pole-item { 
        padding: 12px; border: 1px solid #dee2e6; 
        border-radius: 6px; 
        margin-bottom: 10px; 
        transition: all 0.3s;
    }
    .polygon-item:hover, .pole-item:hover { 
        background: #f8f9fa; 
        box-shadow: 0 2px 6px rgba(0,0,0,0.1); 
    }
    .color-indicator { 
        width: 30px; 
        height: 30px; 
        border-radius: 4px; 
        display: inline-block; 
        margin-right: 10px; 
        border: 2px solid #dee2e6; 
    }
    .image-360-preview { 
        width: 100%; 
        height: 200px; 
        object-fit: cover; 
        border-radius: 6px; 
        margin-top: 10px; 
    }
    .zoom-control { 
        margin-bottom: 15px; 
    }
</style>
<div class="container-fluid mt-90 mb-5">
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 p-3 rounded-3 shadow-sm" style="background: #ffffff; border-left: 4px solid #0d6efd;">
        <div class="mb-2 mb-md-0">
            <h4 class="fw-bold mb-1 d-flex align-items-center" style="font-size: 1.35rem;">
                <i class="fa-solid fa-map-location-dot me-2 text-primary" style="font-size: 1.5rem;"></i>
                <span data-i18n="map_management"></span>
            </h4>
            <nav aria-label="breadcrumb" style="margin-left: 25px;">
                <ol class="breadcrumb mb-0 small">
                    <li class="breadcrumb-item">
                        <span data-i18n="admin"></span>
                    </li>
                    <li class="breadcrumb-item active" aria-current="page">
                        <span data-i18n="map"></span>
                    </li>
                </ol>
            </nav>
        </div>
    </div>
</div>
<div class="container-fluid mt-3 mb-5">
    <div class="row">
        <div class="col-lg-8">
            <div class="toolbar">
                <div class="d-flex align-items-center justify-content-between flex-wrap">
                    <div class="mb-2">
                        <button class="btn btn-primary btn-mode" id="btnView" onclick="setMode('view')">
                            <i class="fas fa-mouse-pointer"></i> <span data-i18n="view_map"></span>
                        </button>
                        <button class="btn btn-outline-success btn-mode" id="btnPolygon" onclick="setMode('polygon')">
                            <i class="fas fa-draw-polygon"></i> <span data-i18n="draw_an_area"></span>
                        </button>
                        <button class="btn btn-outline-warning btn-mode" id="btnMarker" onclick="setMode('marker')">
                            <i class="fas fa-map-pin"></i> <span data-i18n="add_pole"></span>
                        </button>
                    </div>
                        <div class="mb-2">
                            <button class="btn btn-danger" id="btnClear" onclick="clearDrawing()">
                                <i class="fa-solid fa-eraser"></i> <span data-i18n="reset"></span>
                            </button>
                            <button class="btn btn-success" id="btnSave" onclick="saveDrawing()" style="display:none;">
                                <i class="fas fa-save"></i> <span data-i18n="save"></span>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="control-panel zoom-control">
                    <h5><i class="fas fa-search"></i> <span data-i18n="configure_zoom_level"></span></h5>
                    <div class="alert alert-info mb-3">
                        <small><i class="fas fa-info-circle"></i> <span data-i18n="set_boundary"></span></small>
                    </div>
                    <div class="d-flex gap-2 align-items-center">
                        <button class="btn btn-primary flex-grow-1" id="btnSetBounds" onclick="startSetBounds()">
                            <i class="fas fa-compress-arrows-alt"></i> <span data-i18n="set_the_boundary"></span>
                        </button>
                        <div class="flex-grow-1">
                            <small class="text-muted d-block"><span data-i18n="current_zoom"></span> <strong id="currentZoom">12</strong></small>
                            <small class="text-muted d-block"><span data-i18n="zoom_limits"></span> <strong id="zoomLimits">5 - 18</strong></small>
                        </div>
                    </div>
                </div>
                <div id="map"></div>
            </div>
            <div class="col-lg-4">
                <div class="control-panel">
                    <h5 class="mb-3"><i class="fas fa-layer-group"></i> <span data-i18n="area_list"></span></h5>
                    <button class="btn btn-sm btn-primary mb-3 w-100" onclick="showPolygonList()">
                        <i class="fas fa-list"></i> <span data-i18n="view_all"></span>
                    </button>
                    <div id="polygonList"></div>
                </div>
                <div class="control-panel mt-3">
                    <h5 class="mb-3"><i class="fas fa-broadcast-tower"></i> <span data-i18n="pole_list"></span></h5>
                    <button class="btn btn-sm btn-primary mb-3 w-100" onclick="showPoleList()">
                        <i class="fas fa-list"></i> <span data-i18n="view_all"></span>
                    </button>
                    <div id="poleList"></div>
                </div>
            </div>
        </div>
    </div>
</div>
<script src="<?=BASE_URL?>/public/js/admin/map.js?v=<?=time()?>"></script>