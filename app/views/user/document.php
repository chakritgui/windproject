<link href="<?=asset('public/css/page.css')?>" rel="stylesheet">
<link href="<?=asset('public/css/document.css')?>" rel="stylesheet">
<div class="sky-wrap" id="skyWrap"></div>
<div class="container">  
    <div class="page">
        <div class="hero">
            <div class="wind-particles">
                <div class="particle pp-1"></div>
                <div class="particle pp-2"></div>
                <div class="particle pp-3"></div>
                <div class="particle pp-4"></div>
                <div class="particle pp-5"></div>
            </div>
            <div class="deco-cluster cluster-tl">
                <i class="fa-solid fa-file-contract deco-1"></i>
                <i class="fa-solid fa-file-shield deco-2"></i>
            </div>
            <div class="deco-cluster cluster-br">
                <i class="fa-solid fa-file-pdf deco-3"></i>
                <i class="fa-solid fa-file-lines deco-4"></i>
                <i class="fa-solid fa-file-medical deco-5"></i>
            </div>
            <div class="hero-content">
                <div class="hero-icon">
                    <i class="fa-solid fa-folder-open text-white"></i>
                </div>
                <h1 data-i18n="wind_report"></h1>
                <p data-i18n="header-document-subtitle"></p>
                <div class="hero-accent"></div>
            </div>
        </div>
        <div class="toolbar">
            <div style="display:flex;align-items:center;gap:6px;">
                <button class="toolbar-btn" id="sortBtn" onclick="toggleSort()">
                    <i class="fa-solid fa-sort"></i>
                    <span id="sortLabel" data-i18n="newest"></span>
                </button>
            </div>
            <div class="view-group">
                <button class="view-btn active" id="vList" onclick="setView('list')" title="List View">
                    <i class="fa-solid fa-list me-2"></i><span data-i18n="list"></span>
                </button>
                <button class="view-btn" id="vGrid" onclick="setView('grid')" title="Grid View">
                    <i class="fa-solid fa-th-large me-2"></i><span data-i18n="grid"></span>
                </button>
            </div>
            <div class="ms-auto">
                <button class="history-btn history-download">
                    <i class="fa-solid fa-download"></i>
                    <span data-i18n="history"></span>
                </button>
            </div>
        </div>
        <div class="d-flex d-md-none justify-content-between align-items-center mb-3 px-1">
            <h6 class="fw-bold mb-0" style="color:var(--wind-dark);">
                <i class="fa-solid fa-filter me-2"></i>
                <span data-i18n="filter"></span>
            </h6>
            <button class="toolbar-btn" type="button" data-bs-toggle="collapse" data-bs-target="#filterCollapse">
                <i class="fa-solid fa-chevron-down"></i>
                <span data-i18n="toggle_filter"></span>
            </button>
        </div>
        <div class="collapse d-md-block" id="filterCollapse">
            <div class="filter-card">
                <div class="filter-grid">
                    <div class="d-none">
                        <div class="filter-label">
                            <i class="fa-solid fa-file-lines"></i>
                            <span data-i18n="contract"></span>
                        </div>
                        <select id="filter_contract" class="filter-control filter"></select>
                    </div>
                    <div>
                        <div class="filter-label">
                            <i class="fa-solid fa-folder-tree"></i>
                            <span data-i18n="project"></span>
                        </div>
                        <select id="filter_project" class="filter-control filter"></select>
                    </div>
                    <div>
                        <div class="filter-label">
                            <i class="fa-solid fa-tags"></i>
                            <span data-i18n="wind_measurement_equipment"></span>
                        </div>
                        <select id="filter_type" class="filter-control filter"></select>
                    </div>
                    <div>
                        <div class="filter-label">
                            <i class="fa-regular fa-calendar"></i>
                            <span data-i18n="month-year"></span>
                        </div>
                        <input id="filter_date" class="filter-control" type="text" placeholder="MM/YYYY" autocomplete="off">
                    </div>
                    <div class="d-none">
                        <div class="filter-label">
                            <i class="fa-solid fa-location-dot"></i>
                            <span data-i18n="installation"></span>
                        </div>
                        <select id="filter_installations" class="filter-control filter"></select>
                    </div>
                    <div class="d-none">
                        <div class="filter-label">
                            <i class="fa-solid fa-tower-broadcast"></i>
                            <span data-i18n="poles"></span>
                        </div>
                        <select id="filter_poles" class="filter-control filter"></select>
                    </div>
                </div>
            </div>
        </div>
        <div class="search-wrap">
            <input id="filter_keyword" class="search-input" type="text">
                <button class="search-btn" id="btnSearch">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <span data-i18n="search"></span>
                </button>
            </div>
            <div class="results-count d-none">
                <span data-i18n="found"></span>
                <strong id="docTotal">0</strong>
                <span data-i18n="documents"></span>
            </div>
            <div id="docContainer" class="doc-list"></div>
            <div id="scrollEnd"></div>
        </div>
    </div>
</div>
<script src="<?=asset('public/js/user/sky.js')?>"></script>
<script src="<?=asset('public/js/user/document.js')?>" defer></script>