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
            data: "cover_image",
            className: 'text-center',
            render: data => {
                const imgUrl = data ? `${BASE_URL}/${data}` : `${BASE_URL}/public/images/noimage.jpg`;
                return `
                    <div class="news-cover-wrapper mx-auto">
                        <img src="${imgUrl}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='${BASE_URL}/public/images/noimage.jpg';">
                    </div>`;
            }
        },{ 
            data: null,
            render: (data, type, row) => {
                let title = row[`subject_${currentLang}`] || row.subject_en || 'No Title';
                let statusHtml = `
                    <div class="mt-1">
                        ${renderLangStatus('en', row.en_status)}
                        ${renderLangStatus('th', row.th_status)}
                        ${renderLangStatus('lo', row.lo_status)}
                    </div>
                `;
                let badgeHtml = '';
                if (parseInt(row.count_attachment) > 0) {
                    badgeHtml += `
                        <span class="badge rounded-pill bg-danger-subtle text-danger me-1">
                            <i class="fa-solid fa-file-pdf"></i>
                            ${langData['document'] || 'Document'}
                        </span>
                    `;
                }
                if (parseInt(row.count_image) > 0) {
                    badgeHtml += `
                        <span class="badge rounded-pill bg-primary-subtle text-primary me-1">
                            <i class="fa-solid fa-images"></i>
                            ${langData['image'] || 'Image'}
                        </span>
                    `;
                }
                if (parseInt(row.count_image360) > 0) {
                    badgeHtml += `
                        <span class="badge rounded-pill bg-success-subtle text-success me-1">
                            <i class="fa-solid fa-vr-cardboard"></i>
                            ${langData['vr'] || 'VR'}
                        </span>
                    `;
                }
                return `
                    <div class="fw-bold text-dark">${title}</div>
                    <div class="mt-1">${badgeHtml}</div>
                    ${statusHtml}
                `;
            }
        },{
            data: "publish_at",
            render: (data, type, row) => {
                if (row.status !== 'published' || !data) return `<span class="text-muted small">-</span>`;
                return `<div class="small"><i class="fa-regular fa-calendar-check me-1"></i> ${data}</div>`;
            }
        },{ 
            data: "created_at",
            render: data => `<div class="small text-muted">${data}</div>`
        },{ 
            data: "content_view", 
            className: "text-end",
            render: data => `<strong>${Number(data).toLocaleString()}</strong>` 
        },{
            data: "status",
            render: status => {
                const isPub = status === "published";
                const bg = isPub ? "success" : "secondary";
                return `<span class="badge rounded-pill bg-${bg}-subtle text-${bg}"><span>${langData[status] || 'status'}</span></span>`;
            }
        },{
            data: null,
            className: "text-center",
            render: (data, type, row) => `
                <div class="btn-group border rounded-3 bg-white">
                    <a class="btn btn-link text-info" href="${BASE_URL}/content/preview/${row.content_slug}" target="_blank"><i class="fa-solid fa-eye"></i></a>
                    <button class="btn btn-link text-warning py-1 border-start manage-news" data-id="${row.content_id}" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="btn btn-link text-danger py-1 border-start delete-news" data-id="${row.content_id}" title="Delete"><i class="fa-regular fa-trash-can"></i></button>
                </div>`
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
                    <i class="fa-solid fa-plus"></i> <span>${langData['news'] || 'News'}</span>
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
$(".filter").on("change", () => initNewsTable());
$(document).on("click", ".manage-news", function () {
    let id = $(this).data("id") ?? "";
    $.post("api/news/get", { id }, function(res) {
        if(res.status !== "success") return;
        let d = res.data;
        let $modal = $("#windModal");
        let modal = new bootstrap.Modal($modal[0]);
        $modal.find(".modal-header").html(`
            <h5 class="modal-title">${langData['news_management'] || 'News Management'}</h5>
            <button class="btn-close" data-bs-dismiss="modal"></button>
        `);
        $modal.find(".modal-footer").html(`
            <div class="row w-100"> 
                <div class="col-6 d-flex align-items-center">
                    <div class="form-check mb-0">
                        <input class="form-check-input" type="checkbox" id="auto_translate" value="yes">
                        <label class="form-check-label" for="auto_translate">
                            ${langData['auto_translate'] || 'Auto Translate'}
                        </label>
                    </div>
                </div>
                <div class="col-6 text-end">
                    <button type="button" class="btn btn-primary save-news me-2">
                        ${langData['save'] || 'Save'}
                    </button>
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
                        ${langData['close'] || 'Close'}
                    </button>
                </div>
            </div>
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
                            <label class="mb-2 mt-3 required">${langData['status'] || 'Status'}</label>
                            <select id="status" class="form-select obj-required"></select>
                        </div>
                        <div class="col-md-4">
                            <label class="mb-2 mt-3 required">${langData['publish_date'] || 'Publish Date'}</label>
                            <input type="text" id="publish_date" class="form-control obj-required">
                            <div class="form-check mt-2">
                                <input class="form-check-input" type="checkbox" id="publish_now">
                                <label class="form-check-label" for="publish_now">${langData['publish_now'] || 'Publish Now'}</label>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <label class="mb-2 mt-3 required">${langData['publish_time'] || 'Publish Time'}</label>
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
    formData.append("auto_translate", $("#auto_translate").is(":checked") ? 'yes' : 'no');
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
            <p>${langData['please_do_not_close_this_page'] || 'Please do not close this page.'}</p>
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