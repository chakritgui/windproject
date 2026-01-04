<div class="container-fluid mt-3 mb-5">
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 p-3 rounded-3 shadow-sm"
        style="background:#fff;border-left:4px solid #0d6efd;">
        <div>
            <h4 class="fw-bold mb-1 d-flex align-items-center">
                <i class="bi bi-bell me-2 text-primary" style="font-size:1.5rem"></i>
                <span data-i18n="notification_management"></span>
            </h4>
            <nav aria-label="breadcrumb" style="margin-left: 25px;">
                <ol class="breadcrumb mb-0 small">
                    <li class="breadcrumb-item">
                        <span data-i18n="admin"></span>
                    </li>
                    <li class="breadcrumb-item active">
                        <span data-i18n="notification"></span>
                    </li>
                </ol>
            </nav>
        </div>
    </div>
</div>
<div class="container-fluid mt-3 mb-5">
    <div class="row g-2 mb-3">
        <div class="col-sm-2">
            <select id="filter_status" class="form-select filter">
                <option value="" data-i18n="-- status --"></option>
                <option value="published" data-i18n="published"></option>
                <option value="draft" data-i18n="draft"></option>
            </select>
        </div>
    </div>
</div>
<div class="container-fluid mt-3 mb-5">
    <div class="table-responsive">
        <table class="table table-hover" id="tb_notification">
            <thead>
                <tr>
                    <th data-i18n="notification"></th>
                    <th data-i18n="publish_at"></th>
                    <th data-i18n="create_at"></th>
                    <th data-i18n="view"></th>
                    <th data-i18n="status"></th>
                    <th></th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    </div>
</div>
<script src="<?=BASE_URL?>/public/js/admin/notification.js?v=<?=time()?>"></script>