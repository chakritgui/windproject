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