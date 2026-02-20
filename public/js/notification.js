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
        if (!res || res.status !== true) {
            showError(langData['cannot_load']);
            return;
        }
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
function handleNotificationItem(items) {
    const $list = $('.notification-list');
    if (notifyPage === 1) {
        $list.empty();
    }
    if (!items || items.length === 0) {
        if (notifyPage === 1) {
            const emptyHtml = `
                <li class="text-center py-4 text-muted">
                    <div class="d-flex flex-column align-items-center">
                        <i class="fa-solid fa-bell-slash fs-2 mb-2"></i>
                        <div>${langData['no_notification'] || 'No notification'}</div>
                    </div>
                </li>`;
            $list.append(emptyHtml);
        }
        notifyFinished = true;
        return;
    }
    items.forEach(item => {
        const isUnread = !item.read_at ? 'unread' : '';
        let title = '';
        switch(currentLang) {
            case 'en':
                title = item.title_en;
                break;
            case 'lo':
                title = item.title_lo || item.title_en;
                break;
            case 'th':
                title = item.title_th || item.title_en;
                break;
        }
        let icon = '';
        let bg = '';
        let color = '';
        if(item.notifications_target === 'document') {
            icon = getFileIconClass(item.icon);
            bg = 'bg-dark';
        } else {
            if(item.notifications_target == 'project') {
                icon = 'fa-solid fa-diagram-project';
                bg = 'bg-primary';
                color = 'text-primary';
            } else {
                icon = 'fa-solid fa-bell';
                bg = 'bg-warning';
                color = 'text-warning';
            }
        }
        const html = `
            <li>
                ${(item.notifications_target !== 'document') ? `
                    ${(isPWA()) ? `
                        <a onclick="openContent('${item.content_slug}', 'preview')" class="dropdown-item py-3 border-bottom view-content ${isUnread}">
                    ` : `
                        <a href="${BASE_URL}/content/view/${item.content_slug}" class="dropdown-item py-3 border-bottom ${isUnread}" target="_blank">
                    `}
                ` : `
                        <div class="dropdown-item py-3 border-bottom" style="font-size: 12px !important;">
                `}
                    <div class="d-flex align-items-start">
                        <div class="flex-shrink-0 me-3">
                            <div class="${bg} bg-opacity-10 rounded-circle p-2">
                                <i class="${icon} ${color}" style="font-size: 1rem;"></i>
                            </div>
                        </div>
                        <div class="flex-grow-1" style="min-width: 0;">
                            <div class="mb-1 fw-semibold line-clamp-2">${title}</div>
                            <p class="mb-1 small text-muted">${langData[item.notifications_target] || item.notifications_target} ${(item.notifications_target === 'document') ? `<i class="fa-solid fa-hard-drive me-1"></i>${formatFileSize(item.item_size)}` : ``}</p> 
                            <small class="text-muted">
                                <i class="fa-solid fa-clock me-1"></i>${item.notification_at}
                            </small>
                        </div>
                        ${(item.notifications_target === 'document') ? `
                            <div class="ms-2">
                                <button class="btn btn-sm btn-outline-primary download-btn w-100 w-md-auto" data-id="${item.notifications_item}" data-path="${item.path}" data-file-name="${item.item_name}"><i class="fa-solid fa-download"></i></button>
                            </div>
                        ` : ``}
                        ${!item.read_at ? `<span class="badge bg-danger rounded-pill ms-2">${langData['new'] || 'New'}</span>` : ''}
                    </div>
                ${(item.notifications_target !== 'document') ? `
                    </a>
                ` : `
                    </div>
                `}
            </li>`;
        $list.append(html);
    });
}
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
    e.preventDefault();
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