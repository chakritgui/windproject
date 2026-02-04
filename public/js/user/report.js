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
    const reportUrl = `${BASE_URL}/pole/${encodedData}`;
    navigateTo(reportUrl, type);
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
            </div>
            <div class="filter-card" id="filterCard">
                <div class="filter-toggle" id="filterToggle">
                    <h5 class="mb-0"><i class="fas fa-filter me-2"></i><span>${langData['filter'] || 'Filter'}</h5>
                </div>
                <div class="filter-content" id="filterContent">
                    <div class="row">
                        <div class="col-md-6 col-lg-4 mb-3">
                            <label class="form-label required">
                                <i class="fas fa-calendar-day me-2"></i><span>${langData['startDate'] || 'Start Date'}</span>
                            </label>
                            <input type="text" class="form-control obj-required" id="startDate" value="${data.min_datetime}">
                        </div>
                        <div class="col-md-6 col-lg-4 mb-3">
                            <label class="form-label required">
                                <i class="fas fa-calendar-day me-2"></i><span>${langData['endDate'] || 'End Date'}</span>
                            </label>
                            <input type="text" class="form-control obj-required" id="endDate" value="${data.max_datetime}">
                        </div>
                        <div class="col-md-6 col-lg-4 mb-3">
                            <label class="form-label required">
                                <i class="fas fa-arrows-alt-v me-2"></i><span>${langData['height'] || 'Height'}</span>
                            </label>
                            <select class="form-select obj-required" id="heightSelect"></select>
                        </div>
                    </div>
                    <div class="row mt-3">
                        <div class="col-12">
                            <label class="form-label required">
                                <i class="fas fa-sensor me-2"></i><span>${langData['sensor'] || 'Sensor'}</span>
                            </label>
                        </div>
                        <div class="col-md-6 col-lg-4">
                            <div class="sensor-checkbox">
                                <input type="checkbox" class="form-check-input me-2" id="sensor1" checked>
                                <label class="form-check-label" for="sensor1">
                                    <i class="fas fa-wind text-primary me-2"></i><span>${langData['wind_speed'] || 'Wind Speed'}</span> (m/s)
                                </label>
                            </div>
                        </div>
                        <div class="col-md-6 col-lg-4">
                            <div class="sensor-checkbox">
                                <input type="checkbox" class="form-check-input me-2" id="sensor2" checked>
                                <label class="form-check-label" for="sensor2">
                                    <i class="fas fa-compass text-success me-2"></i><span>${langData['wind_direction'] || 'Wind Direction'}</span> (<span>${langData['degree'] || 'Degree'}</span>)
                                </label>
                            </div>
                        </div>
                        <div class="col-md-6 col-lg-4">
                            <div class="sensor-checkbox">
                                <input type="checkbox" class="form-check-input me-2" id="sensor3">
                                <label class="form-check-label" for="sensor3">
                                    <i class="fas fa-weight text-info me-2"></i><span>${langData['air_density'] || 'Air Density'}</span> (kg/m³)
                                </label>
                            </div>
                        </div>
                        <div class="col-md-6 col-lg-4">
                            <div class="sensor-checkbox">
                                <input type="checkbox" class="form-check-input me-2" id="sensor4">
                                <label class="form-check-label" for="sensor4">
                                    <i class="fas fa-tachometer-alt text-warning me-2"></i><span>${langData['surface_pressure'] || 'Surface Pressure'}</span> (hPa)
                                </label>
                            </div>
                        </div>
                        <div class="col-md-6 col-lg-4">
                            <div class="sensor-checkbox">
                                <input type="checkbox" class="form-check-input me-2" id="sensor5">
                                <label class="form-check-label" for="sensor5">
                                    <i class="fas fa-tint text-primary me-2"></i><span>${langData['relative_humidity'] || 'Relative Humidity'}</span> (%)
                                </label>
                            </div>
                        </div>
                        <div class="col-md-6 col-lg-4">
                            <div class="sensor-checkbox">
                                <input type="checkbox" class="form-check-input me-2" id="sensor6">
                                <label class="form-check-label" for="sensor6">
                                    <i class="fas fa-temperature-high text-danger me-2"></i><span>${langData['turbulence_intensity'] || 'Turbulence Intensity'}</span> (°C)
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
            <button class="btn btn-primary me-2" onclick="renderReport(${poles_id}, 'default')">
                ${langData['generate_report'] || 'Generate Report'}</span>
            </button>
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">${langData['close'] || "Close"}</button>
        `);
        if (data.levels_name && data.levels_id) {
            const newOption = new Option(data.levels_name, data.levels_id, true, true);
            $('#heightSelect').append(newOption).trigger('change');
        }
    } catch (err) {
        $('#poleModalBody').html('<div class="alert alert-danger">Cannot load data. Please try again.</div>');
    }
}