let userData = {};
const fieldConfig = {
    firstName: {
        labelKey: 'firstname',
        type: 'text',
        validate: (value) => value.trim().length > 0
    },
    lastName: {
        labelKey: 'lastname',
        type: 'text',
        validate: (value) => value.trim().length > 0
    },
    phone: {
        labelKey: 'mobile',
        type: 'tel',
        validate: (value) => /^[0-9]{10}$/.test(value.replace(/-/g, '')),
        format: (value) => {
            const cleaned = value.replace(/\D/g, '');
            if (cleaned.length === 10) {
                return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
            }
            return value;
        }
    },
    email: {
        labelKey: 'email',
        type: 'email',
        validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    },
    username: {
        labelKey: 'username',
        type: 'text',
        validate: (value) => /^[A-Za-z0-9]{5,10}$/.test(value)
    },
    password: {
        labelKey: 'password',
        type: 'password',
        validate: (value) => {
            const isSafe = /^[A-Za-z0-9]{5,10}$/.test(value);
            const hasUpper = /[A-Z]/.test(value);
            return isLen && isSafe && hasUpper;
        }
    }
};
let editPermissions = {};
function initProfilePage() {
    initProfileData();
    if(isPWA()) { $(".is-pwa").removeClass("d-none"); }
    $.ajax({
        url: `${BASE_URL}/api/member.permission`,
        method: 'POST',
        dataType: 'json',
        success: function(res) {
            if (res.status === true && res.data) {
                res.data.forEach(item => {
                    editPermissions[item.field_key] = item.is_allowed;
                });
                Object.keys(fieldConfig).forEach(fieldName => {
                    updateDisplay(fieldName);
                });
            }
        }
    });
}
function initProfileData() {
    $.ajax({
        url: `${BASE_URL}/api/account.get`,
        method: 'POST',
        dataType: 'json',
        success: function(res) {
            if (res.status === true) {
                userData = {
                    firstName: res.data.first_name || '',
                    lastName: res.data.last_name || '',
                    phone: res.data.phone || '',
                    email: res.data.email || '',
                    username: res.data.username || '',
                    password: res.data.password || ''
                };
                Object.keys(fieldConfig).forEach(fieldName => {
                    updateDisplay(fieldName);
                })
            } else {
                handleError();
            }   
        },
        error: function() {
            handleError();
        }
    });
}
function handleError() {
    const fallbackMsg = "Cannot load information";
    const msg = (typeof langData !== 'undefined' && langData['cannot_load']) ? langData['cannot_load'] : fallbackMsg;
    showError(msg);
}
function editField(fieldName) {
    const config = fieldConfig[fieldName];
    const row = document.getElementById(`row-${fieldName}`);
    if (!row) return;
    const valueDiv = row.querySelector('.info-value');
    const currentValue = userData[fieldName];
    let displayValue = fieldName === 'phone' ? currentValue.replace(/-/g, '') : currentValue;
    let editHTML = `<div class="edit-wrapper" style="width: 100%; display: flex; flex-direction: column; gap: 8px;"><div class="edit-mode" style="display: flex; gap: 8px; align-items: center; width: 100%;">`;
    if (fieldName === 'password') {
        editHTML += `
            <div class="input-group-custom" style="flex: 1; position: relative;">
                <input type="text" class="edit-input" id="edit-${fieldName}" style="width: 100%;">
                <button type="button" class="btn-toggle-eye" onclick="togglePasswordVisibility('${fieldName}')">
                    <i class="fa-solid fa-eye" id="eye-icon-${fieldName}"></i>
                </button>
            </div>`;
    } else {
        editHTML += `<input type="${config.type}" class="edit-input" id="edit-${fieldName}" value="${displayValue}" style="flex: 1;">`;
    }
    editHTML += `
            <div class="edit-actions" style="display: flex; gap: 5px; flex-shrink: 0;">
                <button class="btn btn-blue btn-save" onclick="saveField('${fieldName}')">
                    <i class="fa-solid fa-check"></i>
                </button>
                <button class="btn btn-light btn-cancel" onclick="cancelEdit('${fieldName}')">
                    <i class="fa-solid fa-x"></i>
                </button>
            </div>
        </div>`;
    if (fieldName === 'username') {
        editHTML += `
            <ul id="username-rules" class="list-unstyled rules-container">
                <li><input type="checkbox" class="form-check-input me-2 pwc" id="un_len" disabled><span data-i18n="limit_5_10_characters"></span></li>
                <li><input type="checkbox" class="form-check-input me-2 pwc" id="un_char" disabled><span data-i18n="letters_and_number_only"></span></li>
            </ul>`;
    } else if (fieldName === 'password') {
        editHTML += `
            <ul id="pw-rules" class="list-unstyled rules-container">
                <li><input type="checkbox" class="form-check-input me-2 pwc" id="pw_len" disabled><span data-i18n="limit_5_10_characters"></span></li>
                <li><input type="checkbox" class="form-check-input me-2 pwc" id="pw_only" disabled><span data-i18n="letters_and_number_only"></span></li>
                <li><input type="checkbox" class="form-check-input me-2 pwc" id="pw_upper" disabled><span data-i18n="at_least_1_uppercase_letter"></span></li>
            </ul>`;
    }
    editHTML += `</div>`;
    valueDiv.innerHTML = editHTML;
    if (typeof updateText === 'function') updateText(valueDiv);
    const mainInput = document.getElementById(`edit-${fieldName}`);
    mainInput.focus();
    if (fieldName === 'username') {
        validateUsername(mainInput);
    }
}
$(document).on('keyup', '#edit-username', function () {
    validateUsername(this);
});
function validateUsername(input) {
    let un = $(input).val();
    $('#un_len').prop('checked', un.length >= 5 && un.length <= 10);
    $('#un_char').prop('checked', /^[a-z0-9]+$/.test(un));
}
$(document).on('keyup', '#edit-password', function () {
    let pw = $(this).val();
    $('#pw_len').prop('checked', pw.length >= 5 && pw.length <= 10);
    $('#pw_only').prop('checked', /^[A-Za-z0-9]+$/.test(pw));
    $('#pw_upper').prop('checked', /[A-Z]/.test(pw));
});
function togglePasswordVisibility(fieldName) {
    const input = document.getElementById(`edit-${fieldName}`);
    const icon = document.getElementById(`eye-icon-${fieldName}`);
    if (input.type === "password") {
        input.type = "text";
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    } else {
        input.type = "password";
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    }
}
function saveField(fieldName) {
    const config = fieldConfig[fieldName];
    const input = document.getElementById(`edit-${fieldName}`);
    let newValue = input.value.trim();
    if (!config.validate(newValue)) {
        input.focus();
        return;
    }
    if (config.requireConfirm) {
        const confirmInput = document.getElementById(`edit-${fieldName}-confirm`);
        if (newValue !== confirmInput.value) {
            confirmInput.focus();
            return;
        }
        newValue = '••••••••••••';
    }
    if (config.format) {
        newValue = config.format(newValue);
    }
    userData[fieldName] = newValue;
    updateDisplay(fieldName);
}
function cancelEdit(fieldName) {
    updateDisplay(fieldName);
}
function updateDisplay(fieldName) {
    const row = document.getElementById(`row-${fieldName}`);
    if (!row) return;
    const valueDiv = row.querySelector('.info-value');
    const displayValue = userData[fieldName];
    const permissionKey = 'allow' + fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
    const isAllowed = editPermissions[permissionKey] == "1";
    const hideClass = isAllowed ? "" : "d-none";
    valueDiv.innerHTML = `
        <span class="info-text ${fieldName === 'password' ? 'password-value' : ''}" id="display-${fieldName}">
            ${(fieldName === 'password') ? "••••••••••••" : displayValue}
        </span>
        <button class="btn-edit ${permissionKey} ${hideClass}" onclick="editField('${fieldName}')">
            <i class="fa-solid fa-pen-to-square me-2"></i><span data-i18n="edit"></span>
        </button>
    `;
    if (typeof updateText === 'function') updateText(valueDiv);
}
document.addEventListener('input', (e) => {
    const target = e.target;
    if (!target.id) return;
    if (target.id.includes('phone')) {
        let value = target.value.replace(/\D/g, '');
        if (value.length > 10) value = value.slice(0, 10);
        target.value = value;
    }
    if (target.id.includes('username')) {
        let val = target.value.toLowerCase();
        val = val.replace(/[^a-z0-9_@.]/g, '');
        target.value = val;
    }
});
$(document).ready(function () {
    initProfilePage();
});
function saveField(fieldName) {
    const config = fieldConfig[fieldName];
    const input = document.getElementById(`edit-${fieldName}`);
    const btnSave = document.querySelector(`.btn-save`);
    if (!input || !btnSave) return;
    let newValue = input.value.trim();
    if (!config.validate(newValue)) {
        $(input).addClass('is-invalid').focus();
        const errorMsg = langData[`invalid_${fieldName}`] || langData['invalid_format'] || 'Invalid format';
        showWarning(errorMsg);
        return;
    }
    $(input).removeClass('is-invalid');
    const originalBtnHTML = btnSave.innerHTML;
    btnSave.disabled = true;
    btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    $.ajax({
        url: `${BASE_URL}/api/account.update`,
        method: 'POST',
        data: {
            field: fieldName,
            value: newValue
        },
        dataType: 'json',
        success: function(res) {
            if (res.status === true) {
                if (fieldName === 'password') {
                    newValue = '••••••••••••';
                } else if (config.format) {
                    newValue = config.format(newValue);
                }
                userData[fieldName] = newValue;
                updateDisplay(fieldName);
                showSuccess(langData['saved_successfully'] || 'Data saved successfully');
            } else {
                showError((langData[res.message] || res.message || 'Update failed'));
            }
        },
        error: function(xhr) {
            console.error(xhr);
            showError(langData['cannot_save'] || 'Connection error');
        },
        complete: function() {
            btnSave.disabled = false;
            btnSave.innerHTML = originalBtnHTML;
        }
    });
}
$(document).on('input', '.edit-input', function() {
    $(this).removeClass('is-invalid');
});
$('button[data-bs-toggle="tab"]').on('shown.bs.tab', function (e) {
    const targetId = $(e.target).attr('data-bs-target');
    if (targetId === '#history') {
        loadUsageHistory();
    } else if (targetId === '#info') {
        initProfileData();
    }
});
let historyOffset = 0;
let isHistoryLoading = false;
let hasMoreHistory = true;
function loadUsageHistory() {
    if (isHistoryLoading || !hasMoreHistory) return;
    isHistoryLoading = true;
    $('#scrollEnd').html('<div class="text-center p-3"><i class="fa-solid fa-spinner fa-spin text-primary fa-2x"></i></div>');
    $.ajax({
        url: `${BASE_URL}/api/account.usage`,
        method: 'POST',
        data: { offset: historyOffset },
        dataType: 'json',
        success: function(res) {
            if (res.status && res.data.length > 0) {
                let html = '';
                res.data.forEach((log, index) => {
                    const loginParts = log.formatted_at.split(' ');
                    const displayDate = loginParts[0];
                    const loginTime = loginParts[1].substring(0, 5);
                    let logoutTime = '-';
                    if (log.logout_at) {
                        const logoutParts = log.logout_at.split(' ');
                        logoutTime = logoutParts[1] ? logoutParts[1].substring(0, 5) : '-';
                    }
                    let icon = 'fa-laptop', color = 'text-secondary';
                    if(log.device_os === 'Windows') { icon = 'fa-brands fa-windows'; color = 'text-primary'; }
                    else if(log.device_os === 'Android') { icon = 'fa-brands fa-android'; color = 'text-success'; }
                    else if(log.device_os === 'iPhone (iOS)' || log.device_os === 'iOS') { icon = 'fa-mobile-screen-button'; color = 'text-dark'; }
                    else if(log.device_os === 'Mac OS') { icon = 'fa-brands fa-apple'; color = 'text-dark'; }
                    html += `
                    <div class="activity-timeline-item">
                        <div class="activity-line"></div>
                        <div class="activity-dot ${historyOffset === 0 && index === 0 ? 'active' : ''}"></div>
                        <div class="activity-card premium-card">
                            <div class="activity-header d-flex justify-content-between align-items-center">
                                <div class="date-badge">
                                    <i class="fa-regular fa-calendar me-2"></i>${displayDate}
                                </div>
                                ${historyOffset === 0 && index === 0 ? `<span class="status-badge latest" data-i18n="latest">ล่าสุด</span>` : ``}
                            </div>
                            <div class="activity-body mt-3">
                                <div class="d-flex align-items-center mb-3">
                                    <div class="device-icon-wrapper ${color} shadow-sm">
                                        <i class="fa-solid ${icon}"></i>
                                    </div>
                                    <div class="ms-3 flex-grow-1">
                                        <div class="d-flex flex-column flex-sm-row justify-content-sm-between align-items-start align-items-sm-center">
                                            <div class="mb-1 mb-sm-0">
                                                <span class="device-text-main d-block fw-bold">${log.device_os}</span>
                                                <small class="text-muted">${log.device_browser}</small>
                                            </div>
                                            <div class="text-start text-sm-end">
                                                <small class="text-muted d-block font-monospace" style="font-size: 0.7rem;">
                                                    ${log.ip_address}
                                                </small>
                                                ${log.login_location ? `
                                                    <span class="text-blue small" style="font-size: 0.6rem;">
                                                        <i class="fa-solid fa-location-dot me-1"></i>${log.login_location}
                                                    </span>
                                                ` : ''}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="time-summary-box d-flex justify-content-around">
                                    <div class="time-item">
                                        <small data-i18n="login"></small>
                                        <span>${loginTime}</span>
                                    </div>
                                    <div class="time-divider"></div>
                                    <div class="time-item">
                                        <small data-i18n="logout"></small>
                                        <span>${logoutTime}</span>
                                    </div>
                                    <div class="time-divider"></div>
                                    <div class="time-item">
                                        <small data-i18n="usage"></small>
                                        <span class="${log.duration !== '-' ? 'text-blue' : ''}">${log.duration || '-'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>`;
                });

                if (historyOffset === 0) $('#activityHistory').empty();
                $('#activityHistory').append(html);
                historyOffset += 10;
                hasMoreHistory = res.has_more;
            } else {
                hasMoreHistory = false;
                if (historyOffset === 0) $('#activityHistory').html(`<p class="text-center p-4" data-i18n="no_data_found"></p>`);
            }
        },
        complete: function() {
            isHistoryLoading = false;
            $('#scrollEnd').empty();
            if (typeof updatei18n === 'function') updatei18n();
        }
    });
}
$('button[data-bs-target="#history"]').on('shown.bs.tab', function () {
    if (historyOffset === 0) loadUsageHistory();
});
const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
        loadUsageHistory();
    }
}, {
    root: null, 
    rootMargin: '200px',
});
observer.observe(document.getElementById('scrollEnd'));
document.addEventListener('DOMContentLoaded', () => {
    const pushToggle = document.querySelector('#pwaPushToggle');
    const statusText = document.querySelector('#pwa-status-text');
    const warningBox = document.querySelector('#permission-warning');
    if (!pushToggle) return;
    async function checkInitialStatus() {
        if (!('Notification' in window) || !('serviceWorker' in navigator)) {
            statusText.innerText = langData['this_browser_does_not_support_notifications.'];
            pushToggle.disabled = true;
            return;
        }
        if (Notification.permission === 'denied') {
            statusText.innerText = langData['blocked_by_browser'];
            if (warningBox) warningBox.classList.remove('d-none');
            pushToggle.disabled = true;
            pushToggle.checked = false;
            return;
        }
        if (Notification.permission === 'granted') {
            try {
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();
                if (subscription) {
                    pushToggle.checked = true;
                    statusText.innerText = langData['enable'];
                } else {
                    pushToggle.checked = false;
                    statusText.innerText = langData['deactivated'];
                }
            } catch (err) {
                console.error("Error checking subscription:", err);
            }
        } else {
            pushToggle.checked = false;
            statusText.innerText = langData['deactivated'];
        }
    }
    checkInitialStatus();
    pushToggle.addEventListener('change', async () => {
        if (pushToggle.checked) {
            pushToggle.checked = false;
            const allowed = await new Promise((resolve) => {
                showNotificationModal(
                    async () => {
                        await requestAndSubscribe(await navigator.serviceWorker.ready);
                        setTimeout(checkInitialStatus, 1000);
                        resolve(true);
                    },
                    () => {
                        localStorage.setItem('notification_asked_forever', 'true');
                        resolve(false);
                    }
                );
            });
            pushToggle.checked = allowed;
        } else {
            const unsubscribed = await unsubscribeUser();
            if (!unsubscribed) {
                pushToggle.checked = true;
            } else {
                statusText.innerText = langData['deactivated'];
            }
        }
    });
    window.checkInitialStatus = checkInitialStatus;
});