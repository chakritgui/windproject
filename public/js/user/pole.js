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
$(document).ready(function () {
    generateReport();
});
function generateReport() {
    const selectedSensors = [0,1,2,3,4,5];
    generateStats(selectedSensors);
    updateChartVisibility(selectedSensors);
    setTimeout(() => {
        generateCharts(selectedSensors);
    }, 300);
}
function generateStats(selectedSensors) {
    const statsContainer = document.getElementById('statsContainer');
    statsContainer.innerHTML = '';
    selectedSensors.forEach(idx => {
        const sensor = sensors[idx];
        if (!sensor) return;
        const value = mockData[sensor.key]?.[0] ?? '-';
        const icon = sensorIcons[sensor.key] ?? 'fa-chart-line';
        const col = document.createElement('div');
        col.className = 'col-md-2';
        col.innerHTML = `
            <div class="stat-card position-relative" style="background: linear-gradient(135deg,
                ${sensor.color.replace('rgb','rgba').replace(')',',0.9)')},
                ${sensor.color.replace('rgb','rgba').replace(')',',0.6)')});
            ">
                <i class="fas ${icon} stat-icon"></i>
                <h6 class="stat-label">${sensor.name} ${(sensor.unit) ? `(${langData[sensor.unit] || sensor.unit})` : ``}</h6>
                <div class="stat-value">${value}</div>
            </div>
        `;
        statsContainer.appendChild(col);
    });
}
const mockData = {
    WS: [6.5,7.2,8.1,9.5,10.2,9.8,8.5],
    WD: [0,45,90,135,180,225,270,315],
    AD: [1.18,1.17,1.16,1.15],
    SP: [1008,1006,1005,1007],
    RH: [40,42,38,36],
    TI: [0.08,0.1,0.12,0.09]
};
const charts = {};
function generateCharts(selectedSensors) {
    const keys = selectedSensors.map(i => sensors[i]?.key);
    if (keys.includes('WS')) {
        const ws = sensors.find(s => s.key === 'WS');
        renderLineChart(ws);
        renderAreaChart(ws);
        renderHistogram(ws);
    }
    if (keys.includes('WD')) {
        renderWindRose();
    }
    const weatherKeys = keys.filter(k => ['AD','SP','RH'].includes(k));
    if (weatherKeys.length >= 2) {
        renderWeatherOverview(weatherKeys);
    }
    if (keys.includes('AD') || keys.includes('TI')) {
        renderAirChart();
    }
}
function renderLineChart(sensor) {
    const ctx = document.getElementById('lineChart');
    if (!ctx) return;
    charts.lineChart?.destroy();
    charts.lineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['00','04','08','12','16','20'],
            datasets: [{
                label: sensor.name,
                data: mockData[sensor.key],
                borderColor: sensor.color,
                backgroundColor: sensor.color.replace('rgb','rgba').replace(')',',0.2)'),
                tension: 0.4,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}
function renderWindRose() {
    const ctx = document.getElementById('radarChart');
    if (!ctx) return;
    charts.radarChart?.destroy();
    charts.radarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['N','NE','E','SE','S','SW','W','NW'],
            datasets: [{
                label: 'Wind Direction',
                data: [8,12,15,10,7,9,14,11],
                backgroundColor: 'rgba(54,162,235,0.3)',
                borderColor: 'rgb(54,162,235)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}
function renderHistogram(sensor) {
    const ctx = document.getElementById('barChart');
    if (!ctx) return;
    charts.barChart?.destroy();
    charts.barChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['0–2','2–4','4–6','6–8','8–10','10+'],
            datasets: [{
                label: sensor.name,
                data: [2,5,12,18,9,4],
                backgroundColor: sensor.color.replace('rgb','rgba').replace(')',',0.6)')
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}
function renderWeatherOverview(keys) {
    const ctx = document.getElementById('weatherChart');
    if (!ctx) return;
    charts.weatherChart?.destroy();
    charts.weatherChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['00','06','12','18'],
            datasets: keys.map(k => {
                const s = sensors.find(x => x.key === k);
                return {
                    label: s.name,
                    data: mockData[k],
                    borderColor: s.color,
                    tension: 0.3
                };
            })
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}
function renderAreaChart(sensor) {
    const ctx = document.getElementById('areaChart');
    if (!ctx) return;
    charts.areaChart?.destroy();
    charts.areaChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['00','04','08','12','16','20'],
            datasets: [{
                label: sensor.name + ' (Area)',
                data: mockData[sensor.key],
                borderColor: sensor.color,
                backgroundColor: sensor.color.replace('rgb','rgba').replace(')',',0.35)'),
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}
function renderAirChart() {
    const ctx = document.getElementById('airChart');
    if (!ctx) return;
    charts.airChart?.destroy();
    charts.airChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['00','06','12','18'],
            datasets: [{
                label: 'Air Density (kg/m³)',
                data: mockData.AD,
                borderColor: sensors.find(s => s.key === 'AD').color,
                tension: 0.3
            },{
                label: 'Turbulence Intensity',
                data: mockData.TI,
                borderColor: sensors.find(s => s.key === 'TI').color,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
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