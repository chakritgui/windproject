let pages = 'member';
let tb_member;
function initMemberTable() {
    let oldPage = 0;
    if ($.fn.DataTable.isDataTable('#tb_member')) {
        oldPage = $('#tb_member').DataTable().page();
        $('#tb_member').DataTable().destroy();
    }
    if ($.fn.DataTable.isDataTable('#tb_member')) {
        $('#tb_member').DataTable().ajax.reload(null, false);
        return;
    }
    tb_member = $('#tb_member').DataTable({
        processing: true,
        serverSide: true,
        responsive: true, 
        order: [[6, 'desc']],
        ajax: { 
            url: `${BASE_URL}/api/member.list`,
            type: "POST",
            data: function(d){
                d.role = $('#filter_role').val();
                d.privileges = $('#filter_privileges').val();
                d.status = $('#filter_status').val();
            }
        },
        columns: [         { 
            data: null, 
            orderable: false,
            className: 'text-center',
            render: function(row){
                let initials = "";
                if (row.first_name) initials += row.first_name.charAt(0).toUpperCase();
                if (row.last_name)  initials += row.last_name.charAt(0).toUpperCase();
                let colors = [
                    "#A3D8F4", "#F7B5CA", "#C4DFAA", "#F9D390", 
                    "#B5C7F2", "#E2A9F3", "#F5A7A7", "#A7E9AF"
                ];
                let bg = colors[Math.floor(Math.random() * colors.length)];
                return `
                    <div class="d-flex align-items-center justify-content-center rounded-circle text-white fw-bold"
                        style="width:35px; height:35px; background:${bg}; font-size:0.85rem;">
                        ${initials}
                    </div>
                `;
            } 
        }, { 
            data: null,
            orderable: true,
            render: function(row){
                return `${row.first_name} ${row.last_name}`;
            } 
        }, { 
            data: "email",
            orderable: true,
        },{ 
            data: "phone",
            orderable: true, 
        },{ 
            data: "role",
            orderable: true, 
            render: function(data, type, row) {
                return `<div class="d-flex flex-column" data-i18n="${row.role}">${row.role}</div>`;
            }
        },{ 
            data: null,
            orderable: true,
            render: function(row){
                return `${row.privileges_name || ""}`;
            } 
        }, { 
            data: "created_at",
            orderable: true,
        },{ 
            data: "last_login_at",
            orderable: true,
        },{
            data: "status",
            orderable: true,
            render: function (status, type, row) {
                let badge = '';
                switch(status) {
                    case "active":
                        badge = "success";
                        break;
                    case "banned":
                        badge = "danger";
                        break;
                    default:
                        badge = "warning";
                }
                return `
                    <div class="d-flex align-items-center gap-2">
                        <span class="badge bg-${badge}-subtle text-${badge}" style="font-weight:400;">${langData[status] || status}</span>
                    </div>
                `;
            }
        },{
            data: null,
            orderable: false,
            render: function(row){
                return `
                    <div class="btn-group border rounded-3 bg-white">
                        <button class="btn btn-link text-warning py-1 manage-member" data-id="${row.member_id}"><i class="fa-solid fa-pen-to-square"></i></button>
                        ${((row.role || '').toLowerCase() !== 'administrator') ? `<button class="btn btn-link py-1 text-danger border-start delete-member" data-id="${row.member_id}"><i class="fa-regular fa-trash-can"></i></button>` : `<button class="btn btn-link py-1 text-danger border-start" disabled><i class="fa-regular fa-trash-can"></i></button>`}
                    </div>
                `;
            }
        }],      
        pageLength: pageLength,
        lengthMenu: lengthMenu,
        stateLoadParams: function (settings, data) {
            data.start = oldPage;
            data.length = pageLength; 
        },
        language: getTableLang(),
        initComplete: function() {
            let $filter = $('#tb_member_filter');
            let self = this.api();
            if ($filter.find('.manage-member').length === 0) {
                let btn = `
                    <button class="btn btn-primary btn-sm manage-member ms-2" data-id="">
                        <i class="fa-solid fa-plus"></i> <span>${langData['member'] || 'Member'}</span>
                    </button>
                `;
                $filter.append(btn);
            }
            let $input = $filter.find('input').unbind();
            $input.bind('keypress', function(e) {
                if (e.keyCode == 13) {
                    self.search(this.value).draw();
                }
            });
        },
        drawCallback: function(){
            getTableLang();
        }
    });
}
$('.filter').on('change', function () {
    initMemberTable();
});
$(document).ready(function () {
    initTable();
    $(".nav-link").click(function() {
        let p = $(this).data("page");
        pages = p;
        initTable();
    });
});
$('#filter_role').on('change', function () {
    const isUserOrAll = $(this).val() === 'user' || $(this).val() === '' || !$(this).val();
    const $privileges = $('#filter_privileges');
    if (isUserOrAll) {
        $privileges.prop("disabled", false);
        $privileges.closest('.form-group, .col-md-3').css('opacity', '1');
    } else {
        $privileges.prop("disabled", true);
        $privileges.val(null).trigger('change');
        $privileges.closest('.form-group, .col-md-3').css('opacity', '0.6');
    }
});
function initTable() {
    switch(pages) {
        case 'member':
            initSelect2Remote('#filter_role', `${BASE_URL}/api/member.filter`, { type: 'role' });
            initSelect2Remote('#filter_privileges', `${BASE_URL}/api/member.filter`, { type: 'privileges' });
            initSelect2Remote('#filter_status', `${BASE_URL}/api/member.filter`, { type: 'status' });
            initMemberTable();
            break;
        case 'history':
            initDateRangePicker('#filter_history_date', initHistoryTable);
            initSelect2Remote('#filter_history_role', `${BASE_URL}/api/member.filter`, { type: 'role' });
            initSelect2Remote('#filter_history_member', `${BASE_URL}/api/member.filter`, { type: 'member' });
            initSelect2Remote('#filter_history_device', `${BASE_URL}/api/member.filter`, { type: 'device' });
            initSelect2Remote('#filter_history_browser', `${BASE_URL}/api/member.filter`, { type: 'browser' });
            initSelect2Remote('#filter_history_timezone', `${BASE_URL}/api/member.filter`, { type: 'timezone' });
            initHistoryTable();
            break;
        case 'request':
            initSelect2Remote('#filter_request_member', `${BASE_URL}/api/member.filter`, { type: 'member' });
            initSelect2Remote('#filter_request_role', `${BASE_URL}/api/member.filter`, { type: 'role' });
            initDateRangePicker('#filter_request_date', initRequestTable);
            initRequestTable();
            break;
        case 'setting':
            initPermissionSetting();
            break;
        case 'privileges':
            initPrivilegesTable();
            break;
    }
}
$(document).on('click', '.delete-member', function() {
    let member_id = $(this).data("id");
    showConfirm(langData['confirm'], langData['confirm_delete'], function(){
        $.ajax({
            url: `${BASE_URL}/api/member.delete`,
            method: 'POST',
            data: { id: member_id },
            dataType: 'json',
            success: function(res) {
                if(res.status === true){
                    showSuccess(langData['deleted_successfully']);
                    initMemberTable();
                } else {
                    showError(langData['cannot_delete']);
                }   
            },
            error: function(){
                showError(langData['cannot_delete']);
            }
        });
    });
});
$(document).on('click', '.manage-member', function() {
    let member_id = $(this).data("id");
    $.ajax({
        url: `${BASE_URL}/api/member.get`,
        method: 'POST',
        data: { id: member_id },
        dataType: 'json',
        success: function(res) {
            if(res.status === true){
                let modalEl = $('#windModal');
                let modal = new bootstrap.Modal(modalEl[0]);
                modal.show();
                modalEl.find(".modal-header").html(`
                    <h5 class="modal-title">${langData['manageMember'] || "Manage Member"}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                `);
                modalEl.find(".modal-footer").html(`
                    <button type="submit" class="btn btn-primary me-2 save-member">${langData['save'] || "Save"}</button>
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">${langData['close'] || "Close"}</button>
                `);
                modalEl.find(".modal-body").html(`
                    <input type="hidden" id="member_id">
                    <h6 class="fw-bold mb-3">
                        <i class="fa-solid fa-user-gear me-1"></i>
                        <span>${langData['general'] || "General"}</span>
                    </h6>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="mb-2">${langData['firstname'] || "Firstname"}</label>
                            <input type="text" class="form-control" id="first_name" maxlength="150">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="mb-2">${langData['lastname'] || "Lastname"}</label>
                            <input type="text" class="form-control" id="last_name" maxlength="150">
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="mb-2 required">${langData['role'] || "Role"}</label>
                            <select class="form-select obj-required" id="role"></select>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="mb-2 required">${langData['user_privileges'] || "User Privileges"}</label>
                            <select class="form-select obj-required" id="privileges"></select>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="mb-2 required">${langData['status'] || "Status"}</label>
                            <select class="form-select obj-required" id="status"></select>
                        </div>
                    </div>
                    <hr>
                    <h6 class="fw-bold mb-3">
                        <i class="fa-solid fa-address-book me-1"></i>
                        <span>${langData['contact'] || "Contact"}</span>
                    </h6>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="mb-2">${langData['email'] || "Email"}</label>
                            <div class="input-group">
                                <span class="input-group-text"><i class="fa-regular fa-envelope"></i></span>
                                <input type="email" class="form-control" id="email" maxlength="200">
                            </div>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="mb-2">${langData['mobile'] || "Mobile"}</label>
                            <div class="input-group">
                                <span class="input-group-text"><i class="fa-solid fa-phone"></i></span>
                                <input type="text" class="form-control" id="phone" maxlength="20">
                            </div>
                        </div>
                    </div>
                    <hr>
                    <h6 class="fw-bold mb-3">
                        <i class="fa-solid fa-lock me-1"></i>
                        <span>${langData['password'] || "Password"}</span>
                    </h6>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="mb-2 required">${langData['username'] || "Username"}</label>
                            <div class="input-group">
                                <span class="input-group-text"><i class="fa-solid fa-user-lock"></i></span>
                                <input type="text" class="form-control obj-required" id="username_" maxlength="50">
                            </div>
                            <ul id="user-rules" class="mt-2 list-unstyled">
                                <li><input type="checkbox" class="form-check-input me-1 pwc" id="user_len" disabled>
                                    <span>${langData['limit_5_10_characters'] || "5–10 Characters"}</span>
                                </li>
                                <li><input type="checkbox" class="form-check-input me-1 pwc" id="user_only" disabled>
                                    <span>${langData['letters_and_number_only'] || "Letters and numbers only."}</span>
                                </li>
                            </ul>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="mb-2 required">${langData['password'] || "Password"}</label>
                            <div class="input-group">
                                <span class="input-group-text"><i class="fa-solid fa-key"></i></span>
                                <input type="password" class="form-control obj-required" id="password_" maxlength="20">
                                <button class="btn btn-outline-secondary toggle-pass" type="button" data-target="password_">
                                    <i class="fa-regular fa-eye"></i>
                                </button>
                            </div>
                            <ul id="pw-rules" class="mt-2 list-unstyled">
                                <li><input type="checkbox" class="form-check-input me-1 pwc" id="pw_len" disabled>
                                    <span>${langData['limit_5_10_characters'] || "5–10 Characters"}</span>
                                </li>
                                <li><input type="checkbox" class="form-check-input me-1 pwc" id="pw_upper" disabled>
                                    <span>${langData['at_least_1_uppercase_letter'] || "At least 1 uppercase letter"}</span>
                                </li>
                                <li><input type="checkbox" class="form-check-input me-1 pwc" id="pw_only" disabled>
                                    <span>${langData['letters_and_number_only'] || "Letters and numbers only."}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                `);
                modalEl.find('.toggle-pass').on('click', function(){
                    const target = $(this).data('target');
                    const input = modalEl.find(`#${target}`);
                    const icon = $(this).find('i');
                    if(input.attr('type') === 'password'){
                        input.attr('type', 'text');
                        icon.removeClass('fa-eye').addClass('fa-eye-slash');
                    } else {
                        input.attr('type', 'password');
                        icon.removeClass('fa-eye-slash').addClass('fa-eye');
                    }
                });
                initSelect2Remote('#role', `${BASE_URL}/api/member.filter`, { type: 'role' });
                initSelect2Remote('#privileges', `${BASE_URL}/api/member.filter`, { type: 'privileges' });
                initSelect2Remote('#status', `${BASE_URL}/api/member.filter`, { type: 'status' });
                let member = res.data;
                $('#member_id').val(member_id || '');
                $('#first_name').val(member && member.first_name || '');
                $('#last_name').val(member && member.last_name || '');
                $('#role').val(member && member.role || '');
                $('#email').val(member && member.email || '');
                $('#phone').val(member && member.phone || '');
                $('#status').val(member && member.status || '');
                $('#password_').val(member && member.password_hash || '');
                $('#username_').val(member && member.username || '');
                $('#role').on('change', function() {
                    const isUser = $(this).val() === 'user';
                    const $privileges = $('#privileges');
                    const $label = $privileges.closest('.mb-3').find('label'); 
                    if (isUser) {
                        $privileges.prop("disabled", false);
                        $privileges.addClass('obj-required');
                        $label.addClass('required');
                    } else {
                        $privileges.prop("disabled", true);
                        $privileges.val(null).trigger('change');
                        $privileges.removeClass('obj-required');
                        $label.removeClass('required');
                        $privileges.removeClass('is-invalid'); 
                    }
                });
                if (member && member.role) {
                    let roleName = member.role.charAt(0).toUpperCase() + member.role.slice(1);
                    var newOptionRole = new Option(roleName, member.role, true, true);
                    $('#role').append(newOptionRole).trigger('change');
                } else {
                    $('#role').trigger('change');
                }
                if (member && member.privileges_id && member.role === 'user') {
                    var newOptionPrivileges = new Option(member.privileges_name, member.privileges_id, true, true);
                    $('#privileges').append(newOptionPrivileges).trigger('change');
                }
                if (member && member.status) {
                    let statusName = member.status.charAt(0).toUpperCase() + member.status.slice(1);
                    var newOptionStatus = new Option(statusName, member.status, true, true);
                    $('#status').append(newOptionStatus).trigger('change');
                }
                if(member && member.password_hash) {
                    verifyAuth($('#password_').val(), 'password');
                }
                if(member && member.username) {
                    verifyAuth($('#username_').val(), 'username');
                }
            } else {
                showError(langData['cannot_load']);
            }
        },
        error: function(){
            showError(langData['cannot_load']);
        }
    });
});
$(document).on('keyup', '#password_', function () {
    let pw = $(this).val();
    verifyAuth(pw, 'password');
});
$(document).on('keyup', '#username_', function () {
    let u = $(this).val();
    verifyAuth(u, 'username');
});
function verifyAuth(key, type){
    if(type === 'password'){ 
        $('#pw_len').prop('checked', key.length >= 5 && key.length <= 10);
        $('#pw_only').prop('checked', /^[A-Za-z0-9]+$/.test(key));
        $('#pw_upper').prop('checked', /[A-Z]/.test(key));
    } else {
        $('#user_len').prop('checked', key.length >= 5 && key.length <= 10);
        $('#user_only').prop('checked', /^[A-Za-z0-9]+$/.test(key));
    }
}
function validPassword(pw){
    return (
        pw.length >= 5 &&
        pw.length <= 10 &&
        /^[A-Za-z0-9]+$/.test(pw) &&
        /[A-Z]/.test(pw)
    );
}
function validUsername(u){
    return (
        u.length >= 5 &&
        u.length <= 10 &&
        /^[A-Za-z0-9]+$/.test(u)
    );
}
$(document).on('blur', '#email', function () {
    let email = $(this).val().trim();
    if (email === '') {
        $('#email').removeClass('is-invalid');
        return;
    }
    if (!isValidEmail(email)) {
        $('#email').addClass('is-invalid').focus();
        showWarning(langData['invalid_email'] || 'Invalid email format.');
        return;
    }
    let member_id = $('#member_id').val() || '';
    $.ajax({
        url: `${BASE_URL}/api/member.exitsmail`,
        method: 'POST',
        data: { email: email, member_id: member_id },
        dataType: 'json',
        success: function(res) {
            if(res.exists === true){
                showWarning(langData['email_exists'] || 'This email is already in use by another member.');
                $('#email').addClass('is-invalid').focus();
                $("#email").val("");
            } else {
                $('#email').removeClass('is-invalid');
            }
        }
    });
});
$(document).on('blur', '#username_', function () {
    checkUsernameUnique();
});
function checkUsernameUnique(username) {
    if (username === '') {
        $('#username_').removeClass('is-invalid');
        return;
    }
    let member_id = $('#member_id').val() || '';
    $.ajax({
        url: `${BASE_URL}/api/member.exitsuser`,
        method: 'POST',
        data: { username: username, member_id: member_id },
        dataType: 'json',
        success: function(res) {
            if(res.exists === true){
                showWarning(langData['username_exists'] || 'This username is already in use by another member.');
                $('#username_').addClass('is-invalid').focus();
                $("#username_").val("");
            } else {
                $('#username_').removeClass('is-invalid');
            }
        }
    });
}
$(document).on('click', '.save-member', function () {
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
        showWarning(langData['required_star_message'] || 'Please fill all fields marked with *');
        $('.is-invalid').first().focus();
        return;
    }
    let password = $("#password_").val().trim();
    if(!validPassword(password)){
        $("#password_").addClass("is-invalid");
        showWarning(langData['not_match_password']);
        $("#password_").focus();
        return;
    } else {
        $("#password_").removeClass("is-invalid");
    }
    let username = $("#username_").val().trim();
    if(!validUsername(username)){
        $("#username_").addClass("is-invalid");
        showWarning(langData['not_match_username']);
        $("#username_").focus();
        return;
    } else {
        $("#username_").removeClass("is-invalid");
    }
    saveMember();
});
function saveMember() {
    const btn = $(".save-member");
    btn.prop("disabled", true);
    $.ajax({
        url: `${BASE_URL}/api/member.save`,
        method: 'POST',
        data: { 
            member_id: $("#member_id").val(), 
            first_name: $("#first_name").val().trim(), 
            last_name: $("#last_name").val().trim(), 
            role: $("#role").val(), 
            privileges: $("#privileges").val(), 
            status: $("#status").val(),
            email: $("#email").val().trim(),
            phone: $("#phone").val().trim(),
            password: $("#password_").val().trim(),
            username: $("#username_").val().trim()
        },
        dataType: 'json',
        success: function (res) {
            Swal.close();
            btn.prop("disabled", false);
            if (res.status === true) {
                showSuccess(langData['saved_successfully']);
                if (typeof initMemberTable === "function") initMemberTable();
                $("#member_id").val(res.member_id);
            } else {
                showError((langData['cannot_save'] || 'Error: ') + (res.message || 'Unknown error'));
            }
        },
        error: function (xhr, status, error) {
            Swal.close();
            btn.prop("disabled", false);
            let msg = langData['cannot_save'];
            try {
                let res = JSON.parse(xhr.responseText);
                if (res.message) msg += ": " + res.message;
            } catch (e) {}
            showError(msg);
        },
        complete: function() {
            btn.prop("disabled", false);
        }
    });
}
$(document).on('input change', '.obj-required', function () {
    let value = $(this).val();
    if ($(this).is(':checkbox') || $(this).is(':radio')) {
        if ($(this).is(':checked')) {
            $(this).removeClass('is-invalid');
        } else {
            $(this).addClass('is-invalid');
        }
        return;
    }
    value = value ? value.trim() : '';
    if (value) {
        $(this).removeClass('is-invalid');
    }
});
$('.filter-history').on('change', function () {
    initHistoryTable();
});
let tb_history;
function initHistoryTable() {
    let oldPage = 0;
    if ($.fn.DataTable.isDataTable('#tb_history')) {
        oldPage = $('#tb_history').DataTable().page();
        $('#tb_history').DataTable().destroy();
    }
    if ($.fn.DataTable.isDataTable('#tb_history')) {
        $('#tb_history').DataTable().ajax.reload(null, false);
        return;
    }
    tb_history = $('#tb_history').DataTable({
        processing: true,
        serverSide: true,
        responsive: true, 
        order: [[2, 'desc']],
        ajax: { 
            url: `${BASE_URL}/api/history.list`,
            type: "POST",
            data: function(d){
                d.date = $('#filter_history_date').val();
                d.member = $('#filter_history_member').val();
                d.role = $('#filter_history_role').val();
                d.device = $('#filter_history_device').val();
                d.browser = $('#filter_history_browser').val();
                d.timezone = $('#filter_history_timezone').val();
            }
        },
        columns: [{
            data: null,
            orderable: true, 
            render: function(row){
                return `<div class="d-flex align-items-center">
                            <div class="symbol symbol-35px symbol-circle me-2" style="width:30px; height:30px; background:#f3f6f9; display:flex; align-items:center; justify-content:center; border-radius:50%">
                                <i class="fa fa-user text-primary" style="font-size:12px"></i>
                            </div>
                            <div class="d-flex flex-column">
                                <span class="fw-bold text-gray-800 text-hover-primary mb-1">${row.first_name} ${row.last_name}</span>
                            </div>
                        </div>`;
            }
        },{ 
            data: "role",
            orderable: true, 
            render: function(data, type, row) {
                return `<div class="d-flex flex-column" data-i18n="${row.role}">${row.role}</div>`;
            }
        },{ 
            data: "login_at",
            orderable: true, 
            render: function(data, type, row) {
                let login = `<span class="text-muted fs-8 mt-1"><i class="fas fa-sign-in-alt me-1"></i>${row.login_at}</span>`;
                return `<div class="d-flex flex-column">${login}</div>`;
            }
        },{ 
            data: "logout_at",
            orderable: true, 
            render: function(data, type, row) {
                let logout = row.logout_at && row.logout_at !== '-' 
                    ? `<span class="text-muted fs-8 mt-1"><i class="fas fa-sign-out-alt me-1"></i>${row.logout_at}</span>`
                    : ``;
                return `<div class="d-flex flex-column">${logout}</div>`;
            }
        },{ 
            data: "usage",
            orderable: false, 
        },{ 
            data: "ip_address",
            orderable: true, 
            render: function(data) {
                return `<code class="px-2 py-1 bg-light rounded text-danger fw-bold">${data}</code>`;
            }
        },{ 
            data: "device_os",
            orderable: true, 
            render: function(data) {
                let icon = 'fa-laptop';
                let color = 'text-secondary';
                if(data === 'Windows') {
                    icon = 'fa-brands fa-windows';
                    color = 'text-primary';
                } else if(data === 'Android') {
                    icon = 'fa-brands fa-android';
                    color = 'text-success';
                } else if(data === 'iPhone (iOS)') {
                    icon = 'fa-mobile-screen-button';
                    color = 'text-dark';
                } else if(data === 'iPad (iOS)') {
                    icon = 'fa-tablet-screen-button';
                    color = 'text-dark';
                } else if(data === 'Mac OS') {
                    icon = 'fa-brands fa-apple';
                    color = 'text-dark';
                }
                return `<span class="fw-semibold ${color}"><i class="fa-solid ${icon} me-2"></i>${data}</span>`;
            }
        },{ 
            data: "device_browser",
            orderable: true, 
            render: function(data) {
                let bIcon = 'fa-globe';
                if(data === 'Chrome') bIcon = 'fa-brands fa-chrome text-warning';
                else if(data === 'Firefox') bIcon = 'fa-brands fa-firefox text-orange';
                else if(data === 'Safari') bIcon = 'fa-brands fa-safari text-info';
                return `<span class="text-gray-600 small"><i class="${bIcon} me-1"></i>${data}</span>`;
            }
        },{
            data: "timezone",
            orderable: true,
        },{
            data: "login_location",
            orderable: true,
        },{
            data: "log_type",
            orderable: true, 
            className: "text-center",
            render: function(data) {
                let badgeClass = data === 'kick' ? 'bg-light-danger text-danger' : 'bg-light-success text-success';
                let label = data === 'kick' ? 'Kicked' : 'Normal';
                return `<span class="badge ${badgeClass} border-0 px-3 py-2 text-uppercase" style="font-size: 10px;">${label}</span>`;
            }
        }],      
        pageLength: pageLength,
        lengthMenu: lengthMenu,
        stateLoadParams: function (settings, data) {
            data.start = oldPage;
            data.length = pageLength; 
        },
        language: getTableLang(),
        initComplete: function() {
            let $filter = $('#tb_history_filter');
            let self = this.api();
            let $input = $filter.find('input').unbind();
            $input.bind('keypress', function(e) {
                if (e.keyCode == 13) {
                    self.search(this.value).draw();
                }
            });
        },
        drawCallback: function(){
            getTableLang();
        }
    });
}
$('.filter-request').on('change', function () {
    initRequestTable();
});
$("input[name=status]").on('change', function () {
    initRequestTable();
});
let tb_request;
function initRequestTable() {
    let oldPage = 0;
    if ($.fn.DataTable.isDataTable('#tb_request')) {
        oldPage = $('#tb_request').DataTable().page();
        $('#tb_request').DataTable().destroy();
    }
    if ($.fn.DataTable.isDataTable('#tb_request')) {
        $('#tb_request').DataTable().ajax.reload(null, false);
        return;
    }
    tb_request = $('#tb_request').DataTable({
        processing: true,
        serverSide: true,
        responsive: true, 
        order: [[6, 'desc']],
        ajax: { 
            url: `${BASE_URL}/api/request.list`,
            type: "POST",
            data: function(d){
                d.status = $("input[name=status]:checked").val();
                d.date = $("#filter_request_date").val();
                d.member = $("#filter_request_member").val();
                d.role = $("#filter_request_role").val();
            }
        },
        columns: [{
            data: null,
            orderable: true, 
            render: function(row){
                return `<div class="d-flex align-items-center">
                            <div class="symbol symbol-35px symbol-circle me-2" style="width:30px; height:30px; background:#f3f6f9; display:flex; align-items:center; justify-content:center; border-radius:50%">
                                <i class="fa fa-user text-primary" style="font-size:12px"></i>
                            </div>
                            <div class="d-flex flex-column">
                                <span class="fw-bold text-gray-800 text-hover-primary mb-1">${row.first_name} ${row.last_name}</span>
                            </div>
                        </div>`;
            }
        },{ 
            data: "role",
            orderable: true, 
            render: function(data, type, row) {
                return `<div class="d-flex flex-column" data-i18n="${row.role}">${row.role}</div>`;
            }
        },{ 
            data: "email",
            orderable: true,
        },{ 
            data: "username",
            orderable: true,
        },{
            data: "member_status",
            orderable: true,
            render: function (status, type, row) {
                let badge = '';
                switch(status) {
                    case "active":
                        badge = "success";
                        break;
                    case "banned":
                        badge = "danger";
                        break;
                    default:
                        badge = "secondary";
                }
                return `
                    <div class="d-flex align-items-center gap-2">
                        <span class="badge bg-${badge}-subtle text-${badge}" style="font-weight:400;">${langData[status] || status}</span>
                    </div>
                `;
            }
        },{ 
            data: "user_note",
            orderable: true, 
        },{ 
            data: "created_at",
            orderable: true,
        },{
            data: "status",
            orderable: true,
            render: function (status, type, row) {
                let badge = '';
                switch(status) {
                    case "approved":
                        badge = "success";
                        break;
                    case "rejected":
                        badge = "danger";
                        break;
                    default:
                        badge = "warning";
                }
                return `
                    <div class="d-flex align-items-center gap-2">
                        <span class="badge bg-${badge}-subtle text-${badge}" style="font-weight:400;">${langData[status] || status}</span>
                    </div>
                `;
            }
        },{ 
            data: "admin_remark",
            orderable: true, 
        },{ 
            data: "processed_at",
            orderable: true, 
        },{
            data: null,
            orderable: false,
            render: function(row){
                return `
                    ${row.status == 'pending' ? `
                        <div class="btn-group border rounded-3 bg-white">
                            <button class="btn btn-link text-success py-1 manage-request" data-id="${row.request_id}" data-status="approved" data-member=${row.member_id}><i class="fa-solid fa-check"></i></button>
                            <button class="btn btn-link py-1 text-danger border-start manage-request" data-id="${row.request_id}" data-status="rejected"><i class="fa-solid fa-xmark"></i></button>
                        </div> 
                    ` : ``}
                `;
            }
        }],
        pageLength: pageLength,
        lengthMenu: lengthMenu,
        stateLoadParams: function (settings, data) {
            data.start = oldPage;
            data.length = pageLength; 
        },
        language: getTableLang(),
        initComplete: function() {
            let $filter = $('#tb_history_filter');
            let self = this.api();
            let $input = $filter.find('input').unbind();
            $input.bind('keypress', function(e) {
                if (e.keyCode == 13) {
                    self.search(this.value).draw();
                }
            });
        },
        drawCallback: function(){
            getTableLang();
        }
    });
}
$(document).on('keyup', '#new_password', function () {
    let pw = $(this).val();
    $('#pw_lens').prop('checked', pw.length >= 5 && pw.length <= 10);
    $('#pw_onlys').prop('checked', /^[A-Za-z0-9]+$/.test(key));
    $('#pw_uppers').prop('checked', /[A-Z]/.test(pw));
});

