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
    <ul class="nav nav-pills mb-4" id="mainTabs" role="tablist">
         <li class="nav-item" role="presentation">
            <button class="nav-link active" id="document-tab" data-bs-toggle="pill" data-bs-target="#document_management" data-page="document" type="button">
                <i class="fa-solid fa-folder-tree"></i> <span data-i18n="document"></span>
            </button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link" id="history-tab" data-bs-toggle="pill" data-bs-target="#download_history" data-page="history" type="button">
                <i class="fa-solid fa-clock-rotate-left"></i> <span data-i18n="download_history"></span>
            </button>
        </li>
    </ul>
    <div class="tab-content" id="mainTabContent">
        <div class="tab-pane fade show active" id="document_management" role="tabpanel">
            <div class="card shadow-sm mb-4">
                <div class="card-body">
                    <div class="row g-2 mb-3">
                        <div class="col-sm-2">
                            <p><i class="fa-regular fa-calendar"></i> <span data-i18n="document_date"></span></p>
                            <input type="text" class="form-control filter" id="filter_date" autocomplete="off">
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
            <div class="table-responsive">
                <table class="table table-hover align-middle" id="tb_document" style="width:100%">
                    <thead class="table-light">
                        <tr>
                            <th data-i18n="document_name" style="width: 45%"></th>
                            <th data-i18n="range"></th>
                            <th data-i18n="size"></th>
                            <th data-i18n="type"></th>
                            <th data-i18n="create_at"></th>
                            <th data-i18n="status" class="text-center"></th>
                            <th data-i18n="download"></th>
                            <th class="text-end"></th>
                        </tr>
                    </thead>
                </table>
            </div>
        </div>
        <div class="tab-pane fade" id="download_history" role="tabpanel">
            <div class="card shadow-sm mb-4">
                <div class="card-body">
                    <div class="row g-2 mb-3">
                        <div class="col-sm-2">
                            <p><i class="fa-regular fa-calendar"></i> <span data-i18n="document_date"></span></p>
                            <input type="text" class="form-control filter-history" id="filter_history_date" autocomplete="off">
                        </div>
                        <div class="col-sm-2 col-6">
                            <p><i class="fa-solid fa-folder-tree"></i> <span data-i18n="document"></span></p>
                            <select id="filter_history_document" class="form-select filter-history"></select>
                        </div>
                        <div class="col-sm-2 col-6">
                            <p><i class="fa-solid fa-user"></i> <span data-i18n="member"></span></p>
                            <select id="filter_history_member" class="form-select filter-history"></select>
                        </div>
                        <div class="col-sm-2 col-6">
                            <p><i class="fa-solid fa-arrow-right-to-bracket"></i> <span data-i18n="device"></span></p>
                            <select id="filter_history_device" class="form-select filter-history"></select>
                        </div>
                        <div class="col-sm-2 col-6">
                            <p><i class="fa-regular fa-window-maximize"></i> <span data-i18n="browsers"></span></p>
                            <select id="filter_history_browser" class="form-select filter-history"></select>
                        </div>
                    </div>
                </div>
            </div>
            <div class="table-responsive">
                <table class="table table-striped table-hover" id="tb_history">
                    <thead>
                        <tr>
                            <th data-i18n="document"></th>
                            <th data-i18n="member"></th>
                            <th data-i18n="date"></th>
                            <th data-i18n="device"></th>
                            <th data-i18n="browsers"></th>
                        </tr>
                    </thead>
                </table>
            </div>
        </div>
    </div>
</div>
<script src="<?=BASE_URL?>/public/js/admin/document.js?v=<?=time()?>"></script>