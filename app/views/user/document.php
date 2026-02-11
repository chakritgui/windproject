<link rel="stylesheet" href="<?=BASE_URL?>/public/css/document.css?v=<?=time();?>">
<div class="container py-5 mt-5">  
    <div class="header-section mb-3">
        <div class="header-top">
            <div class="header-title-wrapper">
                <div class="header-icon">
                    <i class="fa-regular fa-folder-open"></i>
                </div>
                <div class="header-text">
                    <h2 class="header-title-main" data-i18n="documents"></h2>
                    <p class="header-subtitle" data-i18n="header-document-subtitle"></p>
                </div>
            </div>
        </div>
        <div class="header-divider">
            <div class="divider-line"></div>
            <div class="divider-dot"></div>
        </div>
    </div>
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 p-2 bg-light rounded-3">
        <div class="d-flex align-items-center gap-2">
            <div class="dropdown">
                <button class="btn btn-white border shadow-sm dropdown-toggle" type="button" id="sortDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="fa-solid fa-sort me-2 text-secondary"></i> 
                    <span id="selectedSortLabel" data-i18n="newest" class="fw-medium"></span>
                </button>
                <ul class="dropdown-menu shadow-sm border-0" aria-labelledby="sortDropdown">
                    <li>
                        <a class="dropdown-item sort-option py-2" href="javascript:void(0)" data-sort="desc" data-label="newest">
                            <i class="fa-solid fa-arrow-down-9-1 me-2 text-muted"></i><span data-i18n="newest"></span>
                        </a>
                    </li>
                    <li>
                        <a class="dropdown-item sort-option py-2" href="javascript:void(0)" data-sort="asc" data-label="oldest">
                            <i class="fa-solid fa-arrow-up-1-9 me-2 text-muted"></i><span data-i18n="oldest"></span>
                        </a>
                    </li>
                </ul>
            </div>
            <div class="btn-group shadow-sm" role="group">
                <button class="btn btn-outline-primary active" data-view="grid" onclick="setView('grid')" title="Grid View">
                    <i class="fas fa-th"></i>
                </button>
                <button class="btn btn-outline-primary" data-view="list" onclick="setView('list')" title="List View">
                    <i class="fas fa-list"></i>
                </button>
            </div>
        </div>
        <div class="d-flex gap-2">
            <button class="btn btn-outline-secondary shadow-sm px-3 history-download" title="History">
                <i class="fa-solid fa-clock-rotate-left"></i>
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
                <div class="col-lg-2 col-md-3 col-6">
                    <label class="form-label small text-muted">
                        <i class="fa-solid fa-file-lines"></i>
                        <span data-i18n="contract"></span>
                    </label>
                    <select id="filter_contract" class="form-select filter"></select>
                </div>
                <div class="col-lg-2 col-md-3 col-6">
                    <label class="form-label small text-muted">
                        <i class="fa-solid fa-folder-tree"></i>
                        <span data-i18n="project"></span>
                    </label>
                    <select id="filter_project" class="form-select filter"></select>
                </div>
                <div class="col-lg-2 col-md-3 col-6">
                    <label class="form-label small text-muted">
                        <i class="fa-solid fa-tags"></i>
                        <span data-i18n="pole_types"></span>
                    </label>
                    <select id="filter_type" class="form-select filter"></select>
                </div>
                <div class="col-lg-2 col-md-3 col-6">
                    <label class="form-label small text-muted">
                        <i class="fa-solid fa-location-dot"></i>
                        <span data-i18n="installation"></span>
                    </label>
                    <select id="filter_installations" class="form-select filter"></select>
                </div>
                <div class="col-lg-2 col-md-3 col-6">
                    <label class="form-label small text-muted">
                        <i class="fa-solid fa-tower-broadcast"></i>
                        <span data-i18n="poles"></span>
                    </label>
                    <select id="filter_poles" class="form-select filter"></select>
                </div>
            </div>
        </div>
    </div>
    <div class="d-flex justify-content-end mb-3">
        <div class="col-lg-4 col-md-4 col-12">
            <div class="input-group search-group">
                <input type="text" id="filter_keyword" class="form-control search-input" 
                    placeholder="Search document name, type...">
                <button class="btn btn-primary px-4 search-btn" id="btnSearch">
                    <span data-i18n="search">Search</span>
                </button>
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