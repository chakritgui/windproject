const today = new Date();
const thirtyDaysAgo = new Date(today);
thirtyDaysAgo.setDate(today.getDate() - 30);
document.getElementById('startDate').valueAsDate = thirtyDaysAgo;
document.getElementById('endDate').valueAsDate = today;
function calculateDays() {
    const start = new Date(document.getElementById('startDate').value);
    const end = new Date(document.getElementById('endDate').value);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    document.getElementById('daysCount').textContent = diffDays;
}
calculateDays();
document.getElementById('startDate').addEventListener('change', calculateDays);
document.getElementById('endDate').addEventListener('change', calculateDays);
const filterToggle = document.getElementById('filterToggle');
const filterContent = document.getElementById('filterContent');
const filterCard = document.getElementById('filterCard');
filterToggle.addEventListener('click', () => {
    filterContent.classList.toggle('hide');
    filterToggle.classList.toggle('collapsed');
    filterCard.classList.toggle('collapsed');
});
function generateReport() {
    const selectedSensors = [];
    const sensorNames = [
        'Wind Speed (m/s)',
        'Wind Direction (degree)',
        'Air Density (kg/m³)',
        'Surface Pressure (hPa)',
        'Relative Humidity (%)',
        'Air Temperature (°C)'
    ];
    for (let i = 1; i <= 6; i++) {
        if (document.getElementById(`sensor${i}`).checked) {
            selectedSensors.push(sensorNames[i-1]);
        }
    }
    if (selectedSensors.length === 0) {
        alert('กรุณาเลือกเซ็นเซอร์อย่างน้อย 1 ตัว');
        return;
    }
    document.getElementById('reportSection').style.display = 'block';
    document.getElementById('reportSection').scrollIntoView({ behavior: 'smooth' });
    generateStats(selectedSensors);
    setTimeout(() => {
        generateCharts();
    }, 300);
}
function generateStats(sensors) {
    const statsContainer = document.getElementById('statsContainer');
    statsContainer.innerHTML = '';
    const sampleData = {
        'Wind Speed (m/s)': '9.2',
        'Wind Direction (degree)': '245',
        'Air Density (kg/m³)': '1.092',
        'Surface Pressure (hPa)': '956.1',
        'Relative Humidity (%)': '39.3',
        'Air Temperature (°C)': '29.5'
    };
    sensors.forEach(sensor => {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4';
        col.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${sampleData[sensor]}</div>
                <div class="stat-label">${sensor}</div>
            </div>
        `;
        statsContainer.appendChild(col);
    });
}
function generateCharts() {
    const labels = ['0-2', '2-4', '4-6', '6-8', '8-10', '10-12', '12-14', '14-16', '16-18', '18-20', '20-22', '22-24'];
    const data = [6.5, 7.2, 8.1, 9.5, 10.2, 11.8, 10.5, 9.8, 8.5, 7.8, 7.2, 6.8];
    const lineCtx = document.getElementById('lineChart');
    if (lineCtx) {
        new Chart(lineCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Wind Speed (m/s)',
                    data: data,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.1)',
                    tension: 0.4,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true
                    }
                }
            }
        });
    }
    const areaCtx = document.getElementById('areaChart');
    if (areaCtx) {
        new Chart(areaCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Wind Speed (m/s)',
                    data: data,
                    borderColor: 'rgb(255, 159, 64)',
                    backgroundColor: 'rgba(255, 159, 64, 0.3)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true
                    }
                }
            }
        });
    }
    const barCtx = document.getElementById('barChart');
    if (barCtx) {
        new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Wind Speed (m/s)',
                    data: data,
                    backgroundColor: 'rgba(153, 102, 255, 0.6)',
                    borderColor: 'rgb(153, 102, 255)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true
                    }
                }
            }
        });
    }
    const radarCtx = document.getElementById('radarChart');
    if (radarCtx) {
        new Chart(radarCtx, {
            type: 'radar',
            data: {
                labels: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'],
                datasets: [{
                    label: 'Wind Direction Frequency',
                    data: [8, 12, 15, 10, 7, 9, 14, 11],
                    backgroundColor: 'rgba(54, 162, 235, 0.3)',
                    borderColor: 'rgb(54, 162, 235)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true
                    }
                }
            }
        });
    }
}