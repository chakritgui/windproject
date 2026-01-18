<link rel="stylesheet" href="<?=BASE_URL?>/public/css/document.css?v=<?=time();?>">
<div class="container py-5 mt-5">
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h2 class="header-title mb-0">
            <i class="fa-regular fa-folder-open"></i>
            <span data-i18n="document"></span>
        </h2>
        <div class="view-toggle btn-group">
            <button class="btn btn-light" data-view="grid" onclick="setView('grid')">
                <i class="fas fa-th"></i>
            </button>
            <button class="btn btn-light active" data-view="list" onclick="setView('list')">
                <i class="fas fa-list"></i>
            </button>
        </div>
    </div>
    <div class="card shadow-sm mb-4">
        <div class="card-body">
            <div class="row g-3 align-items-end">
                <div class="col-lg-2 col-md-3 col-6">
                    <label class="form-label small text-muted">
                        <i class="fa-regular fa-calendar"></i>
                        <span data-i18n="month-year"></span>
                    </label>
                    <input type="text" id="filter_date" class="form-control" placeholder="MM/YYYY">
                </div>
                <div class="col-lg-3 col-md-4 col-6">
                    <label class="form-label small text-muted">
                        <i class="fa-solid fa-tags"></i>
                        <span data-i18n="pole_types"></span>
                    </label>
                    <select id="filter_type" class="form-select filter"></select>
                </div>
                <div class="col-lg-4 col-md-5 col-12">
                    <label class="form-label small text-muted">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        <span data-i18n="search"></span>
                    </label>
                    <div class="input-group">
                        <input type="text" id="filter_keyword" class="form-control"
                            placeholder="Search document name, type...">
                        <button class="btn btn-primary" id="btnSearch">
                            <i class="fa fa-search"></i>
                        </button>
                    </div>
                </div>
                <div class="col-lg-3 col-12 text-lg-end">
                    <button class="btn btn-outline-secondary history-download w-100 w-lg-auto">
                        <i class="fa-solid fa-clock-rotate-left"></i>
                        <span data-i18n="history_download"></span>
                    </button>
                </div>
            </div>
        </div>
    </div>
    <div class="mb-3">
        <small class="text-muted">
            <span data-i18n="found"></span>
            <strong id="docTotal">0</strong>
            <span data-i18n="documents"></span>
        </small>
    </div>
    <div id="gridView" class="row g-4 mb-5" style="display: none;"></div>
    <div id="listView" class="mb-5"></div>
</div>
<div id="scrollEnd"></div>
<script src="<?=BASE_URL?>/public/js/user/document.js?v=<?=time();?>" defer></script>