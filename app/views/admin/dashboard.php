
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>
    .dashboard-container {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 24px;
        padding: 2rem;
        margin: 2rem auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    .stat-card {
        background: linear-gradient(135deg, var(--card-color-1), var(--card-color-2));
        border-radius: 20px;
        padding: 1.5rem;
        color: white;
        transition: all 0.3s ease;
        border: none;
        position: relative;
        overflow: hidden;
    }
    .stat-card::before {
        content: '';
        position: absolute;
        top: -50%;
        right: -50%;
        width: 200%;
        height: 200%;
        background: rgba(255, 255, 255, 0.1);
        transform: rotate(45deg);
        transition: all 0.5s ease;
    }
    .stat-card:hover::before {
        top: -60%;
        right: -60%;
    }
    .stat-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }
    .stat-card-1 { --card-color-1: #667eea; --card-color-2: #764ba2; }
    .stat-card-2 { --card-color-1: #f093fb; --card-color-2: #f5576c; }
    .stat-card-3 { --card-color-1: #4facfe; --card-color-2: #00f2fe; }
    .stat-card-4 { --card-color-1: #43e97b; --card-color-2: #38f9d7; }
    .stat-card-5 { --card-color-1: #fa709a; --card-color-2: #fee140; }
    .stat-card-6 { --card-color-1: #30cfd0; --card-color-2: #330867; }
    .stat-icon {
        font-size: 2.5rem;
        opacity: 0.9;
    }
    .stat-value {
        font-size: 2rem;
        font-weight: 700;
        margin: 0.5rem 0;
    }
    .stat-label {
        font-size: 0.9rem;
        opacity: 0.9;
        font-weight: 500;
    }
    .content-card {
        background: white;
        border-radius: 20px;
        border: none;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        transition: all 0.3s ease;
        overflow: hidden;
    }
    .content-card:hover {
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    }
    .card-header-custom {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 1.25rem 1.5rem;
        border: none;
        font-weight: 600;
    }
    .btn-gradient {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        color: white;
        padding: 0.5rem 1.5rem;
        border-radius: 10px;
        font-weight: 500;
        transition: all 0.3s ease;
    }
    .btn-gradient:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        color: white;
    }
    .table-custom {
        border-collapse: separate;
        border-spacing: 0;
    }
    .table-custom thead th {
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        border: none;
        padding: 1rem;
        font-weight: 600;
        color: #475569;
    }
    .table-custom tbody tr {
        transition: all 0.3s ease;
    }
    .table-custom tbody tr:hover {
        background: #f8fafc;
        transform: scale(1.01);
    }
    .badge-custom {
        padding: 0.4rem 0.8rem;
        border-radius: 8px;
        font-weight: 500;
    }
    .status-online {
        width: 10px;
        height: 10px;
        background: #10b981;
        border-radius: 50%;
        display: inline-block;
        animation: pulse 2s infinite;
    }
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
    .wind-gauge {
        width: 150px;
        height: 150px;
        margin: 0 auto;
    }
    #windMap {
        height: 450px;
        border-radius: 15px;
    }
    .alert-custom {
        border-radius: 15px;
        border: none;
        padding: 1rem 1.5rem;
    }
    .progress-custom {
        height: 10px;
        border-radius: 10px;
        background: #e2e8f0;
    }
    .progress-bar-custom {
        border-radius: 10px;
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    }
    .page-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 2rem;
        border-radius: 20px;
        margin-bottom: 2rem;
        box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
    }
</style>
<div class="container-fluid mt-90 mb-5">
    <div class="dashboard-container">
        <div class="page-header">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h2 class="fw-bold mb-2">
                        <i class="fas fa-wind me-3"></i>Wind Speed Monitoring System
                    </h2>
                    <p class="mb-0 opacity-75">ระบบติดตามและจัดการข้อมูลความเร็วลม</p>
                </div>
            </div>
        </div>
        <div class="row g-4 mb-4">
            <div class="col-6 col-lg-2">
                <div class="stat-card stat-card-1 text-center">
                    <i class="fas fa-tower-observation stat-icon"></i>
                    <div class="stat-value">23</div>
                    <div class="stat-label">สถานีวัดลม</div>
                </div>
            </div>
            <div class="col-6 col-lg-2">
                <div class="stat-card stat-card-2 text-center">
                    <i class="fas fa-wind stat-icon"></i>
                    <div class="stat-value">12.4</div>
                    <div class="stat-label">ความเร็วเฉลี่ย (km/h)</div>
                </div>
            </div>
            <div class="col-6 col-lg-2">
                <div class="stat-card stat-card-3 text-center">
                    <i class="fas fa-location-arrow stat-icon"></i>
                    <div class="stat-value">28</div>
                    <div class="stat-label">ลมแรงสุด (km/h)</div>
                </div>
            </div>
            <div class="col-6 col-lg-2">
                <div class="stat-card stat-card-4 text-center">
                    <i class="fas fa-chart-line stat-icon"></i>
                    <div class="stat-value">94%</div>
                    <div class="stat-label">อัตราการทำงาน</div>
                </div>
            </div>
            <div class="col-6 col-lg-2">
                <div class="stat-card stat-card-5 text-center">
                    <i class="fas fa-exclamation-triangle stat-icon"></i>
                    <div class="stat-value">2</div>
                    <div class="stat-label">แจ้งเตือน</div>
                </div>
            </div>
            <div class="col-6 col-lg-2">
                <div class="stat-card stat-card-6 text-center">
                    <i class="fas fa-clock stat-icon"></i>
                    <div class="stat-value">12m</div>
                    <div class="stat-label">อัปเดตล่าสุด</div>
                </div>
            </div>
        </div>
        <div class="row mb-4">
            <div class="col-lg-8">
                <div class="content-card">
                    <div class="card-header-custom">
                        <i class="fas fa-chart-area me-2"></i>แนวโน้มความเร็วลม (7 วันที่ผ่านมา)
                    </div>
                    <div class="card-body">
                        <canvas id="windTrendChart" height="100"></canvas>
                    </div>
                </div>
            </div>
            <div class="col-lg-4">
                <div class="content-card">
                    <div class="card-header-custom">
                        <i class="fas fa-gauge-high me-2"></i>สถานะระบบ
                    </div>
                    <div class="card-body">
                        <div class="mb-4">
                            <div class="d-flex justify-content-between mb-2">
                                <span class="fw-semibold">ประสิทธิภาพ CPU</span>
                                <span class="text-primary fw-bold">65%</span>
                            </div>
                            <div class="progress progress-custom">
                                <div class="progress-bar progress-bar-custom" style="width: 65%"></div>
                            </div>
                        </div>
                        <div class="mb-4">
                            <div class="d-flex justify-content-between mb-2">
                                <span class="fw-semibold">หน่วยความจำ</span>
                                <span class="text-success fw-bold">42%</span>
                            </div>
                            <div class="progress progress-custom">
                                <div class="progress-bar bg-success" style="width: 42%"></div>
                            </div>
                        </div>
                        <div class="mb-4">
                            <div class="d-flex justify-content-between mb-2">
                                <span class="fw-semibold">พื้นที่จัดเก็บ</span>
                                <span class="text-warning fw-bold">78%</span>
                            </div>
                            <div class="progress progress-custom">
                                <div class="progress-bar bg-warning" style="width: 78%"></div>
                            </div>
                        </div>
                        <div class="alert alert-custom alert-info mb-3">
                            <i class="fas fa-info-circle me-2"></i>
                            ระบบทำงานปกติ
                        </div>
                        <div class="text-center">
                            <span class="status-online me-2"></span>
                            <small class="text-muted">เชื่อมต่อสำเร็จ - 23 สถานี</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="row mb-4">
            <div class="col-lg-8">
                <div class="content-card">
                    <div class="card-header-custom">
                        <i class="fas fa-map-location-dot me-2"></i>แผนที่สถานีวัดลม
                    </div>
                    <div class="card-body p-0">
                        <div id="windMap"></div>
                    </div>
                </div>
            </div>
            <div class="col-lg-4">
                <div class="content-card mb-4">
                    <div class="card-header-custom">
                        <i class="fas fa-compass me-2"></i>ทิศทางลมเฉลี่ย
                    </div>
                    <div class="card-body text-center">
                        <canvas id="windDirectionChart" style="max-height: 200px;"></canvas>
                        <h4 class="mt-3 fw-bold">N 15°</h4>
                        <p class="text-muted mb-0">ทิศเหนือ</p>
                    </div>
                </div>
                <div class="content-card">
                    <div class="card-header-custom">
                        <i class="fas fa-bell me-2"></i>การแจ้งเตือน
                    </div>
                    <div class="card-body">
                        <div class="alert alert-warning alert-custom mb-2">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-exclamation-circle me-2"></i>
                                <div class="flex-grow-1">
                                    <small class="fw-semibold d-block">สถานี WT-12</small>
                                    <small class="text-muted">ความเร็วลมสูงกว่าปกติ</small>
                                </div>
                                <small class="text-muted">5 นาที</small>
                            </div>
                        </div>
                        <div class="alert alert-danger alert-custom mb-0">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-times-circle me-2"></i>
                                <div class="flex-grow-1">
                                    <small class="fw-semibold d-block">สถานี WT-07</small>
                                    <small class="text-muted">การเชื่อมต่อขาดหาย</small>
                                </div>
                                <small class="text-muted">15 นาที</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="content-card mb-4">
            <div class="card-header-custom d-flex justify-content-between align-items-center">
                <span><i class="fas fa-table me-2"></i>ข้อมูลลมล่าสุด</span>
                <button class="btn btn-light btn-sm">
                    <i class="fas fa-download me-1"></i>Export
                </button>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-custom align-middle">
                        <thead>
                            <tr>
                                <th>สถานี</th>
                                <th>ความเร็ว</th>
                                <th>ทิศทาง</th>
                                <th>อุณหภูมิ</th>
                                <th>ความชื้น</th>
                                <th>สถานะ</th>
                                <th>อัปเดต</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <i class="fas fa-tower-observation text-primary me-2"></i>
                                    <strong>WT-001</strong>
                                </td>
                                <td><span class="badge bg-success badge-custom">12.4 km/h</span></td>
                                <td><i class="fas fa-arrow-up text-primary"></i> N</td>
                                <td>28°C</td>
                                <td>65%</td>
                                <td><span class="status-online me-1"></span> Online</td>
                                <td><small class="text-muted">2 นาที</small></td>
                                <td><button class="btn btn-sm btn-outline-primary">รายละเอียด</button></td>
                            </tr>
                            <tr>
                                <td>
                                    <i class="fas fa-tower-observation text-primary me-2"></i>
                                    <strong>WT-002</strong>
                                </td>
                                <td><span class="badge bg-warning badge-custom">18.7 km/h</span></td>
                                <td><i class="fas fa-arrow-up text-primary" style="transform: rotate(45deg)"></i> NE</td>
                                <td>26°C</td>
                                <td>72%</td>
                                <td><span class="status-online me-1"></span> Online</td>
                                <td><small class="text-muted">3 นาที</small></td>
                                <td><button class="btn btn-sm btn-outline-primary">รายละเอียด</button></td>
                            </tr>
                            <tr>
                                <td>
                                    <i class="fas fa-tower-observation text-primary me-2"></i>
                                    <strong>WT-003</strong>
                                </td>
                                <td><span class="badge bg-danger badge-custom">28.0 km/h</span></td>
                                <td><i class="fas fa-arrow-right text-primary"></i> E</td>
                                <td>30°C</td>
                                <td>58%</td>
                                <td><span class="status-online me-1"></span> Online</td>
                                <td><small class="text-muted">1 นาที</small></td>
                                <td><button class="btn btn-sm btn-outline-primary">รายละเอียด</button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <div class="row mb-4">
            <div class="col-lg-6">
                <div class="content-card">
                    <div class="card-header-custom d-flex justify-content-between align-items-center">
                        <span><i class="fas fa-folder-open me-2"></i>เอกสารล่าสุด</span>
                        <button class="btn btn-light btn-sm">
                            <i class="fas fa-upload me-1"></i>Upload
                        </button>
                    </div>
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-3 p-3 bg-light rounded-3">
                            <i class="fas fa-file-pdf text-danger fa-2x me-3"></i>
                            <div class="flex-grow-1">
                                <h6 class="mb-1">Wind Summary Q4 2025</h6>
                                <small class="text-muted">PDF • 2.4 MB • 07/12/2025</small>
                            </div>
                            <button class="btn btn-sm btn-outline-primary">View</button>
                        </div>
                        <div class="d-flex align-items-center mb-3 p-3 bg-light rounded-3">
                            <i class="fas fa-file-excel text-success fa-2x me-3"></i>
                            <div class="flex-grow-1">
                                <h6 class="mb-1">Turbine Performance Report</h6>
                                <small class="text-muted">Excel • 1.8 MB • 05/12/2025</small>
                            </div>
                            <button class="btn btn-sm btn-outline-primary">View</button>
                        </div>
                        <div class="d-flex align-items-center p-3 bg-light rounded-3">
                            <i class="fas fa-file-word text-primary fa-2x me-3"></i>
                            <div class="flex-grow-1">
                                <h6 class="mb-1">Maintenance Schedule</h6>
                                <small class="text-muted">Word • 856 KB • 03/12/2025</small>
                            </div>
                            <button class="btn btn-sm btn-outline-primary">View</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-lg-6">
                <div class="content-card">
                    <div class="card-header-custom">
                        <i class="fas fa-history me-2"></i>ประวัติการใช้งานระบบ
                    </div>
                    <div class="card-body">
                        <div class="d-flex mb-3 pb-3 border-bottom">
                            <div class="text-center me-3" style="min-width: 60px;">
                                <div class="badge bg-primary badge-custom">14:05</div>
                            </div>
                            <div>
                                <h6 class="mb-1">นำเข้าข้อมูลลม</h6>
                                <small class="text-muted">Admin • wind_data_08dec.xlsx</small>
                            </div>
                        </div>
                        <div class="d-flex mb-3 pb-3 border-bottom">
                            <div class="text-center me-3" style="min-width: 60px;">
                                <div class="badge bg-success badge-custom">10:22</div>
                            </div>
                            <div>
                                <h6 class="mb-1">เข้าสู่ระบบ</h6>
                                <small class="text-muted">Manager01 • 192.168.1.20</small>
                            </div>
                        </div>
                        <div class="d-flex mb-3 pb-3 border-bottom">
                            <div class="text-center me-3" style="min-width: 60px;">
                                <div class="badge bg-warning badge-custom">09:15</div>
                            </div>
                            <div>
                                <h6 class="mb-1">อัปเดตการตั้งค่า</h6>
                                <small class="text-muted">Admin • แจ้งเตือนเมื่อลมเกิน 25 km/h</small>
                            </div>
                        </div>
                        <div class="d-flex">
                            <div class="text-center me-3" style="min-width: 60px;">
                                <div class="badge bg-info badge-custom">08:00</div>
                            </div>
                            <div>
                                <h6 class="mb-1">รายงานประจำวัน</h6>
                                <small class="text-muted">System • สร้างรายงานอัตโนมัติ</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="content-card">
            <div class="card-header-custom d-flex justify-content-between align-items-center">
                <span><i class="fas fa-user-check me-2"></i>รายงานการเข้าใช้งาน</span>
                <input type="text" id="login_date_range" class="form-control form-control-sm" style="max-width: 260px; border-radius: 10px;" placeholder="เลือกช่วงวันที่">
            </div>
            <div class="card-body">
                <canvas id="loginChart" height="80"></canvas>
                <hr class="my-4">
                <div class="table-responsive">
                    <table class="table table-custom align-middle">
                        <thead>
                            <tr>
                                <th>ผู้ใช้งาน</th>
                                <th>เวลาเข้าสู่ระบบ</th>
                                <th>IP Address</th>
                                <th>อุปกรณ์</th>
                                <th>ระยะเวลา</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 35px; height: 35px;">
                                            <strong>M</strong>
                                        </div>
                                        <strong>Manager01</strong>
                                    </div>
                                </td>
                                <td>08/12/2025 10:22</td>
                                <td><code>192.168.1.20</code></td>
                                <td><i class="fab fa-chrome me-1"></i> Chrome / Windows</td>
                                <td><span class="badge bg-success badge-custom">Active</span></td>
                            </tr>
                            <tr>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <div class="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 35px; height: 35px;">
                                            <strong>A</strong>
                                        </div>
                                        <strong>Admin</strong>
                                    </div>
                                </td>
                                <td>07/12/2025 21:15</td>
                                <td><code>192.168.1.10</code></td>
                                <td><i class="fab fa-safari me-1"></i> Safari / MacOS</td>
                                <td><span class="badge bg-secondary badge-custom">2h 15m</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>
<script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="<?=BASE_URL?>/public/js/admin/dashboard.js?v=<?=time()?>"></script>