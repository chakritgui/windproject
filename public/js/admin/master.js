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
            initSelect2Remote('#filter_status', `${BASE_URL}/api/contracts/filter`, { type: 'status' });
            $(".filter").on("change", () => initContractsTable());
            initContractsTable();
            break;
        case 'projects':
            initSelect2Remote('#filter_project_status', `${BASE_URL}/api/projects/filter`, { type: 'status' });
            initSelect2Remote('#filter_contract', `${BASE_URL}/api/projects/filter`, { type: 'contract' });
            $(".filter").on("change", () => initProjectsTable());
            initProjectsTable();
            break;
        case 'types':
            initSelect2Remote('#filter_type_status', `${BASE_URL}/api/types/filter`, { type: 'status' });
            $(".filter").on("change", () => initTypesTable());
            initTypesTable();
            break;
        case 'installation':
            initSelect2Remote('#filter_installation_project', `${BASE_URL}/api/installations/filter`, { type: 'project' });
            initSelect2Remote('#filter_installation_type', `${BASE_URL}/api/installations/filter`, { type: 'type' });
            initSelect2Remote('#filter_installation_status', `${BASE_URL}/api/installations/filter`, { type: 'status' });
            $(".filter").on("change", () => initInstallationsTable());
            initInstallationsTable();
            break;
        case 'poles':
            initSelect2Remote('#filter_pole_project', `${BASE_URL}/api/poles/filter`, { type: 'project' });
            initSelect2Remote('#filter_pole_type', `${BASE_URL}/api/poles/filter`, { type: 'type' });
            initSelect2Remote('#filter_pole_installation', `${BASE_URL}/api/poles/filter`, { type: 'installation' });
            initSelect2Remote('#filter_pole_status', `${BASE_URL}/api/poles/filter`, { type: 'status' });
            $(".filter").on("change", () => initPolesTable());
            initPolesTable();
            break;
    }
}