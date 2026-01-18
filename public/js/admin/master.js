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
            initTypesTable();
            break;
        case 'poles':
            initPolesTable();
            break;
    }
}