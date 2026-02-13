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
    const levels = [];
    $('.level-checkbox:checked').each(function() {
        levels.push($(this).val());
    });
    if (levels.length === 0) {
        errors.push('levels');
    }
    if (errors.length) {
        let message = langData['required_star_message'] || 'Please fill all fields marked with *';
        if (errors.length === 1) {
            if (sensors.length === 0) message = langData['select_sensor_message'] || 'Please select at least one sensor.';
            if (levels.length === 0) message = langData['select_level_message'] || 'Please select at least one level.';
        }
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
        s: sensors.join(','), 
        lv: levels.join(',')
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
async function openFilterModal(poles_id, startDate = '', endDate = '', height_id = '', sensors_data = [], levels_data = [], type = '_blank') {
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
            <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div class="card-body p-3 p-lg-3">
                    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                        <div class="d-flex align-items-center gap-3">
                            <div class="bg-primary bg-opacity-10 p-3 rounded-circle text-primary shadow-sm d-flex align-items-center justify-content-center" style="width: 56px; height: 56px;">
                                <i class="fas fa-broadcast-tower fs-4"></i>
                            </div>
                            <div>
                                <h5 class="fw-bold mb-1 text-dark">
                                    <span>${data.installations_name}</span>
                                    <small class="text-muted fw-light ms-1">#${data.poles_code}</small>
                                </h5>
                                <div class="d-inline-flex align-items-center bg-light border border-light-subtle rounded-pill px-3 py-1 shadow-sm">
                                    <i class="fa-solid fa-circle me-2 small" style="color: ${data.project_status_color || "#CCCCCC"}"></i>
                                    <span class="fw-bold opacity-75">${data.project_status_name || "-"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <hr class="text-muted opacity-25 mb-4">
                    <div class="row g-3">
                        <div class="col-12 col-lg-6">
                            <div class="d-flex align-items-start gap-3 p-2 rounded-3 hover-bg-light transition">
                                <div class="text-primary opacity-50"><i class="fa-solid fa-diagram-project fs-4"></i></div>
                                <div>
                                    <label class="d-block text-muted small fw-bold text-uppercase mb-1" data-i18n="project"></label>
                                    <span class="text-dark fw-semibold">${data.project_name}</span> 
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-lg-6">
                            <div class="d-flex align-items-start gap-3 p-2 rounded-3 hover-bg-light transition">
                                <div class="text-info opacity-50"><i class="fas fa-arrows-alt-v fs-4"></i></div>
                                <div>
                                    <label class="d-block text-muted small fw-bold text-uppercase mb-1" data-i18n="level"></label>
                                    <span class="text-dark fw-semibold">${data.height_name}</span>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-lg-6">
                            <div class="d-flex align-items-start gap-3 p-2 rounded-3 hover-bg-light transition">
                                <div class="text-success opacity-50"><i class="fas fa-map-marker-alt fs-4"></i></div>
                                <div>
                                    <label class="d-block text-muted small fw-bold text-uppercase mb-1" data-i18n="location"></label>
                                    <span class="text-dark fw-semibold d-block text-truncate" style="max-width: 180px;">${data.poles_lat}, ${data.poles_lng}</span>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-lg-6">
                            <div class="d-flex align-items-start gap-3 p-2 rounded-3 hover-bg-light transition">
                                <div class="text-warning opacity-50"><i class="fa-regular fa-calendar fs-4"></i></div>
                                <div>
                                    <label class="d-block text-muted small fw-bold text-uppercase mb-1" data-i18n="monitoring_period"></label>
                                    <div class="d-flex align-items-center gap-2">
                                        <span class="text-dark fw-semibold small">${data.start_date} - ${data.end_date}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="bg-dark bg-opacity-10 px-4 py-2 border-top border-light-subtle">
                    <div class="d-flex align-items-center text-secondary small">
                        <i class="fa-solid fa-circle-info me-2"></i>
                        <span class="fw-bold me-1" data-i18n="report_remark"></span>
                    </div>
                </div>
            </div>
            <div class="filter-card mt-3 mb-3" id="filterCard">
                <div class="filter-content" id="filterContent">
                    <div class="row">
                        <div class="col-md-4 col-lg-4 mb-3">
                            <label class="form-label required">
                                <i class="fas fa-calendar-day me-2"></i><span data-i18n="startDate"></span>
                            </label>
                            <input type="text" class="form-control obj-required" id="startDate" value="${data.min_datetime}">
                        </div>
                        <div class="col-md-4 col-lg-4 mb-3">
                            <label class="form-label required">
                                <i class="fas fa-calendar-day me-2"></i><span data-i18n="endDate"></span>
                            </label>
                            <input type="text" class="form-control obj-required" id="endDate" value="${data.max_datetime}">
                        </div>
                        <div class="col-md-4 col-lg-4 mb-3">
                            <label class="form-label required">
                                <i class="fa-solid fa-signal me-2"></i><span data-i18n="level"></span>
                            </label>
                            <select class="form-select obj-required" id="heightSelect"></select>
                        </div>
                    </div>
                    <div class="row mt-3">
                        <div class="col-12">
                            <label class="form-label required">
                                <i class="fa-solid fa-up-down me-2"></i><span data-i18n="height_level"></span>
                            </label>
                            <div class="mb-3 text-warning"><span data-i18n="max_selection_reached"></span> <span class="height_limit"></span> <span data-i18n="height_level"></span></div>
                            <div class="levelBody bg-white border rounded-3 p-3 shadow-sm gap-2"></div>
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
        if (sensors_data && sensors_data.length > 0) {
            $('input[id^="sensor"]').prop('checked', false);
            sensors_data.forEach(sId => {
                $(`#sensor${sId}`).prop('checked', true);
            });
        } else {
            $('#sensor1, #sensor2').prop('checked', true);
        }
        $('#poleModalLabel').text(data.installations_name);
        let minVal = data.min_datetime_val ? new Date(data.min_datetime_val) : null;
        let maxVal = data.max_datetime_val ? new Date(data.max_datetime_val) : null;
        initDatePicker('#startDate', minVal, maxVal);
        initDatePicker('#endDate', minVal, maxVal);
        initSelect2Remote('#heightSelect', `${BASE_URL}/api/height`, { poles_id: poles_id });
        $('#poleDetailModal .modal-footer').html(`
            <button class="btn btn-primary me-2" onclick="renderReport(${poles_id}, '${type}')" data-i18n="generate_report">${langData['generate_report'] || 'Generate Report'}</button>
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal" data-i18n="close">${langData['close'] || 'Close'}</button>
        `);
        if (data.height_name && data.height_id) {
            const newOption = new Option(data.height_name, data.height_id, true, true);
            $('#heightSelect').append(newOption).trigger('change');
        }
        await renderLevel($('#heightSelect').val(), levels_data);
        $('#heightSelect').on('change', function() {
            renderLevel($(this).val(), []);
        });
    } catch (err) {
        $('#poleModalBody').html(langData['cannot_load'] || 'Failed to load data. Please try again later.');
    }
}
let currentLimit = 3; 
async function renderLevel(height_id, levelsToCheck = []) {
    const $container = $(".levelBody");
    if (!height_id) {
        $container.html(`<div class="alert alert-danger" role="alert">${langData['please_choose_height'] || 'Please select height'}</div>`);
        return;
    }
    $container.html(`
        <div class="py-2 text-primary small">
            <div class="spinner-border spinner-border-sm me-2"></div>
            <span data-i18n="loading">${langData['loading'] || 'Loading...'}</span>
        </div>
    `);
    try {
        const response = await fetch(`${BASE_URL}/api/level`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ height_id: height_id })
        });
        if (!response.ok) throw new Error('Network response was not ok');
        const result = await response.json();
        let html = '';
        const levels = result.levels || [];
        currentLimit = parseInt(result.height_limit) || 3;
        if (levels && levels.length > 0) {
            levels.forEach((item, index) => {
                let isChecked = '';
                if (levelsToCheck && levelsToCheck.length > 0) {
                    isChecked = levelsToCheck.some(lv => String(lv) === String(item.levels_id)) ? 'checked' : '';
                } else {
                    isChecked = index < currentLimit ? 'checked' : '';
                }
                html += `
                    <div class="level-item">
                        <input class="btn-check level-checkbox" type="checkbox" name="levels[]" value="${item.levels_id}" id="level_${item.levels_id}" ${isChecked} autocomplete="off">
                        <label class="btn btn-outline-primary btn-sm rounded-pill px-3 py-1 mb-2 me-2 shadow-sm fw-medium transition-all"  for="level_${item.levels_id}">
                            <i class="fa-solid fa-layer-group me-1 small"></i> ${item.height_levels} m.
                        </label>
                    </div>
                `;
            });
            html = `<div class="d-flex flex-wrap align-items-center">${html}</div>`;
        } else {
            html = `<div class="alert alert-danger" role="alert">${langData['no_data_found'] || 'No levels found for this mast.'}</div>`;
        }
        $(".height_limit").html(currentLimit); 
        $(".current_limit_display").html(currentLimit);
        $container.html(html);
    } catch (error) {
        $container.html(`<div class="alert alert-danger" role="alert">${langData['cannot_load'] || 'Connection error.'}</div>`);
    }
}
$(document).on('change', '.level-checkbox', function() {
    let selectedCount = $('.level-checkbox:checked').length;
    if (selectedCount > currentLimit) {
        $(this).prop('checked', false);
        let warningMsg = (langData['max_selection_reached'] || 'You can select a maximum of {count} height levels') + " " + currentLimit;
        warningMsg = warningMsg.replace('{count}', currentLimit);
        showError(warningMsg);
    }
});
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
        <div class="container-fluid mt-3 mb-3">
            <div class="report-section">
                <h6 class="report-title"><i class="fa-solid fa-cloud-meatball me-2"></i><span data-i18n="weather_overview"></span></h6>
                <div class="row g-2 mt-2" id="weatherContainer"></div>
            </div>
        </div>
        <div class="container-fluid mt-3 mb-3">
            <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div class="card-body p-3 p-lg-3">
                    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                        <div class="d-flex align-items-center gap-3">
                            <div class="bg-primary bg-opacity-10 p-3 rounded-circle text-primary shadow-sm d-flex align-items-center justify-content-center" style="width: 56px; height: 56px;">
                                <i class="fas fa-broadcast-tower fs-4"></i>
                            </div>
                            <div>
                                <h4 class="fw-bold mb-1 text-dark">
                                    <span id="installations_name"></span>
                                    <small class="text-muted fw-light ms-1">#<span id="code"></span></small>
                                </h4>
                                <div class="d-inline-flex align-items-center bg-light border border-light-subtle rounded-pill px-3 py-1 shadow-sm">
                                    <i class="fa-solid fa-circle me-2 status_color small"></i>
                                    <span id="status_name" class="fw-bold opacity-75"></span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <hr class="text-muted opacity-25 mb-4">
                    <div class="row row-cols-1 row-cols-sm-2 row-cols-xl-4 g-4">
                        <div class="col">
                            <div class="d-flex align-items-start gap-3 p-2 rounded-3 hover-bg-light transition">
                                <div class="text-primary opacity-50"><i class="fa-solid fa-diagram-project fs-4"></i></div>
                                <div>
                                    <label class="d-block text-muted small fw-bold text-uppercase mb-1" data-i18n="project"></label>
                                    <span id="project" class="text-dark fw-semibold"></span> 
                                </div>
                            </div>
                        </div>
                        <div class="col">
                            <div class="d-flex align-items-start gap-3 p-2 rounded-3 hover-bg-light transition">
                                <div class="text-info opacity-50"><i class="fas fa-arrows-alt-v fs-4"></i></div>
                                <div>
                                    <label class="d-block text-muted small fw-bold text-uppercase mb-1" data-i18n="level"></label>
                                    <span id="height" class="text-dark fw-semibold"></span>
                                </div>
                            </div>
                        </div>
                        <div class="col">
                            <div class="d-flex align-items-start gap-3 p-2 rounded-3 hover-bg-light transition">
                                <div class="text-success opacity-50"><i class="fas fa-map-marker-alt fs-4"></i></div>
                                <div>
                                    <label class="d-block text-muted small fw-bold text-uppercase mb-1" data-i18n="location"></label>
                                    <span id="location" class="text-dark fw-semibold d-block text-truncate" style="max-width: 180px;"></span>
                                </div>
                            </div>
                        </div>
                        <div class="col">
                            <div class="d-flex align-items-start gap-3 p-2 rounded-3 hover-bg-light transition">
                                <div class="text-warning opacity-50"><i class="fa-regular fa-calendar fs-4"></i></div>
                                <div>
                                    <label class="d-block text-muted small fw-bold text-uppercase mb-1" data-i18n="monitoring_period"></label>
                                    <div class="d-flex align-items-center gap-2">
                                        <span id="period" class="text-dark fw-semibold small"></span>
                                        <span class="badge rounded-pill bg-primary-subtle text-primary border border-primary-subtle fw-bold">
                                            <span id="total_days"></span> <span data-i18n="days"></span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="bg-dark bg-opacity-10 px-4 py-2 border-top border-light-subtle">
                    <div class="d-flex align-items-center text-secondary small">
                        <i class="fa-solid fa-circle-info me-2"></i>
                        <span class="fw-bold me-1" data-i18n="report_remark"></span>
                    </div>
                </div>
            </div>
        </div>
        <div class="container-fluid mt-3 mb-3">
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
            sensors_data = data.s.split(',').map(v => parseInt(v, 10));
        } else {
            sensors_data = [];
        }
        if (data.lv) {
            levels_data = data.lv.split(',').filter(v => v !== '').map(Number);
        } else {
            levels_data = [];
        }
        if (typeof generateReport === "function") {
            reportState.poles_id = poles_id;
            reportState.startDate = startDate;
            reportState.endDate = endDate;
            reportState.height_id = height_id;
            reportState.sensors_data = sensors_data;
            reportState.levels_data = levels_data;
            generateReport();
        }
    });
}