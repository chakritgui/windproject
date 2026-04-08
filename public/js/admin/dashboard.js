let charts = {
    main: null,
    others: {}
};
function initDashboard() {
    $.ajax({
        url: `${BASE_URL}/api/dashboard.stats`,
        method: 'POST',
        dataType: 'json',
        success: function(res) {
            if (res.status === true && res.data) {
                const d = res.data;
                $('#memberCount').text(numberWithCommas(d.total_members));
                $('#adminCount').text(numberWithCommas(d.total_admin));
                $('#contractCount').text(numberWithCommas(d.total_contracts));
                $('#projectCount').text(numberWithCommas(d.total_projects));
                $('#installCount').text(numberWithCommas(d.total_installations));
                $('#poleTypeCount').text(numberWithCommas(d.total_types));
                $('#poleCount').text(numberWithCommas(d.total_poles));
                $('#documentCount').text(numberWithCommas(d.total_documents));
                $('#newsCount').text(numberWithCommas(d.total_news));
                $('#windImportCount').text(numberWithCommas(d.total_imports));
                $('#windRowCount').text(numberWithCommas(d.total_winds));
                $('#windUpdate').text(d.import_start || '-');
                loadWindData(); 
            }
        }
    });
}
let chartInstances = {};
function loadWindData() {
    if (typeof Chart === 'undefined') {
        setTimeout(loadWindData, 200);
        return;
    }
    $.getJSON(`${BASE_URL}/api/dashboard.chart`, function(res) {
        if (!res.status || !res.data.length) return;
        const data = res.data;
        const labels = data.map(i => i.time);
        createChart('windDataChart', 'Speed (m/s)', labels, data.map(i => i.speed), '#4361ee', true);
        createChart('chart-direction', 'Dir', labels, data.map(i => i.direction), '#f72585', false);
        createChart('chart-temp', 'Temp', labels, data.map(i => i.temp), '#ff9f43', false);
        createChart('chart-humidity', 'Hum', labels, data.map(i => i.humidity), '#4cc9f0', false);
        createChart('chart-pressure', 'Pres', labels, data.map(i => i.pressure), '#2ec4b6', false);
        createChart('chart-density', 'Dens', labels, data.map(i => i.density), '#7209b7', false);
    });
}
function createChart(canvasId, label, labels, dataValues, color, isMain) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
    }
    chartInstances[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: dataValues,
                borderColor: color,
                backgroundColor: isMain ? hexToRgba(color, 0.1) : 'transparent',
                fill: isMain,
                tension: 0.4,
                borderWidth: isMain ? 3 : 2,
                pointRadius: isMain ? 2 : 0, 
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, 
            plugins: {
                legend: { display: isMain },
                tooltip: { mode: 'index', intersect: false }
            },
            scales: {
                x: {
                    display: isMain,
                    grid: { display: false },
                    ticks: { maxTicksLimit: 8 }
                },
                y: {
                    beginAtZero: false,
                    grid: { color: '#f0f0f0' },
                    ticks: { font: { size: 10 } }
                }
            }
        }
    });
}
function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16),
          g = parseInt(hex.slice(3, 5), 16),
          b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
function getCommonOptions(label) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            tooltip: {
                backgroundColor: 'rgba(0,0,0,0.8)',
                padding: 10,
                bodySpacing: 5
            }
        },
        scales: {
            y: { beginAtZero: false, grid: { color: '#f0f0f0' } },
            x: { grid: { display: false }, ticks: { autoSkip: true, maxTicksLimit: 10 } }
        }
    };
}
function loadLoginHistory() {
    $.getJSON(`${BASE_URL}/api/dashboard.usage`, function(res) {
        if (!res.status) return;
        let html = '';
        res.data.forEach(row => {
            let badge = row.log_type === 'login' ? 'bg-primary' : (row.log_type === 'kick' ? 'bg-danger' : 'bg-success');
            let icon = 'fa-laptop';
            let color = 'text-secondary';
            if(row.device_os === 'Windows') {
                icon = 'fa-brands fa-windows';
                color = 'text-primary';
            } else if(row.device_os === 'Android') {
                icon = 'fa-brands fa-android';
                color = 'text-success';
            } else if(row.device_os === 'iPhone (iOS)') {
                icon = 'fa-mobile-screen-button';
                color = 'text-dark';
            } else if(row.device_os === 'iPad (iOS)') {
                icon = 'fa-tablet-screen-button';
                color = 'text-dark';
            } else if(row.device_os === 'Mac OS') {
                icon = 'fa-brands fa-apple';
                color = 'text-dark';
            }
            html += `
                <tr>
                    <td><div class="fw-bold">${row.member_name}</div></td>
                    <td><small>${row.login_at}</small></td>
                    <td><small>${row.logout_at ?? '-'}</small></td>
                    <td><small>${row.usage ?? '-'}</small></td>
                    <td><code class="small">${row.ip_address}</code></td>
                    <td class="small text-muted text-truncate" style="max-width:150px"><i class="fa-solid ${icon} fa-lg ${color} me-2"></i>${row.device_os} ${row.device_browser}</td>
                    <td><span class="small">${row.login_location || '-'}</span></td>
                    <td><span class="badge ${badge} rounded-pill">${row.log_type.toUpperCase()}</span></td>
                </tr>`;
        });
        $('#loginHistoryTable tbody').html(html);
    });
}
function numberWithCommas(x) {
    if (x === null || x === undefined || x === '') return '-';
    return Number(x).toLocaleString('en-US');
}
$(document).ready(function() {
    initDashboard();
    loadLoginHistory();
});