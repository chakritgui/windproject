<link rel="stylesheet" href="<?=BASE_URL?>/vendor/leaflet/leaflet.css">
<link rel="stylesheet" href="<?=BASE_URL?>/vendor/leaflet/leaflet.draw.css">
<link rel="stylesheet" href="<?=BASE_URL?>/public/css/admin/map.css?v=<?=time();?>">
<script src="<?=BASE_URL?>/vendor/leaflet/leaflet.js"></script>
<script src="<?=BASE_URL?>/vendor/leaflet/leaflet.draw.js"></script>
<script src="<?=BASE_URL?>/public/js/admin/map.js?v=<?=time();?>"></script>
<div class="container-fluid mt-90 mb-3">
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 p-3 rounded-3 shadow-sm" style="background: #ffffff; border-left: 4px solid #0d6efd;">
        <div class="mb-2 mb-md-0">
            <h4 class="fw-bold mb-1 d-flex align-items-center" style="font-size: 1.35rem;">
                <i class="fa-solid fa-map-location-dot me-2 text-primary" style="font-size: 1.5rem;"></i>
                <span>Map Settings</span>
            </h4>
            <nav aria-label="breadcrumb" style="margin-left: 25px;">
                <ol class="breadcrumb mb-0 small">
                    <li class="breadcrumb-item">Admin</li>
                    <li class="breadcrumb-item active" aria-current="page">Map Management</li>
                </ol>
            </nav>
        </div>
    </div>
</div>
<div class="container-fluid mt-1">
    <div class="accordion mb-4" id="guideAccordion">
        <div class="accordion-item border-0 shadow-sm">
            <h2 class="accordion-header">
                <button class="accordion-button bg-light-primary text-primary fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#guideCollapse">
                    <i class="bi bi-lightbulb-fill me-2"></i> Quick Start Guide
                </button>
            </h2>
            <div id="guideCollapse" class="accordion-collapse collapse show" data-bs-parent="#guideAccordion">
                <div class="accordion-body bg-white">
                    <div class="row text-center g-4">
                        <div class="col-md-3">
                            <div class="p-3 border rounded-3 h-100">
                                <div class="badge bg-primary mb-2">Step 1</div>
                                <h6 class="fw-bold">Unlock Map</h6>
                                <p class="small text-muted mb-0">Click "Unlock Zoom" to enable map editing and navigation.</p>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="p-3 border rounded-3 h-100">
                                <div class="badge bg-primary mb-2">Step 2</div>
                                <h6 class="fw-bold">Draw / Pin</h6>
                                <p class="small text-muted mb-0">Use the left toolbar to draw areas or add new power poles.</p>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="p-3 border rounded-3 h-100">
                                <div class="badge bg-primary mb-2">Step 3</div>
                                <h6 class="fw-bold">Style</h6>
                                <p class="small text-muted mb-0">Adjust colors, opacity, and line weights as desired.</p>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="p-3 border rounded-3 h-100">
                                <div class="badge bg-success mb-2">Step 4</div>
                                <h6 class="fw-bold">Save Data</h6>
                                <p class="small text-muted mb-0">Click "Save All Data" to sync changes to the database.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<div class="container-fluid mt-4 mb-5">
    <div class="row">
        <div class="col-lg-8">
            <div class="position-relative">
                <div id="map"></div>
                <div id="statusBadge" class="map-status-badge bg-white text-dark border">
                    <i class="bi bi-info-circle me-1"></i> Mode: View Only
                </div>
            </div>
            <div class="control-panel mt-3" id="stylePanel">
                <div class="row align-items-center g-3">
                    <div class="col-md-3">
                        <label class="small fw-bold">Area / Border Color</label>
                        <div class="d-flex gap-2 mt-1">
                            <input type="color" class="form-control form-control-color" id="fillColor" value="#3388ff">
                            <input type="color" class="form-control form-control-color" id="borderColor" value="#3388ff">
                        </div>
                    </div>
                    <div class="col-md-3">
                        <label class="small fw-bold">Opacity (<span id="opacityValue">30%</span>)</label>
                        <input type="range" class="form-range" id="fillOpacity" min="0" max="100" value="30">
                    </div>
                    <div class="col-md-3">
                        <label class="small fw-bold">Border Weight (<span id="weightValue">2px</span>)</label>
                        <input type="range" class="form-range" id="borderWeight" min="1" max="10" value="2">
                    </div>
                    <div class="col-md-3">
                        <button class="btn btn-primary w-100" id="saveGlobalBtn">
                            <i class="bi bi-cloud-arrow-up"></i> Save All Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-lg-4">
            <div class="control-panel h-100">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5 class="mb-0 fw-bold">Map Layers</h5>
                    <button class="btn btn-sm btn-outline-warning" id="toggleLockBtn">
                        <span id="lockIcon"><i class="bi bi-unlock"></i></span> <span id="lockText">Unlock Zoom</span>
                    </button>
                </div>
                <ul class="nav nav-pills nav-fill mb-3 bg-light p-1 rounded-3" role="tablist">
                    <li class="nav-item">
                        <a class="nav-link active" data-bs-toggle="tab" href="#polygonTab">Polygons</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" data-bs-toggle="tab" href="#poleTab">Poles</a>
                    </li>
                </ul>
                <div class="tab-content mt-3">
                    <div class="tab-pane fade show active" id="polygonTab">
                        <div class="d-grid gap-2 mb-3">
                            <button id="importJsonBtn" class="btn btn-outline-primary btn-sm">
                                Import JSON
                            </button>
                            <input type="file" id="importJsonInput" accept=".json,.geojson" hidden>
                        </div>
                        <div class="data-list" id="polygonList"></div>
                    </div>
                    <div class="tab-pane fade" id="poleTab">
                        <button class="btn btn-info btn-sm w-100 mb-3 text-white" id="addPoleBtn">
                            <i class="bi bi-geo-alt-fill"></i> Add New Pole
                        </button>
                        <div class="data-list" id="poleList"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>