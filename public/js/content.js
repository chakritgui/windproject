function langTab(lang, d) {
    return `
        <div class="tab-pane fade ${lang === 'en' ? 'show active' : ''}" id="tab-${lang}">
            <div class="mb-3">
                <label class="form-label">Title</label>
                <input type="text" class="form-control" id="title_${lang}" value="${d.title?.[lang] || ''}">
            </div>
            <div class="mb-3">
                <label class="form-label">Content</label>
                <textarea class="form-control tinymce" id="content_${lang}" rows="10">${d.content?.[lang] || ''}</textarea>
            </div>
        </div>
    `;
}
function initTinyMCE() {
    tinymce.remove();
    let oldImages = [];
    const fontUrl = 'https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap';
    tinymce.init({
        selector: '#content_en, #content_lo, #content_th',
        height: 450,
        branding: false,
        promotion: false,
        plugins: 'image link lists table media code',
        toolbar: `
            undo redo | styles | fontfamily fontsize | bold italic underline |
            alignleft aligncenter alignright |
            bullist numlist | image media table |
            img25 img50 img100 | code
        `,
        font_family_formats: "TH Sarabun New=TH Sarabun New, Sarabun, sans-serif; Angsana New=Angsana New, sans-serif; Arial=arial,helvetica,sans-serif; Courier New=courier new,courier,monospace; Akbalthom=Akbalthom;",
        content_css: [fontUrl],
        content_style: `
            @import url('${fontUrl}');
            body { 
                font-family: 'TH Sarabun New', 'Sarabun', sans-serif; 
                font-size: 10pt; 
            }
            img { max-width:100%; height:auto; cursor: pointer; transition: 0.3s; }
            img:hover { outline: 3px solid #6366f1; }
        `,
        setup: function (editor) {
            editor.ui.registry.addButton('img25', { text: '25%', onAction: () => resizeImage(editor, '25%') });
            editor.ui.registry.addButton('img50', { text: '50%', onAction: () => resizeImage(editor, '50%') });
            editor.ui.registry.addButton('img100', { text: 'Full', onAction: () => resizeImage(editor, '100%') });
            editor.on('init', function () {
                oldImages = getImageList(editor);
                editor.execCommand('FontName', false, 'TH Sarabun New');
            });
            editor.on('change keyup', function () {
                let newImages = getImageList(editor);
                let removed = oldImages.filter(src => !newImages.includes(src));
                removed.forEach(src => {
                    fetch(BASE_URL + '/public/uploads/delete_content_image.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: src })
                    });
                });
                oldImages = newImages;
            });
        },
        automatic_uploads: true,
        images_upload_handler: function (blobInfo, progress) {
            return new Promise((resolve, reject) => {
                let formData = new FormData();
                formData.append('file', blobInfo.blob(), blobInfo.filename());
                fetch(BASE_URL + '/public/uploads/upload_content_image.php', {
                    method: 'POST',
                    body: formData
                }).then(r => r.json()).then(result => {
                    if (result && result.url) resolve(result.url);
                    else reject('Upload failed');
                }).catch(() => reject('Upload error'));
            });
        }
    });
}
function getImageList(editor) {
    let imgs = editor.getBody().querySelectorAll('img');
    let list = [];
    imgs.forEach(img => {
        let src = img.getAttribute('src');
        if (src) list.push(src);
    });
    return list;
}
function resizeImage(editor, width) {
    let img = editor.selection.getNode();
    if (img && img.nodeName === 'IMG') {
        img.style.width = width;
    }
}
function initCoverUpload() {
    const dropArea = document.getElementById("coverDropArea");
    const input = document.getElementById("cover");
    const preview = document.getElementById("coverPreview");
    const label = document.getElementById("coverDropLabel");
    const btnRemove = document.getElementById("btnRemoveCover");
    const ex_cover = document.getElementById("ex_cover");
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
        ex_cover.value = "";
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
function initAttachmentsUpload(existingAttachments = []) {
    const dropArea = document.getElementById("attachmentsDropArea");
    const input = document.getElementById("attachments");
    const list = document.getElementById("attachmentsList");
    let attachmentsData = [];
    existingAttachments.forEach(att => {
        attachmentsData.push({
            type: 'existing',
            id: att.id,
            name: att.name,
            url: att.url,
            size: att.size
        });
    });
    renderAttachments();
    dropArea.addEventListener("click", () => input.click());
    ["dragenter", "dragover"].forEach(ev =>
        dropArea.addEventListener(ev, e => {
            e.preventDefault();
            dropArea.classList.add("border-primary", "bg-light");
        })
    );
    ["dragleave", "drop"].forEach(ev =>
        dropArea.addEventListener(ev, e => {
            e.preventDefault();
            dropArea.classList.remove("border-primary", "bg-light");
        })
    );
    dropArea.addEventListener("drop", e => {
        const files = Array.from(e.dataTransfer.files);
        addFiles(files);
    });
    input.addEventListener("change", e => {
        const files = Array.from(e.target.files);
        addFiles(files);
        input.value = ""; 
    });
    function addFiles(files) {
        files.forEach(file => {
            attachmentsData.push({
                type: 'new',
                file: file,
                name: file.name,
                size: file.size
            });
        });
        renderAttachments();
    }
    function renderAttachments() {
        if (attachmentsData.length === 0) {
            list.innerHTML = '';
            return;
        }
        list.innerHTML = '<div class="list-group sortable-attachments">' +
            attachmentsData.map((att, index) => `
                <div class="list-group-item d-flex align-items-center" data-index="${index}">
                    <i class="fa-solid fa-file text-primary me-2 fs-5"></i>
                    <div class="flex-grow-1">
                        <div class="fw-medium">${att.name}</div>
                        <small class="text-muted">${formatFileSize(att.size)}</small>
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeAttachment(${index})"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            `).join('') +
            '</div>';
    }
    window.removeAttachment = function(index) {
        attachmentsData.splice(index, 1);
        renderAttachments();
    };
    window.getAttachmentsData = function() {
        return attachmentsData;
    };
}
function initImagesUpload(existingImages = []) {
    const dropArea = document.getElementById("imagesDropArea");
    const input = document.getElementById("images");
    const list = document.getElementById("imagesList");
    let imagesData = [];
    existingImages.forEach(img => {
        imagesData.push({
            type: 'existing',
            id: img.id,
            url: img.url,
            name: img.name || 'image'
        });
    });
    renderImages();
    dropArea.addEventListener("click", () => input.click());
    ["dragenter", "dragover"].forEach(ev =>
        dropArea.addEventListener(ev, e => {
            e.preventDefault();
            dropArea.classList.add("border-primary", "bg-light");
        })
    );
    ["dragleave", "drop"].forEach(ev =>
        dropArea.addEventListener(ev, e => {
            e.preventDefault();
            dropArea.classList.remove("border-primary", "bg-light");
        })
    );
    dropArea.addEventListener("drop", e => {
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        addFiles(files);
    });
    input.addEventListener("change", e => {
        const files = Array.from(e.target.files);
        addFiles(files);
        input.value = "";
    });
    function addFiles(files) {
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = e => {
                imagesData.push({
                    type: 'new',
                    file: file,
                    preview: e.target.result,
                    name: file.name
                });
                renderImages();
            };
            reader.readAsDataURL(file);
        });
    }
    function renderImages() {
        if (imagesData.length === 0) {
            list.innerHTML = '';
            return;
        }
        list.innerHTML = imagesData.map((img, index) => `
            <div class="col-4 col-md-3 col-lg-2" data-index="${index}">
                <div class="card">
                    <div class="position-relative">
                        <img src="${img.preview || img.url}" class="card-img-top" style="height: 100px; object-fit: contain;">
                        <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1" onclick="removeImage(${index})"><i class="fa-solid fa-x"></i></button>
                    </div>
                    <div class="card-body p-2">
                        <small class="text-muted text-truncate d-block">${img.name}</small>
                    </div>
                </div>
            </div>
        `).join('');
    }
    window.removeImage = function(index) {
        imagesData.splice(index, 1);
        renderImages();
    };
    window.getImagesData = function() {
        return imagesData;
    };
}
function init360ImagesUpload(existing360Images = []) {
    const dropArea = document.getElementById("images360DropArea");
    const input = document.getElementById("images360");
    const list = document.getElementById("images360List");
    let images360Data = [];
    existing360Images.forEach(img => {
        images360Data.push({
            type: 'existing',
            id: img.id,
            url: img.url,
            name: img.name || '360-image'
        });
    });
    render360Images();
    dropArea.addEventListener("click", () => input.click());
    ["dragenter", "dragover"].forEach(ev =>
        dropArea.addEventListener(ev, e => {
            e.preventDefault();
            dropArea.classList.add("border-primary", "bg-light");
        })
    );
    ["dragleave", "drop"].forEach(ev =>
        dropArea.addEventListener(ev, e => {
            e.preventDefault();
            dropArea.classList.remove("border-primary", "bg-light");
        })
    );
    dropArea.addEventListener("drop", e => {
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        addFiles(files);
    });
    input.addEventListener("change", e => {
        const files = Array.from(e.target.files);
        addFiles(files);
        input.value = "";
    });
    function addFiles(files) {
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = e => {
                images360Data.push({
                    type: 'new',
                    file: file,
                    preview: e.target.result,
                    name: file.name
                });
                render360Images();
            };
            reader.readAsDataURL(file);
        });
    }
    function render360Images() {
        if (images360Data.length === 0) {
            list.innerHTML = '';
            return;
        }
        list.innerHTML = images360Data.map((img, index) => `
            <div class="col-4 col-md-3 col-lg-2" data-index="${index}">
                <div class="card border-info">
                    <div class="position-relative">
                        <img src="${img.preview || img.url}" class="card-img-top" style="height: 100px; object-fit: contain;">
                        <div class="position-absolute top-0 start-0 m-1">
                            <span class="badge bg-info">360°</span>
                        </div>
                        <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1" onclick="remove360Image(${index})"><i class="fa-solid fa-x"></i></button>
                    </div>
                    <div class="card-body p-2">
                        <small class="text-muted text-truncate d-block">${img.name}</small>
                    </div>
                </div>
            </div>
        `).join('');
    }
    window.remove360Image = function(index) {
        images360Data.splice(index, 1);
        render360Images();
    };
    window.get360ImagesData = function() {
        return images360Data;
    };
}
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
function renderTabs() {
    return `
        <ul class="nav nav-pills nav-justified mb-4" id="contentTab" role="tablist">
            <li class="nav-item">
                <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#tab-basic" type="button">
                    <i class="fa-solid fa-pen-to-square me-2"></i>Content
                </button>
            </li>
            <li class="nav-item">
                <button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-gallery" type="button">
                    <i class="fa-solid fa-images me-2"></i><span data-i18n="gallery"></span>
                </button>
            </li>
            <li class="nav-item">
                <button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-360" type="button">
                    <i class="fa-solid fa-images me-2"></i><span data-i18n="360°"></span>
                </button>
            </li>
            <li class="nav-item">
                <button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-files" type="button">
                    <i class="fa-solid fa-file-arrow-up me-2"></i><span data-i18n="attachments"></span>
                </button>
            </li>
        </ul>
    `;
}
function renderGallery() {
    return `
        <div class="tab-pane fade" id="tab-gallery">
            <div class="mb-4">
                <label class="form-label fw-bold" data-i18n="upload2"></label>
                <div class="border border-2 border-dashed rounded-3 p-4 text-center" id="imagesDropArea" style="cursor: pointer; min-height: 120px;">
                    <input type="file" id="images" name="images[]" class="d-none" accept="image/*" multiple>
                    <div id="imagesDropLabel">
                        <i class="fa-solid fa-image fs-1 text-muted"></i>
                        <p class="mb-0 mt-2 text-muted" data-i18n="drop_here"></p>
                        <small class="text-muted" data-i18n="multiple_upload"></small>
                    </div>
                </div>
                <div id="imagesList" class="mt-3 row g-2"></div>
            </div>
        </div>
    `;
}
function render360() {
    return `
        <div class="tab-pane fade" id="tab-360">
            <div class="mb-4">
                <label class="form-label fw-bold" data-i18n="upload3"></label>
                <div class="border border-2 border-dashed rounded-3 p-4 text-center" 
                    id="images360DropArea" style="cursor: pointer; min-height: 120px;">
                    <input type="file" id="images360" name="images360[]" class="d-none" accept="image/*" multiple>
                    <div id="images360DropLabel">
                        <i class="fa-solid fa-maximize fs-1 text-muted"></i>
                        <p class="mb-0 mt-2 text-muted" data-i18n="drop_here"></p>
                        <small class="text-muted" data-i18n="multiple_upload"></small>
                    </div>
                </div>
                <div id="images360List" class="mt-3 row g-2"></div>
            </div>
        </div>
    `;
}
function renderFiles() {
    return `
        <div class="tab-pane fade" id="tab-files">
            <div class="mb-4">
                <label class="form-label fw-bold" data-i18n="upload1"></label>
                <div class="border border-2 border-dashed rounded-3 p-4 text-center" id="attachmentsDropArea" style="cursor: pointer; min-height: 120px;">
                    <input type="file" id="attachments" name="attachments[]" class="d-none" multiple>
                    <div id="attachmentsDropLabel">
                        <i class="fa-solid fa-paperclip fs-1 text-muted"></i>
                        <p class="mb-0 mt-2 text-muted" data-i18n="drop_here"></p>
                        <small class="text-muted" data-i18n="multiple_upload"></small>
                    </div>
                </div>
                <div id="attachmentsList" class="mt-3"></div>
            </div>
        </div>
    `;
}
function renderCover(d) {
    return `
        <div id="coverDropArea" class="cover-drop-area text-center mb-3">
            <input type="file" id="cover" accept="image/*" hidden>
            <div id="coverPreviewWrapper" class="h-100 d-flex align-items-center justify-content-center">
                ${d.cover 
                    ? `<img id="coverPreview" src="${BASE_URL}/${d.cover}" class="img-fluid rounded shadow-sm" style="max-height:150px;">`
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
        <input type="hidden" id="ex_cover" value="${d.cover ? d.cover : ''}">
    `;
}
function renderLangTabs(d) {
    return `
        <div class="mb-3">
            <label class="form-label fw-bold">Content</label>
            <ul class="nav nav-tabs" role="tablist">
                <li class="nav-item"><a class="nav-link active" data-bs-toggle="tab" href="#tab-en">English</a></li>
                <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tab-lo">ລາວ</a></li>
                <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tab-th">ไทย</a></li>
            </ul>
            <div class="tab-content border border-top-0 p-3">
                ${langTab("en", d)}
                ${langTab("lo", d)}
                ${langTab("th", d)}
            </div>
        </div>
    `;
}