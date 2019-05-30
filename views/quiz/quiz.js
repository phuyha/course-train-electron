const { remote, ipcRenderer } = require('electron');
const quizData = remote.require('./model/model.js');

let userAnswers = new Map();
let correctAnswers = new Map();
let questionIds = [];
const alphabetAnswers = ["A", "B", "C", "D"];

async function getQuestions(courseId) {
    let data = await quizData.getQuestionsByCourseId(courseId);
    return data;
}

async function getAnswers(questionId) {
    let data = await quizData.getAnswersByQuestionId(questionId);
    return data;
}

async function insertUsersCourses(userId, courseId, courseStatus) {
    let data = await quizData.insertUsersCourses(userId, courseId, courseStatus);
    return data;
}

async function selectUserCourses(userId, courseId) {
    let data = await quizData.selectUserCourses(userId, courseId);
    return data;
}

async function updateCourse(courseStatus, userId, courseId) {
    let data = await quizData.updateCourseStatus(courseStatus, userId, courseId);
    return data;
}

ipcRenderer.send('ready-get-data');

resetForm = () => {
    $('#answers').empty();
}

function getQuizResult(id) {
    if (userAnswers.get(id) === undefined) return false;
    const userAnswerStr = userAnswers.get(id).sort().toString();
    const correctAnswerStr = correctAnswers.get(id).sort().toString();
    return userAnswerStr === correctAnswerStr;
}

async function showResult(user, courseId) {
    const correctIds = questionIds.filter((id) => getQuizResult(id));
    const result = correctIds.length;
    const usersCourses = await selectUserCourses(user.id, courseId);
    if (usersCourses.length === 0) {
        if (result === questionIds.length) {
            await insertUsersCourses(user.id, courseId, 1);
            ipcRenderer.send('open-congrats', result, user);

        } else {
            await insertUsersCourses(user.id, courseId, 0);
            ipcRenderer.send('open-fail', result, questionIds.length, user);

        }
    } else {
        if (result === questionIds.length) {
            await updateCourse(1, user.id, courseId);
            ipcRenderer.send('open-congrats', result, user);

        } else {
            await updateCourse(0, user.id, courseId);
            ipcRenderer.send('open-fail', result, questionIds.length, user);
        }
    }
}

function startTimer(duration, display) {
    var timer = duration, minutes, seconds;
    setInterval(function () {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        display.textContent = minutes + ":" + seconds;

        if (--timer < 0) {
            timer = duration;
        }
    }, 1000);
}

