let currentLang = sessionStorage.getItem('lang') || 'en';
let langData = {};
let pageLength = 50;
let lengthMenu = [[50, 100, 250, 500, 1000, -1], [50, 100, 250, 500, 1000, "All"]];
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
});
loadLang(currentLang);
function updatePlaceholders() {
    $('#username').attr('placeholder', langData['username']);
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
function showWarning(title, msg, ConfirmButton = true) {
    Swal.fire({
        icon: 'warning',
        title: title,
        text: msg,
        showConfirmButton: ConfirmButton,
        confirmButtonText: langData['ok'] || 'OK'
    });
}
document.getElementById("sidebarToggle").addEventListener("click", () => {
    document.getElementById("sidebar").classList.add("open");
    document.getElementById("sidebarOverlay").classList.add("show");
});
document.getElementById("sidebarClose").addEventListener("click", () => {
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("sidebarOverlay").classList.remove("show");
});
document.getElementById("sidebarOverlay").addEventListener("click", () => {
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("sidebarOverlay").classList.remove("show");
});
function getTableLang() {
    return {
        search: langData['search'] || "Search",
        paginate: {
            next: langData['next'] || "Next",
            previous: langData['previous'] || "Previous"
        },
        lengthMenu: langData['lengthMenu'] || "Show _MENU_ entries",
        zeroRecords: langData['zeroRecords'] || "No matching records found",
        info: langData['info'] || "Showing _START_ to _END_ of _TOTAL_ entries",
        infoEmpty: langData['infoEmpty'] || "Showing 0 to 0 of 0 entries",
        infoFiltered: langData['infoFiltered'] || "(filtered from _MAX_ total entries)"
    };
}
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const notificationId = this.dataset.notificationId;
            this.classList.remove('unread');
            const badge = this.querySelector('.badge');
            if (badge) {
                badge.remove();
            }
            updateNotificationCount();
            console.log('Notification ' + notificationId + ' marked as read');
        });
    });
    document.getElementById('markAllRead').addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        document.querySelectorAll('.notification-item.unread').forEach(item => {
            item.classList.remove('unread');
            const badge = item.querySelector('.badge');
            if (badge) {
                badge.remove();
            }
        });
        const countBadge = document.getElementById('notificationCount');
        countBadge.textContent = '0';
        countBadge.style.display = 'none';
        console.log('All notifications marked as read');
    });
    function updateNotificationCount() {
        const unreadCount = document.querySelectorAll('.notification-item.unread').length;
        const countBadge = document.getElementById('notificationCount');
        if (unreadCount > 0) {
            countBadge.textContent = unreadCount;
            countBadge.style.display = 'inline-block';
        } else {
            countBadge.style.display = 'none';
        }
    }
    function markNotificationAsRead(notificationId) {
        fetch('api/mark-notification-read.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: notificationId })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    }
    function markAllNotificationsAsRead() {
        fetch('api/mark-all-notifications-read.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    }
});