$(document).ready(function () {
    initShortcut();
});
function initShortcut() {
    $.ajax({
        url: 'api/setting/shortcut',
        method: 'POST',
        dataType: 'json',
        success: function(res) {
            if (res.status === true && res.data) {
                const d = res.data;
                $('#appName').val(d.short_name || '');
                $('#appFullName').val(d.name || '');
                $('#description').val(d.description || '');
                $('#statusBarStyle').val(d.statusBarStyle || 'default');
                $('#appleWebAppCapable').val(d.webAppCapable || 'yes');
                if (d.iosIcon && d.iosIcon.path) {
                    $('#iosIconPreview').html(
                        `<img src="${BASE_URL}/public/${d.iosIcon.path}?v=${Date.now()}" alt="iOS Icon">`
                    );
                    $("#iosIcon").removeClass("obj-required");
                }
                $('#themeColor').val(d.theme_color || '#0d6efd');
                $('#themeColorHex').val(d.theme_color || '#0d6efd');
                $('#bgColor').val(d.background_color || '#ffffff');
                $('#bgColorHex').val(d.background_color || '#ffffff');
                $('#displayMode').val(d.display || 'standalone');
                $('#orientation').val(d.orientation || 'any');
                if (d.androidIcon && d.androidIcon.path) {
                    $('#androidIconPreview').html(
                        `<img src="${BASE_URL}/public/${d.androidIcon.path}?v=${Date.now()}" alt="Android Icon">`
                    );
                    $("#androidIcon").removeClass("obj-required");
                }
                if(d.manifestDate) {
                    $(".shortcut-date").html(`<i class="fa-regular fa-calendar-check"></i> ${d.manifestDate}`);
                }
            } else {
                showError('Error', langData['cannot_load']);
            }
        },
        error: function() {
            showError('Error', langData['cannot_load']);
        }
    });
}
document.getElementById('iosIcon').addEventListener('change', function(e) {
    validatePngOnly(e, 'iosIconPreview');
});
document.getElementById('androidIcon').addEventListener('change', function(e) {
    validatePngOnly(e, 'androidIconPreview');
});
function validatePngOnly(e, previewId) {
    const file = e.target.files[0];
    if (!file) return;
    const isPng =
        file.type === 'image/png' ||
        file.name.toLowerCase().endsWith('.png');
    if (!isPng) {
        showWarning(
            langData['validation_error'] || 'Validation Error',
            langData['png_only'] || 'Please select PNG file only'
        );
        e.target.value = ""; 
        document.getElementById(previewId).src = ""; 
        return;
    }
    previewIcon(e, previewId);
}
function previewIcon(event, previewId) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById(previewId);
            preview.innerHTML = `<img src="${e.target.result}" alt="Icon preview">`;
        };
        reader.readAsDataURL(file);
    }
}
document.getElementById('themeColor').addEventListener('input', function(e) {
    document.getElementById('themeColorHex').value = e.target.value;
});
document.getElementById('themeColorHex').addEventListener('input', function(e) {
    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
        document.getElementById('themeColor').value = e.target.value;
    }
});
document.getElementById('bgColor').addEventListener('input', function(e) {
    document.getElementById('bgColorHex').value = e.target.value;
});
document.getElementById('bgColorHex').addEventListener('input', function(e) {
    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
        document.getElementById('bgColor').value = e.target.value;
    }
});
$('#pwaForm').on('submit', function (e) {
    e.preventDefault();
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
    const btn = $(".save-shortcut");
    btn.prop("disabled", true);
    let fd = new FormData(this);
    fd.set('name', $('#appFullName').val());
    fd.set('short_name', $('#appName').val());
    fd.set('description', $('#description').val());
    fd.set('display', $('#displayMode').val());
    fd.set('orientation', $('#orientation').val());
    fd.set('theme_color', $('#themeColor').val());
    fd.set('background_color', $('#bgColor').val());
    fd.set('statusBarStyle', $('#statusBarStyle').val());
    fd.set('webAppCapable', $('#appleWebAppCapable').val());
    if ($('#androidIcon')[0].files.length) {
        fd.append('androidIcon', $('#androidIcon')[0].files[0]);
    }
    if ($('#iosIcon')[0].files.length) {
        fd.append('iosIcon', $('#iosIcon')[0].files[0]);
    }
    $.ajax({
        url: 'api/setting/saveShortcut',
        method: 'POST',
        data: fd,
        processData: false,
        contentType: false,
        success: function (res) {
            if (res.status === true) {
                showSuccess('Success', langData['saved_successfully']);
                initShortcut();
            } else {
                showError('Error', langData['cannot_save']);
            }
        },
        error: function () {
            showError('Error', langData['cannot_save']);
        },
        complete: function () {
            btn.prop("disabled", false);
        }
    });
});