const { remote, ipcRenderer } = require('electron');
const model = remote.require('./model/model.js');

async function getUsers() {
    let data = await model.getUsers();
    return data;
}

async function insertUser(user) {
    let data = await model.insertUser(user);
    return data;
}

class Validator {
    // Function checking valid student name
    static validateUsername(username) {
        const regexUsername = /^[a-z0-9_.-]{3,16}$/;
        if (!username) {
            return false;
        }
        if (!regexUsername.test(username)) {
            return false;
        }
        return true;
    }

    static validateFullname(fullname) {
        const regexFullname = /^[a-zA-Z_ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶ ẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợ ụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\\s]+$/;

        if (!fullname) {
            return false;
        }

        if (!regexFullname.test(fullname)) {
            return false;
        }
        return true;
    }

    static validateEmail(email) {
        const regexEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        if (!email) {
            return false;
        }

        if (!regexEmail.test(email)) {
            return false;
        }
        return true;
    }

    static validatePassword(password) {

        const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#$^+=!*()@%&]).{8,50}$/;

        if (!password) {
            return false;
        }

        if (!regexPassword.test(password)) {
            return false;
        }
        return true;
    }
}

function resetNotify() {
    $('#username-exist').css("display", "none");
    $('#email-exist').css("display", "none");
    $('#notifySuccess').css("display", "none");
}

function resetForm() {
    $("#fullname").val("");
    $('#username').val("");
    $('#password').val("");
    $('#password-confirm').val("");
    $('#email').val("");
}

$('#register-button').on('click', async (e) => {
    e.preventDefault();
    resetNotify();
    const arrayUsers = await getUsers();
    const _fullname = $('#fullname').val();
    if (!Validator.validateFullname(_fullname)) {
        return;
    }
    const _username = $('#username').val();
    if (!Validator.validateUsername(_username)) {
        return;
    }
    const _password = $('#password').val();

    if (!Validator.validatePassword(_password)) {
        return;
    }

    const _email = $('#email').val();
    if (!Validator.validateEmail(_email)) {
        return;
    }

    for (i = 0; i < arrayUsers.length; i++) {
        if (_username === arrayUsers[i].username && _email === arrayUsers[i].email) {
            $("#username-exist").css("display", "inline-block");
            $("#email-exist").css("display", "inline-block");
        }
        if (_username === arrayUsers[i].username) {
            $("#username-exist").css("display", "inline-block");
            return;
        }

        if (_email === arrayUsers[i].email) {
            $("#email-exist").css("display", "inline-block");
            return;
        }

    }

    const userObject = {
        username: _username,
        password: _password,
        email: _email,
        fullname: _fullname,
    };

    await insertUser(userObject);
    $('#notifySuccess').css("display", "inline-block");
    resetForm();
});

$('#login-button').click(() => {
    ipcRenderer.send('open-login');
});

$('#username').change(() => {
    console.log("Changed");
});

