const sensors = [{
    key: 'WS',
    name: 'Wind Speed',
    unit: 'm/s',
    color: 'rgb(75,192,192)'
},{
    key: 'WD',
    name: 'Wind Direction',
    unit: 'degree',
    color: 'rgb(54,162,235)'
},{
    key: 'AD',
    name: 'Air Density',
    unit: 'kg/m³',
    color: 'rgb(255,159,64)'
},{
    key: 'SP',
    name: 'Surface Pressure',
    unit: 'hPa',
    color: 'rgb(153,102,255)'
},{
    key: 'RH',
    name: 'Relative Humidity',
    unit: '%',
    color: 'rgb(255,205,86)'
},{
    key: 'TI',
    name: 'Turbulence Intensity',
    unit: '',
    color: 'rgb(231,76,60)'
}];
const sensorIcons = {
    WS: 'fa-wind',
    WD: 'fa-compass',
    AD: 'fa-cloud',
    SP: 'fa-tachometer-alt',
    RH: 'fa-tint',
    TI: 'fa-bolt'
};
let poles_id = '';
let startDate = '';
let endDate = '';
let height_id = '';
let sensors_data = [];
const chartDefaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: true,
            position: 'top',
            labels: { usePointStyle: true, padding: 20, font: { size: 12 } }
        },
        tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            cornerRadius: 8,
            bodySpacing: 4,
            usePointStyle: true
        }
    },
    scales: {
        x: {
            grid: { display: false },
            ticks: { font: { size: 11 } }
        },
        y: {
            beginAtZero: true,
            grid: { color: 'rgba(200, 200, 200, 0.2)', drawBorder: false },
            ticks: { font: { size: 11 }, padding: 8 }
        }
    },
    elements: {
        point: { radius: 2, hoverRadius: 5, hitRadius: 10 },
        line: { borderWidth: 2.5 }
    }
};
$(document).ready(function () {
    poles_id  = $('#poles_id').val() || '';
    startDate = $('#start').val() || '';
    endDate   = $('#end').val() || '';
    height_id = $('#height_id').val() || '';
    const sensorsVal = $('#sensors').val();
    sensors_data = sensorsVal
        ? sensorsVal
            .split(',')
            .map(v => parseInt(v, 10) - 1)
            .filter(v => v >= 0) 
        : [];
    generateReport();
});
function generateReport() {
    let selectedSensors = sensors_data && sensors_data.length
        ? sensors_data.map(v => parseInt(v, 10))
        : [];
    selectedSensors = selectedSensors.filter(Number.isInteger);
    generateStats(selectedSensors);
    updateChartVisibility(selectedSensors);
    requestAnimationFrame(() => {
        generateCharts(selectedSensors);
    });
}
async function generateStats(selectedSensors) {
    const statsContainer = document.getElementById('statsContainer');
    statsContainer.innerHTML = '<div class="spinner-border"></div>';
    const payload = {
        poles_id,
        start: startDate,
        end: endDate,
        height_id,
        sensors: selectedSensors.map(i => sensors[i].key)
    };
    updateHeader(payload);
    const res = await fetch(`${BASE_URL}/api/pole-stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    statsContainer.innerHTML = '';
    selectedSensors.forEach(idx => {
        const sensor = sensors[idx];
        const value = data[sensor.key] ?? '-';
        const icon = sensorIcons[sensor.key];
        const col = document.createElement('div');
        col.className = 'col-lg-2 col-md-3';
        col.innerHTML = `
            <div class="stat-card" style="background:${sensor.color}">
                <i class="fas ${icon} stat-icon"></i>
                <h6>${sensor.name} ${(sensor.unit) ? `(${langData[sensor.unit] || sensor.unit})`  : ``}</h6>
                <div class="stat-value">${value}</div>
            </div>
        `;
        statsContainer.appendChild(col);
    });
}
async function updateHeader(payload) {
    try {
        const res = await fetch(`${BASE_URL}/api/pole-info`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const info = await res.json();
        document.getElementById('period').innerText = `${info.period}`;
        document.getElementById('level').innerText = `${info.level.levels_name}`;
        document.getElementById('location').innerText = `${info.pole.poles_lat}, ${info.pole.poles_lng}`;
        document.getElementById('project').innerText = `${info.pole.project_name}`;
        document.getElementById('code').innerText = `${info.pole.poles_code}`;
        document.getElementById('installations_name').innerText = `${info.pole.installations_name}`;
        document.getElementById('total_days').innerText = `${info.total_days}`;
    } catch (error) {
        console.error("Header fetch error:", error);
    }
}
async function fetchPoleStats(payload) {
    try {
        const res = await fetch(`${BASE_URL}/api/pole-val`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return await res.json();
    } catch (error) {
        console.error("Fetch error:", error);
        return null;
    }
}
const charts  = [];
async function generateCharts(selectedSensors) {
    const payload = {
        poles_id,
        start: startDate,
        end: endDate,
        height_id,
        sensors: selectedSensors.map(i => sensors[i].key)
    };
    const realData = await fetchPoleStats(payload); 
    if (!realData || realData.length === 0) return;
    const labels = realData.map(d => d.time_label);
    const keys = payload.sensors;
    updateChartVisibility(selectedSensors);
    if (keys.includes('WS')) {
        const wsSensor = sensors.find(s => s.key === 'WS');
        const wsValues = realData.map(d => d.WS);
        renderLineChart(wsSensor, labels, wsValues);
        renderAreaChart(wsSensor, labels, wsValues);
        renderHistogram(wsSensor, wsValues);
    }
    if (keys.includes('WD')) {
        const wdValues = realData.map(d => d.WD);
        renderWindRose(wdValues);
    }
    const weatherKeys = keys.filter(k => ['AD','SP','RH'].includes(k));
    if (weatherKeys.length >= 1) {
        renderWeatherOverview(weatherKeys, labels, realData);
    }
    if (keys.includes('AD') || keys.includes('TI')) {
        renderAirChart(labels, realData);
    }
}
function renderLineChart(sensor, labels, values) {
    const ctx = document.getElementById('lineChart').getContext('2d');
    if (!ctx) return;
    charts.lineChart?.destroy();
    charts.lineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: sensor.name,
                data: values,
                borderColor: sensor.color,
                backgroundColor: 'transparent',
                tension: 0.4,
                pointBackgroundColor: sensor.color,
                borderCapStyle: 'round'
            }]
        },
        options: chartDefaultOptions
    });
}
function renderAreaChart(sensor, labels, values) {
    const ctx = document.getElementById('areaChart');
    if (!ctx) return;
    charts.areaChart?.destroy();
    charts.areaChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: sensor.name + ' (Area)',
                data: values,
                borderColor: sensor.color,
                backgroundColor: sensor.color.replace('rgb','rgba').replace(')',',0.35)'),
                tension: 0.4,
                fill: true
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}
function renderHistogram(sensor, values) {
    const ctx = document.getElementById('barChart');
    if (!ctx) return;
    const bins = [0, 2, 4, 6, 8, 10];
    const binCounts = new Array(bins.length).fill(0);
    values.forEach(v => {
        const val = parseFloat(v);
        if (val >= 10) binCounts[5]++;
        else if (val >= 8) binCounts[4]++;
        else if (val >= 6) binCounts[3]++;
        else if (val >= 4) binCounts[2]++;
        else if (val >= 2) binCounts[1]++;
        else binCounts[0]++;
    });
    charts.barChart?.destroy();
    charts.barChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['0–2','2–4','4–6','6–8','8–10','10+'],
            datasets: [{
                label: sensor.name + ' Frequency',
                data: binCounts,
                backgroundColor: sensor.color.replace('rgb','rgba').replace(')',',0.6)')
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}
function renderWindRose(wdValues) {
    const ctx = document.getElementById('radarChart');
    if (!ctx) return;
    const directions = new Array(8).fill(0);
    wdValues.forEach(v => {
        const deg = parseFloat(v);
        const index = Math.round(deg / 45) % 8;
        directions[index]++;
    });
    charts.radarChart?.destroy();
    charts.radarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['N','NE','E','SE','S','SW','W','NW'],
            datasets: [{
                label: 'Wind Direction Count',
                data: directions,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgb(54, 162, 235)',
                pointBackgroundColor: 'rgb(54, 162, 235)',
                borderWidth: 2
            }]
        },
        options: {
            ...chartDefaultOptions,
            scales: {
                r: {
                    angleLines: { color: 'rgba(200, 200, 200, 0.3)' },
                    grid: { color: 'rgba(200, 200, 200, 0.3)' },
                    suggestedMin: 0,
                    ticks: { display: false }
                }
            }
        }
    });
}
function renderWeatherOverview(keys, labels, realData) {
    const ctx = document.getElementById('weatherChart');
    if (!ctx) return;
    charts.weatherChart?.destroy();
    charts.weatherChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: keys.map(k => {
                const s = sensors.find(x => x.key === k);
                return {
                    label: s.name,
                    data: realData.map(d => d[k]),
                    borderColor: s.color,
                    tension: 0.3
                };
            })
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}
function renderAirChart(labels, realData) {
    const ctx = document.getElementById('airChart');
    if (!ctx) return;
    charts.airChart?.destroy();
    charts.airChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Air Density (kg/m³)',
                data: realData.map(d => d.AD),
                borderColor: sensors.find(s => s.key === 'AD').color,
                tension: 0.3
            },{
                label: 'Turbulence Intensity',
                data: realData.map(d => d.TI),
                borderColor: sensors.find(s => s.key === 'TI').color,
                tension: 0.3
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}
function updateChartVisibility(selectedSensors) {
    document.querySelectorAll('.chart-box').forEach(el => {
        el.style.display = 'none';
    });
    const keys = selectedSensors.map(i => sensors[i].key);
    if (keys.includes('WS')) {
        showChart('wind-speed');
        showChart('wind-speed-area');
        showChart('wind-speed-hist');
    }
    if (keys.includes('WD')) {
        showChart('wind-direction');
    }
    if (keys.some(k => ['AD','SP','RH','TI'].includes(k))) {
        showChart('weather');
    }
    if (keys.includes('AD') || keys.includes('TI')) {
        showChart('air');
    }
}
function showChart(name) {
    const el = document.querySelector(`[data-chart="${name}"]`);
    if (el) el.style.display = 'block';
}
$(document).on('click', '.close-page', function(e) {
    e.preventDefault();
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.close();
        setTimeout(function() {
            window.location.href = `${BASE_URL}/`;
        }, 500);
    }
});
$(document).on('click', '.open-poles', async function(e) {
    e.preventDefault();
    let poles_id = $(this).data("id");
    if(!poles_id) return;
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
            </div>
            <div class="filter-card" id="filterCard">
                <div class="filter-toggle" id="filterToggle">
                    <h5 class="mb-0"><i class="fas fa-filter me-2"></i><span data-i18n="filter"></h5>
                </div>
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
                                <i class="fas fa-arrows-alt-v me-2"></i><span data-i18n="height"></span>
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
                        <div class="col-md-6 col-lg-4">
                            <div class="sensor-checkbox">
                                <input type="checkbox" class="form-check-input me-3" id="sensor1" checked>
                                <label class="form-check-label" for="sensor1">
                                    <i class="fas fa-wind text-primary me-2"></i><span data-i18n="wind_speed"></span> (m/s)
                                </label>
                            </div>
                        </div>
                        <div class="col-md-6 col-lg-4">
                            <div class="sensor-checkbox">
                                <input type="checkbox" class="form-check-input me-3" id="sensor2" checked>
                                <label class="form-check-label" for="sensor2">
                                    <i class="fas fa-compass text-success me-2"></i><span data-i18n="wind_direction"></span> (<span data-i18n="degree"></span>)
                                </label>
                            </div>
                        </div>
                        <div class="col-md-6 col-lg-4">
                            <div class="sensor-checkbox">
                                <input type="checkbox" class="form-check-input me-3" id="sensor3">
                                <label class="form-check-label" for="sensor3">
                                    <i class="fas fa-weight text-info me-2"></i><span data-i18n="air_density"></span> (kg/m³)
                                </label>
                            </div>
                        </div>
                        <div class="col-md-6 col-lg-4">
                            <div class="sensor-checkbox">
                                <input type="checkbox" class="form-check-input me-3" id="sensor4">
                                <label class="form-check-label" for="sensor4">
                                    <i class="fas fa-tachometer-alt text-warning me-2"></i><span data-i18n="surface_pressure"></span> (hPa)
                                </label>
                            </div>
                        </div>
                        <div class="col-md-6 col-lg-4">
                            <div class="sensor-checkbox">
                                <input type="checkbox" class="form-check-input me-3" id="sensor5">
                                <label class="form-check-label" for="sensor5">
                                    <i class="fas fa-tint text-primary me-2"></i><span data-i18n="relative_humidity"></span> (%)
                                </label>
                            </div>
                        </div>
                        <div class="col-md-6 col-lg-4">
                            <div class="sensor-checkbox">
                                <input type="checkbox" class="form-check-input me-3" id="sensor6">
                                <label class="form-check-label" for="sensor6">
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
        $('.modal-footer').html(`
            <button class="btn btn-primary py-2" onclick="renderReport(${poles_id})">
                <i class="fas fa-chart-line me-2"></i><span data-i18n="report"></span>
            </button>
        `);
        $('.sensor-checkbox input[type="checkbox"]').prop('checked', false);
        sensors_data.forEach(index => {
            let sensorId = index + 1;
            $(`#sensor${sensorId}`).prop('checked', true);
        });
        if (data.levels_name && data.levels_id) {
            const newOption = new Option(data.levels_name, data.levels_id, true, true);
            $('#heightSelect').append(newOption).trigger('change');
        }
    } catch (err) {
        $('#poleModalBody').html('<div class="alert alert-danger">Cannot load data. Please try again.</div>');
    }
});
function renderReport(poles_id) {
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
        const message = (sensors.length === 0 && errors.length === 1)
            ? (langData['select_sensor_message'] || 'Please select at least one sensor.')
            : (langData['required_star_message'] || 'Please fill all fields marked with *');
        showWarning(langData['validation_error'] || 'Validation Error', message);
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
    const reportUrl = `${BASE_URL}/pole/${encodedData}`;
    window.location.href = reportUrl;
}