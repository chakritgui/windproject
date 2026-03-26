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
    $('.summernote').each(function () {
        const $this = $(this);
        $this.summernote({
            dialogsInBody: true,
            height: 450,
            dropdownParent: document.body,
            container: 'body',
            toolbar: [
                ['style', ['style', 'bold', 'italic', 'underline', 'clear']],
                ['font', ['strikethrough', 'superscript', 'subscript']],
                ['fontsize', ['fontsize']],
                ['color', ['color']],
                ['para', ['ul', 'ol', 'paragraph']],
                ['height', ['height']],
                ['insert', ['picture', 'link', 'video', 'table', 'hr']],
                ['custom', ['img25', 'img50', 'img75', 'img100']],
                ['view', ['fullscreen', 'codeview', 'help']]
            ],
            buttons: {
                img25: createResizeButton('25%'),
                img50: createResizeButton('50%'),
                img75: createResizeButton('75%'),
                img100: createResizeButton('100%')
            },
            callbacks: {
                onInit: function () {
                    const $editor = $(this);
                    const html = $editor.summernote('code');
                    const imgs = extractImageSrcs(html);
                    $editor.data('oldImages', imgs);
                    $editor.data('deleteQueue', {});
                },
                onImageUpload: function (files) {
                    uploadImage(files, this);
                },
                onChange: function (contents) {
                    debounceHandleChange(this);
                }
            }
        });
    });
    initDropdownFix();
}
function createResizeButton(size) {
    return function (context) { // รับ context ของ summernote เข้ามา
        var ui = $.summernote.ui;
        var button = ui.button({
            contents: size === '100%' ? 'Full' : size,
            tooltip: 'Resize to ' + size,
            click: function () {
                resizeImage(size, context);
            }
        });
        return button.render();
    };
}
function extractImageSrcs(html) {
    let div = document.createElement('div');
    div.innerHTML = html;
    return [...div.querySelectorAll('img')].map(img => img.src);
}
async function uploadImage(files, editor) {
    const $editor = $(editor);
    for (const file of files) {
        let data = new FormData();
        data.append('file', file);
        try {
            const res = await $.ajax({
                url: BASE_URL + '/public/uploads/upload_content_image.php',
                type: 'POST',
                data: data,
                processData: false,
                contentType: false
            });
            const result = typeof res === 'string' ? JSON.parse(res) : res;
            if (result.uploaded && result.url) {
                const fullUrl = BASE_URL + '/' + result.url;
                $editor.summernote('insertImage', fullUrl);
                setTimeout(() => {
                    const imgs = extractImageSrcs($editor.summernote('code'));
                    $editor.data('oldImages', imgs);
                }, 100);
            }
        } catch (err) {
            console.error('Upload error:', err);
        }
    }
}
function debounceHandleChange(editor) {
    const $editor = $(editor);
    let timer = $editor.data('changeTimer');
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
        handleRemovedImages(editor);
    }, 300);
    $editor.data('changeTimer', timer);
}
function handleRemovedImages(editor) {
    const $editor = $(editor);
    const $editable = $editor.next('.note-editor').find('.note-editable');
    const currentImgs = new Set(
        $editable.find('img').map(function () {
            return this.src;
        }).get()
    );
    const oldImagesArr = $editor.data('oldImages') || [];
    const oldImages = new Set(oldImagesArr);
    const deleteQueue = $editor.data('deleteQueue') || {};
    const removed = [];
    oldImages.forEach(src => {
        if (!currentImgs.has(src)) {
            removed.push(src);
        }
    });
    if (removed.length > 0) {
        removed.forEach(src => {
            if (deleteQueue[src]) return;
            deleteQueue[src] = true;
            if (src.startsWith('http')) {
                $.ajax({
                    url: BASE_URL + '/public/uploads/delete_content_image.php',
                    type: 'POST',
                    data: JSON.stringify({ url: src }),
                    contentType: 'application/json'
                }).done(() => {
                    console.log('Deleted:', src);
                });
            }
        });
    }
    $editor.data('oldImages', Array.from(currentImgs));
    $editor.data('deleteQueue', deleteQueue);
}
function resizeImage(width, context) {
    let img = context.layoutInfo.editable.data('target') || 
              context.invoke('restoreTarget');
    if (!img || $(img).prop("tagName") !== 'IMG') {
        img = context.layoutInfo.editable.find('img.note-selected')[0];
    }
    if (!img) {
        img = context.layoutInfo.editable.find('img:focus')[0];
    }
    if (img && img.tagName === 'IMG') {
        $(img).css({
            'width': width,
            'height': 'auto'
        });
        context.layoutInfo.editable.trigger('keyup');
        console.log("Resized to " + width);
    } }
