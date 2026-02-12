const sensors = [{
    key: 'WS',
    name: 'Wind Speed',
    lang: 'wind_speed',
    unit: 'm/s',
    color: 'rgb(75,192,192)'
},{
    key: 'WD',
    name: 'Wind Direction',
    lang: 'wind_direction',
    unit: 'degree',
    color: 'rgb(54,162,235)'
},{
    key: 'AD',
    name: 'Air Density',
    lang: 'air_density',
    unit: 'kg/m³',
    color: 'rgb(255,159,64)'
},{
    key: 'SP',
    name: 'Surface Pressure',
    lang: 'surface_pressure',
    unit: 'hPa',
    color: 'rgb(153,102,255)'
},{
    key: 'RH',
    name: 'Relative Humidity',
    lang: 'relative_humidity',
    unit: '%',
    color: 'rgb(255,205,86)'
},{
    key: 'TI',
    name: 'Turbulence Intensity',
    lang: 'turbulence_intensity',
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
    sensors_data = sensorsVal ? sensorsVal.split(',').map(v => parseInt(v, 10) - 1).filter(v => v >= 0)  : [];
    generateReport();
});
function generateReport() {
    let selectedSensors = sensors_data && sensors_data.length ? sensors_data.map(v => parseInt(v, 10)) : [];
    if(selectedSensors.length > 0) {
        selectedSensors = selectedSensors.filter(Number.isInteger);
        generateStats(selectedSensors);
        updateChartVisibility(selectedSensors);
        requestAnimationFrame(() => {
            generateCharts(selectedSensors);
        });
    }
}
async function generateStats(selectedSensors) {
    const statsContainer = document.getElementById('statsContainer');
    const weatherContainer = document.getElementById('weatherContainer');
    statsContainer.innerHTML = '<div class="spinner-border text-primary"></div>';
    weatherContainer.innerHTML = '';
    const payload = {
        poles_id,
        start: startDate, 
        end: endDate,
        height_id,
        sensors: selectedSensors.map(i => sensors[i].key)
    };
    updateHeader(payload);
    try {
        const res = await fetch(`${BASE_URL}/api/pole-stats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        const lat = data.lat; 
        const lon = data.lng; 
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&air_quality=pm2_5&timezone=Asia%2FBangkok`;
        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();
        statsContainer.innerHTML = '';
        weatherContainer.innerHTML = '';
        selectedSensors.forEach(idx => {
            const sensor = sensors[idx];
            const value = data[sensor.key] ?? '-';
            const icon = sensorIcons[sensor.key];
            renderCard(statsContainer, 'col-lg-2 col-md-4 col-6', sensor.color, icon, (langData[sensor.lang] || sensor.name), value, (langData[sensor.unit] || sensor.unit), false);
        });
        if (weatherData.current) {
            const cur = weatherData.current;
            const air = weatherData.air_quality || {};
            const weatherItems = [
                { name: 'temp',  val: cur.temperature_2m.toFixed(1), unit: '°C', icon: 'fa-thermometer-half', grad: 'linear-gradient(135deg, #FF512F, #DD2476)', ani: 'ani-temp' },
                { name: 'humid', val: cur.relative_humidity_2m.toFixed(0), unit: '%', icon: 'fa-tint', grad: 'linear-gradient(135deg, #2193b0, #6dd5ed)', ani: 'ani-rain' },
                { name: 'wind',  val: cur.wind_speed_10m.toFixed(1), unit: 'km/h', icon: 'fa-wind', grad: 'linear-gradient(135deg, #11998e, #38ef7d)', ani: 'ani-wind' },
                { name: 'pm2.5', val: air.pm2_5 ? air.pm2_5.toFixed(1) : '-', unit: '', icon: 'fa-smog', grad: 'linear-gradient(135deg, #485563, #29323c)', ani: 'ani-temp' },
                { name: 'rain',  val: cur.precipitation.toFixed(1), unit: 'mm', icon: 'fa-cloud-showers-heavy', grad: 'linear-gradient(135deg, #4b6cb7, #182848)', ani: 'ani-rain' }
            ];
            weatherContainer.innerHTML = '';
            weatherItems.forEach(item => {
                const div = document.createElement('div');
                div.className = 'weather-card-rect';
                div.style.background = item.grad;
                div.innerHTML = `
                    <i class="fas ${item.icon} ${item.ani}"></i>
                    <div class="info">
                        <span class="title">${langData[item.name] || item.name}</span>
                        <span class="value">${item.val} <small style="font-size:0.7em">${item.unit}</small></span>
                    </div>
                `;
                weatherContainer.appendChild(div);
            });
        }
    } catch (error) {
        console.error("Generate Stats Error:", error);
        statsContainer.innerHTML = '<div class="alert alert-danger">Error loading data</div>';
    }
    function renderCard(container, colClass, color, icon, title, value, unit, isSmall) {
        const col = document.createElement('div');
        col.className = colClass;
        const cardStyle = `padding: 12px; background: ${color}; border-radius: 10px; min-height: 85px; color: white; position: relative; overflow: hidden;`;
        col.innerHTML = `
            <div class="stat-card" style="${cardStyle}">
                <i class="fas ${icon} stat-icon" style="position: absolute; right: 10px; top: 10px; opacity: 0.3; font-size: 1.5rem;"></i>
                <h6 style="font-size: 0.85rem; margin-bottom: 5px; opacity: 0.9;">${title}</h6>
                <div class="stat-value" style="font-size: 1.5rem; font-weight: bold;">
                    ${value} <small style="font-size: 0.6em; font-weight: normal;">${unit || ''}</small>
                </div>
            </div>
        `;
        container.appendChild(col);
    }
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
    window.close();
    setTimeout(function() {
        window.location.href = `${BASE_URL}/`;
    }, 500);
});
$(document).on('click', '.open-poles', async function(e) {
    e.preventDefault();
    let poles_id = $(this).data("id");
    if(!poles_id) return;
    openFilterModal(poles_id, startDate, endDate, height_id);
});