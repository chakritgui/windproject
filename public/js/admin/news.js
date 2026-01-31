let tb_news;
function initNewsTable() {
    let oldPage = 0;
    if ($.fn.DataTable.isDataTable('#tb_news')) {
        oldPage = $('#tb_news').DataTable().page();
        $('#tb_news').DataTable().destroy();
    }
    if ($.fn.DataTable.isDataTable('#tb_news')) {
        $('#tb_news').DataTable().ajax.reload(null, false);
        return;
    }
    tb_news = $('#tb_news').DataTable({
        processing: true,
        serverSide: true,
        responsive: true,
        ordering: false,
        order: [[2, 'desc']],
        ajax: {
            url: "api/news/list",
            type: "POST",
            data: function(d) {
                d.status = $("#filter_status").val();
            }
        },
        columns: [{ 
            data: "cover",
            className: 'text-center',
            orderable: false,
            searchable: false,
            render: function(data){
                if (!data) {
                    return `<div style="width: 50px; height: 50px; line-height: 50px; overflow: hidden; margin: 0 auto; border-radius: 4px; border: 1px solid #eee;"><img src="${BASE_URL}/public/images/noimage.jpg" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='${BASE_URL}/public/images/noimage.jpg';"></div>`;
                }
                return `
                    <div style="width: 50px; height: 50px; line-height: 50px; overflow: hidden; margin: 0 auto; border-radius: 4px; border: 1px solid #eee;">
                        <img src="${BASE_URL}/${data}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='${BASE_URL}/public/images/noimage.jpg';">
                    </div>
                `;
            }
        },{ 
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
        },{
            data: "publish_at",
            render: function (publish_at, type, row) {
                return `
                    ${(row.status === 'published') ? publish_at : ''}
                `;
            }
        },{ 
            data: "created_at" 
        },{ 
            data: "content_view", 
            className: "text-end" 
        },{
            data: "status",
            render: function (status, type, row) {
                let badge = '';
                switch(status) {
                    case "published":
                        badge = "success";
                        break;
                    default:
                        badge = "secondary";
                }
                return `
                    <div class="d-flex align-items-center gap-2">
                        <span class="badge bg-${badge}-subtle text-${badge}" data-i18n="${status}"></span>
                    </div>
                `
            }
        },{
            data: null,
            orderable: false,
            render: (_, __, row) => `
                <div class="btn-group border rounded-3 bg-white">
                    <button class="btn btn-link text-info py-1 view-content" data-id="${row.content_id}"><i class="fa-solid fa-eye"></i></button>
                    <button class="btn btn-link text-warning py-1 border-start manage-news" data-id="${row.content_id}"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="btn btn-link text-danger py-1 border-start delete-news" data-id="${row.content_id}"><i class="fa-regular fa-trash-can"></i></button>
                </div>
            `
        }],
        pageLength: pageLength,
        lengthMenu: lengthMenu,
        stateLoadParams: function (settings, data) {
            data.start = oldPage;
            data.length = pageLength; 
        },
        language: getTableLang(),
        initComplete: function(){
            let $filter = $('#tb_news_filter');
            let btn = `
                <button class="btn btn-primary btn-sm manage-news" data-id="">
                    <i class="fa-solid fa-plus"></i> <span data-i18n="news"></span>
                </button>
            `;
            $filter.append(btn);
            var input = $('#tb_news_filter input').unbind();
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
$(document).on('click', '.view-content', function() {
    let content_id = $(this).data("content");
    viewContent(content_id);
});
$(".filter").on("change", () => initNewsTable());
$(document).on("click", ".manage-news", function () {
    let id = $(this).data("id") ?? "";
    $.post("api/news/get", { id }, function(res) {
        if(res.status !== "success") return;
        let d = res.data;
        let $modal = $("#windModal");
        let modal = new bootstrap.Modal($modal[0]);
        $modal.find(".modal-header").html(`
            <h5 class="modal-title" data-i18n="news_management"></h5>
            <button class="btn-close" data-bs-dismiss="modal"></button>
        `);
        $modal.find(".modal-footer").html(`
            <button class="btn btn-secondary" data-bs-dismiss="modal" data-i18n="close"></button>
            <button class="btn btn-primary save-news" data-i18n="save"></button>
        `);
        const publishAt = d.publish_at ? new Date(d.publish_at) : null;
        const publishDate = publishAt ? publishAt.toISOString().slice(0,10) : '';
        const publishTime = publishAt ? publishAt.toTimeString().slice(0,5) : '';
        $modal.find(".modal-body").html(getContentForm(d, publishTime));
        togglePublishControls();
        setMinDateToday();
        initSelect2Remote('#status', `${BASE_URL}/api/news/filter`, { type: 'status' });
        let status = (d.status) ? d.status : 'draft';
        if (status) {
            let statusName = status.charAt(0).toUpperCase() + status.slice(1);
            var newOptionStatus = new Option(statusName, status, true, true);
            $('#status').append(newOptionStatus).trigger('change');
        }
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
        initDatePicker('#publish_date');
        if (publishDate) {
            let d = new Date(publishDate);
            $('#publish_date').datepicker('setDate', d);
        }
        document.querySelectorAll('.timepicker').forEach(el => {
            if (el.dataset.tdInit) return;
            const picker = new tempusDominus.TempusDominus(el, {
                stepping: 1,
                display: {
                    viewMode: 'clock',
                    components: {
                        calendar: false,
                        hours: true,
                        minutes: true,
                        seconds: false
                    }
                },
                localization: {
                    format: 'HH:mm',
                    hourCycle: 'h23'
                }
            });
            el.addEventListener('change.td', (e) => {
                if (e.detail && e.detail.date) {
                    picker.hide();
                }
            });
            el.dataset.tdInit = 1;
        });
        initCoverUpload();
        initAttachmentsUpload(d.attachments || []);
        initImagesUpload(d.images || []);
        init360ImagesUpload(d.images360 || []);
        initTinyMCE();
        modal.show();
    }, "json");
});
function getContentForm(d, publishTime) {
    return `
        <form id="contentForm">
            ${renderTabs()}
            <div class="tab-content">
                <div class="tab-pane fade show active" id="tab-basic">
                    ${renderCover(d)}
                    ${renderLangTabs(d)}
                    <div class="row g-3">
                        <div class="col-md-4">
                            <label class="mb-2 mt-3 required" data-i18n="status"></label>
                            <select id="status" class="form-select obj-required"></select>
                        </div>
                        <div class="col-md-4">
                            <label class="mb-2 mt-3 required" data-i18n="publish_date"></label>
                            <input type="text" id="publish_date" class="form-control obj-required">
                            <div class="form-check mt-2">
                                <input class="form-check-input" type="checkbox" id="publish_now">
                                <label class="form-check-label" for="publish_now"  data-i18n="publish_now"></label>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <label class="mb-2 mt-3 required" data-i18n="publish_time"></label>
                            <input type="text" id="publish_time" class="form-control timepicker obj-required" value="${publishTime}" placeholder="HH:mm">
                        </div>
                    </div>
                </div>
                ${renderGallery()}
                ${render360()}
                ${renderFiles()}
            </div>
            <input type="hidden" id="content_id" value="${d.id ?? ''}">
        </form>
    `;
}
function setMinDateToday() {
    const today = new Date().toISOString().slice(0,10);
    $("#publish_date").attr("min", today);
}
$(document).on("change", "#publish_now", function () {
    const checked = $(this).is(":checked");
    $("#publish_date, #publish_time").prop("disabled", checked).toggleClass("obj-required", !checked);
    if (checked) {
        $("#publish_date, #publish_time").val("");
    }
});
function togglePublishControls() {
    const isDraft = $("#status").val() === "draft";
    $("#publish_date, #publish_time, #publish_now").prop("disabled", isDraft);
    $("#publish_date, #publish_time").toggleClass("obj-required", !isDraft);
    if (isDraft) {
        $("#publish_date, #publish_time").val("");
        $("#publish_now").prop("checked", false);
    }
}
function buildPublishAt() {
    if ($("#publish_now").is(":checked")) {
        return moment().format("YYYY-MM-DD HH:mm:ss");
    }
    const d = $("#publish_date").val();
    const t = $("#publish_time").val();
    if (!d || !t) return null;
    return `${d} ${t}:00`;
}
$(document).on("change", "#status", togglePublishControls);
async function initNews() {
    initNewsTable();
}
$(document).ready(function () {
    initNews();
    initSelect2Remote('#filter_status', `${BASE_URL}/api/news/filter`, { type: 'status' });
});
$(document).on('click', '.save-news', function () {
    $('.is-invalid').removeClass('is-invalid');
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
    saveNews();
});
function saveNews() {
    const btn = $(".save-news");
    btn.prop("disabled", true);
    const formData = new FormData($('#contentForm')[0]);
    const attachments = window.getAttachmentsData();
    attachments.forEach((att, index) => {
        if (att.type === 'new') {
            formData.append('new_attachments[]', att.file);
        } else {
            formData.append('existing_attachments[]', att.id);
        }
    });
    const images = window.getImagesData();
    images.forEach((img, index) => {
        if (img.type === 'new') {
            formData.append('new_images[]', img.file);
        } else {
            formData.append('existing_images[]', img.id);
        }
    });
    const images360 = window.get360ImagesData();
    images360.forEach((img, index) => {
        if (img.type === 'new') {
            formData.append('new_images360[]', img.file);
        } else {
            formData.append('existing_images360[]', img.id);
        }
    });
    formData.append("content_id", $("#content_id").val() || "");
    formData.append("status", $("#status").val());
    formData.append("publish_at", typeof buildPublishAt === "function" ? buildPublishAt() : "");
    formData.append("title_en", $("#title_en").val());
    formData.append("title_lo", $("#title_lo").val());
    formData.append("ex_cover", $("#ex_cover").val());
    formData.append("title_th", $("#title_th").val());
    formData.append("content_en", tinymce.get('content_en')?.getContent() || '');
    formData.append("content_lo", tinymce.get('content_lo')?.getContent() || '');
    formData.append("content_th", tinymce.get('content_th')?.getContent() || '');
    const cover = $("#cover")[0].files[0] || null;
    if (cover) {
        formData.append("cover", cover);
    }
    Swal.fire({
        title: langData['saving'] || 'Saving News...',
        html: `
            <p>Please do not close this page.</p>
            <div class="progress mt-2">
                <div id="swal-progress" class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width:0%">0%</div>
            </div>
        `,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });
    $.ajax({
        url: "api/news/save",
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
            Swal.close();
            if (res.status === true) {
                showSuccess('Success', langData['saved_successfully']);
                if (typeof initNewsTable === "function") initNewsTable();
                $('#windModal').modal('hide');
            } else {
                showError('Error', (langData['cannot_save'] || 'Error: ') + (res.message || 'Unknown error'));
            }
        },
        error: function (xhr, status, error) {
            Swal.close();
            let msg = langData['cannot_save'];
            try {
                let res = JSON.parse(xhr.responseText);
                if (res.message) msg += ": " + res.message;
            } catch (e) {}
            showError('Error', msg);
        },
        complete: function() {
            btn.prop("disabled", false);
        }
    });
}
$(document).on('click', '.delete-news', function() {
    let content_id = $(this).data("id");
    showConfirm(langData['confirm'], langData['confirm_delete'], function(){
        $.ajax({
            url: `${BASE_URL}/api/news/delete`,
            method: 'POST',
            data: { id: content_id },
            dataType: 'json',
            success: function(res) {
                if(res.status === true){
                    showSuccess('Success', langData['deleted_successfully']);
                    initNewsTable();
                } else {
                    showError('Error', langData['cannot_delete']);
                }   
            },
            error: function (xhr, status, error) {
                let msg = langData['cannot_delete'];
                try {
                    let res = JSON.parse(xhr.responseText);
                    if (res.message) msg += ": " + res.message;
                } catch (e) {}
                showError('Error', msg);
            }
        });
    });
});
$(document).on("click", ".view-news", function () {
    const id = $(this).data("id");
    viewNews(id);
});
function viewNews(id) {
    $.post("api/project/gets", { id }, function(res) {
        if(res.status !== "success") return;
        let d = res.data;
        let $modal = $("#windModal");
        let modal = new bootstrap.Modal($modal[0]);
        $modal.find(".modal-header").html(`
            <h5 class="modal-title">${d.title.th || d.title.en}</h5>
            <button class="btn-close" data-bs-dismiss="modal"></button>
        `);
        $modal.find(".modal-footer").html(`
            <button class="btn btn-secondary" data-bs-dismiss="modal" data-i18n="close"></button>
        `);
        $modal.find(".modal-body").html(`
            <div class="content-view">
                <ul class="nav nav-tabs mb-3">
                    <li class="nav-item"><a class="nav-link active" data-bs-toggle="tab" href="#view_en">English</a></li>
                    <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#view_lo">ລາວ</a></li>
                    <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#view_th">ไทย</a></li>
                </ul>
                <div class="tab-content">
                    <div class="tab-pane fade show active" id="view_en">${d.content.en || ''}</div>
                    <div class="tab-pane fade" id="view_lo">${d.content.lo || ''}</div>
                    <div class="tab-pane fade" id="view_th">${d.content.th || ''}</div>
                </div>
            </div>
        `);
        modal.show();
    }, "json");
}