function initDropdownFix() {
    $(document).on('click', '.note-btn.dropdown-toggle', function (e) {
        e.preventDefault();
        const $dropdown = $(this).next('.note-dropdown-menu');
        const isOpen = $dropdown.hasClass('show');
        $('.note-dropdown-menu').removeClass('show').hide();
        if (!isOpen) {
            $dropdown.addClass('show').css({
                display: 'block',
                zIndex: 9999,
                position: 'absolute'
            });
        }
        e.stopPropagation();
    });
    $(document).on('click', '.note-dropdown-menu .dropdown-item, .note-color-btn, .note-dropdown-menu button', function () {
        const $dropdown = $(this).closest('.note-dropdown-menu');
        setTimeout(() => {
            $dropdown.removeClass('show').hide();
        }, 150);
    });
    $(document).on('click', function (e) {
        if (!$(e.target).closest('.note-btn-group').length) {
            $('.note-dropdown-menu').removeClass('show').hide();
        }
    });
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
        const allowedExtensions = /(\.ppt|\.pptx|\.pdf|\.doc|\.docx|\.xls|\.xlsx|\.txt|\.zip|\.rar|\.jpg|\.jpeg|\.png|\.gif|\.webp)$/i;
        const files = Array.from(e.dataTransfer.files).filter(f => {
            return f.type.startsWith('image/') && allowedExtensions.test(f.name);
        });
        addFiles(files);
    });
    input.addEventListener("change", e => {
        const files = Array.from(e.target.files);
        addFiles(files);
        input.value = ""; 
    });
    function addFiles(files) {
        const allowedExtensions = /(\.ppt|\.pptx|\.pdf|\.doc|\.docx|\.xls|\.xlsx|\.txt|\.zip|\.rar|\.jpg|\.jpeg|\.png|\.gif|\.webp)$/i;
        let hasInvalidFile = false;
        files.forEach(file => {
            if (!allowedExtensions.test(file.name)) {
                hasInvalidFile = true;
                return; 
            }
            const reader = new FileReader();
            reader.onload = e => {
                attachmentsData.push({
                    type: 'new',
                    file: file,
                    preview: e.target.result,
                    name: file.name,
                    size: file.size || null,
                });
                renderAttachments();
            };
            reader.readAsDataURL(file);
        });
        if (hasInvalidFile) {
            showError(langData['only_allowed_file_types'] || 'Only allowed file types will be accepted; others will be automatically discarded.');
        }
    }
    function renderAttachments() {
        if (attachmentsData.length === 0) {
            list.innerHTML = '';
            return;
        }
        list.innerHTML = '<div class="list-group sortable-attachments">' +
            attachmentsData.map((att, index) => {
                const ext = att.name.split('.').pop().toLowerCase();
                const iconClass = getFileIconClass(ext);
                return `
                    <div class="list-group-item d-flex align-items-center" data-index="${index}">
                        <i class="fa-solid ${iconClass} me-3 fs-4"></i>
                        <div class="flex-grow-1">
                            <div class="fw-medium text-truncate" style="max-width: 250px;">${att.name}</div>
                            <small class="text-muted">${formatFileSize(att.size)}</small>
                        </div>
                        <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeAttachment(${index})">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                `;
            }).join('') +
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
function initPresentationUpload(existingPresentation = []) {
    const dropArea = document.getElementById("presentationDropArea");
    const input = document.getElementById("presentation");
    const list = document.getElementById("presentationList");
    let presentationData = [];
    existingPresentation.forEach(img => {
        presentationData.push({
            type: 'existing',
            id: img.id,
            url: img.url,
            name: img.name || 'image'
        });
    });
    renderPresentation();
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
        const allowedExtensions = /(\.jpg|\.jpeg|\.png|\.gif|\.webp|\.mp4)$/i;
        const files = Array.from(e.dataTransfer.files).filter(f => {
            return f.type.startsWith('image/') && allowedExtensions.test(f.name);
        });
        addFiles(files);
    });
    input.addEventListener("change", e => {
        const files = Array.from(e.target.files);
        addFiles(files);
        input.value = "";
    });
    function addFiles(files) {
        const allowedExtensions = /(\.jpg|\.jpeg|\.png|\.gif|\.webp|\.mp4)$/i;
        let hasInvalidFile = false;
        files.forEach(file => {
            if (!allowedExtensions.test(file.name)) {
                hasInvalidFile = true;
                return; 
            }
            const reader = new FileReader();
            reader.onload = e => {
                presentationData.push({
                    type: 'new',
                    file: file,
                    preview: e.target.result,
                    name: file.name
                });
                renderPresentation();
            };
            reader.readAsDataURL(file);
        });
        if (hasInvalidFile) {
            showError(langData['only_allowed_file_types'] || 'Only allowed file types will be accepted; others will be automatically discarded.');
        }
    }
    function renderPresentation() {
        if (presentationData.length === 0) {
            list.innerHTML = '';
            return;
        }
        list.innerHTML = presentationData.map((file, index) => {
            const isVideo = 
                file.type?.startsWith('video/') || 
                file.url?.match(/\.(mp4|webm|ogg|mov)$/i) || 
                file.preview?.startsWith('data:video/');
            const mediaTag = isVideo 
                ? `<video src="${file.preview || file.url}" class="card-img-top" style="height: 100px; object-fit: cover;" muted></video>`
                : `<img src="${file.preview || file.url}" class="card-img-top" style="height: 100px; object-fit: contain;" loading="lazy">`;
            return `
                <div class="col-4 col-md-3 col-lg-2" data-index="${index}">
                    <div class="card">
                        <div class="position-relative">
                            ${mediaTag}
                            <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1" onclick="removePresentation(${index})">
                                <i class="fa-solid fa-x"></i>
                            </button>
                            ${isVideo ? '<div class="position-absolute bottom-0 start-0 m-1"><i class="fa-solid fa-video text-white shadow-sm"></i></div>' : ''}
                        </div>
                        <div class="card-body p-2">
                            <small class="text-muted text-truncate d-block">${file.name}</small>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    window.removePresentation = function(index) {
        presentationData.splice(index, 1);
        renderPresentation();
    };
    window.getPresentationData = function() {
        return presentationData;
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
        const allowedExtensions = /(\.jpg|\.jpeg|\.png|\.gif|\.webp)$/i;
        const files = Array.from(e.dataTransfer.files).filter(f => {
            return f.type.startsWith('image/') && allowedExtensions.test(f.name);
        });
        addFiles(files);
    });
    input.addEventListener("change", e => {
        const files = Array.from(e.target.files);
        addFiles(files);
        input.value = "";
    });
    function addFiles(files) {
        const allowedExtensions = /(\.jpg|\.jpeg|\.png|\.gif|\.webp)$/i;
        let hasInvalidFile = false;
        files.forEach(file => {
            if (!allowedExtensions.test(file.name)) {
                hasInvalidFile = true;
                return; 
            }
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
        if (hasInvalidFile) {
            showError(langData['only_allowed_file_types'] || 'Only allowed file types will be accepted; others will be automatically discarded.');
        }
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
                        <img src="${img.preview || img.url}" class="card-img-top" style="height: 100px; object-fit: contain;" loading="lazy">
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
        const allowedExtensions = /(\.jpg|\.jpeg|\.png|\.gif|\.webp)$/i;
        const files = Array.from(e.dataTransfer.files).filter(f => {
            return f.type.startsWith('image/') && allowedExtensions.test(f.name);
        });
        addFiles(files);
    });
    input.addEventListener("change", e => {
        const files = Array.from(e.target.files);
        addFiles(files);
        input.value = "";
    });
    function addFiles(files) {
        const allowedExtensions = /(\.jpg|\.jpeg|\.png|\.gif|\.webp)$/i;
        let hasInvalidFile = false;
        files.forEach(file => {
            if (!allowedExtensions.test(file.name)) {
                hasInvalidFile = true;
                return; 
            }
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
        if (hasInvalidFile) {
            showError(langData['only_allowed_file_types'] || 'Only allowed file types will be accepted; others will be automatically discarded.');
        }
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
                        <img src="${img.preview || img.url}" class="card-img-top" style="height: 100px; object-fit: contain;" loading="lazy">
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
                <button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-presentation" type="button">
                    <i class="fa-solid fa-photo-film me-2"></i><span>${langData['presentation'] || 'Presentation'}</span>
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
function renderPresentation() {
    return `
        <div class="tab-pane fade" id="tab-presentation">
            <div class="mb-4">
                <label class="form-label fw-bold">${langData['upload2'] || 'Images'}</label>
                <div class="border border-2 border-dashed rounded-3 p-4 text-center" id="presentationDropArea" style="cursor: pointer; min-height: 120px;">
                    <input type="file" id="presentation" name="presentation[]" class="d-none" accept=".jpg,.jpeg,.png,.gif,.webp,.mp4" multiple>
                    <div id="presentationDropLabel">
                        <i class="fa-solid fa-image fs-1 text-muted"></i>
                        <p class="mb-0 mt-2 text-muted">${langData['drop_here'] || 'Drop here or click to browse'}</p>
                        <small class="text-muted">${langData['multiple_upload'] || 'Multiple upload supported'}</small>
                    </div>
                </div>
                <div class="mt-3 px-2">
                    <div class="d-flex align-items-start justify-content-center text-center">
                        <i class="fa-solid fa-circle-info text-warning me-2 mt-1"></i>
                        <div class="small text-muted">
                            <div>${langData['only_allowed_file_types'] || 'Only allowed file types will be accepted; others will be automatically discarded.'}</div>
                        </div>
                    </div>
                    <div class="text-center mt-2">
                        <span class="badge rounded-pill bg-light text-dark border">.jpg</span>
                        <span class="badge rounded-pill bg-light text-dark border">.jpeg</span>
                        <span class="badge rounded-pill bg-light text-dark border">.png</span>
                        <span class="badge rounded-pill bg-light text-dark border">.gif</span>
                        <span class="badge rounded-pill bg-light text-dark border">.webp</span>
                        <span class="badge rounded-pill bg-light text-dark border">.mp4</span>
                    </div>
                </div>
                <div id="presentationList" class="mt-3 row g-2"></div>
            </div>
        </div>
    `;
}
function renderGallery() {
    return `
        <div class="tab-pane fade" id="tab-gallery">
            <div class="mb-4">
                <label class="form-label fw-bold">${langData['upload2'] || 'Images'}</label>
                <div class="border border-2 border-dashed rounded-3 p-4 text-center" id="imagesDropArea" style="cursor: pointer; min-height: 120px;">
                    <input type="file" id="images" name="images[]" class="d-none" accept=".jpg,.jpeg,.png,.gif,.webp" multiple>
                    <div id="imagesDropLabel">
                        <i class="fa-solid fa-image fs-1 text-muted"></i>
                        <p class="mb-0 mt-2 text-muted">${langData['drop_here'] || 'Drop here or click to browse'}</p>
                        <small class="text-muted">${langData['multiple_upload'] || 'Multiple upload supported'}</small>
                    </div>
                </div>
                <div class="mt-3 px-2">
                    <div class="d-flex align-items-start justify-content-center text-center">
                        <i class="fa-solid fa-circle-info text-warning me-2 mt-1"></i>
                        <div class="small text-muted">
                            <div>${langData['only_allowed_file_types'] || 'Only allowed file types will be accepted; others will be automatically discarded.'}</div>
                        </div>
                    </div>
                    <div class="text-center mt-2">
                        <span class="badge rounded-pill bg-light text-dark border">.jpg</span>
                        <span class="badge rounded-pill bg-light text-dark border">.jpeg</span>
                        <span class="badge rounded-pill bg-light text-dark border">.png</span>
                        <span class="badge rounded-pill bg-light text-dark border">.gif</span>
                        <span class="badge rounded-pill bg-light text-dark border">.webp</span>
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
                    <input type="file" id="images360" name="images360[]" class="d-none" accept=".jpg,.jpeg,.png,.gif,.webp" multiple>
                    <div id="images360DropLabel">
                        <i class="fa-solid fa-maximize fs-1 text-muted"></i>
                        <p class="mb-0 mt-2 text-muted">${langData['drop_here'] || 'Drop here or click to browse'}</p>
                        <small class="text-muted">${langData['multiple_upload'] || 'Multiple upload supported'}</small>
                    </div>
                </div>
                <div class="mt-3 px-2">
                    <div class="d-flex align-items-start justify-content-center text-center">
                        <i class="fa-solid fa-circle-info text-warning me-2 mt-1"></i>
                        <div class="small text-muted">
                            <div>${langData['only_allowed_file_types'] || 'Only allowed file types will be accepted; others will be automatically discarded.'}</div>
                        </div>
                    </div>
                    <div class="text-center mt-2">
                        <span class="badge rounded-pill bg-light text-dark border">.jpg</span>
                        <span class="badge rounded-pill bg-light text-dark border">.jpeg</span>
                        <span class="badge rounded-pill bg-light text-dark border">.png</span>
                        <span class="badge rounded-pill bg-light text-dark border">.gif</span>
                        <span class="badge rounded-pill bg-light text-dark border">.webp</span>
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
                    <input type="file" id="attachments" name="attachments[]" class="d-none" multiple accept=".ppt,.pptx,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif,.webp">
                    <div id="attachmentsDropLabel">
                        <i class="fa-solid fa-paperclip fs-1 text-muted"></i>
                        <p class="mb-0 mt-2 text-muted">${langData['drop_here'] || 'Drop here or click to browse'}</p>
                        <small class="text-muted">${langData['multiple_upload'] || 'Multiple upload supported'}</small>
                    </div>
                </div>
                <div class="mt-3 px-2">
                    <div class="d-flex align-items-start justify-content-center text-center">
                        <i class="fa-solid fa-circle-info text-warning me-2 mt-1"></i>
                        <div class="small text-muted">
                            <div>${langData['only_allowed_file_types'] || 'Only allowed file types will be accepted; others will be automatically discarded.'}</div>
                        </div>
                    </div>
                    <div class="text-center mt-2">
                        <span class="badge rounded-pill bg-light text-dark border">.ppt</span>
                        <span class="badge rounded-pill bg-light text-dark border">.pptx</span>
                        <span class="badge rounded-pill bg-light text-dark border">.pdf</span>
                        <span class="badge rounded-pill bg-light text-dark border">.doc</span>
                        <span class="badge rounded-pill bg-light text-dark border">.docx</span>
                        <span class="badge rounded-pill bg-light text-dark border">.xls</span>
                        <span class="badge rounded-pill bg-light text-dark border">.xlsx</span>
                        <span class="badge rounded-pill bg-light text-dark border">.txt</span>
                        <span class="badge rounded-pill bg-light text-dark border">.zip</span>
                        <span class="badge rounded-pill bg-light text-dark border">.rar</span>
                        <span class="badge rounded-pill bg-light text-dark border">.jpg</span>
                        <span class="badge rounded-pill bg-light text-dark border">.jpeg</span>
                        <span class="badge rounded-pill bg-light text-dark border">.png</span>
                        <span class="badge rounded-pill bg-light text-dark border">.gif</span>
                        <span class="badge rounded-pill bg-light text-dark border">.webp</span>
                    </div>
                </div>
                <div id="attachmentsList" class="mt-3"></div>
            </div>
        </div>
    `;
}
function renderCover(d, type = '') {
    return `
        <div id="coverDropArea" class="cover-drop-area text-center mb-3">
            <input type="file" id="cover" accept="image/*" hidden>
            <div id="coverPreviewWrapper" class="h-100 d-flex align-items-center justify-content-center">
                ${d.cover 
                    ? `<img id="coverPreview" src="${BASE_URL}/${d.cover}" class="img-fluid rounded shadow-sm" style="max-height:150px;" loading="lazy">`
                    : `<img id="coverPreview" class="img-fluid rounded shadow-sm d-none" style="max-height:150px;" loading="lazy">`
                }
            </div>
            <div id="coverDropLabel" class="${d.cover ? 'd-none' : ''}">
                <div class="fw-bold fs-6 mt-2">${langData['drop_here'] || 'Drop here or click to browse'}</div>
                <div class="text-muted small mb-2">
                    <span>${langData['or'] || 'Or'}</span> <span>${langData['choose'] || 'Choose'}</span>
                </div>
            </div>
            <div class="text-muted small mt-2">${langData['support_image'] || 'Supports .jpg, .jpeg, .png, .gif, .webp only.'}</div>
            <button type="button" id="btnRemoveCover" class="btn btn-sm btn-outline-danger mt-2 ${d.cover ? '' : 'd-none'}">${langData['remove'] || 'Remove'}</button>
        </div>
        <input type="hidden" id="ex_cover" value="${d.cover ? d.cover : ''}">
        ${(type !== 'poles' && type !== 'folder') ? `
            <div class="mb-3">
                <label class="form-label fw-bold" data-i18n="display_the_cover"></label>
                <div class="mb-3">
                    <input type="radio" id="display_yes" name="cover_display" value="yes" ${(d.cover_display === 'yes') ? 'checked' : ''}>
                    <label class="form-check-label me-3" for="display_yes" data-i18n="show" style="cursor: pointer;"></label>
                    <input type="radio" id="display_no" name="cover_display" value="no" ${(d.cover_display === 'no') ? 'checked' : ''}>
                    <label class="form-check-label" for="display_no" data-i18n="hide" style="cursor: pointer;"></label>
                </div>
            </div>
        ` : ``}
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
            <ul class="nav nav-tabs" role="tablist">
                ${sortedLangs.map(lang => `
                    <li class="nav-item">
                        <a class="nav-link ${lang === defaultLang ? 'active' : ''}" data-bs-toggle="tab" href="#tab-${lang}">
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
function renderPresentationShow(presentation) {
    if (!presentation || !Array.isArray(presentation) || presentation.length === 0) return '';
    const carouselId = 'carousel-' + Math.random().toString(36).substr(2, 9); // สุ่ม ID ป้องกันซ้ำ
    let indicators = '';
    let items = '';
    presentation.forEach((item, index) => {
        const isActive = index === 0 ? 'active' : '';
        const isVideo = item.url.match(/\.(mp4|webm|ogg)$/i);
        const fullUrl = BASE_URL + '/' + item.url;
        indicators += `
            <button type="button" data-bs-target="#${carouselId}" data-bs-slide-to="${index}" class="${isActive}" aria-current="${isActive ? 'true' : 'false'}"></button>`;
        items += `
            <div class="carousel-item ${isActive}" data-bs-interval="${isVideo ? '10000' : '5000'}">
                <div class="ratio ratio-16x9 bg-dark rounded overflow-hidden shadow-sm">
                    ${isVideo ? `
                        <video class="w-100 h-100 object-fit-cover" autoplay muted loop playsinline>
                            <source src="${fullUrl}" type="video/mp4">
                        </video>` : `
                        <img src="${fullUrl}" class="d-block w-100 h-100 object-fit-cover" alt="Slide">
                    `}
                </div>
            </div>`;
    });
    return `
        <div id="${carouselId}" class="carousel slide carousel-fade rounded-4 mb-4" data-bs-ride="carousel">
            <div class="carousel-indicators">${indicators}</div>
            <div class="carousel-inner">${items}</div>
            <button class="carousel-control-prev" type="button" data-bs-target="#${carouselId}" data-bs-slide="prev">
                <span class="carousel-control-prev-icon" aria-hidden="true"></span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#${carouselId}" data-bs-slide="next">
                <span class="carousel-control-next-icon" aria-hidden="true"></span>
            </button>
        </div>`;
}