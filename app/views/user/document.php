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
            <div class="btn-group shadow-sm rounded-pill overflow-hidden view-toggle" role="group">
                <button type="button" class="btn btn-outline-primary border-0 px-3" data-view="grid" onclick="setView('grid')" title="Grid View">
                    <i class="fas fa-th-large"></i>
                </button>
                <button type="button" class="btn btn-outline-primary active border-0 px-3" data-view="list" onclick="setView('list')" title="List View">
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
    <div class="d-flex d-md-none justify-content-between align-items-center mb-3 px-1">
        <h6 class="fw-bold mb-0 text-dark"><i class="fa-solid fa-filter me-2"></i><span data-i18n="filter"></span></h6>
        <button class="btn btn-primary btn-sm rounded-pill px-3" type="button" data-bs-toggle="collapse" data-bs-target="#filterCollapse" aria-expanded="false" aria-controls="filterCollapse">
            <i class="fa-solid fa-chevron-down me-1"></i> <span data-i18n="toggle_filter"><span data-i18n="show"></span>/<span data-i18n="hide"></span></span>
        </button>
    </div>
    <div class="collapse d-md-block" id="filterCollapse">
        <div class="card shadow-sm border-0 rounded-4 mb-4">
            <div class="card-body p-3 p-lg-4">
                <div class="row g-3 align-items-end">
                    <div class="col-lg-2 col-md-3 col-6">
                        <label class="form-label small fw-bold text-muted mb-1">
                            <i class="fa-regular fa-calendar me-1"></i><span data-i18n="month-year"></span>
                        </label>
                        <input type="text" id="filter_date" class="form-control rounded-3" placeholder="MM/YYYY">
                    </div>
                    <div class="col-lg-2 col-md-3 col-6">
                        <label class="form-label small fw-bold text-muted mb-1">
                            <i class="fa-solid fa-file-lines me-1"></i><span data-i18n="contract"></span>
                        </label>
                        <select id="filter_contract" class="form-select filter rounded-3"></select>
                    </div>
                    <div class="col-lg-2 col-md-3 col-6">
                        <label class="form-label small fw-bold text-muted mb-1">
                            <i class="fa-solid fa-folder-tree me-1"></i><span data-i18n="project"></span>
                        </label>
                        <select id="filter_project" class="form-select filter rounded-3"></select>
                    </div>
                    <div class="col-lg-2 col-md-3 col-6">
                        <label class="form-label small fw-bold text-muted mb-1">
                            <i class="fa-solid fa-tags me-1"></i><span data-i18n="pole_types"></span>
                        </label>
                        <select id="filter_type" class="form-select filter rounded-3"></select>
                    </div>
                    <div class="col-lg-2 col-md-3 col-6">
                        <label class="form-label small fw-bold text-muted mb-1">
                            <i class="fa-solid fa-location-dot me-1"></i><span data-i18n="installation"></span>
                        </label>
                        <select id="filter_installations" class="form-select filter rounded-3"></select>
                    </div>
                    <div class="col-lg-2 col-md-3 col-6">
                        <label class="form-label small fw-bold text-muted mb-1">
                            <i class="fa-solid fa-tower-broadcast me-1"></i><span data-i18n="poles"></span>
                        </label>
                        <select id="filter_poles" class="form-select filter rounded-3"></select>
                    </div>
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