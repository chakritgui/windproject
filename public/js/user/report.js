function renderReport(poles_id, type) {
    let errors = [];
    $('.obj-required').each(function () {
        let value = ($(this).val() || '').toString().trim();
        if (!value) {
            $(this).addClass('is-invalid');
            errors.push(this.id);
        } else {
            $(this).removeClass('is-invalid');
        }
    });
    const sensors = [];
    $('.sensor-checkbox input:checked').each(function () {
        sensors.push($(this).attr('id').replace('sensor', ''));
    });
    if (sensors.length === 0) {
        $('.sensor-checkbox').addClass('border-danger');
        errors.push('sensors');
    } else {
        $('.sensor-checkbox').removeClass('border-danger');
    }
    if (errors.length) {
        const message = (sensors.length === 0 && errors.length === 1) ? (langData['select_sensor_message'] || 'Please select at least one sensor.') : (langData['required_star_message'] || 'Please fill all fields marked with *');
        showWarning(message);
        const el = $('.is-invalid').first()[0];
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }
    const reportData = {
        id: poles_id,
        start: $('#startDate').val(),
        end: $('#endDate').val(),
        h: $('#heightSelect').val(),
        s: sensors.join(',')
    };
    const encodedData = btoa(
        unescape(encodeURIComponent(JSON.stringify(reportData)))
    );
    if(isPWA()) {
        showReportPWA(reportData);
    } else {
        const reportUrl = `${BASE_URL}/pole/${encodedData}`;
        navigateTo(reportUrl, type);
    }
}
async function openFilterModal(poles_id, startDate = '', endDate = '', height_id = '') {
    const myModal = new bootstrap.Modal(document.getElementById('poleDetailModal'));
    myModal.show();
    $('#poleModalBody').html('<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>');
    try {
        const response = await fetch(`${BASE_URL}/api/pole-details`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                id: poles_id,
                start: startDate,
                end: endDate,
                height: height_id,
            })
        });
        const data = await response.json();
        const html = `
            <div class="header-card">
                <div class="row align-items-center">
                    <div class="col-lg-12">
                        <h5 class="mb-3"><i class="fas fa-broadcast-tower me-3"></i>${data.installations_name} #${data.poles_code}</h5>
                        <div class="mb-1 d-flex flex-wrap align-items-center gap-3">
                            <span><i class="fa-solid fa-diagram-project me2"></i> ${data.project_name}</span>
                            <span><i class="fa-regular fa-calendar me-2"></i> ${data.start_date} - ${data.end_date}</span>
                            <span><i class="fas fa-map-marker-alt me-2"></i> ${data.poles_lat}, ${data.poles_lng}</span>
                        </div>
                    </div>
                </div>
                <div class="mt-1 border-opacity-25">
                    <div class="d-flex align-items-center text-white">
                        <i class="fa-solid fa-circle-info me-2 small"></i>
                        <div class="fw-bold" data-i18n="report_remark"></div>
                    </div>
                </div>
            </div>
            <div class="filter-card" id="filterCard">
                <div class="filter-content" id="filterContent">
                    <div class="row">
                        <div class="col-md-6 col-lg-4 mb-3">
                            <label class="form-label required">
                                <i class="fas fa-calendar-day me-2"></i><span data-i18n="startDate"></span>
                            </label>
                            <input type="text" class="form-control obj-required" id="startDate" value="${data.min_datetime}">
                        </div>
                        <div class="col-md-6 col-lg-4 mb-3">
                            <label class="form-label required">
                                <i class="fas fa-calendar-day me-2"></i><span data-i18n="endDate"></span>
                            </label>
                            <input type="text" class="form-control obj-required" id="endDate" value="${data.max_datetime}">
                        </div>
                        <div class="col-md-6 col-lg-4 mb-3">
                            <label class="form-label required">
                                <i class="fas fa-arrows-alt-v me-2"></i><span data-i18n="level"></span>
                            </label>
                            <select class="form-select obj-required" id="heightSelect"></select>
                        </div>
                    </div>
                    <div class="row mt-3">
                        <div class="col-12">
                            <label class="form-label required">
                                <i class="fas fa-sensor me-2"></i><span data-i18n="sensor"></span>
                            </label>
                        </div>
                        <div class="col-md-6 col-lg-6">
                            <div class="sensor-checkbox">
                                <input type="checkbox" class="form-check-input me-2" id="sensor1" checked>
                                <label class="form-check-label" for="sensor1" style="cursor: pointer;">
                                    <i class="fas fa-wind text-primary me-2"></i><span data-i18n="wind_speed"></span> (m/s)
                                </label>
                            </div>
                        </div>
                        <div class="col-md-6 col-lg-6">
                            <div class="sensor-checkbox">
                                <input type="checkbox" class="form-check-input me-2" id="sensor2" checked>
                                <label class="form-check-label" for="sensor2" style="cursor: pointer;">
                                    <i class="fas fa-compass text-success me-2"></i><span data-i18n="wind_direction"></span> (<span data-i18n="degree"></span>)
                                </label>
                            </div>
                        </div>
                        <div class="col-md-6 col-lg-6">
                            <div class="sensor-checkbox">
                                <input type="checkbox" class="form-check-input me-2" id="sensor3">
                                <label class="form-check-label" for="sensor3" style="cursor: pointer;">
                                    <i class="fas fa-weight text-info me-2"></i><span data-i18n="air_density"></span> (kg/m³)
                                </label>
                            </div>
                        </div>
                        <div class="col-md-6 col-lg-6">
                            <div class="sensor-checkbox">
                                <input type="checkbox" class="form-check-input me-2" id="sensor4">
                                <label class="form-check-label" for="sensor4" style="cursor: pointer;">
                                    <i class="fas fa-tachometer-alt text-warning me-2"></i><span data-i18n="surface_pressure"></span> (hPa)
                                </label>
                            </div>
                        </div>
                        <div class="col-md-6 col-lg-6">
                            <div class="sensor-checkbox">
                                <input type="checkbox" class="form-check-input me-2" id="sensor5">
                                <label class="form-check-label" for="sensor5" style="cursor: pointer;">
                                    <i class="fas fa-tint text-primary me-2"></i><span data-i18n="relative_humidity"></span> (%)
                                </label>
                            </div>
                        </div>
                        <div class="col-md-6 col-lg-6">
                            <div class="sensor-checkbox">
                                <input type="checkbox" class="form-check-input me-2" id="sensor6">
                                <label class="form-check-label" for="sensor6" style="cursor: pointer;">
                                    <i class="fas fa-temperature-high text-danger me-2"></i><span data-i18n="turbulence_intensity"></span> (°C)
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        $('#poleModalBody').html(html);
        $('#poleModalLabel').text(data.installations_name);
        let minVal = data.min_datetime_val ? new Date(data.min_datetime_val) : null;
        let maxVal = data.max_datetime_val ? new Date(data.max_datetime_val) : null;
        initDatePicker('#startDate', minVal, maxVal);
        initDatePicker('#endDate', minVal, maxVal);
        initSelect2Remote('#heightSelect', `${BASE_URL}/api/height`, { poles_id: poles_id });
        $('#poleDetailModal .modal-footer').html(`
            <button class="btn btn-primary me-2" onclick="renderReport(${poles_id}, 'default')" data-i18n="generate_report"></button>
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal" data-i18n="close"></button>
        `);
        if (data.height_name && data.height_id) {
            const newOption = new Option(data.height_name, data.height_id, true, true);
            $('#heightSelect').append(newOption).trigger('change');
        }
    } catch (err) {
        $('#poleModalBody').html('<div class="alert alert-danger">Cannot load data. Please try again.</div>');
    }
}
function showReportPWA(data) {
    const $modal = $("#reportModal");
    const modalBody = $modal.find(".modal-body");
    $modal.find(".modal-dialog").addClass("modal-fullscreen");
    $modal.find(".modal-header").html(`
        <div class="d-flex align-items-center w-100">
            <button type="button" class="btn btn-sm btn-light me-3" data-bs-dismiss="modal">
                <i class="fa-solid fa-arrow-left"></i>
            </button>
            <h6 class="mb-0" data-i18n="analysis_report"></h6>
        </div>
    `);
    $modal.find(".modal-footer").html(`
        <div class="d-flex justify-content-center align-items-center w-100">${footer}</div>
    `);
    modalBody.html(`
        <div class="container-fluid mt-3 mb-5">
            <div class="report-section mb-4">
                <h6 class="report-title"><i class="fa-solid fa-cloud-meatball me-2"></i><span data-i18n="weather_overview"></span></h6>
                <div class="row g-2 mt-2" id="weatherContainer"></div>
            </div>
            <div class="header-card p-3 border rounded bg-light mb-4">
                <h5 class="mb-3">
                    <i class="fas fa-broadcast-tower me-2 text-white"></i>
                    <span id="installations_name">-</span> #<span id="code">-</span>
                </h5>
                <div class="d-flex flex-wrap gap-3 text-white" style="font-size: 0.85rem;">
                    <span><i class="fa-solid fa-diagram-project me-1"></i> <span id="project">-</span></span>
                    <span><i class="fas fa-arrows-alt-v me-1"></i> <span id="level">-</span></span>
                    <span><i class="fas fa-map-marker-alt me-1"></i> <span id="location">-</span></span>
                    <span>
                        <i class="fa-regular fa-calendar me-1"></i>
                        <span id="period"></span> <span class="badge-days mx-1"> <span id="total_days"></span> <span data-i18n="days"></span></span>
                    </span>
                </div>
                <div class="mt-1 border-opacity-25">
                    <div class="d-flex align-items-center text-white">
                        <i class="fa-solid fa-circle-info me-2 small"></i>
                        <div class="fw-bold" data-i18n="report_remark"></div>
                    </div>
                </div>
            </div>
            <div class="report-section mb-4">
                <h6 class="report-title"><i class="fas fa-chart-bar me-2"></i><span data-i18n="average_summary"></span></h6>
                <div class="row g-3" id="statsContainer"></div>
            </div>
            <div class="report-section">
                <h6 class="report-title"><i class="fas fa-chart-line me-2"></i><span data-i18n="visualization"></span></h6>
                <div class="row" id="chartRow">
                    <div class="col-lg-4 mb-4 chart-box" data-chart="wind-speed">
                        <h6 class="text-center" data-i18n="wind_speed_trend"></h6>
                        <div class="chart-container">
                            <canvas id="lineChart"></canvas>
                        </div>
                    </div>
                    <div class="col-lg-4 mb-4 chart-box" data-chart="wind-speed-area">
                        <h6 class="text-center" data-i18n="wind_speed_area"></h6>
                        <div class="chart-container">
                            <canvas id="areaChart"></canvas>
                        </div>
                    </div>
                    <div class="col-lg-4 mb-4 chart-box" data-chart="wind-speed-hist">
                        <h6 class="text-center" data-i18n="wind_speed_distribution"></h6>
                        <div class="chart-container">
                            <canvas id="barChart"></canvas>
                        </div>
                    </div>
                    <div class="col-lg-4 mb-4 chart-box" data-chart="wind-direction">
                        <h6 class="text-center" data-i18n="wind_rose"></h6>
                        <div class="chart-container">
                            <canvas id="radarChart"></canvas>
                        </div>
                    </div>
                    <div class="col-lg-4 mb-4 chart-box" data-chart="weather">
                        <h6 class="text-center" data-i18n="weather_overview"></h6>
                        <div class="chart-container">
                            <canvas id="weatherChart"></canvas>
                        </div>
                    </div>
                    <div class="col-lg-4 mb-4 chart-box" data-chart="air">
                        <h6 class="text-center" data-i18n="air_density_turbulence"></h6>
                        <div class="chart-container">
                            <canvas id="airChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `);
    $modal.modal('show');
    $modal.one('shown.bs.modal', function () {
        poles_id  = data.id;
        startDate = data.start;
        endDate   = data.end;
        height_id = data.h;
        if (data.s) {
            sensors_data = data.s.split(',').map(v => parseInt(v, 10) - 1);
        } else {
            sensors_data = [];
        }
        if (typeof generateReport === "function") {
            generateReport();
        }
    });
}