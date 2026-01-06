let tb_project;
function initProjectTable() {
    tb_project = $('#tb_project').DataTable({
        processing: true,
        serverSide: true,
        responsive: true, 
        ajax: { url: "api/project/list", type: "POST" },
        columns: [
            {
                data: "cover_image",
                className: 'text-center',
                render: img => `<img src="${img}" class="rounded" width="50">`
            },
            { data: "title" },
            { data: "publish_at" },
            { data: "created_at" },
            { data: "create_by" },
            { 
                data: "notify_users",
                className: 'text-center',
                render: function(status){
                    let badge = status === 0 ? "success" : "secondary";
                    return `<span class="text-${badge}" style="font-size: 18px;">${status === 0 ? '<i class="fa-solid fa-bell text-warning"></i>' : '<i class="fa-solid fa-bell-slash text-mute"></i>'}</span>`;
                }
            },
            { data: 'view', className: 'text-end', },
            { 
                data: "status",
                render: s => `<span class="badge bg-${s === 'published' ? 'success' : (s === 'scheduled' ? 'warning' : 'secondary')} text-${s === 'published' ? 'success' : (s === 'scheduled' ? 'warning' : 'secondary')} bg-opacity-10" style="font-size: 13px; font-weight: 400;">${s}</span>`
            },
            {
                className: 'text-center',
                render: () => `
                    <button class="btn btn-light text-secondary" data-id="1"><i class="fa-solid fa-folder-open"></i></button>
                    <button class="btn btn-light text-secondary manage-project" data-id="1"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="btn btn-light text-secondary"><i class="fa-regular fa-trash-can"></i></button>
                `
            }
        ],
        pageLength: pageLength,
        lengthMenu: lengthMenu,
        language: getTableLang(),
        initComplete: function(){
            var input = $('#tb_project_filter input').unbind();
            var self = this.api();
            input.bind('keypress', function(e){
                if(e.keyCode == 13) {
                    self.search(input.val()).draw();
                }
            });
        }
    });
}
$('.filter').on('change', function () {
    tb_project.ajax.reload();
});
function loadProjectFilters() {
    $.ajax({
        url: "api/member/filterData",
        type: "POST",
        dataType: "json",
        success: function(res) {
            if(res.status === "success") {
                let company = res.data.company;
                company.forEach(c => {
                    $("#filter_company").append(`<option value="${c}">${c}</option>`);
                });
                let position = res.data.position;
                position.forEach(p => {
                    $("#filter_position").append(`<option value="${p}">${p}</option>`);
                });

            }
        }
    });
}
async function initProject() {
    await loadLang(currentLang); 
    initProjectTable(); 
    loadProjectFilters();
}
$(document).ready(function () {
    initProject();
});
$(document).on("click", ".manage-project", function () {
    let id = $(this).data("id");
    $.post("api/project/get", { id }, function(res){
        if(res.status !== "success") return;
        let d = res.data;
        let modalEl = $('#windModal');
        let modal = new bootstrap.Modal(modalEl[0]);
        modal.show();
        modalEl.find(".modal-header").html(`
            <h5 class="modal-title" data-i18n="project_management"></h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        `);
        modalEl.find(".modal-footer").html(`
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" data-i18n="close"></button>
            <button type="submit" class="btn btn-primary" data-i18n="save"></button>
        `);
        modalEl.find(".modal-body").html(`
            <input type="hidden" id="project_id">
            <div class="mb-3">
                <label class="form-label" data-i18n="cover_image"></label>
                <input type="file" class="form-control" id="cover_image">
                <img id="cover_preview" class="mt-2 rounded d-none" width="250">
            </div>
            <ul class="nav nav-tabs mb-3">
                <li class="nav-item"><a class="nav-link active" data-bs-toggle="tab" href="#th">ไทย</a></li>
                <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#la">ລາວ</a></li>
                <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#en">English</a></li>
            </ul>
            <div class="tab-content">
                <div class="tab-pane fade show active" id="th">
                    <div class="text-end">
                        <button type="button" class="btn btn-primary mt-2 translate-btn" data-target="en">
                            <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="15" height="15" viewBox="0,0,256,256"><defs><linearGradient x1="3.906" y1="3.906" x2="45.428" y2="45.428" gradientUnits="userSpaceOnUse" id="color-1_rnK88i9FvAFO_gr1"><stop offset="0" stop-color="#ff9900"></stop><stop offset="0.036" stop-color="#fcc419"></stop><stop offset="0.293" stop-color="#ff9900"></stop><stop offset="0.528" stop-color="#37c6ff"></stop><stop offset="0.731" stop-color="#b9f5ff"></stop><stop offset="0.895" stop-color="#7ef9ff"></stop><stop offset="1" stop-color="#0a85d9"></stop></linearGradient></defs><g fill="url(#color-1_rnK88i9FvAFO_gr1)" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal;"><g transform="scale(5.33333,5.33333)"><path d="M46.117,23.081l-0.995,-0.04h-0.002c-10.877,-0.428 -19.733,-9.284 -20.161,-20.161l-0.04,-0.996c-0.019,-0.494 -0.425,-0.884 -0.919,-0.884c-0.494,0 -0.9,0.39 -0.919,0.883l-0.04,0.996c-0.429,10.877 -9.285,19.733 -20.163,20.162l-0.995,0.04c-0.493,0.019 -0.883,0.425 -0.883,0.919c0,0.494 0.39,0.9 0.884,0.919l0.995,0.039c10.877,0.43 19.733,9.286 20.162,20.163l0.04,0.996c0.019,0.493 0.425,0.883 0.919,0.883c0.494,0 0.9,-0.39 0.919,-0.883l0.04,-0.996c0.429,-10.877 9.285,-19.733 20.162,-20.163l0.995,-0.039c0.494,-0.019 0.884,-0.425 0.884,-0.919c0,-0.494 -0.39,-0.9 -0.883,-0.919z"></path></g></g></svg> Translate (AI)
                        </button>
                    </div>
                    <div class="mb-2">
                        <label class="mb-2" data-i18n="title"></label>
                        <input class="form-control" id="title_th">
                    </div>
                    <label class="mb-2" data-i18n="content"></label>
                    <textarea id="content_th"></textarea>
                </div>
                <div class="tab-pane fade" id="la">
                    <div class="text-end">
                        <button type="button" class="btn btn-primary mt-2 translate-btn" data-target="en">
                            <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="15" height="15" viewBox="0,0,256,256"><defs><linearGradient x1="3.906" y1="3.906" x2="45.428" y2="45.428" gradientUnits="userSpaceOnUse" id="color-1_rnK88i9FvAFO_gr1"><stop offset="0" stop-color="#ff9900"></stop><stop offset="0.036" stop-color="#fcc419"></stop><stop offset="0.293" stop-color="#ff9900"></stop><stop offset="0.528" stop-color="#37c6ff"></stop><stop offset="0.731" stop-color="#b9f5ff"></stop><stop offset="0.895" stop-color="#7ef9ff"></stop><stop offset="1" stop-color="#0a85d9"></stop></linearGradient></defs><g fill="url(#color-1_rnK88i9FvAFO_gr1)" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal;"><g transform="scale(5.33333,5.33333)"><path d="M46.117,23.081l-0.995,-0.04h-0.002c-10.877,-0.428 -19.733,-9.284 -20.161,-20.161l-0.04,-0.996c-0.019,-0.494 -0.425,-0.884 -0.919,-0.884c-0.494,0 -0.9,0.39 -0.919,0.883l-0.04,0.996c-0.429,10.877 -9.285,19.733 -20.163,20.162l-0.995,0.04c-0.493,0.019 -0.883,0.425 -0.883,0.919c0,0.494 0.39,0.9 0.884,0.919l0.995,0.039c10.877,0.43 19.733,9.286 20.162,20.163l0.04,0.996c0.019,0.493 0.425,0.883 0.919,0.883c0.494,0 0.9,-0.39 0.919,-0.883l0.04,-0.996c0.429,-10.877 9.285,-19.733 20.162,-20.163l0.995,-0.039c0.494,-0.019 0.884,-0.425 0.884,-0.919c0,-0.494 -0.39,-0.9 -0.883,-0.919z"></path></g></g></svg> Translate (AI)
                        </button>
                    </div>
                    <div class="mb-2">
                        <label class="mb-2">ຫົວຂໍ້ຂ່າວ</label>
                        <input class="form-control" id="title_la">
                    </div>
                    <textarea id="content_la"></textarea>
                </div>
                <div class="tab-pane fade" id="en">
                    <div class="text-end">
                        <button type="button" class="btn btn-primary mt-2 translate-btn" data-target="en">
                            <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="15" height="15" viewBox="0,0,256,256"><defs><linearGradient x1="3.906" y1="3.906" x2="45.428" y2="45.428" gradientUnits="userSpaceOnUse" id="color-1_rnK88i9FvAFO_gr1"><stop offset="0" stop-color="#ff9900"></stop><stop offset="0.036" stop-color="#fcc419"></stop><stop offset="0.293" stop-color="#ff9900"></stop><stop offset="0.528" stop-color="#37c6ff"></stop><stop offset="0.731" stop-color="#b9f5ff"></stop><stop offset="0.895" stop-color="#7ef9ff"></stop><stop offset="1" stop-color="#0a85d9"></stop></linearGradient></defs><g fill="url(#color-1_rnK88i9FvAFO_gr1)" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal;"><g transform="scale(5.33333,5.33333)"><path d="M46.117,23.081l-0.995,-0.04h-0.002c-10.877,-0.428 -19.733,-9.284 -20.161,-20.161l-0.04,-0.996c-0.019,-0.494 -0.425,-0.884 -0.919,-0.884c-0.494,0 -0.9,0.39 -0.919,0.883l-0.04,0.996c-0.429,10.877 -9.285,19.733 -20.163,20.162l-0.995,0.04c-0.493,0.019 -0.883,0.425 -0.883,0.919c0,0.494 0.39,0.9 0.884,0.919l0.995,0.039c10.877,0.43 19.733,9.286 20.162,20.163l0.04,0.996c0.019,0.493 0.425,0.883 0.919,0.883c0.494,0 0.9,-0.39 0.919,-0.883l0.04,-0.996c0.429,-10.877 9.285,-19.733 20.162,-20.163l0.995,-0.039c0.494,-0.019 0.884,-0.425 0.884,-0.919c0,-0.494 -0.39,-0.9 -0.883,-0.919z"></path></g></g></svg> Translate (AI)
                        </button>
                    </div>
                    <div class="mb-2">
                        <label class="mb-2">Title</label>
                        <input class="form-control" id="title_en">
                    </div>
                    <textarea id="content_en"></textarea>
                </div>
            </div>
            <hr class="my-4">
            <div class="row g-3">
                <div class="col-md-4">
                    <label class="mb-2" data-i18n="status"></label>
                    <select id="project_status" class="form-select">
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="scheduled">Scheduled</option>
                    </select>
                </div>
                <div class="col-md-4">
                    <label class="mb-2" data-i18n="publish_at"></label>
                    <input type="datetime-local" class="form-control" id="project_publish_at">
                </div>
                <div class="col-md-4">
                    <label class="mb-2" data-i18n="notification"></label>
                    <select id="project_notify" class="form-select">
                        <option value="1" data-i18n="yes"></option>
                        <option value="0" data-i18n="no"></option>
                    </select>
                </div>
            </div>
        `);
        loadLang(currentLang);
        let editor_th, editor_la, editor_en;
        ClassicEditor.create(document.querySelector('#content_th')).then(e => editor_th = e);
        ClassicEditor.create(document.querySelector('#content_la')).then(e => editor_la = e);
        ClassicEditor.create(document.querySelector('#content_en')).then(e => editor_en = e);
    }, "json");
});
$(document).on("click", ".translate-btn", function () {
    let lang = $(this).data("target");
    alert("AI Translate for language: " + lang + " (mock action)");
});
