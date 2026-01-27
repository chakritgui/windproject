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
        ordering: false,
        order: [[4, 'asc'], [5, 'desc']],
        ajax: { 
            url: "api/member/list",
            type: "POST",
            data: function(d){
                d.role = $('#filter_role').val();
                d.status = $('#filter_status').val();
            }
        },
        columns: [         
            { 
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
            }, 
            { 
                data: null,
                render: function(row){
                    return `${row.first_name} ${row.last_name}`;
                } 
            },
            { data: "email" },
            { data: "phone" },
            { data: "role" },
            { data: "created_at" },
            { data: "last_login_at" },
            {
                data: "status",
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
                            <span class="badge bg-${badge}" style="font-weight:400;" data-i18n="${status}"></span>
                        </div>
                    `;
                }
            },
            {
                data: null,
                orderable: false,
                render: function(row){
                    return `
                        <button class="btn btn-light text-secondary manage-member" data-id="${row.member_id}"><i class="fa-solid fa-pen-to-square"></i></button>
                        ${((row.role || '').toLowerCase() !== 'administrator') ? `<button class="btn btn-light text-secondary text-danger delete-member" data-id="${row.member_id}"><i class="fa-regular fa-trash-can"></i></button>` : ''}
                    `;
                }
            }
        ],      
        pageLength: pageLength,
        lengthMenu: lengthMenu,
        stateLoadParams: function (settings, data) {
            data.start = oldPage;
            data.length = pageLength; 
        },
        language: getTableLang(),
        initComplete: function(){
            let $filter = $('#tb_member_filter');
            let btn = `
                <button class="btn btn-primary btn-sm manage-member" data-id="">
                    <i class="fa-solid fa-plus"></i> <span data-i18n="member"></span>
                </button>
            `;
            $filter.append(btn);
            var input = $('#tb_member_filter input').unbind();
            var self = this.api();
            input.bind('keypress', function(e){
                if(e.keyCode == 13) {
                    self.search(input.val()).draw();
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
async function initMember() {
    initMemberTable(); 
}
$(document).ready(function () {
    initMember();
    initSelect2Remote('#filter_role', `${BASE_URL}/api/member/filter`, { type: 'role' });
    initSelect2Remote('#filter_status', `${BASE_URL}/api/member/filter`, { type: 'status' });
});
$(document).on('click', '.delete-member', function() {
    let member_id = $(this).data("id");
    showConfirm(langData['confirm'], langData['confirm_delete'], function(){
        $.ajax({
            url: `${BASE_URL}/api/member/delete`,
            method: 'POST',
            data: { id: member_id },
            dataType: 'json',
            success: function(res) {
                if(res.status === true){
                    showSuccess('Success', langData['deleted_successfully']);
                    initMemberTable();
                } else {
                    showError('Error', langData['cannot_delete']);
                }   
            },
            error: function(){
                showError('Error', langData['cannot_delete']);
            }
        });
    });
});
$(document).on('click', '.manage-member', function() {
    let member_id = $(this).data("id");
    $.ajax({
        url: `${BASE_URL}/api/member/get`,
        method: 'POST',
        data: { id: member_id },
        dataType: 'json',
        success: function(res) {
            if(res.status === true){
                let modalEl = $('#windModal');
                let modal = new bootstrap.Modal(modalEl[0]);
                modal.show();
                modalEl.find(".modal-header").html(`
                    <h5 class="modal-title" data-i18n="${(member_id) ? 'manageMember' : 'newMember'}"></h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                `);
                modalEl.find(".modal-footer").html(`
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" data-i18n="close"></button>
                    <button type="submit" class="btn btn-primary save-member" data-i18n="save"></button>
                `);
                modalEl.find(".modal-body").html(`
                    <input type="hidden" id="member_id">
                    <h6 class="fw-bold mb-3">
                        <i class="fa-solid fa-user-gear me-1"></i>
                        <span data-i18n="general"></span>
                    </h6>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="mb-2 required" data-i18n="firstname"></label>
                            <input type="text" class="form-control obj-required" id="first_name" maxlength="150">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="mb-2 required" data-i18n="lastname"></label>
                            <input type="text" class="form-control obj-required" id="last_name" maxlength="150">
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="mb-2 required" data-i18n="role"></label>
                            <select class="form-select obj-required" id="role"></select>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="mb-2 required" data-i18n="status"></label>
                            <select class="form-select obj-required" id="status"></select>
                        </div>
                    </div>
                    <hr>
                    <h6 class="fw-bold mb-3">
                        <i class="fa-solid fa-address-book me-1"></i>
                        <span data-i18n="contact"></span>
                    </h6>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="mb-2 required" data-i18n="email"></label>
                            <div class="input-group">
                                <span class="input-group-text"><i class="fa-regular fa-envelope"></i></span>
                                <input type="email" class="form-control obj-required" id="email" maxlength="200">
                            </div>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="mb-2 required" data-i18n="mobile"></label>
                            <div class="input-group">
                                <span class="input-group-text"><i class="fa-solid fa-phone"></i></span>
                                <input type="text" class="form-control obj-required" id="phone" maxlength="20">
                            </div>
                        </div>
                    </div>
                    <hr>
                    <h6 class="fw-bold mb-3">
                        <i class="fa-solid fa-lock me-1"></i>
                        <span data-i18n="password"></span>
                    </h6>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="mb-2 required" data-i18n="username"></label>
                            <div class="input-group">
                                <span class="input-group-text"><i class="fa-solid fa-user-lock"></i></span>
                                <input type="text" class="form-control obj-required" id="username_" maxlength="50">
                            </div>
                            <ul id="user-rules" class="mt-2 list-unstyled">
                                <li><input type="checkbox" class="form-check-input me-1 pwc" id="user_len" disabled>
                                    <span data-i18n="user_line1"></span>
                                </li>
                                <li><input type="checkbox" class="form-check-input me-1 pwc" id="user_only" disabled>
                                    <span data-i18n="user_line2"></span>
                                </li>
                            </ul>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="mb-2 required" data-i18n="password"></label>
                            <div class="input-group">
                                <span class="input-group-text"><i class="fa-solid fa-key"></i></span>
                                <input type="password" class="form-control obj-required" id="password_" maxlength="20">
                                <button class="btn btn-outline-secondary toggle-pass" type="button" data-target="password_">
                                    <i class="fa-regular fa-eye"></i>
                                </button>
                            </div>
                            <ul id="pw-rules" class="mt-2 list-unstyled">
                                <li><input type="checkbox" class="form-check-input me-1 pwc" id="pw_len" disabled>
                                    <span data-i18n="pw_line1"></span>
                                </li>
                                <li><input type="checkbox" class="form-check-input me-1 pwc" id="pw_only" disabled>
                                    <span data-i18n="pw_line2"></span>
                                </li>
                                <li><input type="checkbox" class="form-check-input me-1 pwc" id="pw_upper" disabled>
                                    <span data-i18n="pw_line3"></span>
                                </li>
                                <li><input type="checkbox" class="form-check-input me-1 pwc" id="pw_lower" disabled>
                                    <span data-i18n="pw_line4"></span>
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
                initSelect2Remote('#role', `${BASE_URL}/api/member/filter`, { type: 'role' });
                initSelect2Remote('#status', `${BASE_URL}/api/member/filter`, { type: 'status' });
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
                if (member && member.role) {
                    let roleName = member.role.charAt(0).toUpperCase() + member.role.slice(1);
                    var newOptionStatus = new Option(roleName, member.role, true, true);
                    $('#role').append(newOptionStatus).trigger('change');
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
                showError('Error', langData['cannot_load']);
            }
        },
        error: function(){
            showError('Error', langData['cannot_load']);
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
        $('#pw_len').prop('checked', key.length >= 4 && key.length <= 20);
        $('#pw_only').prop('checked', /^[A-Za-z0-9@_\-\.&!+]+$/.test(key));
        $('#pw_upper').prop('checked', /[A-Z]/.test(key));
        $('#pw_lower').prop('checked', /[a-z]/.test(key));
    } else {
        if(isValidEmail(key)){
            $('#user_len').prop('checked', true);
            $('#user_only').prop('checked', true);
            return;
        }
        $('#user_len').prop('checked', key.length >= 8 && key.length <= 50);
        $('#user_only').prop('checked', /^[A-Za-z0-9@_\-\.&!+]+$/.test(key));
    }
}
function validPassword(pw){
    return (
        pw.length >= 4 &&
        pw.length <= 20 &&
        /^[A-Za-z0-9@_\-\.&!+]+$/.test(pw) &&
        /[A-Z]/.test(pw) &&
        /[a-z]/.test(pw)
    );
}
function validUsername(u){
    if(isValidEmail(u)) return true;
    return (
        u.length >= 8 &&
        u.length <= 50 &&
        /^[A-Za-z0-9@_\-\.&!+]+$/.test(u)
    );
}
$(document).on('blur', '#email', function () {
    let email = $(this).val().trim();
    if (email === '') {
        $("#username_").val("");
        $('#email').removeClass('is-invalid');
        return;
    }
    if (!isValidEmail(email)) {
        $('#email').addClass('is-invalid').focus();
        showWarning(
            langData['invalid_email'] || 'Invalid email format.',
            email
        );
        return;
    }
    let member_id = $('#member_id').val() || '';
    $.ajax({
        url: `${BASE_URL}/api/member/check-email`,
        method: 'POST',
        data: { email: email, member_id: member_id },
        dataType: 'json',
        success: function(res) {
            if(res.exists === true){
                showWarning(
                    email,
                    langData['email_exists'] || 'This email is already in use by another member.'
                );
                $('#email').addClass('is-invalid').focus();
                $("#email").val("");
            } else {
                $('#email').removeClass('is-invalid');
                if($('#username_').val() === '') {
                    $("#username_").val(email);
                    checkUsernameUnique(email);
                    verifyAuth(email, 'username');
                }
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
        url: `${BASE_URL}/api/member/check-username`,
        method: 'POST',
        data: { username: username, member_id: member_id },
        dataType: 'json',
        success: function(res) {
            if(res.exists === true){
                showWarning(
                    username,
                    langData['username_exists'] || 'This username is already in use by another member.'
                );
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
        showWarning(
            langData['validation_error'] || 'Validation Error',
            langData['required_star_message'] || 'Please fill all fields marked with *'
        );
        $('.is-invalid').first().focus();
        return;
    }
    let password = $("#password_").val().trim();
    if(!validPassword(password)){
        $("#password_").addClass("is-invalid");
        showWarning(
            langData['invalid_password'], langData['not_match_password']
        );
        $("#password_").focus();
        return;
    } else {
        $("#password_").removeClass("is-invalid");
    }
    let username = $("#username_").val().trim();
    if(!validUsername(username)){
        $("#username_").addClass("is-invalid");
        showWarning(
            langData['invalid_username'], langData['not_match_username']
        );
        $("#username_").focus();
        return;
    } else {
        $("#username_").removeClass("is-invalid");
    }
    saveMember();
});
function saveMember() {
    $(".save-member").attr("disabled", true);
    $.ajax({
        url: `${BASE_URL}/api/member/save`,
        method: 'POST',
        data: { 
            member_id: $("#member_id").val(), 
            first_name: $("#first_name").val().trim(), 
            last_name: $("#last_name").val().trim(), 
            role: $("#role").val(), 
            status: $("#status").val(),
            email: $("#email").val().trim(),
            phone: $("#phone").val().trim(),
            password: $("#password_").val().trim(),
            username: $("#username_").val().trim()
        },
        dataType: 'json',
        success: function(res) {
            if(res.status === true){
                showSuccess('Success', langData['saved_successfully']);
                initMemberTable();
                $('#windModal').modal('hide');
            } else {
                showError('Error', langData['cannot_save']);
            }   
            $(".save-member").attr("disabled", false);
        },
        error: function(){
            showError('Error', langData['cannot_save']);
            $(".save-member").attr("disabled", false);
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