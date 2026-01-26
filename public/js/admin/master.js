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
            initSelect2Remote('#filter_status', 'api/contracts/filter', { type: 'status' });
            $(".filter").on("change", () => initContractsTable());
            initContractsTable();
            break;
        case 'projects':
            initSelect2Remote('#filter_project_status', 'api/projects/filter', { type: 'status' });
            initSelect2Remote('#filter_contract', 'api/projects/filter', { type: 'contract' });
            $(".filter").on("change", () => initProjectsTable());
            initProjectsTable();
            break;
        case 'types':
            initSelect2Remote('#filter_type_status', 'api/types/filter', { type: 'status' });
            $(".filter").on("change", () => initTypesTable());
            initTypesTable();
            break;
        case 'installation':
            initSelect2Remote('#filter_installation_project', 'api/installations/filter', { type: 'project' });
            initSelect2Remote('#filter_installation_type', 'api/installations/filter', { type: 'type' });
            initSelect2Remote('#filter_installation_status', 'api/installations/filter', { type: 'status' });
            $(".filter").on("change", () => initInstallationsTable());
            initInstallationsTable();
            break;
        case 'poles':
            initSelect2Remote('#filter_pole_project', 'api/poles/filter', { type: 'project' });
            initSelect2Remote('#filter_pole_type', 'api/poles/filter', { type: 'type' });
            initSelect2Remote('#filter_pole_installation', 'api/poles/filter', { type: 'installation' });
            initSelect2Remote('#filter_pole_status', 'api/poles/filter', { type: 'status' });
            $(".filter").on("change", () => initPolesTable());
            initPolesTable();
            break;
    }
}