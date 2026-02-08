function langTab(lang, d, isDefault = false) {
    const status = d.status_translate?.[lang] || '';
    const response = d.response?.[lang] || '';
    const translate_with = d.translate_with?.[lang] || '';
    let rawContent = d.content?.[lang] || '';
    const cleanCheck = rawContent.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim();
    if (cleanCheck === '' && !rawContent.includes('<img')) {
        rawContent = '';
    }
    const renderTranslateMethod = (method) => {
        if (status === 'wait') return ''; 
        if (method === 'ai') {
            return `<span class="badge bg-warning-subtle text-warning border border-warning-subtle" title="AI"><i class="fa-solid fa-wand-magic-sparkles"></i> AI</span>`;
        } else if (method === 'self') {
            return `<span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle" title="Manual"><i class="fa-solid fa-language"></i> Self</span>`;
        }
        return '';
    };
    const requiredAttr = isDefault ? 'obj-required' : '';
    const labelSuffix = isDefault ? 'required' : '';
    return `
        <div class="mb-3 d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center gap-2">
                <strong class="fs-5">${lang.toUpperCase()}</strong>
                ${typeof renderLangStatus === 'function' ? renderLangStatus(lang, status, translate_with) : ''}
                ${renderTranslateMethod(translate_with)}
            </div>
        </div>
        ${status === 'failed' && response ? `<div class="alert alert-danger py-2 small">${response}</div>` : ''}
        <div class="mb-3">
            <label class="form-label fw-bold ${labelSuffix}">${currentLang['title'] || 'Title'}</label>
            <input type="text" class="form-control ${requiredAttr}" id="title_${lang}" value="${d.title?.[lang] || ''}">
        </div>
        <div class="mb-3">
            <label class="form-label fw-bold">${currentLang['content'] || 'Content'}</label>
            <textarea class="form-control summernote" id="content_${lang}" rows="10">${rawContent}</textarea>
        </div>
    `;
}
function initSummernote() {
    $('.summernote').summernote({
        dialogsInBody: true,
        height: 450,
        dropdownParent: document.body,
        toolbar: [
            ['style', ['bold', 'italic', 'underline']],
            ['para', ['ul', 'ol']],
            ['insert', ['picture', 'link']],
            ['custom', ['img25', 'img50', 'img100']],
            ['view', ['codeview']]
        ],
        buttons: {
            img25: function () {
                return $.summernote.ui.button({
                    contents: '25%',
                    tooltip: 'Image 25%',
                    click: function () {
                        resizeImage('25%');
                    }
                }).render();
            },
            img50: function () {
                return $.summernote.ui.button({
                    contents: '50%',
                    tooltip: 'Image 50%',
                    click: function () {
                        resizeImage('50%');
                    }
                }).render();
            },
            img100: function () {
                return $.summernote.ui.button({
                    contents: 'Full',
                    tooltip: 'Image 100%',
                    click: function () {
                        resizeImage('100%');
                    }
                }).render();
            }
        },
        callbacks: {
            onImageUpload: function(files) {
                uploadImage(files[0], this);
            },
            onChange: function(contents) {
                handleRemovedImages(this, contents);
            }
        }
    });
}
function uploadImage(file, editor) {
    let data = new FormData();
    data.append('file', file);
    $.ajax({
        url: BASE_URL + '/public/uploads/upload_content_image.php',
        type: 'POST',
        data: data,
        processData: false,
        contentType: false,
        success: function (res) {
            let result = typeof res === 'string' ? JSON.parse(res) : res;
            if (result.uploaded && result.url) {
                $(editor).summernote('insertImage', result.url);
            }
        },
        error: function () {
            alert('Upload image failed');
        }
    });
}
let oldImages = [];
function handleRemovedImages(editor, contents) {
    let div = document.createElement('div');
    div.innerHTML = contents;
    let imgs = [...div.querySelectorAll('img')].map(i => i.src);
    let removed = oldImages.filter(src => !imgs.includes(src));
    removed.forEach(src => {
        $.post(
            BASE_URL + '/public/uploads/delete_content_image.php',
            JSON.stringify({ url: src })
        );
    });
    oldImages = imgs;
}
function resizeImage(width) {
    let img = document.getSelection()?.anchorNode?.parentElement;
    if (img && img.tagName === 'IMG') {
        img.style.width = width;
    }
}
$(document).on('click', '.note-modal .close', function () {
    $(this).closest('.modal').modal('hide');
});
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
            showWarning(langData['allow_images_only'] || 'Allow images only (jpg, jpeg, png, gif, webp)');
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
        <ul class="nav nav-pills nav-justified mb-4" id="mainTabs" role="tablist">
            <li class="nav-item">
                <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#tab-basic" type="button">
                    <i class="fa-solid fa-pen-to-square me-2"></i><span>${langData['content'] || 'Content'}</span>
                </button>
            </li>
            <li class="nav-item">
                <button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-gallery" type="button">
                    <i class="fa-solid fa-images me-2"></i><span>${langData['gallery'] || 'Gallery'}</span>
                </button>
            </li>
            <li class="nav-item">
                <button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-360" type="button">
                    <i class="fa-solid fa-images me-2"></i><span>${langData['360°'] || '360°'}</span>
                </button>
            </li>
            <li class="nav-item">
                <button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-files" type="button">
                    <i class="fa-solid fa-file-arrow-up me-2"></i><span>${langData['attachments'] || 'Attachments'}</span>
                </button>
            </li>
        </ul>
    `;
}
function renderGallery() {
    return `
        <div class="tab-pane fade" id="tab-gallery">
            <div class="mb-4">
                <label class="form-label fw-bold">${langData['upload2'] || 'Images'}</label>
                <div class="border border-2 border-dashed rounded-3 p-4 text-center" id="imagesDropArea" style="cursor: pointer; min-height: 120px;">
                    <input type="file" id="images" name="images[]" class="d-none" accept="image/*" multiple>
                    <div id="imagesDropLabel">
                        <i class="fa-solid fa-image fs-1 text-muted"></i>
                        <p class="mb-0 mt-2 text-muted">${langData['drop_here'] || 'Drop here or click to browse'}</p>
                        <small class="text-muted">${langData['multiple_upload'] || 'Multiple upload supported'}</small>
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
                <label class="form-label fw-bold">${langData['upload3'] || '360° Images'}</label>
                <div class="border border-2 border-dashed rounded-3 p-4 text-center" 
                    id="images360DropArea" style="cursor: pointer; min-height: 120px;">
                    <input type="file" id="images360" name="images360[]" class="d-none" accept="image/*" multiple>
                    <div id="images360DropLabel">
                        <i class="fa-solid fa-maximize fs-1 text-muted"></i>
                        <p class="mb-0 mt-2 text-muted">${langData['drop_here'] || 'Drop here or click to browse'}</p>
                        <small class="text-muted">${langData['multiple_upload'] || 'Multiple upload supported'}</small>
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
                <label class="form-label fw-bold">${langData['upload1'] || 'Attachments (PDF, DOC, etc.)'}</label>
                <div class="border border-2 border-dashed rounded-3 p-4 text-center" id="attachmentsDropArea" style="cursor: pointer; min-height: 120px;">
                    <input type="file" id="attachments" name="attachments[]" class="d-none" multiple>
                    <div id="attachmentsDropLabel">
                        <i class="fa-solid fa-paperclip fs-1 text-muted"></i>
                        <p class="mb-0 mt-2 text-muted">${langData['drop_here'] || 'Drop here or click to browse'}</p>
                        <small class="text-muted">${langData['multiple_upload'] || 'Multiple upload supported'}</small>
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
                <div class="fw-bold fs-6 mt-2">${langData['drop_here'] || 'Drop here or click to browse'}</div>
                <div class="text-muted small mb-2">
                    <span>${langData['or'] || 'Or'}</span> <span>${langData['choose'] || 'Choose'}</span>
                </div>
            </div>
            <div class="text-muted small mt-2">${langData['allow_images_only'] || 'Allow images only (jpg, jpeg, png, gif, webp)'}</div>
            <button type="button" id="btnRemoveCover" class="btn btn-sm btn-outline-danger mt-2 ${d.cover ? '' : 'd-none'}">${langData['remove'] || 'Remove'}</button>
        </div>
        <input type="hidden" id="ex_cover" value="${d.cover ? d.cover : ''}">
    `;
}
function renderLangTabs(d) {
    const defaultLang = d.settings?.language_content || 'en';
    const allLangs = d.settings?.language ? d.settings.language.split(',').map(s => s.trim()) : ['en'];
    const sortedLangs = allLangs.sort((a, b) => {
        if (a === defaultLang) return -1;
        if (b === defaultLang) return 1;
        return 0;
    });
    return `
        <div class="mb-3">
            <label class="form-label fw-bold">Localization Content</label>
            <ul class="nav nav-tabs" role="tablist">
                ${sortedLangs.map(lang => `
                    <li class="nav-item">
                        <a class="nav-link ${lang === defaultLang ? 'active' : ''}" 
                           data-bs-toggle="tab" href="#tab-${lang}">
                           ${langInfo[lang]?.full || lang.toUpperCase()}
                           ${lang === defaultLang ? ' <i class="fa-solid fa-star text-warning small"></i>' : ''}
                        </a>
                    </li>
                `).join('')}
            </ul>
            <div class="tab-content border border-top-0 p-3">
                ${sortedLangs.map(lang => `
                    <div class="tab-pane fade ${lang === defaultLang ? 'show active' : ''}" id="tab-${lang}">
                        ${langTab(lang, d, lang === defaultLang)}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}