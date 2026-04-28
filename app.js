// State
let currentQuiz = null;
let currentQuestionIndex = 0;
let score = 0;
let answers = [];
let shuffledQuestions = [];

// LocalStorage for stats
function getStats() {
    return JSON.parse(localStorage.getItem('hp-stats') || '{}');
}

function saveStats(quizType, correct, total) {
    const stats = getStats();
    if (!stats[quizType]) {
        stats[quizType] = { attempts: 0, totalCorrect: 0, totalQuestions: 0 };
    }
    stats[quizType].attempts++;
    stats[quizType].totalCorrect += correct;
    stats[quizType].totalQuestions += total;
    localStorage.setItem('hp-stats', JSON.stringify(stats));
}

function renderStats() {
    const stats = getStats();
    const bar = document.getElementById('stats-bar');
    const entries = Object.entries(stats);
    if (entries.length === 0) {
        bar.innerHTML = '<span class="stat-chip">Inga resultat aen - boerja oeva!</span>';
        return;
    }
    bar.innerHTML = entries.map(([key, s]) => {
        const pct = Math.round((s.totalCorrect / s.totalQuestions) * 100);
        const name = key.toUpperCase();
        return `<span class="stat-chip"><strong>${name}</strong> ${pct}% (${s.attempts} foersoek)</span>`;
    }).join('');
}

// Shuffle array
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// Navigation
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function goHome() {
    renderStats();
    showScreen('start-screen');
}

// Start Quiz
function startQuiz(type) {
    const bank = questionBank[type];
    if (!bank) return;

    currentQuiz = type;
    currentQuestionIndex = 0;
    score = 0;
    answers = [];
    shuffledQuestions = shuffle(bank.questions);

    document.getElementById('quiz-title').textContent = bank.title;
    showScreen('quiz-screen');
    renderQuestion();
}

// Render Question
function renderQuestion() {
    const q = shuffledQuestions[currentQuestionIndex];
    const total = shuffledQuestions.length;

    document.getElementById('quiz-progress').textContent =
        `Fraga ${currentQuestionIndex + 1} av ${total}`;
    document.getElementById('quiz-score').textContent =
        `${score} raett`;

    // Context
    const ctxEl = document.getElementById('question-context');
    ctxEl.textContent = q.context || '';

    // Question
    document.getElementById('question-text').textContent = q.question;

    // Options
    const optionsEl = document.getElementById('options');
    optionsEl.innerHTML = q.options.map((opt, i) =>
        `<button class="option-btn" onclick="selectAnswer(${i})">${String.fromCharCode(65 + i)}. ${opt}</button>`
    ).join('');

    // Reset feedback
    const fb = document.getElementById('feedback');
    fb.className = 'feedback';
    fb.textContent = '';

    document.getElementById('next-btn').style.display = 'none';
}

// Select Answer
function selectAnswer(index) {
    const q = shuffledQuestions[currentQuestionIndex];
    const buttons = document.querySelectorAll('.option-btn');
    const isCorrect = index === q.correct;

    // Disable all buttons
    buttons.forEach((btn, i) => {
        btn.classList.add('disabled');
        btn.onclick = null;
        if (i === q.correct) btn.classList.add('correct');
        if (i === index && !isCorrect) btn.classList.add('wrong');
    });

    // Score
    if (isCorrect) score++;
    answers.push({ question: q.question, correct: isCorrect, userAnswer: index, correctAnswer: q.correct });

    // Feedback
    const fb = document.getElementById('feedback');
    fb.className = `feedback show ${isCorrect ? 'correct' : 'wrong'}`;
    fb.textContent = isCorrect
        ? `Raett! ${q.explanation}`
        : `Fel. ${q.explanation}`;

    document.getElementById('next-btn').style.display = 'block';
    document.getElementById('next-btn').textContent =
        currentQuestionIndex < shuffledQuestions.length - 1 ? 'Naesta fraga' : 'Visa resultat';
}

// Next Question
function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < shuffledQuestions.length) {
        renderQuestion();
        // Scroll to top
        document.querySelector('.quiz-body').scrollTop = 0;
        window.scrollTo(0, 0);
    } else {
        showResults();
    }
}

// Show Results
function showResults() {
    const total = shuffledQuestions.length;
    const pct = Math.round((score / total) * 100);

    saveStats(currentQuiz, score, total);

    let icon, message;
    if (pct >= 80) {
        icon = 'Toppresultat!';
        message = 'Utmaerkt! Du behaerskar detta omrade vaeldigt bra.';
    } else if (pct >= 60) {
        icon = 'Bra jobbat!';
        message = 'Bra resultat! Fortsaett oeva foer att naa aennu hoegre.';
    } else if (pct >= 40) {
        icon = 'Pa god vaeg';
        message = 'Du aer pa raett vaeg. Fokusera pa de omraaden du missar.';
    } else {
        icon = 'Fortsaett oeva';
        message = 'Ge inte upp! Repetition aer nyckeln till framgang.';
    }

    document.getElementById('results-icon').textContent = icon;
    document.getElementById('results-score').textContent = `${score}/${total} (${pct}%)`;
    document.getElementById('results-message').textContent = message;

    // Breakdown
    const breakdown = document.getElementById('results-breakdown');
    breakdown.innerHTML = answers.map((a, i) => {
        const shortQ = a.question.length > 60 ? a.question.substring(0, 60) + '...' : a.question;
        return `<div class="result-item">
            <div class="result-marker ${a.correct ? 'correct' : 'wrong'}"></div>
            <span>${i + 1}. ${shortQ}</span>
        </div>`;
    }).join('');

    showScreen('results-screen');
}

// Restart
function restartQuiz() {
    startQuiz(currentQuiz);
}

// Init
renderStats();