// get user information from main.js
ipcRenderer.on('get-data', async (event, course, user) => {
    var minutes = course.total_time * 60,
        display = document.querySelector('#time');
    startTimer(minutes, display);
    setTimeout(async () => {
        await showResult(user, course.id);
    }, (minutes * 1000));
    const questions = await getQuestions(course.id);
    for (let question of questions) {
        questionIds.push(question.id);
    }
    let questionIndex = 0;
    $('#previous-button').css("display", "none");
    $('#title').text(course.name);
    $('#question-number').text(`QUESTION ${questionIndex + 1} OF ${questions.length}`);
    $('#question').text(`${questions[questionIndex].content}`);
    let answers = await getAnswers(questions[questionIndex].id);

    // return correctAnswers = [...]
    for (let question of questions) {
        let correctAnswer = question.correctId.split(',');
        correctAnswers.set(question.id, correctAnswer);
    }
    let chAnswer = [];
    let countAnswer2 = 0;
    for (let answer of answers) {
        
        $('#answers').append(`
                <p class="option has-text-grey-dark">
                    <span id="span-${answer.id}" class="has-text-weight-bold is-size-5">${alphabetAnswers[countAnswer2++]}</span> ${answer.content}
                </p>
        `);

        if (userAnswers.has(questions[questionIndex].id)) {
            chAnswer = userAnswers.get(questions[questionIndex].id);
            for (let i of chAnswer) {
                $(`#span-${i}`).addClass(`pink`);
            }
        }

        document.querySelector(`#span-${answer.id}`).addEventListener('click', function (e) {
            e.preventDefault();
            if (!(document.querySelector(`#span-${answer.id}`).classList.contains('pink'))) {
                document.querySelector(`#span-${answer.id}`).classList.add('pink');
                chAnswer.push(answer.id);
                userAnswers.set(questions[questionIndex].id, chAnswer);
            } else {
                document.querySelector(`#span-${answer.id}`).classList.remove('pink');
                let index1 = chAnswer.indexOf(answer.id);
                chAnswer.splice(index1, 1);
                userAnswers.set(questions[questionIndex].id, chAnswer);
            }
        });
    }

    $("#next-button").click(async () => {

        questionIndex++;

        if (questionIndex <= questions.length - 1) {
            if (questionIndex == questions.length - 1) {
                $('#next-button').css("display", "none");
            }
            $('#previous-button').css("display", "");
            resetForm();
            $('#question-number').text(`QUESTION ${questionIndex + 1} OF ${questions.length}`);
            $('#question').text(`${questions[questionIndex].content}`);
            let answers = await getAnswers(questions[questionIndex].id);
            let chAnswer = [];
            let countAnswer1 = 0;
            for (let answer of answers) {
                $('#answers').append(`
                        <p class="option has-text-grey-dark">
                            <span id="span-${answer.id}" class="has-text-weight-bold is-size-5">${alphabetAnswers[countAnswer1++]}</span> ${answer.content}
                        </p>
                `);

                if (userAnswers.has(questions[questionIndex].id)) {
                    chAnswer = userAnswers.get(questions[questionIndex].id);

                    for (let i of chAnswer) {
                        $(`#span-${i}`).addClass(`pink`);
                    }
                }

                $(`#span-${answer.id}`).click(() => {
                    if ($(`#span-${answer.id}`).hasClass(`pink`)) {
                        $(`#span-${answer.id}`).removeClass(`pink`);
                        let index1 = chAnswer.indexOf(answer.id);
                        chAnswer.splice(index1, 1);
                        userAnswers.set(questions[questionIndex].id, chAnswer);
                    } else {
                        $(`#span-${answer.id}`).addClass(`pink`);
                        chAnswer.push(answer.id);
                        userAnswers.set(questions[questionIndex].id, chAnswer);
                    }
                })
            }
        } else {
            $('#next-button').css("display", "none");
        }

    });

    $("#previous-button").click(async () => {
        questionIndex--;

        if (questionIndex >= 0) {
            if (questionIndex == 0) {
                $('#previous-button').css("display", "none");
            }
            $('#next-button').css("display", "");
            resetForm();
            $('#question-number').text(`QUESTION ${questionIndex + 1} OF ${questions.length}`);
            $('#question').text(`${questions[questionIndex].content}`);
            let answers = await getAnswers(questions[questionIndex].id);
            let chAnswer = [];
            let countAnswer = 0;
            for (let answer of answers) {
                $('#answers').append(`
                    <p class="option has-text-grey-dark">
                        <span id="span-${answer.id}" class="has-text-weight-bold is-size-5">${alphabetAnswers[countAnswer++]}</span> ${answer.content}
                    </p>
                `);

                if (userAnswers.has(questions[questionIndex].id)) {
                    chAnswer = userAnswers.get(questions[questionIndex].id);
                    for (let i of chAnswer) {
                        $(`#span-${i}`).addClass(`pink`);
                    }
                }

                $(`#span-${answer.id}`).click(() => {
                    if ($(`#span-${answer.id}`).hasClass(`pink`)) {
                        $(`#span-${answer.id}`).removeClass(`pink`);
                        let index1 = chAnswer.indexOf(answer.id);
                        chAnswer.splice(index1, 1);
                        userAnswers.set(questions[questionIndex].id, chAnswer);
                    } else {
                        $(`#span-${answer.id}`).addClass(`pink`);
                        chAnswer.push(answer.id);
                        userAnswers.set(questions[questionIndex].id, chAnswer);
                    }
                })
            }
        } else {
            $('#previous-button').css("display", "none");
        }
    });

    $('#submit-button').click(async () => {
        await showResult(user, course.id);
    });

});

