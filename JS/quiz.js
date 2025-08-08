// JS/quiz.js

const nav          = document.getElementById('quiz-nav');
const quizEl       = document.getElementById('quiz');
const showScoreBtn = document.getElementById('show-score');
const scoreDisplay = document.getElementById('score-display');

let questions = [];
let answeredCount = 0;

// Wire up header buttons
nav.addEventListener('click', (e) => {
    const btn = e.target.closest('.nav-item');
    if (!btn) return;

    setActive(btn);
    quizEl.innerHTML = '';
    scoreDisplay.textContent = '';
    showScoreBtn.disabled = false;

    if (btn.dataset.kind === 'pdf') {
        const src = btn.dataset.src;
        const iframe = document.createElement('iframe');
        iframe.className = 'pdf-frame';
        iframe.src = `./data/${src}`;
        quizEl.appendChild(iframe);
    } else {
        const file = btn.dataset.file;
        loadQuiz(file);
    }
});

// Set active tab styling
function setActive(activeBtn) {
    nav.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    if (activeBtn) activeBtn.classList.add('active');
}

// Load a quiz JSON and render
async function loadQuiz(file) {
    // reset UI
    quizEl.innerHTML = '';
    scoreDisplay.textContent = '';
    showScoreBtn.disabled = false;
    answeredCount = 0;

    try {
        const res = await fetch(`./data/${file}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        questions = await res.json();
        renderQuiz();
    } catch (err) {
        console.error('Could not load quiz:', err);
        quizEl.textContent = '❌ Could not load quiz.';
    }
}

function renderQuiz() {
    questions.forEach((q, qi) => {
        const qDiv = document.createElement('div');
        qDiv.className = 'question';

        const h3 = document.createElement('h3');
        h3.textContent = `${qi + 1}. ${q.text}`;
        qDiv.appendChild(h3);

        const opts = document.createElement('div');
        opts.className = 'options';

        q.options.forEach((opt, oi) => {
            const label = document.createElement('label');
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = `q${qi}`;
            radio.value = oi;

            radio.addEventListener('change', () => {
                // lock choices for this question
                opts.querySelectorAll('input').forEach(i => i.disabled = true);

                const fb = document.createElement('div');
                fb.className = 'feedback';
                if (oi === q.answer) {
                    fb.textContent = '✅ Correct!';
                    fb.classList.add('correct');
                } else {
                    fb.textContent = `❌ Incorrect. ${q.explanation}`;
                    fb.classList.add('incorrect');
                }
                qDiv.appendChild(fb);

                // progress
                answeredCount++;
                // Keep the Show Score button always enabled; we compute based only on answered questions
            });

            label.append(radio, ` ${String.fromCharCode(97 + oi)}) ${opt}`);
            opts.append(label);
        });

        qDiv.append(opts);
        quizEl.append(qDiv);
    });

    // Replace any previous click handler to avoid stacking
    showScoreBtn.onclick = () => {
        let correct = 0;
        let answered = 0;
        questions.forEach((q, qi) => {
            const sel = document.querySelector(`input[name="q${qi}"]:checked`);
            if (sel) {
                answered++;
                if (Number(sel.value) === q.answer) correct++;
            }
        });
        if (answered === 0) {
            scoreDisplay.textContent = 'No answers yet.';
            return;
        }
        const pct = Math.round((correct / answered) * 100);
        scoreDisplay.textContent = `Score: ${correct}/${answered} (${pct}%)`;
    };
}

// Auto-load the first tab on page load
window.addEventListener('DOMContentLoaded', () => {
    const first = nav.querySelector('.nav-item');
    if (first) first.click();
});
