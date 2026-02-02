function isIOSx() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}
function parseUA(ua) {
    if (/iPhone/.test(ua)) {
        const os = ua.match(/OS ([\d_]+)/)?.[1]?.replace(/_/g,'.');
        return {
            icon: 'fa-solid fa-mobile-screen',
            label: `iPhone · iOS ${os} · Safari`
        };
    }
    if (/Android/.test(ua)) {
        return { icon: 'fa-solid fa-mobile-screen', label: 'Android Device' };
    }
    if (/Windows/.test(ua)) {
        return { icon: 'fa-solid fa-laptop', label: 'Windows PC' };
    }
    return { icon: 'fa-solid fa-desktop', label: 'Unknown Device' };
}
function readableSize(bytes) {
    if (bytes === 0) return "0 B";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return (bytes / Math.pow(1024, i)).toFixed(2) + " " + sizes[i];
}
function getFileIconClass(ext) {
    ext = ext.toLowerCase();
    if (["jpg","jpeg","png","gif","webp","svg"].includes(ext)) return "fa-solid fa-file-image text-info";
    if (["pdf"].includes(ext)) return "fa-solid fa-file-pdf text-danger";
    if (["doc","docx"].includes(ext)) return "fa-solid fa-file-word text-primary";
    if (["xls","xlsx","csv"].includes(ext)) return "fa-solid fa-file-excel text-success";
    if (["ppt","pptx"].includes(ext)) return "fa-solid fa-file-powerpoint text-orange";
    if (["zip","rar","7z"].includes(ext)) return "fa-solid fa-file-zipper text-secondary";
    if (["mp4","mov","avi","mkv"].includes(ext)) return "fa-solid fa-file-video text-purple";
    if (["mp3","wav","ogg"].includes(ext)) return "fa-solid fa-file-audio text-info";
    if (["txt","md","log"].includes(ext)) return "fa-solid fa-file-lines text-muted";
    return "fa-solid fa-file text-muted";
}
function navigateTo(url, type) {
    if(type == 'self') {
        window.location.href = url;
    } else {
        if (isIOSx()) {
            window.location.href = url;
        } else {
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}
function showPageLoader() {
    $('#pageLoader').removeClass('d-none');
}
function hidePageLoader() {
    $('#pageLoader').addClass('d-none');
}
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function renderLangStatus(lang, status) {
    if (!status) return '';
    const map = {
        ready:   { cls: 'success', icon: 'fa-check' },
        wait:    { cls: 'warning',   icon: 'fa-spinner fa-spin' },
        success: { cls: 'success',   icon: 'fa-check' },
        failed:  { cls: 'danger',    icon: 'fa-xmark' }
    };
    const s = map[status] || map.ready;
    return `
        <span class="badge rounded-pill bg-${s.cls}-subtle text-${s.cls} me-1">
            <i class="fa-solid ${s.icon}"></i> ${lang.toUpperCase()}
        </span>
    `;
}
function renderStatusBadge(status) {
    if (!status) return '';
    const map = {
        ready:   { cls: 'success', text: 'Ready',   icon: 'fa-check' },
        wait:    { cls: 'warning',   text: 'Waiting', icon: 'fa-spinner fa-spin' },
        success: { cls: 'success',   text: 'Success', icon: 'fa-check' },
        failed:  { cls: 'danger',    text: 'Failed',  icon: 'fa-xmark' }
    };
    const s = map[status] || map.ready;
    return `
        <span class="badge rounded-pill bg-${s.cls}-subtle text-${s.cls}">
            <i class="fa-solid ${s.icon}"></i> ${s.text}
        </span>
    `;
}
