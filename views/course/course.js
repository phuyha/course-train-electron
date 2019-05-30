const { remote, ipcRenderer } = require('electron');
const courseData = remote.require('./model/model.js');
const windowSet = remote.require('./lib/window-set.js');

ipcRenderer.send('ready-get-user-info');

let currentUser = {};

//get user information from main.js
ipcRenderer.on('get-user-info', (event, user) => {
    $('.profile').append('<h1>Welcome ' + user.fullname + '</h1>');
    currentUser = user;
});

async function getAllCourses() {
    let data = await courseData.getCourses();
    return data;
}

async function getQuestionsByCourseId(courseId) {
    let data = await courseData.getQuestionsByCourseId(courseId);
    return data;
}

async function updateCourseInvalid(courseId) {
    let data = await courseData.updateCourseInvalid(courseId);
    return data;
}
$(document).ready(async () => {
    const courses = await getAllCourses();
    for (const course of courses) {
        // get all questions by course id
        const questions = await getQuestionsByCourseId(course.id);
        // if this course don't have any question => set course to invalid
        if(questions.length === 0) {
            await updateCourseInvalid(course.id);
        }
        if (course.valid === 1) {
            $('#course-list').append(`
                <li id='${course.id}'>
                    <div class="card-front">
                        <h2>
                            <b> ${course.name}</b>
                        </h2> 
                        <p>${course.descript}</p>
                    </div>
                    <div class="card-back">
                        <h2>
                            <b>Click here</b>
                        </h2>
                    </div>
                    <div class="all-content">
                        <h1> ${course.name} </h1>
                    </div>
                </li>`);
            $(`#${course.id}`).click((event) => {
                Confirm(`Go to do ${course.name}`, 'Are you sure you want to do this Course', 'Yes', 'Cancel', course, currentUser);
            });
        }
    }
});
$('#logout-button').click(() => {
    windowSet.openLogin();
    windowSet.closeCourse();
});

// --------------------------------> CONFIRM DIALOG <---------------------------------------

function Confirm(title, msg, yes, no, course, currentUser) { /*change*/
    var content = "<div class='dialog-ovelay'>" +
        "<div class='dialog'><header>" +
        " <h3> " + title + " </h3> " +
        "<i class='fa fa-close'></i>" +
        "</header>" +
        "<div class='dialog-msg'>" +
        " <p> " + msg + " </p> " +
        "</div>" +
        "<footer>" +
        "<div class='controls'>" +
        " <button class='button button-danger doAction'>" + yes + "</button> " +
        " <button class='button button-default cancelAction'>" + no + "</button> " +
        "</div>" +
        "</footer>" +
        "</div>" +
        "</div>";
    $('body').prepend(content);
    $('.doAction').click(function () {
        ipcRenderer.send('open-quiz', course, currentUser);
        $(this).parents('.dialog-ovelay').fadeOut(500, function () {
            $(this).remove();
        });
    });
    $('.cancelAction, .fa-close').click(function () {
        $(this).parents('.dialog-ovelay').fadeOut(500, function () {
            $(this).remove();
        });
    });
}