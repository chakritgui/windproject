<link rel="stylesheet" href="<?=BASE_URL?>/public/css/document.css?v=<?=time();?>">
<div class="container py-5 mt-5">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
            <h2 class="header-title mb-1"><i class="fa-regular fa-folder-open"></i> <span data-i18n="document"></span></h2>
        </div>
        <div class="view-toggle btn-group" role="group">
            <button type="button" class="btn btn-outline-primary" onclick="setView('grid')">
                <i class="bi bi-grid-3x3-gap"></i> <span data-i18n="grid"></span>
            </button>
            <button type="button" class="btn btn-outline-primary active" onclick="setView('list')">
                <i class="bi bi-list-ul"></i> <span data-i18n="list"></span>
            </button>
        </div>
    </div>
    <div class="row g-2 mb-4 align-items-end">
        <div class="col-md-3 col-6">
            <p><i class="fa-solid fa-cubes"></i> <span data-i18n="source"></span></p>
            <select id="filter_source" class="form-select filter"></select>
        </div>
        <div class="col-md-9 col-6 text-end">
            <button class="btn btn-light history-download"><i class="fa-solid fa-clock-rotate-left"></i> <span data-i18n="history_download"></span></button>
        </div>
    </div>
    <div id="gridView" class="row g-4 mb-5" style="display: none;"></div>
    <div id="listView" class="mb-5"></div>
</div>
<div id="scrollEnd"></div>
<script src="<?=BASE_URL?>/public/js/user/document.js?v=<?=time();?>" defer></script>