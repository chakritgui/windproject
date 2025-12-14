<style>
    :root {
        --primary-color: #2c3e50;
        --secondary-color: #3498db;
        --accent-color: #e74c3c;
        --bg-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .header-card {
        background: var(--bg-gradient);
        color: white;
        border-radius: 20px;
        padding: 2rem;
        margin-bottom: 2rem;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        animation: slideDown 0.5s ease-out;
    }
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    .filter-card {
        background: white;
        border-radius: 15px;
        padding: 1.5rem;
        margin-bottom: 2rem;
        box-shadow: 0 5px 20px rgba(0,0,0,0.1);
        transition: all 0.3s ease;
    }
    .filter-card.collapsed {
        padding: 1rem;
    }
    .filter-toggle {
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 0;
        border-bottom: 2px solid #e0e0e0;
        margin-bottom: 1rem;
    }
    .filter-toggle i {
        transition: transform 0.3s ease;
    }
    .filter-toggle.collapsed i {
        transform: rotate(180deg);
    }
    .filter-content {
        max-height: 1000px;
        overflow: hidden;
        transition: max-height 0.3s ease, opacity 0.3s ease;
    }
    .filter-content.hide {
        max-height: 0;
        opacity: 0;
    }
    .form-label {
        font-weight: 600;
        color: var(--primary-color);
        margin-bottom: 0.5rem;
    }
    .form-control, .form-select {
        border-radius: 10px;
        border: 2px solid #e0e0e0;
        transition: all 0.3s ease;
    }
    .form-control:focus, .form-select:focus {
        border-color: var(--secondary-color);
        box-shadow: 0 0 0 0.2rem rgba(52, 152, 219, 0.25);
    }
    .sensor-checkbox {
        background: #f8f9fa;
        border-radius: 10px;
        padding: 1rem;
        margin-bottom: 0.5rem;
        transition: all 0.3s ease;
    }
    .sensor-checkbox:hover {
        background: #e9ecef;
        transform: translateX(5px);
    }
    .sensor-checkbox input[type="checkbox"] {
        width: 20px;
        height: 20px;
        cursor: pointer;
    }
    .btn-generate {
        background: var(--bg-gradient);
        border: none;
        color: white;
        padding: 0.8rem 3rem;
        border-radius: 50px;
        font-weight: 600;
        font-size: 1.1rem;
        transition: all 0.3s ease;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    }
    .btn-generate:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        color: white;
    }
    .report-section {
        background: white;
        border-radius: 15px;
        padding: 2rem;
        margin-bottom: 2rem;
        box-shadow: 0 5px 20px rgba(0,0,0,0.1);
        animation: fadeIn 0.5s ease-out;
    }
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    .report-title {
        color: var(--primary-color);
        border-left: 5px solid var(--secondary-color);
        padding-left: 1rem;
        margin-bottom: 1.5rem;
        font-weight: 700;
    }
    .stat-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 15px;
        padding: 1.5rem;
        text-align: center;
        margin-bottom: 1rem;
        transition: all 0.3s ease;
    }
    .stat-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }
    .stat-value {
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
    }
    .stat-label {
        font-size: 0.9rem;
        opacity: 0.9;
    }
    .chart-container {
        background: white;
        border-radius: 10px;
        padding: 1rem;
        height: 400px;
        position: relative;
    }
    .table-responsive {
        border-radius: 10px;
        overflow: hidden;
    }
    .table {
        margin-bottom: 0;
    }
    .table thead th {
        background: var(--primary-color);
        color: white;
        border: none;
        padding: 1rem;
    }
    .table tbody tr {
        transition: all 0.2s ease;
    }
    .table tbody tr:hover {
        background: #f8f9fa;
        transform: scale(1.01);
    }
    .info-badge {
        display: inline-block;
        background: rgba(255,255,255,0.2);
        padding: 0.3rem 1rem;
        border-radius: 20px;
        margin: 0.2rem;
        font-size: 0.9rem;
    }
    .days-count {
        background: rgba(255,255,255,0.3);
        padding: 0.5rem 1.5rem;
        border-radius: 10px;
        display: inline-block;
        margin-top: 0.5rem;
        font-weight: 600;
    }
    @media (max-width: 768px) {
        .header-card {
            padding: 1.5rem;
        }
        .btn-generate {
            width: 100%;
            margin-top: 1rem;
        }
        .stat-value {
            font-size: 1.5rem;
        }
    }
