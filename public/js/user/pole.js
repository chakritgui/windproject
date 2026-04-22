const sensors = [
    { key: '', name: '', lang: '', unit: '', color: '', icon: ''},
    { key: 'WS', name: 'Wind Speed', lang: 'wind_speed', unit: 'm/s', color: '#00d2d3', icon: 'fa-solid fa-wind' },
    { key: 'WD', name: 'Wind Direction', lang: 'wind_direction', unit: 'degree', color: '#54a0ff', icon: 'fa-solid fa-compass' },
    { key: 'AD', name: 'Air Density', lang: 'air_density', unit: 'kg/m³', color: '#8395a7', icon: 'fa-solid fa-smog'},
    { key: 'SP', name: 'Surface Pressure', lang: 'surface_pressure', unit: 'hPa', color: '#a29bfe', icon: 'fa-solid fa-gauge-high' },
    { key: 'RH', name: 'Relative Humidity', lang: 'relative_humidity', unit: '%', color: '#48dbfb', icon: 'fa-solid fa-droplet'},
    { key: 'TE', name: 'Air Temperature', lang: 'temperature', unit: 'degC', color: '#ff6b6b', icon: 'fa-solid fa-temperature-half' },
    { key: 'TU', name: 'Turbulence intensity', lang: 'turbulence_intensity', unit: '%', color: '#ee5253', icon: 'fa-solid fa-tornado'}
];
let charts = {};
let reportState = {
    poles_id: '', startDate: '', endDate: '', height_id: '',
    sensors_data: [], levels_data: []
};
$(document).ready(() => {
    updateStateFromInputs();
    generateReport();
});
function updateStateFromInputs() {
    reportState.poles_id = $('#poles_id').val() || '';
    reportState.startDate = $('#start').val() || '';
    reportState.endDate = $('#end').val() || '';
    reportState.height_id = $('#height_id').val() || '';
    const sVal = $('#sensors').val();
    reportState.sensors_data = sVal ? sVal.split(',').filter(v => v !== '').map(Number) : [];
    const lVal = $('#levels').val();
    reportState.levels_data = lVal ? lVal.split(',').filter(v => v !== '').map(Number) : [];
}
async function generateReport() {
    if (!reportState.sensors_data.length) return;
    toggleLoading(true);
    try {
        await updateHeaderInfo();
        await renderStatsAndWeather();
        const realData = await fetchGraphData();
        if (realData && realData.length > 0) {
            renderAllCharts(realData);
        }
    } catch (err) {
        console.error("Critical Error:", err);
    } finally {
        toggleLoading(false);
    }
}
async function fetchGraphData() {
    const selectedKeys = reportState.sensors_data.map(i => sensors[i].key);
    const payload = {
        ...reportState,
        sensors: selectedKeys,
        lv: reportState.levels_data.join(',')
    };
    try {
        const res = await fetch(`${BASE_URL}/api/poles.val`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return await res.json();
    } catch (e) {
        console.error("Fetch Graph Data Error:", e);
        return null;
    }
}
async function renderStatsAndWeather() {
    const statsContainer = document.getElementById('statsContainer');
    const selectedIdx = reportState.sensors_data;
    const payload = {
        ...reportState,
        sensors: selectedIdx.map(i => sensors[i].key),
        lv: reportState.levels_data.join(',')
    };
    const res = await fetch(`${BASE_URL}/api/poles.stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    statsContainer.innerHTML = '';
    selectedIdx.forEach(idx => {
        const s = sensors[idx];
        const val = data[s.key] ?? '-';
        createStatCard(statsContainer, s, val);
    });
    if (data.lat && data.lng) {
        fetchExternalWeather(data.lat, data.lng);
    }
}
const chartDefaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
        duration: 800,
        easing: 'easeInOutQuart'
    },
    interaction: {
        mode: 'index',
        intersect: false
    },
    plugins: {
        legend: {
            display: false
        },
        tooltip: {
            backgroundColor: 'rgba(255,255,255,0.95)',
            borderColor: 'rgba(0,0,0,0.08)',
            borderWidth: 1,
            titleColor: '#111827',
            bodyColor: '#6b7280',
            padding: 12,
            cornerRadius: 10,
            boxPadding: 5,
            titleFont: { size: 12, weight: '600', family: 'inherit' },
            bodyFont: { size: 12, family: 'inherit' },
            callbacks: {
                labelColor(ctx) {
                    return {
                        borderColor: ctx.dataset.borderColor,
                        backgroundColor: ctx.dataset.borderColor,
                        borderRadius: 3
                    };
                }
            }
        }
    },
    scales: {
        x: {
            grid: {
                display: false
            },
            ticks: {
                color: '#9ca3af',
                font: { size: 11, family: 'inherit' },
                maxRotation: 30
            },
            border: { display: false }
        },
        y: {
            grid: {
                color: 'rgba(0,0,0,0.05)',
                lineWidth: 1
            },
            ticks: {
                color: '#9ca3af',
                font: { size: 11, family: 'inherit' },
                padding: 8
            },
            border: { display: false, dash: [4, 4] }
        }
    },
    elements: {
        line: {
            tension: 0.4,
            borderWidth: 2.5,
            borderCapStyle: 'round',
            borderJoinStyle: 'round'
        },
        point: {
            radius: 0,
            hitRadius: 20,
            hoverRadius: 5,
            hoverBorderWidth: 2,
            hoverBackgroundColor: '#fff'
        },
        bar: {
            borderRadius: 6,
            borderSkipped: 'bottom'
        }
    }
};
function renderAllCharts(realData) {
    if (!realData || realData.length === 0) return;
    const labels = [...new Set(realData.map(d => d.time_label))];
    const distinctLevels = [...new Set(realData.map(d => d.level_name))];
    const selectedKeys = reportState.sensors_data.filter(i => i !== "" && sensors[i]).map(i => sensors[i].key);
    updateChartVisibility(selectedKeys);
    if (selectedKeys.includes('WS')) {
        const wsSensor = sensors.find(s => s.key === 'WS');
        const wsDatasets = distinctLevels.map((lvl, idx) => {
            const color = getLevelColor(idx, wsSensor.color);
            return {
                label: `${lvl}`,
                data: labels.map(t => {
                    const row = realData.find(d => d.time_label === t && d.level_name === lvl);
                    return row ? row.WS : null;
                }),
                borderColor: color,
                backgroundColor: hexToRgba(color, 0.08),
                tension: 0.4,
                fill: idx === 0,
                spanGaps: true
            };
        });
        renderChart('lineChart', 'line', labels, wsDatasets);
        renderHistogram('barChart', wsSensor, realData, distinctLevels);
    }
    if (selectedKeys.includes('WD')) {
        renderWindRose16('radarChart', realData, distinctLevels);
    }
    const weatherKeys = selectedKeys.filter(k => ['TE', 'RH'].includes(k));
    if (weatherKeys.length) {
        let weatherDatasets = [];
        weatherKeys.forEach(k => {
            const s = sensors.find(x => x.key === k);
            const ds = distinctLevels.map((lvl, idx) => {
                const color = getLevelColor(idx, s.color);
                return {
                    label: `${langData[s.lang] || s.name} (${lvl})`,
                    data: labels.map(t => {
                        const row = realData.find(d => d.time_label === t && d.level_name === lvl);
                        return row ? row[k] : null;
                    }),
                    borderColor: color,
                    backgroundColor: hexToRgba(color, 0.07),
                    borderDash: idx > 0 ? [5, 5] : [],
                    tension: 0.4,
                    fill: idx === 0,
                    spanGaps: true
                };
            });
            weatherDatasets = weatherDatasets.concat(ds);
        });
        renderChart('weatherChart', 'line', labels, weatherDatasets);
    }
    const airKeys = ['AD', 'TU'].filter(k => selectedKeys.includes(k));
    if (airKeys.length) {
        let airDatasets = [];
        airKeys.forEach(k => {
            const s = sensors.find(x => x.key === k);
            const ds = distinctLevels.map((lvl, idx) => {
                const color = getLevelColor(idx, s.color);
                return {
                    label: `${langData[s.lang] || s.name} (${lvl})`,
                    data: labels.map(t => {
                        const row = realData.find(d => d.time_label === t && d.level_name === lvl);
                        return row ? row[k] : null;
                    }),
                    borderColor: color,
                    backgroundColor: hexToRgba(color, 0.07),
                    tension: 0.4,
                    fill: idx === 0,
                    spanGaps: true
                };
            });
            airDatasets = airDatasets.concat(ds);
        });
        renderChart('airChart', 'line', labels, airDatasets);
    }
    if (selectedKeys.includes('SP')) {
        const spSensor = sensors.find(s => s.key === 'SP') || { name: 'Surface Pressure', color: '#ff9f40' };
        const spDatasets = distinctLevels.map((lvl, idx) => {
            const color = getLevelColor(idx, spSensor.color);
            return {
                label: `${lvl}`,
                data: labels.map(t => {
                    const row = realData.find(d => d.time_label === t && d.level_name === lvl);
                    return row ? row.SP : null;
                }),
                borderColor: color,
                backgroundColor: hexToRgba(color, 0.07),
                borderDash: idx > 0 ? [5, 5] : [],
                tension: 0.4,
                fill: idx === 0,
                spanGaps: true
            };
        });
        renderChart('pressureChart', 'line', labels, spDatasets, {
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Pressure (hPa)',
                        color: '#9ca3af',
                        font: { size: 11 }
                    }
                }
            }
        });
    }
}
function renderWindRose16(canvasId, realData, distinctLevels) {
    const directions = [
        "N","NNE","NE","ENE","E","ESE","SE","SSE",
        "S","SSW","SW","WSW","W","WNW","NW","NNW"
    ];
    const datasets = distinctLevels.map((lvl, idx) => {
        const counts = new Array(16).fill(0);
        const levelData = realData.filter(d => d.level_name === lvl);
        levelData.forEach(row => {
            const deg = parseFloat(row.WD);
            const speed = parseFloat(row.WS_MAX || 0);
            if (isNaN(deg)) return;
            let dIdx;
            if (deg >= 350 || deg < 10) dIdx = 0;
            else if (deg < 35) dIdx = 1;
            else if (deg < 55) dIdx = 2;
            else if (deg < 80) dIdx = 3;
            else if (deg < 100) dIdx = 4;
            else if (deg < 125) dIdx = 5;
            else if (deg < 145) dIdx = 6;
            else if (deg < 170) dIdx = 7;
            else if (deg < 190) dIdx = 8;
            else if (deg < 215) dIdx = 9;
            else if (deg < 235) dIdx = 10;
            else if (deg < 260) dIdx = 11;
            else if (deg < 280) dIdx = 12;
            else if (deg < 305) dIdx = 13;
            else if (deg < 325) dIdx = 14;
            else dIdx = 15;
            counts[dIdx] += speed;
        });
        const color = getLevelColor(idx, 'rgb(54, 162, 235)');
        return {
            label: `${lvl}`,
            data: counts,
            backgroundColor: hexToRgba(color, 0.2),
            borderColor: color,
            borderWidth: 2,
            fill: true,
            pointRadius: 3,
            pointHoverRadius: 5
        };
    });
    renderChart(canvasId, 'radar', directions, datasets, {
        scales: {
            r: {
                angleLines: { display: true, color: 'rgba(0,0,0,0.06)' },
                grid: { color: 'rgba(0,0,0,0.06)' },
                pointLabels: {
                    font: { size: 11 },
                    color: '#9ca3af'
                },
                suggestedMin: 0,
                ticks: { display: false }
            }
        }
    });
}
function renderHistogram(canvasId, sensor, realData, distinctLevels) {
    const bins = ['0–2', '2–4', '4–6', '6–8', '8–10', '10+'];
    const datasets = distinctLevels.map((lvl, idx) => {
        const counts = new Array(6).fill(0);
        const levelData = realData.filter(d => d.level_name === lvl);
        levelData.forEach(row => {
            const val = parseFloat(row.WS);
            if (val >= 10) counts[5]++;
            else if (val >= 8) counts[4]++;
            else if (val >= 6) counts[3]++;
            else if (val >= 4) counts[2]++;
            else if (val >= 2) counts[1]++;
            else if (val >= 0) counts[0]++;
        });
        const color = getLevelColor(idx, sensor.color);
        return {
            label: `${lvl}`,
            data: counts,
            backgroundColor: hexToRgba(color, 0.65),
            borderColor: color,
            borderWidth: 1.5,
            borderRadius: 6,
            borderSkipped: 'bottom'
        };
    });
    renderChart(canvasId, 'bar', bins, datasets, {
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Frequency (count)',
                    color: '#9ca3af',
                    font: { size: 11 }
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Wind speed range (m/s)',
                    color: '#9ca3af',
                    font: { size: 11 }
                }
            }
        }
    });
}
function renderChart(canvasId, type, labels, datasets, extraOptions = {}) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    if (charts[canvasId]) charts[canvasId].destroy();
    const mergedOptions = deepMerge(chartDefaultOptions, extraOptions);
    charts[canvasId] = new Chart(ctx, {
        type,
        data: { labels, datasets },
        options: mergedOptions
    });
    renderCustomLegend(canvasId, datasets);
}
function renderCustomLegend(canvasId, datasets) {
    const legendId = canvasId + '-legend';
    let legendEl = document.getElementById(legendId);
    if (!legendEl) {
        legendEl = document.createElement('div');
        legendEl.id = legendId;
        legendEl.style.cssText = 'display:flex;flex-wrap:wrap;justify-content:center;gap:8px 16px;margin-bottom:8px;font-size:8px;color:#6b7280;font-family:inherit;';
        const canvas = document.getElementById(canvasId);
        canvas.parentNode.insertBefore(legendEl, canvas);
    }
    legendEl.innerHTML = datasets.map(ds => {
        const color = ds.borderColor || ds.backgroundColor || '#888';
        return `<span style="display:flex;align-items:center;gap:5px;"><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${color};flex-shrink:0;"></span>${ds.label}</span>`;
    }).join('');
}
function deepMerge(base, override) {
    const result = { ...base };
    for (const key of Object.keys(override)) {
        if (
            override[key] !== null &&
            typeof override[key] === 'object' &&
            !Array.isArray(override[key]) &&
            typeof base[key] === 'object' &&
            base[key] !== null
        ) {
            result[key] = deepMerge(base[key], override[key]);
        } else {
            result[key] = override[key];
        }
    }
    return result;
}
function hexToRgba(color, alpha) {
    if (!color) return `rgba(100,100,100,${alpha})`;
    if (color.startsWith('rgba')) {
        return color.replace(/[\d.]+\)$/, `${alpha})`);
    }
    if (color.startsWith('rgb(')) {
        return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
    }
    let hex = color.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}
