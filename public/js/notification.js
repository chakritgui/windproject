async function loadNotification() {
    try {
        const res = await $.ajax({
            url: `${BASE_URL}/api/notification.load`,
            method: 'POST',
            dataType: 'json'
        });
        if (!res || res.status !== true) {
            showError(langData['cannot_load']);
            return;
        }
        updateUnreadBadge(res.data.unread);
    } catch (err) {
        showError(langData['cannot_load']);
    }
}
$(document).on('click', '.btn-notification', async function (e) {
    notifyPage = 1; 
    notifyFinished = false; 
    $('.notification-list').empty();
    e.preventDefault();
    e.stopPropagation();
    updateUnreadBadge(0);
    await readNotification();
});
async function readNotification() {
    try {
        const res = await $.ajax({
            url: `${BASE_URL}/api/notification.read`,
            method: 'POST',
            dataType: 'json'
        });
        notifyPage = 1;
        notifyFinished = false;
        $('.notification-list').empty();
        await loadNotificationItem();
    } catch (err) {
        showError(langData['cannot_load']);
    }
}
let notifyPage = 1;
let notifyLoading = false;
let notifyFinished = false;
async function loadNotificationItem() {
    if (notifyLoading || notifyFinished) return;
    notifyLoading = true;
    try {
        const res = await $.ajax({
            url: `${BASE_URL}/api/notification.get`,
            method: 'POST',
            data: {
                page: notifyPage,
                limit: 10
            },
            dataType: 'json'
        });
        if (!res || res.status !== true) {
            showError(langData['cannot_load']);
            return;
        }
        const items = res.data.data ?? [];
        handleNotificationItem(items);
        notifyPage++;
    } catch (err) {
        console.error('Notification load error:', err);
        showError(langData['cannot_load']);
    } finally {
        notifyLoading = false;
    }
}
const NOTIF_ICON = {
    document: { cls: 'notif-icon-doc',  fallback: 'fa-solid fa-file-lines' },
    project: { cls: 'notif-icon-proj', fallback: 'fa-solid fa-diagram-project' },
    news: { cls: 'notif-icon-news', fallback: 'fa-solid fa-bell' },
};
function getNotifIconCls(target) {
    return NOTIF_ICON[target] || NOTIF_ICON['news'];
}
function handleNotificationItem(items) {
    const $list = $('.notification-list');
    if (notifyPage === 1) $list.empty();
    if (!items || items.length === 0) {
        if (notifyPage === 1) {
            $list.append(`
                <li class="notif-empty">
                    <i class="fa-solid fa-bell-slash"></i>
                    <div class="notif-empty-text">${langData['no_notification'] || 'No notifications'}</div>
                </li>
            `);
        }
        notifyFinished = true;
        return;
    }
    function getTitle(item) {
        if (currentLang === 'en') return item.title_en;
        if (currentLang === 'lo') return item.title_lo || item.title_en;
        return item.title_th || item.title_en;
    }
    const baseDelay = notifyPage === 1 ? 0.04 : 0;
    items.forEach((item, idx) => {
        const isDoc    = item.notifications_target === 'document';
        const isUnread = !item.read_at;
        const cfg      = getNotifIconCls(item.notifications_target);
        const iconClass = isDoc ? (typeof getFileIconClass === 'function' ? getFileIconClass(item.icon) : 'fa-solid fa-file-lines') : cfg.fallback;
        const subLine = `
            <i class="${_targetIcon(item.notifications_target)}" style="font-size:10px;"></i>
            ${langData[item.notifications_target] || item.notifications_target}
            ${isDoc ? `<i class="fa-solid fa-hard-drive" style="font-size:10px;margin-left:4px;"></i>${formatFileSize(item.item_size)}` : ''}
        `;
        const actionBtn = isDoc ? `<button class="notif-action download-btn" data-id="${item.notifications_item}" data-path="${item.path}" data-file-name="${item.item_name}" title="Download"><i class="fa-solid fa-download"></i></button>` : `<button class="notif-action open-content" data-slug="${item.content_slug}" title="Open"><i class="fa-solid fa-arrow-up-right-from-square"></i></button>`;
        const rightMeta = isUnread ? `<div class="notif-right"><span class="notif-new">${langData['new'] || 'New'}</span>${actionBtn}</div>` : actionBtn;
        const divider = (notifyPage === 1 && idx === 0) ? '' : '<li class="notif-divider"></li>';
        const delay = baseDelay + idx * 0.06;
        const html = `
            ${divider}
            <li class="notif-item ${isUnread ? 'unread' : ''}" style="animation-delay:${delay}s;" data-redirect="${item.redirect}">
                <div class="notif-icon ${cfg.cls}"><i class="${iconClass}" style="font-size:16px;"></i></div>
                <div class="notif-body">
                    <div class="notif-name">${getTitle(item)}</div>
                    <div class="notif-sub">${subLine}</div>
                    <div class="notif-time"><i class="fa-regular fa-clock"></i>${item.notification_at}</div>
                </div>
                ${rightMeta}
            </li>`;
        $list.append(html);
    });
}
function _targetIcon(target) {
    const map = {
        document: 'fa-regular fa-folder-open',
        project: 'fa-solid fa-folder-tree',
        news: 'fa-regular fa-newspaper',
    };
    return map[target] || 'fa-solid fa-bell';
}
$(document).on('click', '.notif-item', function () {
    const redirect = $(this).data('redirect');
    window.location = `${BASE_URL}/${redirect}`;
});
$('.notification-list').on('scroll', async function () {
    const el = this;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
        await loadNotificationItem();
    }
});
function updateUnreadBadge(unread) {
    if(unread > 0) {
        if(unread < 100) {
            unread = unread;
        } else {
            unread = '99+';
        }
        $(".notification-badge").removeClass("d-none");
        $("#notificationCount").html(unread);
    } else {
        $(".notification-badge").addClass("d-none");
    }
}
$(document).on('click', '.download-btn', function (e) {
    e.stopPropagation();
    const btn  = $(this);
    const id   = btn.data('id');
    const path = btn.data('path');
    const fileName = btn.data('file-name') || '';
    if (!id || !path) return;
    $.ajax({
        url: `${BASE_URL}/api/document.download`,
        method: 'POST',
        dataType: 'json',
        data: { id: id },
        success: function (res) {
            triggerDownload(path, fileName);
        },
        error: function () {
            triggerDownload(path, fileName);
        }
    });
});
function triggerDownload(url, fileName='') {
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', fileName || '');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
$(document).on('click', '.open-content', function (e) {
    e.stopPropagation()
    const slug = $(this).data('slug');
    openContent(slug, 'view');
});