let editors = {};
let tb_notification;
function initNotificationTable() {
    let oldPage = 0;
    if ($.fn.DataTable.isDataTable('#tb_notification')) {
        oldPage = $('#tb_notification').DataTable().page();
        $('#tb_notification').DataTable().destroy();
    }
    if ($.fn.DataTable.isDataTable('#tb_notification')) {
        $('#tb_notification').DataTable().ajax.reload(null, false);
        return;
    }
    tb_notification = $('#tb_notification').DataTable({
        processing: true,
        serverSide: true,
        responsive: true,
        order: [[2, 'desc']],
        ajax: {
            url: "api/notification/list",
            type: "POST",
            data: function(d) {
                d.status = $("#filter_status").val();
            }
        },
        columns: [
            { 
                data: "status",
                className: 'text-center',
                orderable: false,
                searchable: false,
                render: function(data){
                    return `<i class="fa-solid fa-bell fa-2x ${(data == 'published') ? 'text-warning' : 'text-muted'}"></i>`;
                }
            },
            { 
                data: null,
                render: (_, __, row) => {
                    let title = '';
                    switch(currentLang) {
                        case 'en':
                            title = row.title_en;
                            break;
                        case 'lo':
                            title = row.title_lo || row.title_en;
                            break;
                        case 'th':
                            title = row.title_th || row.title_en;
                            break;
                    }
                    return title;
                }
            },
            {
                data: "publish_at",
                render: function (publish_at, type, row) {
                    return `
                        ${(row.status === 'published') ? publish_at : ''}
                    `;
                }
            },
            { data: "created_at" },
            { data: "notifications_view", className: "text-end" },
            {
                data: "status",
                render: function (status, type, row) {
                    return `
                        <div class="d-flex align-items-center gap-2">
                            <span class="badge bg-${status === 'published' ? 'success' : 'secondary'}" data-i18n="${status}"></span>
                            <div class="dropdown">
                                <button class="btn btn-sm border-0" data-bs-toggle="dropdown">
                                    <i class="fa-solid fa-angle-down"></i>
                                </button>
                                <ul class="dropdown-menu dropdown-menu-end shadow">
                                    <li class="${status === 'published' ? 'd-none' : ''}">
                                        <a class="dropdown-item change-status" data-id="${row.notifications_id}" data-status="published"><span data-i18n="published" class="text-success"></span></a>
                                    </li>
                                    <li class="${status === 'draft' ? 'd-none' : ''}">
                                        <a class="dropdown-item change-status" data-id="${row.notifications_id}" data-status="published"><span data-i18n="re-published" class="text-warning"></span></a>
                                    </li>
                                    <li class="${status === 'draft' ? 'd-none' : ''}">
                                        <a class="dropdown-item change-status" data-id="${row.notifications_id}" data-status="draft"><span data-i18n="draft" class="text-secondary"></span></a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    `
                }
            },
            {
                data: null,
                orderable: false,
                render: (_, __, row) => `
                    <button class="btn btn-light text-secondary view-notification" data-id="${row.notifications_id}">
                        <i class="fa-solid fa-folder-open"></i>
                    </button>
                    <button class="btn btn-light text-secondary manage-notification" data-id="${row.notifications_id}">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="btn btn-light text-danger delete-notification" data-id="${row.notifications_id}">
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                `
            }
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
            let $filter = $('#tb_notification_filter');
            let btn = `
                <button class="btn btn-primary btn-sm manage-notification" data-id="">
                    <i class="fa-solid fa-plus"></i> <span data-i18n="notification"></span>
                </button>
            `;
            $filter.append(btn);
            var input = $('#tb_notification_filter input').unbind();
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
$(".filter").on("change", () => initNotificationTable());
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
            <button class="btn btn-primary save-notification" data-i18n="save"></button>
        `);
        $modal.find(".modal-body").html(getNotificationForm(d));
        togglePublishControls();
        setMinDateTimeNow();
        $("#publish_at").on("change", function () {
            const min = $(this).attr("min");
            if (this.value < min) {
                showWarning(
                    langData['warning'] || 'Warning',
                    langData['past_date'] || 'You cannot select a past date and time.'
                );
                this.value = min;
            }
        });
        ClassicEditor.create(document.querySelector('#content_en'), {
            ckfinder: {
                uploadUrl: BASE_URL + '/public/uploads/upload_notification_image.php'
            }
        }).then(editor=>{
            editors['en'] = editor;
        });
        ClassicEditor.create(document.querySelector('#content_lo'), {
            ckfinder: {
                uploadUrl: BASE_URL + '/public/uploads/upload_notification_image.php'
            }
        }).then(editor=>{
            editors['lo'] = editor;
        });
        ClassicEditor.create(document.querySelector('#content_th'), {
            ckfinder: {
                uploadUrl: BASE_URL + '/public/uploads/upload_notification_image.php'
            }
        }).then(editor=>{
            editors['th'] = editor;
        });
        const $publishAtInput = $("#publish_at");
        const $publishNowCheck = $("#publish_now");
        $publishNowCheck.on("change", function () {
            if ($(this).is(":checked")) {
                $publishAtInput.prop("disabled", true);
                $publishAtInput.val("");
                $publishAtInput.removeClass("obj-required");
            } else {
                $publishAtInput.prop("disabled", false);
                $publishAtInput.addClass("obj-required");
            }
        });
        modal.show();
    }, "json");
});
function getNotificationForm(d) {
    return `
        <input type="hidden" id="notifications_id" value="${d.id ?? ''}">
        <ul class="nav nav-tabs mb-3">
            <li class="nav-item"><a class="nav-link active" data-bs-toggle="tab" href="#en">English</a></li>
            <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#lo">ລາວ</a></li>
            <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#th">ไทย</a></li>
        </ul>
        <div class="tab-content">
            ${langTab("en", d)}
            ${langTab("lo", d)}
            ${langTab("th", d)}
        </div>
        <div class="row g-3">
            <div class="col-md-4">
                <label class="mb-2 mt-3 required" data-i18n="status"></label>
                <select id="status" class="form-select obj-required">
                    <option value="draft" data-i18n="draft" ${(d.status === 'draft') ? 'selected' : ''}></option>
                    <option value="published" data-i18n="published" ${(d.status === 'published') ? 'selected' : ''}></option>
                </select>
            </div>
            <div class="col-md-4">
                <label class="mb-2 mt-3 required" data-i18n="publish_at"></label>
                <div class="d-flex gap-2">
                    <input type="datetime-local" id="publish_at" class="form-control obj-required" value="${d.publish_at ?? ''}">
                    <div class="form-check ms-2">
                        <input class="form-check-input" type="checkbox" id="publish_now">
                        <label class="form-check-label" for="publish_now">
                            Now
                        </label>
                    </div>
                </div>
            </div>
        </div>
    `;
}
function setMinDateTimeNow() {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    $("#publish_at").attr("min", local);
}
function togglePublishControls() {
    const status = $("#status").val();
    if (status === "draft") {
        $("#publish_at").prop("disabled", true);
        $("#publish_now").prop("disabled", true);
        $("#publish_at").removeClass("obj-required");
        $("#publish_now").removeClass("obj-required");
        $("#publish_at").val("");
    } else {
        $("#publish_at").prop("disabled", false);
        $("#publish_now").prop("disabled", false);
        $("#publish_at").addClass("obj-required");
        $("#publish_now").addClass("obj-required");
    }
}
$(document).on("change", "#status", togglePublishControls);
function langTab(lang, d) {
    return `
        <div class="tab-pane fade ${lang==='en' ? 'show active':''}" id="${lang}">
            <div class="mb-2">
                <label class="mb-2 ${lang === 'en' ? 'required' : ''}" data-i18n="title"></label>
                <input class="form-control ${lang === 'en' ? 'obj-required' : ''}" id="title_${lang}" value="${d.title[lang] ?? ''}">
            </div>
            <label class="mb-2" data-i18n="notification"></label>
            <textarea id="content_${lang}">${d.content[lang] ?? ''}</textarea>
        </div>
    `;
}
async function initNotification() {
    initNotificationTable();
}
$(document).ready(initNotification);
$(document).on('click', '.save-notification', function () {
    let errors = [];
    $('.obj-required').each(function () {
        let value = $(this).val()?.trim() || '';
        if (!value) {
            $(this).addClass('is-invalid');
            errors.push(this.name || this.id);
        } else {
            $(this).removeClass('is-invalid');
        }
    });
    if (errors.length) {
        showWarning(
            langData['validation_error'] || 'Validation Error',
            langData['required_star_message'] || 'Please fill all fields marked with *'
        );
        $('.is-invalid').first().focus();
        return;
    }
    saveNotifications();
});
function saveNotifications() {
    $(".save-notification").attr("disable", true);
    const notifications_id = $("#notifications_id").val() || "";
    const status = $("#status").val();
    const publish_at = $("#publish_at").val();
    const title_en = $("#title_en").val();
    const title_lo = $("#title_lo").val();
    const title_th = $("#title_th").val();
    const content_en = editors['en']?.getData() ?? '';
    const content_lo = editors['lo']?.getData() ?? '';
    const content_th = editors['th']?.getData() ?? '';
    const formData = new FormData();
    formData.append("notifications_id", notifications_id);
    formData.append("status", status);
    formData.append("publish_at", publish_at);
    formData.append("title_en", title_en);
    formData.append("title_lo", title_lo);
    formData.append("title_th", title_th);
    formData.append("content_en", content_en);
    formData.append("content_lo", content_lo);
    formData.append("content_th", content_th);
    $.ajax({
        url: "api/notification/save",
        type: "POST",
        data: formData,
        contentType: false,
        processData: false,
        xhr: function () {
            let xhr = new window.XMLHttpRequest();
            xhr.upload.addEventListener("progress", function (e) {
                if (e.lengthComputable) {
                    let percent = Math.round((e.loaded / e.total) * 100);
                    let bar = document.getElementById("swal-progress");
                    if (bar) {
                        bar.style.width = percent + "%";
                        bar.innerText = percent + "%";
                    }
                }
            });
            return xhr;
        },
        success: function (res) {
            if (res.status === true) {
                showSuccess('Success', langData['saved_successfully']);
                initNotificationTable();
                $('#windModal').modal('hide');
            } else {
                showError('Error', langData['cannot_save']);
            }
            $(".save-notification").attr("disable", false);
        },
        error: function () {
            showError('Error', langData['cannot_save']);
            $(".save-notification").attr("disable", false);
        }
    });
}
$(document).on('click', '.delete-notification', function() {
    let notifications_id = $(this).data("id");
    showConfirm(langData['confirm'], langData['confirm_delete'], function(){
        $.ajax({
            url: 'api/notification/delete',
            method: 'POST',
            data: { id: notifications_id },
            dataType: 'json',
            success: function(res) {
                if(res.status === true){
                    showSuccess('Success', langData['deleted_successfully']);
                    initNotificationTable();
                } else {
                    showError('Error', langData['cannot_delete']);
                }   
            },
            error: function(){
                showError('Error', langData['cannot_delete']);
            }
        });
    });
});
$(document).on('click', '.change-status', function() {
    let notifications_id = $(this).data("id");
    let status = $(this).data("status");
    showConfirm(langData['confirm'], langData['confirm_change'], function(){
        $.ajax({
            url: 'api/notification/change',
            method: 'POST',
            data: { 
                id: notifications_id,
                status: status,
            },
            dataType: 'json',
            success: function(res) {
                if(res.status === true){
                    showSuccess('Success', langData['change_successfully']);
                    initNotificationTable();
                } else {
                    showError('Error', langData['cannot_change']);
                }   
            },
            error: function(){
                showError('Error', langData['cannot_change']);
            }
        });
    });
});
$(document).on("click", ".view-notification", function () {
    const id = $(this).data("id");
    notificatinInfo(id, 'preview');
});