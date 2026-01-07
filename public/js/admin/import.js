let tb_wind;
function initWindTable() {
    let oldPage = 0;
    if ($.fn.DataTable.isDataTable('#tb_document')) {
        oldPage = $('#tb_document').DataTable().page();
        $('#tb_document').DataTable().destroy();
    }
    if ($.fn.DataTable.isDataTable('#tb_wind')) {
        $('#tb_wind').DataTable().ajax.tb_wind(null, false);
        return;
    }
    tb_wind = $('#tb_wind').DataTable({
        processing: true,
        serverSide: true,
        order: [[1, 'desc']],
        ajax: {
            url: "api/wind/list",
            type: "POST",
            data: function (d) {
                d.date = $("#filter_date").val();
            }
        },
        columns: [
            { data: "document_name" },
            { data: "import_start" },
            { data: "import_end" },
            { data: "import_type" },
            { data: "status" },
            { data: "import_record" },
            { data: "remark" },
        ],
        stateSave: true,
        pageLength: pageLength,
        lengthMenu: lengthMenu,
        stateLoadParams: function (settings, data) {
            data.start = oldPage;
            data.length = pageLength; 
        },
        language: getTableLang(),
        initComplete: function(){
            var input = $('#tb_wind_filter input').unbind();
            var self = this.api();
            input.bind('keypress', function(e){
                if(e.keyCode == 13) {
                    self.search(input.val()).draw();
                }
            });
        }, 
        initComplete: function(){
            let $filter = $('#tb_wind_filter');
            let btn = `
                <button class="btn btn-primary btn-sm manage-wind" data-id="">
                    <i class="fa-solid fa-plus"></i> <span data-i18n="import"></span>
                </button>
            `;
            $filter.append(btn);
            var input = $('#tb_wind_filter input').unbind();
            var self = this.api();
            input.bind('keypress', function(e){
                if(e.keyCode == 13) {
                    self.search(input.val()).draw();
                }
            });
        }, 
        drawCallback: function(){
            getTableLang();
        }
    });
}
$(document).ready(function () {
    initWindTable();
    initDateRangePicker('#filter_date', initWindTable);
    $(".filter").on("change", () => initWindTable());
});
$(document).on('click', '.manage-wind', function () {
    let wind_id = $(this).data("id");
    let wind = window.windData || {}; 
    let modalEl = $('#windModal');
    let modal = new bootstrap.Modal(modalEl[0]);
    modal.show();
    modalEl.find(".modal-header").html(`
        <h5 class="modal-title" data-i18n="wind_management"></h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
    `);
    modalEl.find(".modal-footer").html(`
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" data-i18n="close"></button>
        <button type="submit" class="btn btn-primary" data-i18n="import"></button>
    `);
    modalEl.find(".modal-body").html(`
        <input type="hidden" id="wind_id" value="${wind.id ?? ''}">
        <div class="mb-3">
            <label class="mb-2 fw-bold" data-i18n="uploadWindData"></label>
            <input type="file" id="wind_file" class="form-control" accept=".xlsx,.csv">
            <div class="alert alert-info rounded-3 mt-3">
                <h6 class="fw-bold mb-2" data-i18n="uploadGuideline"></h6>
                <ul class="mb-0 small">
                    <li data-i18n="uploadFormat1"></li>
                    <li data-i18n="uploadFormat2"></li>
                    <li data-i18n="uploadFormat3"></li>
                </ul>
            </div>
        </div>
    `);
    loadLang(currentLang);
});