function getLevelColor(index, baseColor) {
    if (index === 0) return baseColor;
    const colors = ['#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6', '#34495e'];
    return colors[(index - 1) % colors.length];
}
function createStatCard(container, sensor, value) {
    const col = document.createElement('div');
    col.className = 'stat-card-rect';
    col.innerHTML = `
        <div class="stat-card" style="padding:12px; background:${sensor.color}; border-radius:12px; color:white; position:relative; min-height:90px; box-shadow: 0 2px 12px ${hexToRgba(sensor.color, 0.35)};">
            <i class="${sensor.icon}" style="position:absolute; right:10px; top:10px; opacity:0.25; font-size:1.4rem; animation: iconFloat 3.5s ease-in-out infinite;"></i>
            <h6 style="font-size:0.75rem; margin-bottom:5px; opacity:0.85; height:24px;" data-i18n="${sensor.lang}" title="${sensor.name}">
                ${sensor.name}
            </h6>
            <div style="font-size:1.3rem; font-weight:600; letter-spacing:-0.5px;">
                ${value} <small style="font-size:0.6em; font-weight:400; opacity:0.75;">${sensor.unit}</small>
            </div>
        </div>
    `;
    container.appendChild(col);
}
function updateChartVisibility(keys) {
    document.querySelectorAll('.chart-box').forEach(el => el.style.display = 'none');
    const show = (selector) => {
        const el = document.querySelector(`[data-chart="${selector}"]`);
        if (el) el.style.display = 'block';
    };
    if (keys.includes('WS')) {
        show('wind-speed');
        show('wind-speed-hist');
    }
    if (keys.includes('WD')) show('wind-direction');
    if (keys.includes('RH') || keys.includes('TE')) show('weather');
    if (keys.includes('AD') || keys.includes('TU')) show('air');
    if (keys.includes('SP')) show('surface-pressure');
}
function show(name) {
    const el = document.querySelector(`[data-chart="${name}"]`);
    if (el) el.style.display = 'block';
}
function toggleLoading(show) {
    const loader = document.getElementById('statsContainer');
    if (show) loader.innerHTML = '<div class="text-center w-100 p-5"><div class="spinner-border text-blue"></div><p data-i18n="loading"></p></div>';
}
async function updateHeaderInfo() {
    try {
        const res = await fetch(`${BASE_URL}/api/poles.infos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reportState)
        });
        const info = await res.json();
        const mappings = {
            'period': info.period,
            'height': info.height?.height_name,
            'location': `${info.pole?.poles_lat}, ${info.pole?.poles_lng}`,
            'project': info.pole?.project_name,
            'code': info.pole?.poles_code,
            'installations_name': info.pole?.installations_name,
            'total_days': info.total_days,
            'status_name': info.pole?.project_status_name ?? '-',
            'status_color': info.pole?.project_status_color
        };
        for (const [id, val] of Object.entries(mappings)) {
            const el = document.getElementById(id);
            if (!el) continue;
            el.innerText = val || '-';
            if (id === 'status_name') {
                const icon = document.querySelector('.status_color');
                if (icon) {
                    const colorCode = info.pole?.project_status_color;
                    if (colorCode && val && val !== '-') {
                        icon.style.color = colorCode;
                        icon.style.display = 'inline-block';
                    } else if (val === '-') {
                        icon.style.display = 'none';
                    } else {
                        icon.style.color = '#ccc';
                    }
                }
            }
        }
    } catch (e) { console.error("Header Error:", e); }
}
async function fetchExternalWeather(lat, lon) {
    const windUnit = WIND_UNITS[parseInt(localStorage.getItem('windUnit') || '0')];
    const weatherContainer = document.getElementById('weatherContainer');
    const skeletonItems = ['Temp', 'Humid', 'Wind', 'PM2.5', 'Rain'];
    weatherContainer.innerHTML = skeletonItems.map(() => `
        <div class="weather-card-rect skeleton-loading" style="background:#e0e0e0;height:50px;padding:10px;border-radius:8px;margin-bottom:10px;display:flex;align-items:center;gap:10px;">
            <div style="width:30px;height:30px;background:#ccc;border-radius:50%;"></div>
            <div style="flex:1;">
                <div style="width:40%;height:10px;background:#ccc;margin-bottom:5px;"></div>
                <div style="width:70%;height:12px;background:#ccc;"></div>
            </div>
        </div>
    `).join('');
    try {
        const [weatherRes, dbWindRes] = await Promise.allSettled([
            fetch(`${BASE_URL}/api/weather.current?lat=${lat}&lon=${lon}`),
            fetch(`${BASE_URL}/api/weather.wind?station_id=${reportState.poles_id}`)
        ]);
        const data    = weatherRes.status === 'fulfilled' && weatherRes.value.ok ? await weatherRes.value.json() : {};
        const dbWind  = dbWindRes.status  === 'fulfilled' && dbWindRes.value.ok  ? await dbWindRes.value.json()  : null;
        const windVal = dbWind?.wind_speed != null ? (dbWind.wind_speed * windUnit.factor).toFixed(1) : (data.wind_speed  != null ? (data.wind_speed * windUnit.factor).toFixed(1) : '-');
        const items = [
            { name: 'temp',  val: data.temperature ?? '-', unit: '°C', icon: 'fa-thermometer-half', grad: 'linear-gradient(135deg,#FF512F,#DD2476)', ani: 'ani-temp' },
            { name: 'humid', val: data.humidity ?? '-', unit: '%', icon: 'fa-tint', grad: 'linear-gradient(135deg,#2193b0,#6dd5ed)', ani: 'ani-rain' },
            { name: 'wind',  val: windVal, unit: windUnit.label, icon: 'fa-wind', grad: 'linear-gradient(135deg,#11998e,#38ef7d)', ani: 'ani-wind' },
            { name: 'pm2.5', val: data.pm25 ?? '-', unit: 'μg', icon: 'fa-smog', grad: 'linear-gradient(135deg,#485563,#29323c)', ani: 'ani-temp' },
            { name: 'rain',  val: data.precipitation  ?? '-', unit: 'mm', icon: 'fa-cloud-showers-heavy', grad: 'linear-gradient(135deg,#4b6cb7,#182848)', ani: 'ani-rain' },
        ];
        weatherContainer.innerHTML = items.map(item => `
            <div class="weather-card-rect" style="background:${item.grad};padding:10px;border-radius:8px;color:white;display:flex;align-items:center;gap:10px;margin-bottom:10px;animation:fadeIn 0.5s ease-in;">
                <i class="fas ${item.icon} ${item.ani} fa-lg"></i>
                <div class="info">
                    <div style="font-size:0.7rem;opacity:0.8;text-transform:uppercase;" data-i18n="${item.name}"></div>
                    <div style="font-weight:bold;">${item.val} ${item.unit}</div>
                </div>
            </div>
        `).join('');
        if (typeof updateText === 'function') updateText(weatherContainer);
    } catch (e) {
        console.warn('fetchExternalWeather error:', e);
        weatherContainer.innerHTML = '<div style="font-size:0.8rem;color:#ff5e5e;">Connection Error</div>';
    }
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
    openFilterModal(reportState.poles_id, reportState.startDate, reportState.endDate, reportState.height_id, reportState.sensors_data, reportState.levels_data, 'self');
});