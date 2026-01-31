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
                            <div class="stat-label">จำนวนสมาชิก</div>
                            <div class="stat-number" id="memberCount">1,234</div>
                            <div class="mt-2">
                                <span class="badge badge-custom bg-light text-success">
                                    <i class="bi bi-arrow-up"></i> +12%
                                </span>
                            </div>
                        </div>
                        <div class="icon-box">
                            <i class="bi bi-people-fill"></i>
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
                            <div class="stat-label">จำนวนสัญญา</div>
                            <div class="stat-number" id="contractCount">567</div>
                            <div class="mt-2">
                                <span class="badge badge-custom bg-light text-info">
                                    <i class="bi bi-arrow-up"></i> +8%
                                </span>
                            </div>
                        </div>
                        <div class="icon-box">
                            <i class="bi bi-file-earmark-text-fill"></i>
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
                            <div class="stat-label">จำนวนโครงการ</div>
                            <div class="stat-number" id="projectCount">89</div>
                            <div class="mt-2">
                                <span class="badge badge-custom bg-light text-warning">
                                    <i class="bi bi-arrow-up"></i> +5%
                                </span>
                            </div>
                        </div>
                        <div class="icon-box">
                            <i class="bi bi-building"></i>
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
                            <div class="stat-label">จำนวนจุดติดตั้ง</div>
                            <div class="stat-number" id="installCount">2,456</div>
                            <div class="mt-2">
                                <span class="badge badge-custom bg-light text-danger">
                                    <i class="bi bi-arrow-up"></i> +15%
                                </span>
                            </div>
                        </div>
                        <div class="icon-box">
                            <i class="bi bi-geo-alt-fill"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="row mb-4">
        <div class="col-md-3 mb-3">
            <div class="mini-stat">
                <i class="bi bi-broadcast-pin"></i>
                <div class="number" id="poleTypeCount">12</div>
                <div class="label">ประเภทเสา</div>
            </div>
        </div>
        <div class="col-md-3 mb-3">
            <div class="mini-stat">
                <i class="bi bi-pin-map"></i>
                <div class="number" id="poleCount">3,789</div>
                <div class="label">จำนวนเสา</div>
            </div>
        </div>
        <div class="col-md-3 mb-3">
            <div class="mini-stat">
                <i class="bi bi-wind"></i>
                <div class="number" id="windImportCount">45</div>
                <div class="label">นำเข้าข้อมูลลม</div>
            </div>
        </div>
        <div class="col-md-3 mb-3">
            <div class="mini-stat">
                <i class="bi bi-table"></i>
                <div class="number" id="windRowCount">15,678</div>
                <div class="label">แถวข้อมูลลม</div>
            </div>
        </div>
    </div>
    <div class="row mb-4">
        <div class="col-lg-8 mb-4">
            <div class="card chart-card">
                <div class="card-header">
                    <h5><i class="bi bi-activity text-info"></i> การเข้าใช้งานของผู้ใช้</h5>
                </div>
                <div class="card-body">
                    <canvas id="userActivityChart" height="80"></canvas>
                </div>
            </div>
        </div>
        <div class="col-lg-4 mb-4">
            <div class="card chart-card">
                <div class="card-header">
                    <div class="d-flex justify-content-between align-items-center">
                        <h5><i class="bi bi-bell-fill text-warning"></i> ข่าวสารแจ้งเตือน</h5>
                        <span class="badge bg-danger" id="notificationCount">24</span>
                    </div>
                </div>
                <div class="card-body" style="max-height: 400px; overflow-y: auto;">
                    <div class="activity-item">
                        <div class="d-flex justify-content-between">
                            <strong>โครงการใหม่เพิ่ม</strong>
                            <span class="activity-time">5 นาทีที่แล้ว</span>
                        </div>
                        <p class="mb-0 text-muted small">มีการเพิ่มโครงการ "สายส่งไฟฟ้า A-01"</p>
                    </div>
                    <div class="activity-item">
                        <div class="d-flex justify-content-between">
                            <strong>ข้อมูลลมอัพเดท</strong>
                            <span class="activity-time">1 ชั่วโมงที่แล้ว</span>
                        </div>
                        <p class="mb-0 text-muted small">นำเข้าข้อมูลลม 500 แถว</p>
                    </div>
                    <div class="activity-item">
                        <div class="d-flex justify-content-between">
                            <strong>เอกสารดาวน์โหลด</strong>
                            <span class="activity-time">2 ชั่วโมงที่แล้ว</span>
                        </div>
                        <p class="mb-0 text-muted small">มีการดาวน์โหลดรายงาน Q4</p>
                    </div>
                    <div class="activity-item">
                        <div class="d-flex justify-content-between">
                            <strong>สมาชิกใหม่</strong>
                            <span class="activity-time">3 ชั่วโมงที่แล้ว</span>
                        </div>
                        <p class="mb-0 text-muted small">มีสมาชิกเข้าระบบ 15 คน</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="row mb-4">
        <div class="col-12">
            <div class="card chart-card">
                <div class="card-header">
                    <h5><i class="bi bi-wind text-primary"></i> การวิเคราะห์ข้อมูลลม</h5>
                </div>
                <div class="card-body">
                    <div class="row mb-3">
                        <div class="col-md-4">
                            <div class="border rounded p-3 text-center">
                                <i class="bi bi-arrow-up-circle text-success" style="font-size: 2rem;"></i>
                                <h4 class="mt-2 mb-0">45</h4>
                                <small class="text-muted">ครั้งนำเข้า</small>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="border rounded p-3 text-center">
                                <i class="bi bi-database text-info" style="font-size: 2rem;"></i>
                                <h4 class="mt-2 mb-0">15,678</h4>
                                <small class="text-muted">แถวข้อมูล</small>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="border rounded p-3 text-center">
                                <i class="bi bi-calendar-check text-danger" style="font-size: 2rem;"></i>
                                <h4 class="mt-2 mb-0">วันนี้</h4>
                                <small class="text-muted">อัพเดทล่าสุด</small>
                            </div>
                        </div>
                    </div>
                    <canvas id="windDataChart" height="60"></canvas>
                </div>
            </div>
        </div>
    </div>
</div>
<script>
    const userActivityCtx = document.getElementById('userActivityChart').getContext('2d');
    new Chart(userActivityCtx, {
        type: 'line',
        data: {
            labels: ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์', 'อาทิตย์'],
            datasets: [{
                label: 'จำนวนผู้เข้าใช้',
                data: [65, 78, 90, 81, 95, 45, 30],
                borderColor: 'rgba(102, 126, 234, 1)',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    const windDataCtx = document.getElementById('windDataChart').getContext('2d');
    new Chart(windDataCtx, {
        type: 'line',
        data: {
            labels: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'],
            datasets: [{
                label: 'จำนวนข้อมูลลมที่นำเข้า',
                data: [1200, 1400, 1100, 1600, 1300, 1500, 1700, 1250, 1450, 1350, 1550, 1650],
                borderColor: 'rgba(79, 172, 254, 1)',
                backgroundColor: 'rgba(79, 172, 254, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
</script>