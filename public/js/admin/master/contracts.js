let tb_contract;
function initContractsTable() {
    let oldPage = 0;
    if ($.fn.DataTable.isDataTable('#tb_contract')) {
        oldPage = $('#tb_contract').DataTable().page();
        $('#tb_contract').DataTable().destroy();
    }
    if ($.fn.DataTable.isDataTable('#tb_contract')) {
        $('#tb_contract').DataTable().ajax.reload(null, false);
        return;
    }
    tb_contract = $('#tb_contract').DataTable({
        processing: true,
        serverSide: true,
        ordering: false,
        order: [[5, 'desc']],
        ajax: { 
            url: "api/contracts/list", 
            type: "POST",
            data: function(d){
                d.status = $('#status').val();
            }
        },
        columns: [      
            { data: "contract_no" },
            { data: "contract_name" },
            { data: "contract_start" },
            { data: "contract_end" },
            { 
                data: 'status',
                render: function (status, type, row) {
                    let badgeColor = "";
                    switch(status) {
                        case 'active':
                            badgeColor = "success";
                            break;
                        case 'inactive':
                            badgeColor = "secondary";
                            break;
                        case 'expired':
                            badgeColor = "error";
                            break;
                    }
                    return `
                        <div class="d-flex align-items-center gap-2">
                            <span class="badge bg-${badgeColor}" style="font-weight:400;" data-i18n="${status}"></span>
                        </div>
                    `;
                }
            },
            { 
                data: 'contract_id',
                orderable: false,
                render: function(row){
                    return `
                        <button class="btn btn-light text-secondary manage-contact" data-id="${row.contract_id}"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="btn btn-light text-secondary text-danger delete-contact" data-id="${row.contract_id}"><i class="fa-regular fa-trash-can"></i></button>
                    `;
                }
            }
        ],
        pageLength: pageLength,
        lengthMenu: lengthMenu,
        stateLoadParams: function (settings, data) {
            data.start = oldPage;
            data.length = pageLength; 
        },
        language: getTableLang(),
        initComplete: function(){
            var input = $('#tb_contract_filter input').unbind();
            var self = this.api();
            input.bind('keypress', function(e){
                if(e.keyCode == 13) {
                    self.search(input.val()).draw();
                }
            });
            let $filter = $('#tb_contract_filter');
            let btn = `
                <button class="btn btn-primary btn-sm manage-contact" data-id="">
                    <i class="fa-solid fa-plus"></i> <span data-i18n="contract"></span>
                </button>
            `;
            $filter.append(btn);
            var input = $('#tb_contractt_filter input').unbind();
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