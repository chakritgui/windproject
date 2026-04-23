<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.4.0/leaflet.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css">
<link href="<?=asset('public/css/admin/map.css')?>" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.4.0/leaflet.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js"></script>
<script src="<?=asset('public/js/admin/map.js')?>" defer></script>
<div class="container-fluid mt-90 mb-3">
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 p-3 rounded-3 shadow-sm" style="background: #ffffff; border-left: 4px solid #0d6efd;">
        <div class="mb-2 mb-md-0">
            <h4 class="fw-bold mb-1 d-flex align-items-center" style="font-size: 1.35rem;">
                <i class="fa-solid fa-map-location-dot me-2 text-primary" style="font-size: 1.5rem;"></i>
                <span data-i18n="map_and_boundary"></span>
            </h4>
            <nav aria-label="breadcrumb" style="margin-left: 25px;">
                <ol class="breadcrumb mb-0 small">
                    <li class="breadcrumb-item" data-i18n="admin"></li>
                    <li class="breadcrumb-item active" aria-current="page" data-i18n="map_and_boundary"></li>
                </ol>
            </nav>
        </div>
    </div>
</div>
<div class="container-fluid mt-1 mb-5">
    <ul class="nav nav-pills mb-4" role="tablist" id="mainTabs">
        <li class="nav-item" role="presentation">
            <button class="nav-link active" data-bs-toggle="pill" data-bs-target="#map_tab" type="button"><i class="fa-solid fa-map-location-dot me-2"></i><span data-i18n="map_and_boundary"></span></button>
        </li>
        <li class="nav-item nav-display" role="presentation">
            <button class="nav-link" data-bs-toggle="pill" data-bs-target="#display_tab" type="button"><i class="fa-solid fa-gears me-2"></i><span data-i18n="configuration"></span></button>
        </li>
    </ul>
    <div class="tab-content">
        <div class="tab-pane fade show active" id="map_tab">
            <div class="accordion mb-4" id="guideAccordion">
                <div class="accordion-item border-0 shadow-sm">
                    <h5 class="accordion-header text-primary">
                        <i class="fa-solid fa-lightbulb me-2"></i><span data-i18n="quick_start_guide"></span>
                    </h5>
                    <div id="guideCollapse" class="accordion-collapse collapse show" data-bs-parent="#guideAccordion">
                        <div class="accordion-body bg-white">
                            <div class="row text-center g-4">
                                <div class="col-md-3">
                                    <div class="p-3 border rounded-3 h-100">
                                        <div class="badge bg-primary mb-2"><span data-i18n="step"></span> 1</div>
                                        <h6 class="fw-bold" data-i18n="upload_json"></h6>
                                        <p class="small text-muted mb-0" data-i18n="step-1"></p>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="p-3 border rounded-3 h-100">
                                        <div class="badge bg-primary mb-2"><span data-i18n="step"></span> 2</div>
                                        <h6 class="fw-bold" data-i18n="style_edit"></h6>
                                        <p class="small text-muted mb-0" data-i18n="step-2"></p>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="p-3 border rounded-3 h-100">
                                        <div class="badge bg-primary mb-2"><span data-i18n="step"></span> 3</div>
                                        <h6 class="fw-bold" data-i18n="fit_boundary"></h6>
                                        <p class="small text-muted mb-0" data-i18n="step-3"></p>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="p-3 border rounded-3 h-100">
                                        <div class="badge bg-success mb-2"><span data-i18n="step"></span> 4</div>
                                        <h6 class="fw-bold" data-i18n="save_data"></h6>
                                        <p class="small text-muted mb-0" data-i18n="step-4"></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-lg-8">
                    <div class="position-relative">
                        <div id="map"></div>
                        <button id="fitBoundaryBtn" class="map-status-badge-left btn btn-outline-dark btn-sm">
                            <i class="fa-solid fa-up-right-and-down-left-from-center me-2"></i><span data-i18n="fit_boundary"></span>
                        </button>
                        <div id="statusBadge" class="map-status-badge bg-white text-dark border">
                            <i class="fa-solid fa-circle-info me-1"></i>
                        </div>
                    </div>
                    <div class="control-panel mt-3" id="stylePanel">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <p class="mb-0 fw-bold" data-i18n="country_line"></p>
                        </div>
                        <div class="mb-3">
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="radio" name="show_country_line" id="showUpload" value="show" checked>
                                <label class="form-check-label" for="showUpload" data-i18n="show"></label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="radio" name="show_country_line" id="hideUpload" value="hide">
                                <label class="form-check-label" for="hideUpload" data-i18n="hide"></label>
                            </div>
                        </div>
                        <div id="jsonUploadSection" class="p-3 border rounded bg-light">
                            <label for="jsonFile" class="form-label" data-i18n="upload_json"></label>
                            <input class="form-control" type="file" id="jsonFile" accept=".json,.geojson">
                            <p class="mt-3" data-i18n="support_json"></p>
                        </div>
                        <div class="d-flex justify-content-between align-items-center mb-3 mt-3">
                            <p class="mb-0 fw-bold" data-i18n="map_labels"></p>
                        </div>
                        <div class="mb-3">
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="radio" name="map_labels" id="map_labels_yes" value="yes" checked>
                                <label class="form-check-label" for="map_labels_yes" data-i18n="show"></label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="radio" name="map_labels" id="map_labels_no" value="no">
                                <label class="form-check-label" for="map_labels_no" data-i18n="hide"></label>
                            </div>
                        </div>
                    </div>
                    <div class="control-panel mt-3" id="stylePanel">
                        <div class="row align-items-center g-3">
                            <div class="col-md-12">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <label class="form-label fw-bold mb-0" data-i18n="height_level">Height Level</label>
                                    <span id="height-display" class="badge bg-primary">100m</span>
                                </div>
                                <div class="position-relative px-2" style="height: 40px;">
                                    <input type="range" class="form-range custom-windy-slider" id="heightSlider" min="0" max="14" step="1" value="0" style="width: 100%;">
                                    <div class="position-relative w-100" style="font-size: 10px;">
                                        <span class="slider-label" style="left: 0%;">100m</span>
                                        <span class="slider-label" style="left: 21.4%;">900h</span>
                                        <span class="slider-label" style="left: 50%;">500h</span>
                                        <span class="slider-label" style="left: 78.4%;">250h</span>
                                        <span class="slider-label" style="left: 100%;">10h</span>
                                    </div>
                                </div>
                                <input type="hidden" name="DEFAULT_LEVEL" id="actual_level" value="100m">
                            </div>
                        </div>
                    </div>
                    <div class="control-panel mt-3">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <p class="mb-0 fw-bold" data-i18n="map_controls"></p>
                        </div>
                        <div class="mode-container mb-4 p-3 border rounded shadow-sm" data-mode="satellite">
                            <p class="fw-bold border-bottom pb-2 text-primary" data-i18n="satellite"></p>
                            <div class="options-list mt-2">
                                <div class="form-check mb-2">
                                    <input class="form-check-input master-control" type="checkbox" id="sat-opt2" checked>
                                    <label class="form-check-label fw-bold" for="sat-opt2" data-i18n="wind_measurement_equipment"></label>
                                </div>
                                <div class="ms-4">
                                    <div class="form-check mb-1">
                                        <input class="form-check-input dependent-opt" type="checkbox" id="sat-opt1" checked>
                                        <label class="form-check-label" for="sat-opt1" data-i18n="show_wind_values"></label>
                                    </div>
                                    <div class="form-check mb-1">
                                        <input class="form-check-input dependent-opt" type="checkbox" id="sat-opt7" checked>
                                        <label class="form-check-label" for="sat-opt7" data-i18n="wind_speed"></label>
                                    </div>
                                </div>
                                <hr class="my-2">
                                <div class="form-check mb-1"><input class="form-check-input" type="checkbox" id="sat-opt3"><label class="form-check-label" for="sat-opt3" data-i18n="focus_mode"></label></div>
                                <div class="form-check mb-1"><input class="form-check-input" type="checkbox" id="sat-opt4"><label class="form-check-label" for="sat-opt4" data-i18n="windturbine"></label></div>
                                <div class="form-check mb-1"><input class="form-check-input" type="checkbox" id="sat-opt5"><label class="form-check-label" for="sat-opt5" data-i18n="wind_animation"></label></div>
                                <div class="form-check mb-1"><input class="form-check-input" type="checkbox" id="sat-opt6"><label class="form-check-label" for="sat-opt6" data-i18n="show_place_label"></label></div>
                                <div class="form-check mb-1"><input class="form-check-input" type="checkbox" id="sat-opt8"><label class="form-check-label" for="sat-opt8" data-i18n="area"></label></div>
                                <div class="form-check mb-1"><input class="form-check-input" type="checkbox" id="sat-opt9"><label class="form-check-label" for="sat-opt9" data-i18n="border"></label></div>
                            </div>
                        </div>
                        <div class="mode-container mb-4 p-3 border rounded shadow-sm" data-mode="wind">
                            <p class="fw-bold border-bottom pb-2 text-success" data-i18n="wind"></p>
                            <div class="options-list mt-2">
                                <div class="form-check mb-2">
                                    <input class="form-check-input master-control" type="checkbox" id="wind-opt2" checked>
                                    <label class="form-check-label fw-bold" for="wind-opt2" data-i18n="wind_measurement_equipment"></label>
                                </div>
                                <div class="ms-4">
                                    <div class="form-check mb-1">
                                        <input class="form-check-input dependent-opt" type="checkbox" id="wind-opt1" checked>
                                        <label class="form-check-label" for="wind-opt1" data-i18n="show_wind_values"></label>
                                    </div>
                                    <div class="form-check mb-1">
                                        <input class="form-check-input dependent-opt" type="checkbox" id="wind-opt7" checked>
                                        <label class="form-check-label" for="wind-opt7" data-i18n="wind_speed"></label>
                                    </div>
                                </div>
                                <hr class="my-2">
                                <div class="form-check mb-1"><input class="form-check-input" type="checkbox" id="wind-opt3"><label class="form-check-label" for="wind-opt3" data-i18n="focus_mode"></label></div>
                                <div class="form-check mb-1"><input class="form-check-input" type="checkbox" id="wind-opt4"><label class="form-check-label" for="wind-opt4" data-i18n="windturbine"></label></div>
                                <div class="form-check mb-1"><input class="form-check-input" type="checkbox" id="wind-opt5"><label class="form-check-label" for="wind-opt5" data-i18n="wind_animation"></label></div>
                                <div class="form-check mb-1"><input class="form-check-input" type="checkbox" id="wind-opt6"><label class="form-check-label" for="wind-opt6" data-i18n="show_place_label"></label></div>
                                <div class="form-check mb-1"><input class="form-check-input" type="checkbox" id="wind-opt8"><label class="form-check-label" for="wind-opt8" data-i18n="area"></label></div>
                                <div class="form-check mb-1"><input class="form-check-input" type="checkbox" id="wind-opt9"><label class="form-check-label" for="wind-opt9" data-i18n="border"></label></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-4">
                    <div class="h-100">
                        <div class="control-panel mb-3" id="stylePanel">
                            <div class="row align-items-center g-3">
                                <div class="col-md-6">
                                    <label class="small fw-bold" data-i18n="area_border_color"></label>
                                    <div class="d-flex gap-2 mt-1">
                                        <input type="color" class="form-control form-control-color" id="fillColor" value="#3388ff">
                                        <input type="color" class="form-control form-control-color" id="borderColor" value="#3388ff">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <label class="small fw-bold"><span data-i18n="opacity"></span> (<span id="opacityValue">30%</span>)</label>
                                    <input type="range" class="form-range" id="fillOpacity" min="0" max="100" value="30">
                                </div>
                                <div class="col-md-6">
                                    <label class="small fw-bold"><span data-i18n="border_weight"></span> (<span id="weightValue">2px</span>)</label>
                                    <input type="range" class="form-range" id="borderWeight" min="0" max="10" value="2">
                                </div>
                                <div class="col-md-6">
                                    <label class="small fw-bold"><span data-i18n="outside_the_polygon">Outside the Polygon</span></label>
                                    <div class="d-flex gap-3 mt-1">
                                        <div class="form-check">
                                            <input class="form-check-input" type="radio" name="polygon_visibility" id="maskOpen" value="open">
                                            <label class="form-check-label" for="maskOpen" data-i18n="open">Open</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="radio" name="polygon_visibility" id="maskClose" value="close" checked>
                                            <label class="form-check-label" for="maskClose" data-i18n="close">Close</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="control-panel">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h5 class="mb-0 fw-bold" data-i18n="map_layers"></h5>
                            </div>
                            <div class="d-grid gap-2 mb-3">
                                <button id="importJsonBtn" class="btn btn-outline-primary btn-sm">
                                    <span data-i18n="import"></span> JSON
                                </button>
                                <input type="file" id="importJsonInput" hidden><input type="file" id="importJsonInput" accept=".json,.geojson" hidden>
                                <p data-i18n="support_json"></p>
                            </div>
                            <div class="data-list" id="polygonList"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="d-flex justify-content-end mt-4">
                <button class="btn btn-lg btn-primary w-md-auto save-map" id="saveGlobalBtn">
                    <i class="fa-solid fa-floppy-disk me-2"></i>
                    <span data-i18n="save"></span>
                </button>
            </div>
        </div>
        <div class="tab-pane fade" id="display_tab">
            <table class="table table-hover align-middle" id="tb_display">
                <thead>
                    <tr>
                        <th></th>
                        <th data-i18n="boundary"></th>
                        <th data-i18n="project"></th>
                        <th data-i18n="project_status"></th>
                        <th data-i18n="display_boundary"></th>
                        <th data-i18n="show_on_menu"></th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    </div>
</div>