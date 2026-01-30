<div class="container-fluid mt-90 mb-5">
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 p-3 rounded-3 shadow-sm" style="background: #ffffff; border-left: 4px solid #0d6efd;">
        <div class="mb-2 mb-md-0">
            <h4 class="fw-bold mb-1 d-flex align-items-center" style="font-size: 1.35rem;">
                <i class="fa-solid fa-folder-tree me-2 text-primary" style="font-size: 1.5rem;"></i>
                <span data-i18n="document_management"></span>
            </h4>
            <nav aria-label="breadcrumb" style="margin-left: 25px;">
                <ol class="breadcrumb mb-0 small">
                    <li class="breadcrumb-item">
                        <span data-i18n="admin"></span>
                    </li>
                    <li class="breadcrumb-item active" aria-current="page">
                        <span data-i18n="document"></span>
                    </li>
                </ol>
            </nav>
        </div>
    </div>
</div>
<div class="container-fluid mt-3 mb-5">
    <div class="card shadow-sm mb-4">
        <div class="card-body">
            <div class="row g-2 mb-3">
                <div class="col-sm-2">
                    <p><i class="fa-regular fa-calendar"></i> <span data-i18n="document_date"></span></p>
                    <input type="text" class="form-control filter" id="filter_date">
                </div>
                <div class="col-sm-2 col-6">
                    <p><i class="fa-solid fa-file-lines"></i> <span data-i18n="contract"></span></p>
                    <select id="filter_contract" class="form-select filter"></select>
                </div>
                <div class="col-sm-2 col-6">
                    <p><i class="fa-solid fa-folder-tree"></i> <span data-i18n="project"></span></p>
                    <select id="filter_project" class="form-select filter"></select>
                </div>
                <div class="col-sm-2 col-6">
                    <p><i class="fa-solid fa-tags"></i> <span data-i18n="pole_types"></span></p>
                    <select id="filter_type" class="form-select filter"></select>
                </div>
                <div class="col-sm-2 col-6">
                    <p><i class="fa-solid fa-location-dot"></i> <span data-i18n="installation"></span></p>
                    <select id="filter_installations" class="form-select filter"></select>
                </div>
                <div class="col-sm-2 col-6">
                    <p><i class="fa-solid fa-tower-broadcast"></i> <span data-i18n="poles"></span></p>
                    <select id="filter_poles" class="form-select filter"></select>
                </div>
                <div class="col-sm-2 col-6">
                    <p><i class="fa-solid fa-circle-dot"></i> <span data-i18n="status"></span></p>
                    <select id="filter_status" class="form-select filter"></select>
                </div>
            </div>
        </div>
    </div>
</div>
<div class="container-fluid mt-3 mb-5">
    <div class="table-responsive">
        <table class="table table-hover align-middle" id="tb_document" style="width:100%">
            <thead class="table-light">
                <tr>
                    <th data-i18n="document_name" style="width: 45%"></th>
                    <th data-i18n="file_info"></th>
                    <th data-i18n="timeline"></th>
                    <th data-i18n="status" class="text-center"></th>
                    <th class="text-end"></th>
                </tr>
            </thead>
        </table>
    </div>
</div>
<script src="<?=BASE_URL?>/public/js/admin/document.js?v=<?=time()?>"></script>