<div class="container-fluid mt-90 mb-5">
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 p-3 rounded-3 shadow-sm" style="background: #ffffff; border-left: 4px solid #0d6efd;">
        <div class="mb-2 mb-md-0">
            <h4 class="fw-bold mb-1 d-flex align-items-center" style="font-size: 1.35rem;">
                <i class="fa-solid fa-diagram-project me-2 text-primary" style="font-size: 1.5rem;"></i>
                <span data-i18n="project_management"></span>
            </h4>
            <nav aria-label="breadcrumb" style="margin-left: 25px;">
                <ol class="breadcrumb mb-0 small">
                    <li class="breadcrumb-item">
                        <span data-i18n="admin"></span>
                    </li>
                    <li class="breadcrumb-item active" aria-current="page">
                        <span data-i18n="project"></span>
                    </li>
                </ol>
            </nav>
        </div>
        <div class="ms-md-3 text-md-end align-items-end">
            <button class="btn btn-primary btn-sm manage-project">
                <i class="fa-solid fa-plus"></i> <span data-i18n="project"></span>
            </button>
        </div>
    </div>
</div>
<div class="container-fluid mt-3 mb-5">
    <div class="row g-2 mb-3">
        <div class="col-sm-3">
            <input type="date" class="form-control filter" id="filter_date">
        </div>
        <div class="col-sm-3">
            <select id="filter_notification" class="form-select">
                <option value="">-- Notification --</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
            </select>
        </div>
        <div class="col-sm-3">
            <select id="filter_status" class="form-select filter">
                <option value="">-- Status --</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
            </select>
        </div>
        <div class="col-sm-3">
            <select id="filter_status" class="form-select filter">
                <option value="">-- Creator --</option>
            </select>
        </div>
    </div>
</div>
<div class="container-fluid mt-3 mb-5">
    <div class="table-responsive">
        <table class="table table-striped table-hover" id="tb_project">
            <thead>
                <tr>
                    <th data-i18n="cover"></th>
                    <th data-i18n="title"></th>
                    <th data-i18n="publish_at"></th>
                    <th data-i18n="create_at"></th>
                    <th data-i18n="create_by"></th>
                    <th data-i18n="notification"></th>
                    <th data-i18n="view"></th>
                    <th data-i18n="status"></th>
                    <th></th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    </div>
</div>
<script src="<?=BASE_URL?>/public/js/admin/project.js?v=<?=time()?>"></script>