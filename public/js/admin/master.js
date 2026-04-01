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
            orderItem('contract', `${BASE_URL}/admin/projects/order`, `${langData['contract'] || 'Contract'}`);
            break;
        case 'project':
            orderItem('project', `${BASE_URL}/admin/projects/order`, `${langData['project'] || 'Project'}`);
            break;
        case 'pole_types':
            orderItem('pole_types', `${BASE_URL}/admin/types/order`, `${langData['pole_types'] || 'Wind Measurement Equipment'}`);
            break;
        case 'installation':
            orderItem('installation', `${BASE_URL}/admin/installation/order`, `${langData['installation'] || 'Installation'}`);
            break;
        case 'level':
            orderItem('level', `${BASE_URL}/admin/level/order`, `${langData['level'] || 'Level'}`);
            break;
        case 'poles':
            orderItem('poles', `${BASE_URL}/admin/poles/order`, `${langData['poles'] || 'Poles'}`);
            break;
    }
});
function orderItem(type, url, title) {
    $.ajax({
        url: url,
        type: 'GET',
        dataType: 'json',
        success: function(response) {
            if (response.status === 'success') {
                let items = response.data;
                let content = `
                    <ul class="list-group sortable" data-type="${type}">
                `;
                items.forEach(item => {
                    content += `
                        <li class="list-group-item" data-id="${item.id}">
                            <i class="fa-solid fa-grip-vertical"></i> ${item.name}
                        </li>
                    `;
                });
                content += `</ul>`;
                Swal.fire({ 
                    title: title,
                    html: content,
                    width: 400,
                    showCancelButton: true,
                    confirmButtonText: langData['save'] || 'Save',
                    cancelButtonText: langData['cancel'] || 'Cancel',
                    didOpen: () => {    
                        $('.sortable').sortable();
                    }
                }).then((result) => {
                    if (result.isConfirmed) {
                        let order = [];
                        $('.sortable li').each(function(index) {
                            order.push($(this).data('id'));
                        });
                        $.ajax({
                            url: url,
                            type: 'POST',
                            data: { order: order },
                            dataType: 'json',
                            success: function(response) {
                                if (response.status === 'success') {
                                    Swal.fire({
                                        icon: 'success',
                                        title: langData['success'] || 'Success',
                                        text: response.message,
                                        timer: 2000,
                                        showConfirmButton: false
                                    });
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
                                    }
                                } else {
                                    Swal.fire({
                                        icon: 'error',
                                        title: langData['error'] || 'Error',
                                        text: response.message,
                                        timer: 2000,
                                        showConfirmButton: false
                                    });
                                }
                            }
                        });
                    }
                });
            }
        }
    });
}