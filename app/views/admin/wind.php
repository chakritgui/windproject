<div class="container-fluid mt-3 mb-5">
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 p-3 rounded-3 shadow-sm" style="background: #ffffff; border-left: 4px solid #0d6efd;">
        <div class="mb-2 mb-md-0">
            <h4 class="fw-bold mb-1 d-flex align-items-center" style="font-size: 1.35rem;">
                <i class="fa-solid fa-wind me-2 text-primary" style="font-size: 1.5rem;"></i>
                <span data-i18n="wind_management"></span>
            </h4>
            <nav aria-label="breadcrumb" style="margin-left: 25px;">
                <ol class="breadcrumb mb-0 small">
                    <li class="breadcrumb-item">
                        <span data-i18n="admin"></span>
                    </li>
                    <li class="breadcrumb-item active" aria-current="page">
                        <span data-i18n="wind"></span>
                    </li>
                </ol>
            </nav>
        </div>
    </div>
</div>
<div class="container-fluid mt-3 mb-5">
    <div class="row g-2 mb-3">
        <div class="col-sm-2">
            <p><i class="fa-regular fa-calendar"></i> <span data-i18n="import_date"></span></p>
            <input type="text" class="form-control filter" id="filter_date">
        </div>
    </div>
</div>
<div class="container-fluid mt-3 mb-5">
    <div class="table-responsive">
        <table class="table table-hover" id="tb_wind">
            <thead>
                <tr>
                    <th data-i18n="import_type"></th>
                    <th data-i18n="import_start"></th>
                    <th data-i18n="import_end"></th>
                    <th data-i18n="status"></th>
                    <th data-i18n="record"></th>
                    <th data-i18n="remark"></th>
                    <th></th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    </div>
</div>
<script src="<?=BASE_URL?>/public/js/admin/import.js?v=<?=time()?>"></script>