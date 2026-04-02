let pages = 'contracts';
$(document).ready(function () {
    initMaster();
});
function initMaster() {
    initTable();
    $(".nav-link").click(function() {
        let p = $(this).data("page");
        pages = p;
        initTable();
    });
}
function initTable() {
    switch(pages) {
        case 'contracts':
            initSelect2Remote('#filter_status', `${BASE_URL}/api/contracts.filter`, { type: 'status' });
            $(".filter").on("change", () => initContractsTable());
            initContractsTable();
            break;
        case 'group':
            initSelect2Remote('#filter_group_status', `${BASE_URL}/api/installations.filter`, { type: 'status' });
            $(".filter").on("change", () => initGroupTable());
            initGroupTable();
            break;
        case 'project-status':
            initSelect2Remote('#filter_projectstatus_status', `${BASE_URL}/api/installations.filter`, { type: 'status' });
            $(".filter").on("change", () => initProjectStatusTable());
            initProjectStatusTable();
            break;
        case 'projects':
            initSelect2Remote('#filter_project_status', `${BASE_URL}/api/projects.filter`, { type: 'project_status' });
            initSelect2Remote('#filter_p_status', `${BASE_URL}/api/projects.filter`, { type: 'status' });
            initSelect2Remote('#filter_contract', `${BASE_URL}/api/projects.filter`, { type: 'contract' });
            initSelect2Remote('#filter_group', `${BASE_URL}/api/projects.filter`, { type: 'group' });
            $(".filter").on("change", () => initProjectsTable());
            initProjectsTable();
            break;
        case 'types':
            initSelect2Remote('#filter_type_status', `${BASE_URL}/api/types.filter`, { type: 'status' });
            $(".filter").on("change", () => initTypesTable());
            initTypesTable();
            break;
        case 'installation':
            initSelect2Remote('#filter_installation_project', `${BASE_URL}/api/installations.filter`, { type: 'project' });
            initSelect2Remote('#filter_installation_type', `${BASE_URL}/api/installations.filter`, { type: 'type' });
            initSelect2Remote('#filter_installation_status', `${BASE_URL}/api/installations.filter`, { type: 'status' });
            $(".filter").on("change", () => initInstallationsTable());
            initInstallationsTable();
            break;
        case 'level':
            initSelect2Remote('#filter_level_status', `${BASE_URL}/api/installations.filter`, { type: 'status' });
            $(".filter").on("change", () => initLevelTable());
            initLevelTable();
            break;
        case 'poles':
            initSelect2Remote('#filter_pole_project', `${BASE_URL}/api/poles.filter`, { type: 'project' });
            initSelect2Remote('#filter_pole_type', `${BASE_URL}/api/poles.filter`, { type: 'type' });
            initSelect2Remote('#filter_pole_installation', `${BASE_URL}/api/poles.filter`, { type: 'installation' });
            initSelect2Remote('#filter_pole_status', `${BASE_URL}/api/poles.filter`, { type: 'status' });
            $(".filter").on("change", () => initPolesTable());
            initPolesTable();
            break;
        case 'windturbine':
            initSelect2Remote('#filter_windturbine_project', `${BASE_URL}/api/windturbine.filter`, { type: 'project' });
            initSelect2Remote('#filter_windturbine_status', `${BASE_URL}/api/windturbine.filter`, { type: 'status' });
            $(".filter").on("change", () => initWindturbineTable());
            initWindturbineTable();
            break;
    }
}
$(document).on('click', '.item-order', function() {
    let type = $(this).data("type");
    switch(type) {
        case 'contract':
            orderItem('contract', `${langData['contract'] || 'Contract'}`);
            break;
        case 'project':
            orderItem('project', `${langData['project'] || 'Project'}`);
            break;
        case 'pole_types':
            orderItem('pole_types', `${langData['pole_types'] || 'Wind Measurement Equipment'}`);
            break;
        case 'installation':
            orderItem('installation',`${langData['installation'] || 'Installation'}`);
            break;
        case 'level':
            orderItem('level', `${langData['level'] || 'Level'}`);
            break;
        case 'poles':
            orderItem('poles', `${langData['poles'] || 'Poles'}`);
            break;
        case 'group':
            orderItem('group', `${langData['group'] || 'Group'}`);
            break;
        case 'status':
            orderItem('project_status', `${langData['project_status'] || 'Project Status'}`);
            break;
    }
});
function orderItem(type, title) {
    let modalEl = $('#windModal');
    let modal = new bootstrap.Modal(modalEl[0]);
    modal.show();
    modalEl.find(".modal-header").html(`
        <h5 class="modal-title">${langData['sort'] || "Sort"} • ${langData[type] || title}</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
    `);
    modalEl.find(".modal-footer").html(`
        <button type="button" class="btn btn-primary me-2 save-order-item">${langData['save'] || "Save"}</button>
        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">${langData['close'] || "Close"}</button>
    `);
    modalEl.find(".modal-body").html(`
        <table class="table table-bordered">
            <thead>
                <tr>
                    <th width="50px">${langData['sort'] || "Sort"}</th>
                    <th>${langData[type] || title}</th>
                </tr>
            </thead>
            <tbody id="sortable-list">
                <tr><td colspan="2" class="text-center">Loading...</td></tr>
            </tbody>
        </table>
    `);
    $.ajax({
        url: `${BASE_URL}/api/sort.list`,
        method: 'POST',
        data: { type: type },
        dataType: 'json',
        success: function(res) {
            if(res.status && res.data){
                let html = '';
                res.data.forEach((item, index) => {
                    html += `
                        <tr data-id="${item.item_id}" style="cursor: move;">
                            <td class="text-center"><i class="fas fa-grip-lines"></i></td>
                            <td>
                                <strong>${item.item_name}</strong>
                                ${item.item_detail ? `<br><small class="text-muted">${item.item_detail}</small>` : ''}
                            </td>
                        </tr>
                    `;
                });
                $('#sortable-list').html(html);
                new Sortable(document.getElementById('sortable-list'), {
                    animation: 150,
                    ghostClass: 'bg-light'
                });
            } else {
                showError(langData['cannot_load']);
            }
        }
    });
    modalEl.off('click', '.save-order-item').on('click', '.save-order-item', function() {
        let orderData = [];
        $('#sortable-list tr').each(function(index) {
            orderData.push($(this).data('id'));
        });
        $.ajax({
            url: `${BASE_URL}/api/sort.save`,
            method: 'POST',
            data: { 
                type: type,
                order: orderData
            },
            success: function(res) {
                if(res.status) {
                    showSuccess(langData['save_success'] || "Saved!");
                    modal.hide();
                    switch(type) {
                        case 'contract':
                            initContractsTable();
                            break;
                        case 'project':
                            initProjectsTable();
                            break;
                        case 'pole_types':
                            initTypesTable();
                            break;
                        case 'installation':
                            initInstallationsTable();
                            break;
                        case 'level':
                            initLevelTable();
                            break;
                        case 'poles':
                            initPolesTable();
                            break;
                        case 'group':
                            initGroupTable();
                            break;
                        case 'project_status':
                            initProjectStatusTable();
                            break;
                    }
                }
            }
        });
    });
}