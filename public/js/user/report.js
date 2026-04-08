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
    $('.fm-sensor-item input:checked').each(function () {
        sensors.push($(this).attr('id').replace('sensor', ''));
    });
    if (sensors.length === 0) {
        $('.fm-sensor-item').addClass('border-danger');
        errors.push('sensors');
    } else {
        $('.fm-sensor-item').removeClass('border-danger');
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
    $('#poleModalBody').html(`
        <div style="padding:20px;display:flex;flex-direction:column;gap:12px;">
            <div class="fm-skel" style="height:110px;border-radius:16px;"></div>
            <div class="fm-skel" style="height:180px;border-radius:16px;"></div>
            <div class="fm-skel" style="height:140px;border-radius:16px;"></div>
        </div>
    `);
    try {
        const response = await fetch(`${BASE_URL}/api/poles.info`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: poles_id, start: startDate, end: endDate, height: height_id })
        });
        const data = await response.json();
        const chip = (iconClass, color, labelKey, value) => `
            <div class="fm-chip">
                <div class="fm-chip-icon" style="color:${color};">
                    <i class="${iconClass}"></i>
                </div>
                <div>
                    <div class="fm-chip-label" data-i18n="${labelKey}"></div>
                    <div class="fm-chip-value">${value}</div>
                </div>
            </div>`;
        const sensor = (id, iconClass, color, labelKey, unit) => `
            <div class="col-md-6 col-lg-6">
                <label class="fm-sensor-item" for="sensor${id}">
                    <input type="checkbox" class="fm-sensor-check" id="sensor${id}" autocomplete="off">
                    <div class="fm-sensor-icon" style="background:${color}18;border-color:${color}30;">
                        <i class="${iconClass}" style="color:${color};font-size:15px;"></i>
                    </div>
                    <div class="fm-sensor-text">
                        <span data-i18n="${labelKey}"></span>
                        <span class="fm-sensor-unit">${unit}</span>
                    </div>
                    <div class="fm-sensor-check-indicator">
                        <i class="fa-solid fa-check" style="font-size:10px;"></i>
                    </div>
                </label>
            </div>`;
        const html = `
        <div class="fm-wrap">
            <div class="fm-info-card">
                <div class="fm-info-header">
                    <div class="poles-avatar">
                        <i class="fas fa-broadcast-tower"></i>
                    </div>
                    <div>
                        <div class="poles-name">
                            ${data.installations_name}
                            <span class="poles-code">#${data.poles_code}</span>
                        </div>
                    </div>
                </div>
                <div class="fm-chips">
                    ${chip('fa-solid fa-diagram-project', '#2d7fc1', 'project',           data.project_name)}
                    ${chip('fa-solid fa-arrows-alt-v',    '#0891b2', 'level',             data.height_name)}
                    ${chip('fa-solid fa-map-marker-alt',  '#059669', 'location',          `${data.poles_lat}, ${data.poles_lng}`)}
                    ${chip('fa-regular fa-calendar',      '#d97706', 'monitoring_period', `${data.start_date} – ${data.end_date}`)}
                </div>
                <div class="fm-remark">
                    <i class="fa-solid fa-circle-info"></i>
                    <span data-i18n="report_remark"></span>
                </div>
            </div>
            <div class="fm-filter-card" id="filterCard">
                <div class="fm-section-title">
                    <i class="fa-solid fa-sliders"></i>
                    <span data-i18n="filter"></span>
                </div>
                <div class="row g-3 mb-0" id="filterContent">
                    <div class="col-md-4">
                        <label class="fm-label">
                            <i class="fas fa-calendar-day"></i>
                            <span data-i18n="startDate"></span>
                        </label>
                        <input type="text" class="fm-input obj-required" id="startDate" value="${data.min_datetime}" autocomplete="off">
                    </div>
                    <div class="col-md-4">
                        <label class="fm-label">
                            <i class="fas fa-calendar-day"></i>
                            <span data-i18n="endDate"></span>
                        </label>
                        <input type="text" class="fm-input obj-required" id="endDate" value="${data.max_datetime}" autocomplete="off">
                    </div>
                    <div class="col-md-4">
                        <label class="fm-label">
                            <i class="fa-solid fa-signal"></i>
                            <span data-i18n="level"></span>
                        </label>
                        <select class="fm-select obj-required" id="heightSelect"></select>
                    </div>
                </div>
                <div class="mt-4">
                    <label class="fm-label mb-2">
                        <i class="fa-solid fa-up-down"></i>
                        <span data-i18n="height_level"></span>
                    </label>
                    <div class="fm-limit-warn mb-2">
                        <i class="fa-solid fa-triangle-exclamation" style="font-size:12px;"></i>
                        <span data-i18n="max_selection_reached"></span>
                        <strong class="height_limit"></strong>
                        <span data-i18n="height_level"></span>
                    </div>
                    <div class="levelBody fm-level-body"></div>
                </div>
                <div class="mt-4">
                    <label class="fm-label mb-3">
                        <i class="fas fa-satellite-dish"></i>
                        <span data-i18n="sensor"></span>
                    </label>
                    <div class="row g-2">
                        ${sensor(1, 'fa-solid fa-wind',             '#00b8d9', 'wind_speed',          '(m/s)')}
                        ${sensor(2, 'fa-solid fa-compass',          '#54a0ff', 'wind_direction',      '(°)')}
                        ${sensor(3, 'fa-solid fa-smog',             '#8395a7', 'air_density',         '(kg/m³)')}
                        ${sensor(4, 'fa-solid fa-gauge-high',       '#a29bfe', 'surface_pressure',    '(hPa)')}
                        ${sensor(5, 'fa-solid fa-droplet',          '#48dbfb', 'relative_humidity',   '(%)')}
                        ${sensor(6, 'fa-solid fa-temperature-half', '#ff6b6b', 'temperature',         '(°C)')}
                        ${sensor(7, 'fa-solid fa-tornado',          '#ee5253', 'turbulence_intensity', '(%)')}
                    </div>
                </div>
            </div>
        </div>`;
        $('#poleModalBody').html(html);
        if (sensors_data && sensors_data.length > 0) {
            $('input[id^="sensor"]').prop('checked', false);
            sensors_data.forEach(sId => $(`#sensor${sId}`).prop('checked', true));
        } else {
            $('#sensor1, #sensor2').prop('checked', true);
        }
        $('input[id^="sensor"]').each(function () { syncSensorItem(this); });
        $(document).on('change', 'input[id^="sensor"]', function () { syncSensorItem(this); });
        $('#poleModalLabel').html(`
            <span class="project-status">
                <i class="fa-solid fa-circle-dot status-pulse me-2" style="color:${data.project_status_color || '#ccc'}; font-size: 0.8em;"></i>
                <span class="fw-bold" style="font-size: 0.9rem; color: #444;">
                    ${data.project_status_name || '—'}
                </span>
            </span>
        `);
        let minVal = data.min_datetime_val ? new Date(data.min_datetime_val) : null;
        let maxVal = data.max_datetime_val ? new Date(data.max_datetime_val) : null;
        initDatePicker('#startDate', minVal, maxVal);
        initDatePicker('#endDate', minVal, maxVal);
        $('#startDate, #endDate').on('blur', function () {
            const $input = $(this);
            let val = $input.val();
            if (!val) return;
            let parts = val.split('/');
            let selectedDate = new Date(parts[2], parts[1] - 1, parts[0]);
            if (isNaN(selectedDate.getTime()) || parts.length !== 3) { $input.val(''); return; }
            if (minVal && selectedDate < minVal) selectedDate = new Date(minVal);
            else if (maxVal && selectedDate > maxVal) selectedDate = new Date(maxVal);
            const sv = $('#startDate').val().split('/');
            const ev = $('#endDate').val().split('/');
            let sd = new Date(sv[2], sv[1]-1, sv[0]);
            let ed = new Date(ev[2], ev[1]-1, ev[0]);
            if (!isNaN(sd.getTime()) && !isNaN(ed.getTime()) && sd > ed) {
                selectedDate = ($input.attr('id') === 'startDate') ? ed : sd;
            }
            $input.val(formatThaiDate(selectedDate));
        });
        function formatThaiDate(date) {
            return ('0'+date.getDate()).slice(-2)+'/'+('0'+(date.getMonth()+1)).slice(-2)+'/'+date.getFullYear();
        }
        initSelect2Remote('#heightSelect', `${BASE_URL}/api/level.get`, { poles_id: poles_id });
        $('#poleDetailModal .modal-footer').html(`
            <button class="poles-btn-primary" onclick="renderReport(${poles_id}, '${type}')" data-i18n="generate_report">
                ${langData['generate_report'] || 'Generate Report'}
            </button>
            <button type="button" class="poles-btn-ghost" data-bs-dismiss="modal" data-i18n="close">
                ${langData['close'] || 'Close'}
            </button>
        `);
        if (data.height_name && data.height_id) {
            const newOption = new Option(data.height_name, data.height_id, true, true);
            $('#heightSelect').append(newOption).trigger('change');
        }
        await renderLevel($('#heightSelect').val(), levels_data);
        $('#heightSelect').on('change', function () { renderLevel($(this).val(), []); });
        if (typeof updateText === 'function') updateText($('#poleModalBody')[0]);
    } catch (err) {
        $('#poleModalBody').html(`
            <div style="padding:24px;">
                <div class="fm-error">
                    <i class="fa-solid fa-circle-exclamation"></i>
                    ${langData['cannot_load'] || 'Failed to load data. Please try again later.'}
                </div>
            </div>`);
    }
}
function syncSensorItem(input) {
    const $label = $(input).closest('.fm-sensor-item');
    if ($(input).is(':checked')) {
        $label.addClass('is-checked');
    } else {
        $label.removeClass('is-checked');
    }
}
let currentLimit = 3;
async function renderLevel(height_id, levelsToCheck = []) {
    const $container = $('.levelBody');
    if (!height_id) {
        $container.html(`<div class="fm-alert-warn">${langData['please_choose_height'] || 'Please select height'}</div>`);
        return;
    }
    $container.html(`
        <div class="fm-loading">
            <div class="spinner-border spinner-border-sm" style="color:#2d7fc1;"></div>
            <span data-i18n="loading">${langData['loading'] || 'Loading...'}</span>
        </div>`);
    try {
        const response = await fetch(`${BASE_URL}/api/heght.level`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ height_id })
        });
        if (!response.ok) throw new Error('Network error');
        const result = await response.json();
        const levels = result.levels || [];
        currentLimit = parseInt(result.height_limit) || 3;
        $('.height_limit, .current_limit_display').text(currentLimit);
        if (!levels.length) {
            $container.html(`<div class="fm-alert-warn">${langData['no_data_found'] || 'No levels found.'}</div>`);
            return;
        }
        const items = levels.map((item, index) => {
            let isChecked = levelsToCheck.length > 0
                ? levelsToCheck.some(lv => String(lv) === String(item.levels_id))
                : index < currentLimit;
            return `
                <div class="fm-level-item">
                    <input class="btn-check level-checkbox" type="checkbox" name="levels[]" value="${item.levels_id}" id="level_${item.levels_id}" ${isChecked ? 'checked' : ''} autocomplete="off">
                    <label class="fm-level-btn" for="level_${item.levels_id}">
                        <i class="fa-solid fa-layer-group" style="font-size:11px;"></i>
                        ${item.height_levels} m
                    </label>
                </div>`;
        }).join('');
        $container.html(`<div class="fm-level-grid">${items}</div>`);
    } catch (err) {
        $container.html(`<div class="fm-alert-danger">${langData['cannot_load'] || 'Connection error.'}</div>`);
    }
}
$(document).on('change', '.level-checkbox', function () {
    const selected = $('.level-checkbox:checked').length;
    if (selected > currentLimit) {
        $(this).prop('checked', false);
        const msg = (langData['max_selection_reached'] || 'Max {count} levels').replace('{count}', currentLimit) + ' ' + currentLimit;
        showWarning(msg);
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
    const footerDefault = `Copyright © <img src="${BASE_URL}/public/images/iwind.png" alt="wind" class="footer-logo"> Corporation Limited`;
    const footer_val = getTranslation(footer, lang, footerDefault);
    $modal.find(".modal-footer").html(`
        <div class="d-flex justify-content-center align-items-center w-100">${footer_val}</div>
    `);
    modalBody.html(`
        <div class="container-fluid mt-3 mb-3">
            <div class="report-section">
                <div class="d-flex align-items-center gap-3 mb-3">
                    <div class="bg-primary bg-opacity-10 p-3 rounded-circle text-primary shadow-sm d-flex align-items-center justify-content-center" style="width: 56px; height: 56px; animation: iconFloat 3.5s ease-in-out infinite;">
                        <i class="fa-solid fa-cloud-meatball fs-4"></i>
                    </div>
                    <h4 class="fw-bold mb-1 text-dark" data-i18n="weather_overview"></h4>
                </div>
                <div class="row g-2 mt-2" id="weatherContainer"></div>
            </div>
        </div>
        <div class="container-fluid mt-3 mb-3">
            <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div class="card-body p-3 p-lg-3">
                    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                        <div class="d-flex align-items-center gap-3">
                            <div class="bg-primary bg-opacity-10 p-3 rounded-circle text-primary shadow-sm d-flex align-items-center justify-content-center" style="width: 56px; height: 56px; animation: iconFloat 3.5s ease-in-out infinite;">
                                <i class="fas fa-broadcast-tower fs-4"></i>
                            </div>
                            <div>
                                <h4 class="fw-bold mb-1 text-dark">
                                    <span id="installations_name"></span>
                                    <small class="text-muted fw-light ms-1">#<span id="code"></span></small>
                                </h4>
                                <div class="d-inline-flex align-items-center py-1">
                                    <i class="fa-solid fa-circle-dot me-2 status_color small" style="animation: status-ripple 2s infinite ease-out;"></i>
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
                <div class="d-flex align-items-center gap-3 mb-3">
                    <div class="bg-primary bg-opacity-10 p-3 rounded-circle text-primary shadow-sm d-flex align-items-center justify-content-center" style="width: 56px; height: 56px; animation: iconFloat 3.5s ease-in-out infinite;">
                        <i class="fas fa-chart-bar fs-4"></i>
                    </div>
                    <h4 class="fw-bold mb-1 text-dark" data-i18n="average_summary"></h4>
                </div>
                <div class="row g-2 mt-2" id="statsContainer"></div>
            </div>
            <div class="report-section">
                <div class="d-flex align-items-center gap-3 mb-3">
                    <div class="bg-primary bg-opacity-10 p-3 rounded-circle text-primary shadow-sm d-flex align-items-center justify-content-center" style="width: 56px; height: 56px; animation: iconFloat 3.5s ease-in-out infinite;">
                        <i class="fas fa-chart-line fs-4"></i>
                    </div>
                    <h4 class="fw-bold mb-1 text-dark" data-i18n="visualization"></h4>
                </div>
                <div class="row" id="chartRow">
                    <div class="col-lg-4 mb-4 chart-box p-3" data-chart="wind-speed">
                        <h6 class="text-center" data-i18n="wind_speed"></h6>
                        <div class="chart-container">
                            <canvas id="lineChart"></canvas>
                        </div>
                    </div>
                    <div class="col-lg-4 mb-4 chart-box p-3" data-chart="wind-speed-hist">
                        <h6 class="text-center" data-i18n="wind_speed_distribution"></h6>
                        <div class="chart-container">
                            <canvas id="barChart"></canvas>
                        </div>
                    </div>
                    <div class="col-lg-4 mb-4 chart-box p-3" data-chart="wind-direction">
                        <h6 class="text-center" data-i18n="wind_rose"></h6>
                        <div class="chart-container">
                            <canvas id="radarChart"></canvas>
                        </div>
                    </div>
                    <div class="col-lg-4 mb-4 chart-box p-3" data-chart="weather">
                        <h6 class="text-center" data-i18n="weather_overview"></h6>
                        <div class="chart-container">
                            <canvas id="weatherChart"></canvas>
                        </div>
                    </div>
                    <div class="col-lg-4 mb-4 chart-box p-3" data-chart="air">
                        <h6 class="text-center" data-i18n="air_density_turbulence"></h6>
                        <div class="chart-container">
                            <canvas id="airChart"></canvas>
                        </div>
                    </div>
                    <div class="col-lg-4 mb-4 chart-box p-3" data-chart="surface-pressure">
                        <h6 class="text-center" data-i18n="surface_pressure"></h6>
                        <div class="chart-container">
                            <canvas id="pressureChart"></canvas>
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