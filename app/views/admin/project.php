<link rel="stylesheet" href="<?=BASE_URL?>/public/css/admin/project.css?v=<?php echo time(); ?>">
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
    <nav aria-label="breadcrumb">
        <ol class="breadcrumb" id="breadcrumb" style="font-size: 1.1rem;">
            <li class="breadcrumb-item active" data-id="1">
                <span>ไดรฟ์ของฉัน</span>
            </li>
        </ol>
    </nav>
    <div class="d-flex justify-content-between align-items-center mb-3">
        <div>
            <button class="btn btn-sm btn-outline-secondary" id="btnCreateFolder">
                <i class="fa-solid fa-folder-plus"></i> <span data-i18n="folder"></span>
            </button>
            <button class="btn btn-sm btn-outline-secondary" id="btnCreateFile">
                <i class="fa-solid fa-file-circle-plus"></i> <span data-i18n="content"></span>
            </button>
        </div>
        <div class="btn-group" role="group">
            <button type="button" class="btn btn-sm btn-outline-secondary active" id="viewGrid">
                <i class="fas fa-th"></i>
            </button>
            <button type="button" class="btn btn-sm btn-outline-secondary" id="viewList">
                <i class="fas fa-list"></i>
            </button>
        </div>
    </div>
    <div id="gridView" class="row g-3"></div>
    <div id="listView" class="d-none">
        <table class="table table-hover">
            <thead>
                <tr>
                    <th></th>
                    <th data-i18n="name"></th>
                    <th data-i18n="last_update"></th>
                    <th data-i18n="notification"></th>
                    <th data-i18n="status"></th>
                    <th></th>
                </tr>
            </thead>
            <tbody id="listViewBody"></tbody>
        </table>
    </div>
    <div id="emptyState" class="text-center py-5 d-none">
        <i class="fa-solid fa-folder-open text-muted" style="font-size: 5rem;"></i>
        <h5 class="text-muted mt-3" data-i18n="no_data_found"></h5>
        <p class="text-muted" data-i18n="project_line1"></p>
    </div>
</div>
<script src="<?=BASE_URL?>/public/js/admin/project.js?v=<?=time()?>"></script>