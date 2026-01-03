let currentLang = sessionStorage.getItem('lang') || 'en';
let langData = {};
let pageLength = 50;
let lengthMenu = [[50, 100, 250, 500, 1000, -1], [50, 100, 250, 500, 1000, "All"]];
let icon;
let logo;
let lang;
let website;
async function loadLang(lang) {
    try {
        const res = await fetch(`${BASE_URL}/public/lang/${lang}.json?v=${Date.now()}`);
        if (!res.ok) throw new Error("Language file missing");
        langData = await res.json();
        updateText();
        updatePlaceholders();
        updateDropdownLabel(lang);
    } catch(e) {
        console.error("Error loading language:", e);
    }
}
function updateText(){
    $('[data-i18n]').each(function(){
        let key = $(this).data('i18n');
        if(langData[key]){
            $(this).text(langData[key]);
        }
    });
}
function updateDropdownLabel(lang) {
    let flag = "gb"; 
    let label = "EN";
    if (lang === "lo") {
        flag = "la";
        label = "LO";
    } else if (lang === "th") {
        flag = "th";
        label = "TH";
    }
    $('.dropdown-language .dropdown-toggle').html(`
        <img src="${BASE_URL}/public/flags/${flag}.png" width="20" class="me-1"> ${label}
    `);
}
$(document).on('click', '.dropdown-language .dropdown-item', async function(){
    let lang = $(this).data('value');
    currentLang = lang;
    sessionStorage.setItem('lang', lang);
    await loadLang(lang);
    await refreshAllTables();
});
async function refreshAllTables() {
    await loadLang(currentLang); 
    $('.dataTable').each(function() {
        let tableId = $(this).attr('id');
        let tableApi = $(this).DataTable();
        let currentPage = tableApi.page();
        if (tableId === 'tb_member') initMemberTable();
        if (tableId === 'tb_document') initDocumentTable();
    });
}
loadLang(currentLang);
function updatePlaceholders() {
    $('#username').attr('placeholder', langData['username_or_email']);
    $('#password').attr('placeholder', langData['password']);
    $('#email').attr('placeholder', langData['email']);
}
function showSuccess(msg, ConfirmButton = true) {
    if(!ConfirmButton) {
        Swal.fire({
            icon: 'success',
            title: langData['success'] || 'Success',
            text: msg,
            timer: timer,
            showConfirmButton: ConfirmButton,
            confirmButtonText: langData['ok'] || 'OK'
        });
    } else {
        Swal.fire({
            icon: 'success',
            title: langData['success'] || 'Success',
            text: msg,
            showConfirmButton: ConfirmButton,
            confirmButtonText: langData['ok'] || 'OK'
        });
    }
}
function showError(title, msg, ConfirmButton = true) {
    Swal.fire({
        icon: 'error',
        title: title,
        text: msg,
        showConfirmButton: ConfirmButton,
        confirmButtonText: langData['ok'] || 'OK'
    });
}
function showConfirm(title, msg, confirmCallback, cancelCallback) {
    Swal.fire({
        title: title,   
        text: msg,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: langData['yes'] || 'Yes',
        cancelButtonText: langData['no'] || 'No'
    }).then((result) => {
        if (result.isConfirmed) {
            if (typeof confirmCallback === 'function') confirmCallback();
        } else {
            if (typeof cancelCallback === 'function') cancelCallback();
        }
    });
}
function showWarning(title, msg, ConfirmButton = true) {
    Swal.fire({
        icon: 'warning',
        title: title,
        text: msg,
        showConfirmButton: ConfirmButton,
        confirmButtonText: langData['ok'] || 'OK'
    });
}
document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("sidebarToggle");
    const closeBtn = document.getElementById("sidebarClose");
    const overlay = document.getElementById("sidebarOverlay");
    const sidebar = document.getElementById("sidebar");
    toggle?.addEventListener("click", () => {
        sidebar.classList.add("open");
        overlay.classList.add("show");
    });
    closeBtn?.addEventListener("click", () => {
        sidebar.classList.remove("open");
        overlay.classList.remove("show");
    });
    overlay?.addEventListener("click", () => {
        sidebar.classList.remove("open");
        overlay.classList.remove("show");
    });
});
function getTableLang() {
    return {
        search: langData?.search || "Search",
        lengthMenu: langData?.lengthMenu || "Show _MENU_ entries",
        zeroRecords: langData?.zeroRecords || "No matching records found",
        info: langData?.info || "Showing _START_ to _END_ of _TOTAL_ entries",
        infoEmpty: langData?.infoEmpty || "Showing 0 to 0 of 0 entries",
        infoFiltered: langData?.infoFiltered || "(filtered from _MAX_ total entries)",
        paginate: {
            first: langData?.first || "First",
            last: langData?.last || "Last",
            next: langData?.next || "Next",
            previous: langData?.previous || "Previous"
        }
    };
}
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const notificationId = this.dataset.notificationId;
            this.classList.remove('unread');
            const badge = this.querySelector('.badge');
            if (badge) badge.remove();
            updateNotificationCount();
            console.log('Notification ' + notificationId + ' marked as read');
        });
    });
    const markAllBtn = document.getElementById('markAllRead');
    markAllBtn?.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        document.querySelectorAll('.notification-item.unread').forEach(item => {
            item.classList.remove('unread');

            const badge = item.querySelector('.badge');
            if (badge) badge.remove();
        });
        const countBadge = document.getElementById('notificationCount');
        if (countBadge) {
            countBadge.textContent = '0';
            countBadge.style.display = 'none';
        }
        console.log('All notifications marked as read');
    });
    function updateNotificationCount() {
        const unreadCount = document.querySelectorAll('.notification-item.unread').length;
        const countBadge = document.getElementById('notificationCount');
        if (!countBadge) return; 
        if (unreadCount > 0) {
            countBadge.textContent = unreadCount;
            countBadge.style.display = 'inline-block';
        } else {
            countBadge.style.display = 'none';
        }
    }
});
function showPageLoader() {
    $("#pageLoader").removeClass("d-none");
}
function hidePageLoader() {
    $("#pageLoader").addClass("d-none");
}
function isValidEmail(email){
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}