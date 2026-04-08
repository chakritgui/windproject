<script>
    const initialData = {
        currentFolderId: <?= json_encode($currentFolderId ?? null) ?>,
        currentLevel: <?= json_encode($currentLevel ?? 1) ?>,
        initialPath: <?= json_encode($initialPath ?? [['id' => null, 'name' => 'PSTG PROJECT', 'level' => 1, 'slug' => '']]) ?>
    };
</script>
<script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/Sortable.min.js"></script>
<link href="<?=asset('public/css/admin/project.css')?>" rel="stylesheet">
<div class="container-fluid mt-90 mb-5">
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 p-3 rounded-3 shadow-sm"
        style="background:#fff;border-left:4px solid #0d6efd;">
        <div>
            <h4 class="fw-bold mb-1 d-flex align-items-center">
                <i class="fa-solid fa-diagram-project me-2 text-primary" style="font-size:1.5rem"></i>
                <span data-i18n="project_management"></span>
            </h4>
            <nav aria-label="breadcrumb" style="margin-left: 25px;">
                <ol class="breadcrumb mb-0 small">
                    <li class="breadcrumb-item">
                        <span data-i18n="admin"></span>
                    </li>
                    <li class="breadcrumb-item active">
                        <span data-i18n="project"></span>
                    </li>
                </ol>
            </nav>
        </div>
    </div>
</div>
<div class="container-fluid mt-3 mb-5">
    <nav aria-label="breadcrumb" class="breadcrumb-container shadow-sm border mb-3 px-3 py-2 bg-white">
        <ol class="breadcrumb mb-0" id="breadcrumb">
            <li class="breadcrumb-item active" data-id="1">
                <i class="fa-solid fa-house me-1 text-primary"></i>
                <span>PSTG PROJECT</span>
            </li>
        </ol>
    </nav>
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 gap-2">
        <div>
            <button class="btn btn-sm btn-outline-warning manage-project" data-id="">
                <i class="fa-solid fa-folder-plus me-2"></i><span data-i18n="folder"></span>
            </button>
            <button class="btn btn-sm btn-outline-primary manage-content" data-id="">
                <i class="fa-solid fa-file-circle-plus me-2"></i><span data-i18n="content"></span>
            </button>
        </div>
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 gap-2">
            <div class="d-flex gap-2">
                <div class="dropdown">
                    <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" id="sortDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="fa-solid fa-sort me-2"></i><span id="selectedSortLabel" data-i18n="newest"></span>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="sortDropdown">
                        <li>
                            <a class="dropdown-item sort-option" href="javascript:void(0)" data-sort="desc" data-label="newest">
                                <i class="fa-solid fa-arrow-down-9-1 me-2"></i><span data-i18n="newest"></span>
                            </a>
                        </li>
                        <li>
                            <a class="dropdown-item sort-option" href="javascript:void(0)" data-sort="asc" data-label="oldest">
                                <i class="fa-solid fa-arrow-up-1-9 me-2"></i><span data-i18n="oldest"></span>
                            </a>
                        </li>
                    </ul>
                </div>
                <div class="position-relative" style="min-width: 250px;">
                    <i class="fa-solid fa-magnifying-glass position-absolute text-muted" style="top: 10px; left: 12px;"></i>
                    <input type="text" id="txtSearch" class="form-control form-control-sm ps-5" autocomplete="off" placeholder="Search...">
                </div>
            </div>
        </div>
    </div>
    <div class="mb-2 text-end">
        <button id="btnSaveSort" class="btn btn-success d-none">
            <i class="fa-solid fa-floppy-disk me-2"></i><span data-i18n="save_ordering"></span>
        </button>
    </div>
    <div id="listView" class="bg-white rounded table-responsive">
        <table class="table table-striped table-hover mb-0">
            <thead class="table-light">
                <tr>
                    <th></th>
                    <th style="width: 60px;"></th>
                    <th data-i18n="name"></th>
                    <th data-i18n="type"></th>
                    <th data-i18n="last_update"></th>
                    <th data-i18n="language"></th>
                    <th data-i18n="status"></th>
                    <th style="width: 100px;"></th>
                </tr>
            </thead>
            <tbody id="listViewBody"></tbody>
        </table>
    </div>
    <div id="loadingIndicator" class="text-center d-none py-4">
        <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
        <span class="ms-2 text-muted" style="font-size: 0.85rem;" data-i18n="loading">Loading more...</span>
    </div>
    <div id="emptyState" class="text-center py-5 d-none bg-white rounded shadow-sm border mt-3">
        <i class="fa-solid fa-folder-open text-muted" style="font-size: 5rem;"></i>
        <h5 class="text-muted mt-3" data-i18n="no_data_found"></h5>
        <p class="text-muted" data-i18n="project_line1"></p>
    </div>
    <div id="scrollEnd"></div>
</div>
<script src="<?=asset('public/js/admin/project.js')?>" defer></script>
<style>
    #listViewBody, #listViewBody * {
        -webkit-user-select: none; 
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
    }
</style>