</style>
<div class="container mt-3 mb-5">
    <div class="header-card">
        <div class="row align-items-center">
            <div class="col-lg-8">
                <h3 class="mb-3"><i class="fas fa-broadcast-tower me-3"></i><strong>Station:</strong> <span id="stationName">Wind Tower #01</h3>
                <div class="mb-2">
                    <i class="fas fa-broadcast-tower me-2"></i><strong>Station:</strong> <span id="stationName">Wind Tower #01</span>
                </div>
                <div>
                    <span class="info-badge"><i class="fas fa-map-marker-alt me-2"></i>Lat: <span id="latitude">13.7563</span></span>
                    <span class="info-badge"><i class="fas fa-map-marker-alt me-2"></i>Lng: <span id="longitude">100.5018</span></span>
                </div>
            </div>
            <div class="col-lg-4 text-lg-end mt-3 mt-lg-0">
                <div class="days-count">
                    <i class="fas fa-calendar-alt me-2"></i>
                    <span id="daysCount">0</span> วัน
                </div>
            </div>
        </div>
    </div>
    <div class="filter-card" id="filterCard">
        <div class="filter-toggle" id="filterToggle">
            <h4 class="mb-0"><i class="fas fa-filter me-2"></i>ตัวกรองข้อมูล</h4>
            <i class="fas fa-chevron-up"></i>
        </div>
        <div class="filter-content" id="filterContent">
            <div class="row">
                <div class="col-md-6 col-lg-3 mb-3">
                    <label class="form-label">
                        <i class="fas fa-arrows-alt-v me-2"></i>ความสูง (Height)
                    </label>
                    <select class="form-select" id="heightSelect">
                        <option value="10">10 เมตร</option>
                        <option value="30" selected>30 เมตร</option>
                        <option value="50">50 เมตร</option>
                        <option value="80">80 เมตร</option>
                        <option value="100">100 เมตร</option>
                    </select>
                </div>
                <div class="col-md-6 col-lg-3 mb-3">
                    <label class="form-label">
                        <i class="fas fa-calendar-day me-2"></i>วันที่เริ่มต้น
                    </label>
                    <input type="date" class="form-control" id="startDate">
                </div>
                <div class="col-md-6 col-lg-3 mb-3">
                    <label class="form-label">
                        <i class="fas fa-calendar-day me-2"></i>วันที่สิ้นสุด
                    </label>
                    <input type="date" class="form-control" id="endDate">
                </div>
                <div class="col-md-6 col-lg-3 mb-3 d-flex align-items-end">
                    <button class="btn btn-generate w-100" onclick="generateReport()">
                        <i class="fas fa-chart-line me-2"></i>สร้างรายงาน
                    </button>
                </div>
            </div>
            <div class="row mt-3">
                <div class="col-12">
                    <label class="form-label">
                        <i class="fas fa-sensor me-2"></i>เลือกเซ็นเซอร์
                    </label>
                </div>
                <div class="col-md-6 col-lg-4">
                    <div class="sensor-checkbox">
                        <input type="checkbox" class="form-check-input me-3" id="sensor1" checked>
                        <label class="form-check-label" for="sensor1">
                            <i class="fas fa-wind text-primary me-2"></i>Wind Speed (m/s)
                        </label>
                    </div>
                </div>
                <div class="col-md-6 col-lg-4">
                    <div class="sensor-checkbox">
                        <input type="checkbox" class="form-check-input me-3" id="sensor2" checked>
                        <label class="form-check-label" for="sensor2">
                            <i class="fas fa-compass text-success me-2"></i>Wind Direction (degree)
                        </label>
                    </div>
                </div>
                <div class="col-md-6 col-lg-4">
                    <div class="sensor-checkbox">
                        <input type="checkbox" class="form-check-input me-3" id="sensor3">
                        <label class="form-check-label" for="sensor3">
                            <i class="fas fa-weight text-info me-2"></i>Air Density (kg/m³)
                        </label>
                    </div>
                </div>
                <div class="col-md-6 col-lg-4">
                    <div class="sensor-checkbox">
                        <input type="checkbox" class="form-check-input me-3" id="sensor4">
                        <label class="form-check-label" for="sensor4">
                            <i class="fas fa-tachometer-alt text-warning me-2"></i>Surface Pressure (hPa)
                        </label>
                    </div>
                </div>
                <div class="col-md-6 col-lg-4">
                    <div class="sensor-checkbox">
                        <input type="checkbox" class="form-check-input me-3" id="sensor5">
                        <label class="form-check-label" for="sensor5">
                            <i class="fas fa-tint text-primary me-2"></i>Relative Humidity (%)
                        </label>
                    </div>
                </div>
                <div class="col-md-6 col-lg-4">
                    <div class="sensor-checkbox">
                        <input type="checkbox" class="form-check-input me-3" id="sensor6">
                        <label class="form-check-label" for="sensor6">
                            <i class="fas fa-temperature-high text-danger me-2"></i>Air Temperature (°C)
                        </label>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div id="reportSection" style="display: none;">
        <div class="report-section">
            <h3 class="report-title"><i class="fas fa-chart-bar me-2"></i>ค่าเฉลี่ยรวม (Average Summary)</h3>
            <div class="row" id="statsContainer"></div>
        </div>
        <div class="report-section">
            <h3 class="report-title"><i class="fas fa-table me-2"></i>ตารางข้อมูล Wind Speed</h3>
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>วันที่/เวลา</th>
                            <th>Wind Speed (m/s)</th>
                            <th>Max Speed</th>
                            <th>Min Speed</th>
                            <th>Average</th>
                        </tr>
                    </thead>
                    <tbody id="dataTable">
                        <tr>
                            <td>2025-11-01 00:00</td>
                            <td>8.5</td>
                            <td>12.3</td>
                            <td>5.2</td>
                            <td>8.1</td>
                        </tr>
                        <tr>
                            <td>2025-11-01 01:00</td>
                            <td>9.2</td>
                            <td>13.1</td>
                            <td>6.1</td>
                            <td>9.0</td>
                        </tr>
                        <tr>
                            <td>2025-11-01 02:00</td>
                            <td>7.8</td>
                            <td>11.5</td>
                            <td>4.9</td>
                            <td>7.5</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div class="report-section">
            <h3 class="report-title"><i class="fas fa-chart-line me-2"></i>กราฟแสดงผล Wind Speed</h3>
            <div class="row">
                <div class="col-lg-6 mb-4">
                    <h5 class="text-center mb-3">Line Chart</h5>
                    <div class="chart-container">
                        <canvas id="lineChart"></canvas>
                    </div>
                </div>
                <div class="col-lg-6 mb-4">
                    <h5 class="text-center mb-3">Area Chart</h5>
                    <div class="chart-container">
                        <canvas id="areaChart"></canvas>
                    </div>
                </div>
                <div class="col-lg-6 mb-4">
                    <h5 class="text-center mb-3">Histogram</h5>
                    <div class="chart-container">
                        <canvas id="barChart"></canvas>
                    </div>
                </div>
                <div class="col-lg-6 mb-4">
                    <h5 class="text-center mb-3">Wind Rose (Radar)</h5>
                    <div class="chart-container">
                        <canvas id="radarChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js"></script>
<script src="<?=BASE_URL?>/public/js/pole.js?v=<?=time();?>" defer></script>