$(document).on('click', '#togglePasswordNew', function () {
    const input = $("#new_password");
    const icon = $("#toggleIconNew");
    const isPassword = input.attr("type") === "password";
    input.attr("type", isPassword ? "text" : "password");
    icon.toggleClass("fa-eye-slash fa-eye");
});
$(document).on('click', '.manage-request', function () {
    let id = $(this).data("id");
    let status = $(this).data("status");
    let member_id = $(this).data("member");
    if(status === 'approved') {
        let modalEl = $('#passwordModal');
        let modal = new bootstrap.Modal(modalEl[0]);
        modalEl.find(".modal-header").html(`
            <h6 class="modal-title text-success"><i class="bi bi-check-circle-fill me-2"></i>${langData['approved'] || "Approved"}</h6>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        `);
        modalEl.find(".modal-body").html(`
            <div class="w-100 mb-3 text-start">
                <label class="form-label fw-bold">${langData['new_password'] || "New Password"}</label>
                <div class="input-group mb-3">
                    <input type="password" class="form-control" id="new_password" placeholder="••••••••" autocomplete="new-password">
                    <span class="input-group-text" id="togglePasswordNew" style="cursor:pointer;">
                        <i class="fa-solid fa-eye-slash" id="toggleIconNew"></i>
                    </span>
                </div>
                <div class="p-3 bg-light rounded shadow-sm">
                    <small class="text-muted d-block mb-2">เงื่อนไขรหัสผ่าน:</small>
                    <ul id="pw-rules" class="list-unstyled mb-0">
                        <li class="mb-1"><input type="checkbox" class="form-check-input me-2" id="pw_lens" disabled> <small data-i18n="limit_5_10_characters"></small></li>
                        <li class="mb-1"><input type="checkbox" class="form-check-input me-2" id="pw_onlys" disabled> <small data-i18n="letters_and_number_only"></small></li>
                        <li class="mb-1"><input type="checkbox" class="form-check-input me-2" id="pw_uppers" disabled> <small data-i18n="at_least_1_uppercase_letter"></small></li>
                    </ul>
                </div>
                <hr class="my-4">
                    <div class="card bg-light border-0">
                        <div class="card-body">
                            <h6 class="card-title fw-bold text-dark"><i class="fa-solid fa-bell me-2"></i>${langData['notification_settings']}</h6>
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="send_notification">
                                <label class="form-check-label" for="send_notification">${langData['send_update']}</label>
                            </div>
                        </div>
                    </div>
            </div>    
        `);
        modalEl.find(".modal-footer").html(`
            <button type="button" class="btn btn-success approved-request" data-id="${id}" data-member="${member_id}">
                <i class="bi bi-save me-1"></i> ${langData['approved'] || "Confirm Approved"}
            </button>
            <button type="button" class="btn btn-link text-secondary" data-bs-dismiss="modal">${langData['close'] || "Close"}</button>
        `);
        modal.show();
    } else {
        Swal.fire({
            title: langData['confirm_reject'] || 'Are you sure you want to reject this request?',
            input: 'textarea',
            inputAttributes: { 'autocapitalize': 'off' },
            showCancelButton: true,
            confirmButtonText: langData['yes'] || 'Yes',
            cancelButtonText: langData['no'] || 'No',
            confirmButtonColor: '#dc3545',
            showLoaderOnConfirm: true,
            preConfirm: (note) => {
                return note;
            }
        }).then((result) => {
            if (result.isConfirmed) {
                $.post(`${BASE_URL}/api/member.reject`, { id: id, note: result.value }, function(res) {
                    if(res.status === true){
                        showSuccess(langData['reject_successfully']);
                        initRequestTable();
                    } else {
                        showError(langData['cannot_save']);
                    }
                }, 'json').fail(() => showError(langData['cannot_save']));
            }
        });
    }
});
$(document).on('click', '.approved-request', function() {
    let id = $(this).data("id");
    let member_id = $(this).data("member");
    const newPassword = $("#new_password").val();
    if (!$('#pw_lens').is(':checked') || !$('#pw_onlys').is(':checked')) {
        showError(langData['password_invalid_format']);
        return;
    }
    let $btn = $(this);
    let originalHtml = $btn.html();
    $btn.prop('disabled', true).html(`<span class="spinner-border spinner-border-sm me-1"></span> ${langData['processing...'] || 'Processing...'}`);
    $.post(`${BASE_URL}/api/member.approved`, {
        id: id,
        password: newPassword,
        member_id: member_id,
        send_notification: $("#send_notification").is(":checked") ? 'yes' : 'no'
    }, function(res) {
        if (res.status === true || res.status === 'success') {
            bootstrap.Modal.getInstance($('#passwordModal')[0]).hide();
            showSuccess(langData['password_updated_success']);
            initRequestTable();
        } else {
            showError(langData[res.message] || res.message || "Error");
            $btn.prop('disabled', false).html(originalHtml);
        }
    }, 'json').fail(function() {
        $btn.prop('disabled', false).html(originalHtml);
        showError(langData['connection_error']);
    });
});
function initPermissionSetting() {
    $.ajax({
        url: `${BASE_URL}/api/member.permission`,
        method: 'POST',
        dataType: 'json',
        success: function(res) {
            if (res.status === true && res.data) {
                res.data.forEach(item => {
                    let target = $(`#${item.field_key}`);
                    if (target.length) {
                        target.prop('checked', item.is_allowed == 1);
                    }
                });
            }
        }
    });
}
$(document).on('click', '.save-permission', function() {
    let permissions = [];
    $('#permissionForm input[type="checkbox"]').each(function() {
        permissions.push({
            field_key: $(this).attr('id'),
            is_allowed: $(this).is(':checked') ? 1 : 0
        });
    });
    const btn = $(this);
    btn.prop('disabled', true).html(`<span class="spinner-border spinner-border-sm"></span> ${langData['saving']}`);
    $.ajax({
        url: `${BASE_URL}/api/member.update_permissions`,
        method: 'POST',
        data: { permissions: permissions },
        dataType: 'json',
        success: function(res) {
            if (res.status === true) {
                showSuccess(langData['saved_successfully']);
            } else {
                showError(langData[res.message] || res.message || "Error");
            }
        },
        error: function() {
            showError(langData['cannot_save']);
        },
        complete: function() {
            btn.prop('disabled', false).html(langData['save']);
        }
    });
});
let tb_privileges;
function initPrivilegesTable() {
    let oldPage = 0;
    if ($.fn.DataTable.isDataTable('#tb_privileges')) {
        oldPage = $('#tb_privileges').DataTable().page();
        $('#tb_privileges').DataTable().destroy();
    }
    tb_privileges = $('#tb_privileges').DataTable({
        processing: true,
        serverSide: true,
        order: [[2, 'desc']],
        ajax: { 
            url: `${BASE_URL}/api/privileges.list`, 
            type: "POST",
        },
        columns: [{ 
            data: "privileges_name",
        },{ 
            data: "status",
            orderable: true,
            render: function (status, type, row) {
                let badge = '';
                switch(status) {
                    case "active":
                        badge = "success";
                        break;
                    case "banned":
                        badge = "danger";
                        break;
                    default:
                        badge = "warning";
                }
                return `
                    <div class="d-flex align-items-center gap-2">
                        <span class="badge bg-${badge}-subtle text-${badge}" style="font-weight:400;">${langData[status] || status}</span>
                    </div>
                `;
            }
        },{ 
            data: "created_at",
            className: 'align-middle text-nowrap',
            render: function(data) {
                return `<small class="text-muted"><i class="fa-regular fa-calendar me-1"></i>${data}</small>`;
            }
        },{
            data: null,
            className: 'align-middle text-end',
            orderable: false,
            render: function(row) {
                return `
                    <div class="btn-group border rounded-3 bg-white">
                        <button class="btn btn-link text-info py-1 config-privilegest" data-id="${row.privileges_id}">
                            <i class="fa-solid fa-list-check"></i>
                        </button>
                        <button class="btn btn-link text-warning py-1 border-start manage-privileges" data-id="${row.privileges_id}">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn btn-link text-danger py-1 border-start delete-privileges" data-id="${row.privileges_id}">
                            <i class="fa-regular fa-trash-can"></i>
                        </button>
                    </div>`;
            }
        }],
        pageLength: pageLength,
        lengthMenu: lengthMenu,
        language: getTableLang(),
        initComplete: function() {
            let self = this.api();
            let $filter = $('#tb_privileges_filter');
            if ($filter.find('.manage-disclaimer').length === 0) {
                $filter.append(`
                    <button class="btn btn-primary btn-sm manage-privileges ms-2" data-id="0">
                        <i class="fa-solid fa-plus"></i> <span>${langData['privileges'] || 'Privileges'}</span>
                    </button>
                `);
            }
            let $input = $filter.find('input').unbind();
            $input.bind('keypress', function(e) {
                if (e.keyCode == 13) { self.search(this.value).draw(); }
            });
        }
    });
}
const apiPost = (url, data, options = {}) => {
    const isFormData = data instanceof FormData;
    return $.ajax({
        url: `${BASE_URL}${url}`,
        type: 'POST',
        data: data,
        dataType: options.dataType || 'json',
        contentType: options.contentType !== undefined ? options.contentType : (isFormData ? false : 'application/x-www-form-urlencoded; charset=UTF-8'),
        processData: options.processData !== undefined ? options.processData : (isFormData ? false : true),
        xhr: options.xhr
    });
};
$(document).on('click', '.config-privilegest', function() {
    const privileges_id = $(this).data("id");
    const modalEl = $('#windModal');
    modalEl.find(".modal-header").html(`
        <h5 class="modal-title"><i class="bi bi-shield-lock me-2"></i>${langData['user_privileges'] || 'User Privileges'}</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
    `);
    modalEl.find(".modal-body").html(`
        <div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
            <span class="fw-bold text-secondary">${langData['menu'] || 'Menu'}</span>
            <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" id="selectAllMenus">
                <label class="form-check-label small" for="selectAllMenus">${langData['select_all'] || 'Select All'}</label>
            </div>
        </div>
        <div id="menu-list-container" style="max-height: 400px; overflow-y: auto; overflow-x: hidden;">
            <div class="text-center p-5">
                <div class="spinner-border text-primary" role="status"></div>
                <div class="mt-2 text-muted">${langData['loading'] || "Loading..."}</div>
            </div>
        </div>
    `);
    modalEl.find(".modal-footer").html(`
        <button type="button" class="btn btn-primary save-config" data-privilege-id="${privileges_id}">
            ${langData['save'] || "Save"}
        </button>
        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">${langData['close'] || "Close"}</button>
    `);
    let modal = new bootstrap.Modal(modalEl[0], { focus: false });
    modal.show();
    let rightsMenu = [];
    apiPost(`/api/config.menu`, { privileges_id: privileges_id }).done(res => {
        if (res.status) {
            rightsMenu = res.data.map(item => item.menu_id.toString());
        }
        apiPost(`/api/settings.menu`, { privileges_id: privileges_id }).done(res => {
            if (res.status) {
                const userMenus = res.data.filter(item => item.target_group === 'user');
                renderMenuList(userMenus, rightsMenu);
            } else {
                $('#menu-list-container').html(`<div class="alert alert-danger">${res.message}</div>`);
            }
        });
    });
});
function renderMenuList(menus, selectedIds = []) {
    let html = '';
    if (menus.length === 0) {
        html = `<div class="text-center text-muted p-4">${langData['no_data_found'] || "No data available"}</div>`;
    } else {
        menus.forEach(menu => {
            const isChecked = (selectedIds.length === 0) || selectedIds.includes(menu.id.toString()) ? 'checked' : '';
            html += `
            <div class="form-check mb-1 p-2 border-bottom-dashed hover-bg-light">
                <input class="form-check-input ms-0 me-3" type="checkbox" value="${menu.id}" id="menu_${menu.id}" name="menu_access[]" ${isChecked}>
                <label class="form-check-label d-flex align-items-center cursor-pointer" for="menu_${menu.id}">
                    <i class="bi ${menu.icon || 'bi-circle'} fs-5 me-3 text-primary"></i> 
                    <div>
                        <div class="fw-bold">${menu.th || (menu.translations && menu.translations.th)}</div>
                        <div class="small text-muted" style="font-size: 0.75rem;">${menu.en || (menu.translations && menu.translations.en)}</div>
                    </div>
                </label>
            </div>`;
        });
    }
    $('#menu-list-container').html(html);
}
$(document).on('change', '#selectAllMenus', function() {
    const isChecked = $(this).is(':checked');
    $('.form-check-input[name="menu_access[]"]').prop('checked', isChecked);
});
$(document).on('click', '.save-config', function() {
    const $btn = $(this);
    const privId = $btn.data('privilege-id');
    let selectedMenus = [];
    $('.form-check-input[name="menu_access[]"]:checked').each(function() {
        selectedMenus.push($(this).val());
    });
    $btn.prop('disabled', true).html(`<span class="spinner-border spinner-border-sm me-1"></span> ${langData['saving'] || "Saving..."}`);
    $.ajax({
        url: `${BASE_URL}/api/privileges.config`,
        method: 'POST',
        data: {
            privileges_id: privId,
            menu_ids: selectedMenus 
        },
        dataType: 'json',
        success: function(res) {
            if (res.status) {
                showSuccess(langData['saved_successfully'] || 'Saved successfully');
                const modalElement = document.getElementById('windModal');
                const modalInstance = bootstrap.Modal.getInstance(modalElement);
                if (modalInstance) {
                    modalInstance.hide();
                }
            } else {
                showError((langData['cannot_save'] || 'Error: ') + ' ' + (langData[res.message] || res.message || 'Unknown error'));
            }
        },
        error: function(xhr, status, error) {
            console.error(xhr.responseText);
            showError('Server Error: ' + status);
        },
        complete: function() {
            $btn.prop('disabled', false).html('<i class="bi bi-save me-1"></i> ' + (langData['save'] || "บันทึก"));
        }
    });
});
$(document).on('click', '.delete-privileges', function() {
    let privileges_id = $(this).data("id");
    showConfirm(langData['confirm'], langData['confirm_delete'], function(){
        $.ajax({
            url: `${BASE_URL}/api/privileges.delete`,
            method: 'POST',
            data: { id: privileges_id },
            dataType: 'json',
            success: function(res) {
                if(res.status === true){
                    showSuccess(langData['deleted_successfully']);
                    initPrivilegesTable();
                } else {
                    showError(langData['cannot_delete']);
                }   
            },
            error: function(){
                showError(langData['cannot_delete']);
            }
        });
    });
});
$(document).on('click', '.manage-privileges', function() {
    let privileges_id = $(this).data("id");
    $.ajax({
        url: `${BASE_URL}/api/privileges.get`,
        method: 'POST',
        data: { id: privileges_id },
        dataType: 'json',
        success: function(res) {
            if(res.status === true){
                let privilegesData = res.data;
                let modalEl = $('#windModal');
                let modal = new bootstrap.Modal(modalEl[0]);
                modal.show();
                modalEl.find(".modal-header").html(`
                    <h5 class="modal-title">${langData['user_privileges'] || 'User Privileges'}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                `);
                modalEl.find(".modal-footer").html(`
                    <button type="submit" class="btn btn-primary me-2 save-privileges">${langData['save'] || "Save"}</button>
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">${langData['close'] || "Close"}</button>
                `);
                modalEl.find(".modal-body").html(`
                    <input type="hidden" name="privileges_id" id="privileges_id" value="${privileges_id ?? ''}">
                    <div class="mb-3">
                        <label class="mb-2 required">${langData['user_privileges'] || 'User Privileges'}</label>
                        <input type="text" class="form-control obj-required" id="privileges_name" maxlength="255">
                    </div>
                    <div class="mb-3">
                        <label class="mb-2 required">${langData['status'] || 'Status'}</label>
                        <select id="status" class="form-select obj-required"></select>
                    </div>
                `);
                if (privilegesData) {
                    $("#privileges_id").val(privilegesData.privileges_id);
                    $("#privileges_name").val(privilegesData.privileges_name);
                    if (privilegesData.status) {
                        let statusName = privilegesData.status.charAt(0).toUpperCase() + privilegesData.status.slice(1);
                        var newOptionStatus = new Option(statusName, privilegesData.status, true, true);
                        $('#status').append(newOptionStatus).trigger('change');
                    }
                }
            } else {
                showError(langData['cannot_load']);
            }
        },
        error: function(){
            showError(langData['cannot_load']);
        }
    });
});
$(document).on('click', '.save-privileges', function () {
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
        showWarning(langData['required_star_message'] || 'Please fill all fields marked with *');
        $('.is-invalid').first().focus();
        return;
    }
    savePrivileges();
});
function savePrivileges() {
    const btn = $(".save-privileges");
    btn.prop("disabled", true);
    const formData = new FormData();
    formData.append("privileges_id", $("#privileges_id").val() || "");
    formData.append("status", $("#status").val() || "active");
    formData.append("privileges_name", $("#privileges_name").val());
    Swal.fire({
        title: langData['saving'] || 'Saving...',
        html: `
            <p>${langData['do_not_close'] || 'Please do not close this window.'}</p>
            <div class="progress mt-2">
                <div id="swal-progress" class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width:0%">0%</div>
            </div>
        `,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });
    $.ajax({
        url: `${BASE_URL}/api/privileges.save`,
        type: "POST",
        data: formData,
        contentType: false,
        processData: false,
        dataType: "json",
        xhr: function () {
            let xhr = new window.XMLHttpRequest();
            xhr.upload.addEventListener("progress", function (e) {
                if (e.lengthComputable) {
                    let percent = Math.round((e.loaded / e.total) * 100);
                    let bar = document.getElementById("swal-progress");
                    if (bar) {
                        bar.style.width = percent + "%";
                        bar.innerText = percent + "%";
                    }
                }
            });
            return xhr;
        },
        success: function (res) {
            Swal.close();
            if (res.status === true) {
                showSuccess(langData['saved_successfully']);
                if (typeof initPrivilegesTable === "function") initPrivilegesTable();
                $('#windModal').modal('hide');
            } else {
                showError((langData['cannot_save'] || 'Error: ') + ' ' + (langData[res.message] || 'Unknown error'));
            }
        },
        error: function (xhr, status, error) {
            Swal.close();
            let msg = langData['cannot_save'];
            try {
                let res = JSON.parse(xhr.responseText);
                if (res.message) msg += ": " + res.message;
            } catch (e) {}
            showError(msg);
        },
        complete: function() {
            btn.prop("disabled", false);
        }
    });
}