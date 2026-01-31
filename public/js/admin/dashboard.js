function initDashboard() {
    $.ajax({
        url: `${BASE_URL}/api/dashboard/getStats`,
        method: 'POST',
        dataType: 'json',
        success: function(res) {
            if (res.status === true && res.data) {
                const d = res.data;
                $('#memberCount').text(numberWithCommas(d.total_members));
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
            } else {
                showError('Error', langData['cannot_load']);
            }
        },
        error: function() {
            showError('Error', langData['cannot_load']);
        }
    });
}
function loadLoginHistory() {
    $.getJSON(`${BASE_URL}/api/dashboard/loginHistory`, function(res) {
        if (!res.status) return;

        let html = '';
        res.data.forEach(row => {
            html += `
                <tr>
                    <td>${row.member_name}</td>
                    <td>${row.login_at}</td>
                    <td>${row.logout_at ?? '-'}</td>
                    <td>${row.ip_address}</td>
                    <td class="text-truncate" style="max-width:200px">${row.login_device}</td>
                    <td>
                        <span class="badge bg-${row.log_type === 'kick' ? 'danger' : (row.log_type == 'login') ? 'warning' : 'success'}">
                            ${row.log_type}
                        </span>
                    </td>
                </tr>
            `;
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