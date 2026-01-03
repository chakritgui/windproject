let tb_notification;

/* ------------------- Init Table ------------------- */
function initNotificationTable() {
    tb_notification = $('#tb_notification').DataTable({
        processing: true,
        serverSide: true,
        responsive: true,
        ajax: {
            url: "api/notification/list",
            type: "POST",
            data: function(d) {
                d.filter_date        = $("#filter_date").val();
                d.filter_status      = $("#filter_status").val();
                d.filter_notification = $("#filter_notification").val();
                d.filter_creator     = $("#filter_creator").val();
            }
        },
        columns: [
            { data: "title" },
            { data: "publish_at" },
            { data: "created_at" },
            { data: "create_by" },
            { data: "view", className: "text-end" },
            {
                data: "status",
                render: s =>
                    `<span class="badge bg-${s === 'published' ? 'success' : (s === 'scheduled' ? 'warning' : 'secondary')} bg-opacity-10 text-dark px-3 py-2" style="font-size:12px;">${s}</span>`
            },
            {
                className: "text-center",
                render: (_, __, row) => `
                    <button class="btn btn-light text-secondary view-news" data-id="${row.id}">
                        <i class="fa-solid fa-folder-open"></i>
                    </button>
                    <button class="btn btn-light text-secondary manage-notification" data-id="${row.id}">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="btn btn-light text-danger delete-news" data-id="${row.id}">
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                `
            }
        ],
        pageLength: pageLength,
        lengthMenu: lengthMenu,
        language: getTableLang(),
        initComplete: function () {
            let input = $('#tb_notification_filter input').unbind();
            let self = this.api();
            input.on('keypress', function (e) {
                if (e.keyCode === 13) self.search(this.value).draw();
            });
        }
    });
}
$(".filter").on("change", () => tb_notification.ajax.reload());
function loadCreatorFilter() {
    $.post("api/member/filterData", {}, function(res) {
        if(res.status === "success") {
            $("#filter_creator").empty().append(`<option value="">-- Creator --</option>`);
            res.data.admin.forEach(a => {
                $("#filter_creator").append(`<option>${a}</option>`);
            });
        }
    }, "json");
}
$(document).on("click", ".manage-notification", function () {
    let id = $(this).data("id") ?? "";
    $.post("api/notification/get", { id }, function(res) {
        if(res.status !== "success") return;
        let d = res.data;
        let $modal = $("#windModal");
        let modal = new bootstrap.Modal($modal[0]);
        $modal.find(".modal-header").html(`
            <h5 class="modal-title" data-i18n="notification_management"></h5>
            <button class="btn-close" data-bs-dismiss="modal"></button>
        `);
        $modal.find(".modal-footer").html(`
            <button class="btn btn-secondary" data-bs-dismiss="modal" data-i18n="close"></button>
            <button class="btn btn-primary" id="saveNotification" data-i18n="save"></button>
        `);
        $modal.find(".modal-body").html(getNotificationForm(d));
        ClassicEditor.create(document.querySelector('#content_th'));
        ClassicEditor.create(document.querySelector('#content_la'));
        ClassicEditor.create(document.querySelector('#content_en'));
        loadLang(currentLang);
        modal.show();
    }, "json");
});
function getNotificationForm(d) {
    return `
        <input type="hidden" id="news_id" value="${d.id ?? ''}">
        <ul class="nav nav-tabs mb-3">
            <li class="nav-item"><a class="nav-link active" data-bs-toggle="tab" href="#th">ไทย</a></li>
            <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#la">ລາວ</a></li>
            <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#en">English</a></li>
        </ul>
        <div class="tab-content">
            ${langTab("th", d)}
            ${langTab("la", d)}
            ${langTab("en", d)}
        </div>
        <hr>
        <div class="row g-3">
            <div class="col-md-4">
                <label class="mb-2" data-i18n="status"></label>
                <select id="news_status" class="form-select">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="scheduled">Scheduled</option>
                </select>
            </div>
            <div class="col-md-4">
                <label class="mb-2" data-i18n="publish_at"></label>
                <input type="datetime-local" id="news_publish_at" class="form-control" value="${d.publish_at}">
            </div>
            <div class="col-md-4">
                <label class="mb-2" data-i18n="notification"></label>
                <select id="news_notify" class="form-select">
                    <option value="1" ${d.notify_users==1?'selected':''} data-i18n="yes"></option>
                    <option value="0" ${d.notify_users==0?'selected':''} data-i18n="no"></option>
                </select>
            </div>
        </div>
    `;
}
function langTab(lang, d) {
    return `
        <div class="tab-pane fade ${lang==='th' ? 'show active':''}" id="${lang}">
            <div class="mb-2">
                <label class="mb-2" data-i18n="title"></label>
                <input class="form-control" id="title_${lang}" value="${d.title[lang] ?? ''}">
            </div>
            <label class="mb-2" data-i18n="notification"></label>
            <textarea id="content_${lang}">${d.content[lang] ?? ''}</textarea>
        </div>
    `;
}
async function initNotification() {
    await loadLang(currentLang);
    initNotificationTable();
    loadCreatorFilter();
}
$(document).ready(initNotification);