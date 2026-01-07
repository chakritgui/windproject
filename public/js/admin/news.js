let editors = {};
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
        order: [[2, 'desc']],
        ajax: {
            url: "api/news/list",
            type: "POST",
            data: function(d) {
                d.status = $("#filter_status").val();
            }
        },
        columns: [
            { 
                data: "cover",
                className: 'text-center',
                orderable: false,
                searchable: false,
                render: function(data){
                    if (!data) {
                        return `<img src="${BASE_URL}/public/images/noimage.jpg" style="height:60px; border-radius:6px; object-fit:cover;">`;
                    }
                    return `
                        <img src="${BASE_URL}/${data}" style="height:60px; border-radius:6px; object-fit:cover;">
                    `;
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
            { data: "news_view", className: "text-end" },
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
                                        <a class="dropdown-item change-status" data-id="${row.news_id}" data-status="published"><span data-i18n="published" class="text-success"></span></a>
                                    </li>
                                    <li class="${status === 'draft' ? 'd-none' : ''}">
                                        <a class="dropdown-item change-status" data-id="${row.news_id}" data-status="published"><span data-i18n="re-published" class="text-warning"></span></a>
                                    </li>
                                    <li class="${status === 'draft' ? 'd-none' : ''}">
                                        <a class="dropdown-item change-status" data-id="${row.news_id}" data-status="draft"><span data-i18n="draft" class="text-secondary"></span></a>
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
                    <button class="btn btn-light text-secondary view-news" data-id="${row.news_id}">
                        <i class="fa-solid fa-folder-open"></i>
                    </button>
                    <button class="btn btn-light text-secondary manage-news" data-id="${row.news_id}">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="btn btn-light text-danger delete-news" data-id="${row.news_id}">
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
        $modal.find(".modal-body").html(getNewsForm(d, publishTime));
        togglePublishControls();
        setMinDateToday();
        initSelect2Remote('#status', 'api/news/filter', { type: 'status' });
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
        ClassicEditor.create(document.querySelector('#content_en'), {
            ckfinder: {
                uploadUrl: BASE_URL + '/public/uploads/upload_news_image.php'
            }
        }).then(editor=>{
            editors['en'] = editor;
        });
        ClassicEditor.create(document.querySelector('#content_lo'), {
            ckfinder: {
                uploadUrl: BASE_URL + '/public/uploads/upload_news_image.php'
            }
        }).then(editor=>{
            editors['lo'] = editor;
        });
        ClassicEditor.create(document.querySelector('#content_th'), {
            ckfinder: {
                uploadUrl: BASE_URL + '/public/uploads/upload_news_image.php'
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
        initDatePicker('#publish_date');
        if (publishDate) {
            $('#publish_date').datepicker('setDate', publishDate);
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
        modal.show();
    }, "json");
});
function getNewsForm(d, publishTime) {
    return `
        <input type="hidden" id="news_id" value="${d.id ?? ''}">
        <div id="coverDropArea" class="cover-drop-area text-center mb-3">
            <input type="file" id="cover" accept="image/*" hidden>
            <div id="coverPreviewWrapper" class="h-100 d-flex align-items-center justify-content-center">
                ${d.cover 
                    ? `<img id="coverPreview" src="${d.cover}" class="img-fluid rounded shadow-sm" style="max-height:150px;">`
                    : `<img id="coverPreview" class="img-fluid rounded shadow-sm d-none" style="max-height:150px;">`
                }
            </div>
            <div id="coverDropLabel" class="${d.cover ? 'd-none' : ''}">
                <div class="fw-bold fs-6 mt-2" data-i18n="dropHere"></div>
                <div class="text-muted small mb-2">
                    <span data-i18n="or"></span> <span data-i18n="choose"></span>
                </div>
            </div>
            <div class="text-muted small mt-2" data-i18n="allow_images_only"></div>
            <button type="button" id="btnRemoveCover" class="btn btn-sm btn-outline-danger mt-2 ${d.cover ? '' : 'd-none'}" data-i18n="remove"></button>
        </div>
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
    `;
}
function initCoverUpload() {
    const dropArea = document.getElementById("coverDropArea");
    const input = document.getElementById("cover");
    const preview = document.getElementById("coverPreview");
    const label = document.getElementById("coverDropLabel");
    const btnRemove = document.getElementById("btnRemoveCover");
    dropArea.addEventListener("click", () => input.click());
    ["dragenter", "dragover"].forEach(ev =>
        dropArea.addEventListener(ev, e => {
            e.preventDefault();
            dropArea.classList.add("border-primary");
        })
    );
    ["dragleave", "drop"].forEach(ev =>
        dropArea.addEventListener(ev, e => {
            e.preventDefault();
            dropArea.classList.remove("border-primary");
        })
    );
    dropArea.addEventListener("drop", e => {
        const file = e.dataTransfer.files[0];
        if (file) showPreview(file);
    });
    input.addEventListener("change", e => {
        const file = e.target.files[0];
        if (file) showPreview(file);
    });
    btnRemove.addEventListener("click", e => {
        e.stopPropagation();
        input.value = "";
        preview.src = "";
        preview.classList.add("d-none");
        label.classList.remove("d-none");
        btnRemove.classList.add("d-none");
    });
    function showPreview(file) {
        const validExt = ["jpg","jpeg","png","gif","webp"];
        const ext = file.name.split(".").pop().toLowerCase();
        if (!file.type.startsWith("image/") && !validExt.includes(ext)) {
            showWarning(
                langData['validation_error'] || 'Validation Error',
                langData['allow_images_only'] || 'Allow images only (jpg, jpeg, png, gif, webp)'
            );
            input.value = "";
            return;
        } 
        const reader = new FileReader();
        reader.onload = e => {
            preview.src = e.target.result;
            preview.classList.remove("d-none");
            label.classList.add("d-none");
            btnRemove.classList.remove("d-none");
        };
        reader.readAsDataURL(file);
    }
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
function langTab(lang, d) {
    return `
        <div class="tab-pane fade ${lang==='en' ? 'show active':''}" id="${lang}">
            <div class="mb-2">
                <label class="mb-2 ${lang === 'en' ? 'required' : ''}" data-i18n="title"></label>
                <input class="form-control ${lang === 'en' ? 'obj-required' : ''}" id="title_${lang}" value="${d.title[lang] ?? ''}">
            </div>
            <label class="mb-2" data-i18n="news"></label>
            <textarea id="content_${lang}">${d.content[lang] ?? ''}</textarea>
        </div>
    `;
}
async function initNews() {
    initNewsTable();
}
$(document).ready(function () {
    initNews();
    initSelect2Remote('#filter_status', 'api/news/filter', { type: 'status' });
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
    $(".save-news").attr("disable", true);
    const news_id = $("#news_id").val() || "";
    const status = $("#status").val();
    const publish_at = buildPublishAt();
    const title_en = $("#title_en").val();
    const title_lo = $("#title_lo").val();
    const title_th = $("#title_th").val();
    const content_en = editors['en']?.getData() ?? '';
    const content_lo = editors['lo']?.getData() ?? '';
    const content_th = editors['th']?.getData() ?? '';
    const cover = $("#cover")[0].files[0] || null;
    const formData = new FormData();
    formData.append("news_id", news_id);
    formData.append("status", status);
    formData.append("publish_at", publish_at);
    formData.append("title_en", title_en);
    formData.append("title_lo", title_lo);
    formData.append("title_th", title_th);
    formData.append("content_en", content_en);
    formData.append("content_lo", content_lo);
    formData.append("content_th", content_th);
    formData.append("cover", cover);
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
            if (res.status === true) {
                showSuccess('Success', langData['saved_successfully']);
                initNewsTable();
                $('#windModal').modal('hide');
            } else {
                showError('Error', langData['cannot_save']);
            }
            $(".save-news").attr("disable", false);
        },
        error: function () {
            showError('Error', langData['cannot_save']);
            $(".save-news").attr("disable", false);
        }
    });
}
$(document).on('click', '.delete-news', function() {
    let news_id = $(this).data("id");
    showConfirm(langData['confirm'], langData['confirm_delete'], function(){
        $.ajax({
            url: 'api/news/delete',
            method: 'POST',
            data: { id: news_id },
            dataType: 'json',
            success: function(res) {
                if(res.status === true){
                    showSuccess('Success', langData['deleted_successfully']);
                    initNewsTable();
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
    let news_id = $(this).data("id");
    let status = $(this).data("status");
    showConfirm(langData['confirm'], langData['confirm_change'], function(){
        $.ajax({
            url: 'api/news/change',
            method: 'POST',
            data: { 
                id: news_id,
                status: status,
            },
            dataType: 'json',
            success: function(res) {
                if(res.status === true){
                    showSuccess('Success', langData['change_successfully']);
                    initNewsTable();
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
$(document).on("click", ".view-news", function () {
    const id = $(this).data("id");
    notificatinInfo(id, 'preview');
});