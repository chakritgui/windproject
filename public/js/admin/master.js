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
            initSelect2Remote('#status', 'api/contracts/filter', { type: 'status' });
            $(".filter").on("change", () => initContractsTable());
            initContractsTable();
            break;
        case 'projects':
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