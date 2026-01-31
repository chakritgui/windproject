<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<style>
    :root {
        --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        --success-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        --info-gradient: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        --warning-gradient: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
    }
    body {
        background: #f8f9fa;
    }
    .navbar {
        background: var(--primary-gradient);
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .stat-card {
        border: none;
        border-radius: 15px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.08);
        transition: all 0.3s ease;
        overflow: hidden;
        position: relative;
    }
    .stat-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }
    .stat-card.gradient-1 {
        background: var(--primary-gradient);
        color: white;
    }
    .stat-card.gradient-2 {
        background: var(--success-gradient);
        color: white;
    }
    .stat-card.gradient-3 {
        background: var(--info-gradient);
        color: white;
    }
    .stat-card.gradient-4 {
        background: var(--warning-gradient);
        color: white;
    }
    .stat-card .icon-box {
        width: 60px;
        height: 60px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        background: rgba(255,255,255,0.2);
        backdrop-filter: blur(10px);
    }
    .stat-number {
        font-size: 2rem;
        font-weight: 700;
        margin: 10px 0 5px 0;
    }
    .stat-label {
        font-size: 0.9rem;
        opacity: 0.95;
        font-weight: 500;
    } 
    .chart-card {
        border: none;
        border-radius: 15px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.08);
        margin-bottom: 30px;
    }
    .chart-card .card-header {
        background: white;
        border: none;
        border-bottom: 2px solid #f0f0f0;
        padding: 20px;
    }
    .chart-card .card-header h5 {
        margin: 0;
        color: #333;
        font-weight: 600;
    }
    .activity-item {
        border-left: 3px solid #667eea;
        padding: 15px 20px;
        margin-bottom: 15px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        transition: all 0.3s ease;
    }
    .activity-item:hover {
        transform: translateX(5px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .activity-time {
        font-size: 0.85rem;
        color: #6c757d;
    }
    .page-header {
        background: white;
        border-radius: 15px;
        padding: 30px;
        margin-bottom: 30px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }
    .badge-custom {
        padding: 8px 15px;
        border-radius: 20px;
        font-weight: 500;
    }
    .progress-custom {
        height: 8px;
        border-radius: 10px;
        background-color: rgba(0,0,0,0.1);
    }
    .table-card {
        background: white;
        border-radius: 15px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.08);
        overflow: hidden;
    }
    .table-card thead {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
    }  
    .mini-stat {
        text-align: center;
        padding: 15px;
        background: white;
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    .mini-stat i {
        font-size: 2rem;
        color: #667eea;
        margin-bottom: 10px;
    }  
    .mini-stat .number {
        font-size: 1.5rem;
        font-weight: 700;
        color: #333;
    }
    .mini-stat .label {
        font-size: 0.85rem;
        color: #6c757d;
    }
</style>
<div class="container-fluid mt-90 mb-5">
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 p-3 rounded-3 shadow-sm" style="background: #ffffff; border-left: 4px solid #0d6efd;">
        <div class="mb-2 mb-md-0">
            <h4 class="fw-bold mb-1 d-flex align-items-center" style="font-size: 1.35rem;">
                <i class="fa-solid fa-chart-pie me-2 text-primary" style="font-size: 1.5rem;"></i>
                <span data-i18n="dashboard"></span>
            </h4>
            <nav aria-label="breadcrumb" style="margin-left: 25px;">
                <ol class="breadcrumb mb-0 small">
                    <li class="breadcrumb-item">
                        <span data-i18n="admin"></span>
                    </li>
                    <li class="breadcrumb-item active" aria-current="page">
                        <span data-i18n="dashboard"></span>
                    </li>
                </ol>
            </nav>
        </div>
    </div>
</div>
<div class="container-fluid mt-3 mb-5">
    <div class="row mb-4">
        <div class="col-xl-3 col-md-6 mb-4">
            <div class="card stat-card gradient-1">
                <div class="card-body p-4">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <div class="stat-label" data-i18n="member"></div>
                            <div class="stat-number" id="memberCount">0</div>
                        </div>
                        <div class="icon-box">
                            <i class="fa-solid fa-users"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-xl-3 col-md-6 mb-4">
            <div class="card stat-card gradient-2">
                <div class="card-body p-4">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <div class="stat-label" data-i18n="contract"></div>
                            <div class="stat-number" id="contractCount">0</div>
                        </div>
                        <div class="icon-box">
                            <i class="fa-solid fa-file"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-xl-3 col-md-6 mb-4">
            <div class="card stat-card gradient-3">
                <div class="card-body p-4">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <div class="stat-label" data-i18n="project"></div>
                            <div class="stat-number" id="projectCount">0</div>
                        </div>
                        <div class="icon-box">
                            <i class="fa-solid fa-diagram-project"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-xl-3 col-md-6 mb-4">
            <div class="card stat-card gradient-4">
                <div class="card-body p-4">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <div class="stat-label" data-i18n="installation"></div>
                            <div class="stat-number" id="installCount">0</div>
                        </div>
                        <div class="icon-box">
                            <i class="fa-solid fa-location-dot"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="row mb-4">
        <div class="col-md-3 mb-3">
            <div class="mini-stat">
                <i class="fa-solid fa-map-pin"></i>
                <div class="number" id="poleTypeCount">0</div>
                <div class="label" data-i18n="pole_types"></div>
            </div>
        </div>
        <div class="col-md-3 mb-3">
            <div class="mini-stat">
                <i class="fa-solid fa-tower-broadcast"></i>
                <div class="number" id="poleCount">0</div>
                <div class="label" data-i18n="pole"></div>
            </div>
        </div>
        <div class="col-md-3 mb-3">
            <div class="mini-stat">
                <i class="fa-solid fa-folder-open"></i>
                <div class="number" id="documentCount">0</div>
                <div class="label" data-i18n="documents"></div>
            </div>
        </div>
        <div class="col-md-3 mb-3">
            <div class="mini-stat">
                <i class="fa-solid fa-newspaper"></i>
                <div class="number" id="newsCount">0</div>
                <div class="label" data-i18n="news"></div>
            </div>
        </div>
    </div>
    <div class="row mb-4">
        <div class="col-12">
            <div class="card chart-card">
                <div class="card-header">
                    <h5><i class="fa-solid fa-wind text-primary"></i> <span data-i18n="wind"></span></h5>
                </div>
                <div class="card-body">
                    <div class="row mb-3">
                        <div class="col-md-4">
                            <div class="border rounded p-3 text-center">
                                <i class="fa-solid fa-file-import text-success" style="font-size: 2rem;"></i>
                                <h4 class="mt-2 mb-0" id="windImportCount">0</h4>
                                <small class="text-muted" data-i18n="import"></small>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="border rounded p-3 text-center">
                                <i class="fa-solid fa-database text-info" style="font-size: 2rem;"></i>
                                <h4 class="mt-2 mb-0" id="windRowCount">0</h4>
                                <small class="text-muted" data-i18n="row"></small>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="border rounded p-3 text-center">
                                <i class="fa-regular fa-calendar text-danger" style="font-size: 2rem;"></i>
                                <h4 class="mt-2 mb-0" id="windUpdate">-</h4>
                                <small class="text-muted" data-i18n="last_update"></small>
                            </div>
                        </div>
                    </div>
                    <canvas id="windDataChart" height="60"></canvas>
                </div>
            </div>
        </div>
    </div>
    <div class="row mb-4">
        <div class="col-12">
            <div class="card chart-card">
                <div class="card-header">
                    <h5><i class="fa-solid fa-clock-rotate-left"></i> <span data-i18n="usage_history"></span></h5>
                </div>
                <div class="card-body">
                    <table id="loginHistoryTable" class="table table-striped table-hover">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Login</th>
                                <th>Logout</th>
                                <th>IP</th>
                                <th>Device</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>            
</div>
<script src="<?=BASE_URL?>/public/js/admin/dashboard.js?v=<?=time()?>"></script>