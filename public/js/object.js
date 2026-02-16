function initSelect2Remote(selector, apiUrl, extraData = {}) {
    $(selector).select2({
        theme: 'bootstrap-5',
        width: '100%',
        allowClear: true,
        ajax: {
            url: apiUrl,
            type: 'POST',
            dataType: 'json',
            delay: 250,
            data: function (params) {
                return $.extend({
                    searchTerm: params.term,
                    page: params.page || 1,
                    limit: 10
                }, extraData);
            },
            processResults: function (res, params) {
                params.page = params.page || 1;
                const data = res.data || res.status || {};
                const items = (data.items || []).map(item => {
                    return {
                        ...item,
                        text: langData[item.id] || item.text
                    };
                });
                const total = parseInt(data.total_count || 0);
                return {
                    results: items,
                    pagination: {
                        more: (params.page * 10) < total
                    }
                };
            },
            cache: true
        },
        language: {
            searching: () => langData['searching'] || "Searching...",
            noResults: () => langData['no_results'] || "No results found",
            inputTooShort: () => langData['input_too_short'] || "Please enter more characters"
        },
        placeholder: langData['select_option'] || 'Select an option',
        minimumInputLength: 0
    });
}
function initDateRangePicker(selector, callback) {
    $(selector).daterangepicker({
        opens: 'left',
        autoUpdateInput: false,
        alwaysShowCalendars: true, 
        ranges: {
            [langData['today'] || 'Today']: [moment(), moment()],
            [langData['yesterday'] || 'Yesterday']: [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
            [langData['last_7_days'] || 'Last 7 Days']: [moment().subtract(6, 'days'), moment()],
            [langData['last_30_days'] || 'Last 30 Days']: [moment().subtract(29, 'days'), moment()],
            [langData['this_week'] || 'This Week']: [moment().startOf('week'), moment().endOf('week')],
            [langData['last_week'] || 'Last Week']: [moment().subtract(1, 'week').startOf('week'), moment().subtract(1, 'week').endOf('week')],
            [langData['this_month'] || 'This Month']: [moment().startOf('month'), moment().endOf('month')],
            [langData['last_month'] || 'Last Month']: [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
            [langData['this_year'] || 'This Year']: [moment().startOf('year'), moment().endOf('year')],
            [langData['last_year'] || 'Last Year']: [moment().subtract(1, 'year').startOf('year'), moment().subtract(1, 'year').endOf('year')]
        },
        locale: {
            format: date_format,
            applyLabel: langData['apply'] || 'Apply',
            cancelLabel: langData['clear'] || 'Clear',
            customRangeLabel: langData['custom_range'] || 'Custom Range'
        }
    });
    $(selector).on('apply.daterangepicker', function(ev, picker) {
        let selectedDate = picker.startDate.format(date_format) + ' - ' + picker.endDate.format(date_format);
        $(this).val(selectedDate);
        if (typeof callback === 'function') {
            callback(selectedDate); 
        }
    });
    $(selector).on('cancel.daterangepicker', function(ev, picker) {
        $(this).val('');
        if (typeof callback === 'function') {
            callback('');
        }
    });
}
function initDatePicker(selector, minDate = null, maxDate = null) {
    $(selector).datepicker('destroy');
    $(selector).datepicker({
        format: "dd/mm/yyyy",
        autoclose: true,  
        todayHighlight: true,
        orientation: "auto",
        language: "en",
        startDate: minDate,
        endDate: maxDate,
        forceParse: false,
    });
}
function initMonthYearPicker(selector, callback) {
    $(selector).datepicker('destroy');
    $(selector).datepicker({
        format: "mm/yyyy",
        startView: "months",
        minViewMode: "months",
        autoclose: true
    }).on('changeDate', function () {
        if (typeof callback === 'function') {
            callback();
        }
    });
}