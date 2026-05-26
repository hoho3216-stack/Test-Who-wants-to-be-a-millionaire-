// Game State
let gameState = {
    questions: [],
    currentQuestion: 0,
    score: 0,
    prize: 0,
    lifelinesUsed: {
        fiftyFifty: false,
        callFriend: false,
        audiencePoll: false
    }
};

const prizeTable = [
    0, 100, 200, 500, 1000, 2000, 4000, 8000, 16000, 32000,
    64000, 125000, 250000, 500000, 1000000
];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadQuestionsFromLocalStorage();
    updateQuestionsList();
});

// Game Functions
function startGame() {
    if (gameState.questions.length === 0) {
        alert('Please upload questions first!');
        toggleQuestionsPanel();
        return;
    }

    // Shuffle and limit questions to 15
    gameState.questions = gameState.questions.sort(() => 0.5 - Math.random()).slice(0, 15);
    gameState.currentQuestion = 0;
    gameState.score = 0;
    gameState.prize = 0;
    gameState.lifelinesUsed = {
        fiftyFifty: false,
        callFriend: false,
        audiencePoll: false
    };

    showScreen('gameScreen');
    displayQuestion();
    enableAllLifelines();
}

function displayQuestion() {
    const question = gameState.questions[gameState.currentQuestion];
    document.getElementById('questionText').textContent = `${gameState.currentQuestion + 1}. ${question.question}`;
    document.getElementById('currentLevel').textContent = `Level: ${gameState.currentQuestion + 1}`;
    document.getElementById('currentPrize').textContent = `$${prizeTable[gameState.currentQuestion].toLocaleString()}`;

    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';

    const options = ['A', 'B', 'C', 'D'];
    options.forEach(option => {
        const button = document.createElement('button');
        button.className = 'option';
        button.textContent = `${option}) ${question[option]}`;
        button.onclick = () => selectAnswer(option, question.correct);
        optionsContainer.appendChild(button);
    });
}

function selectAnswer(selected, correct) {
    const options = document.querySelectorAll('.option');
    options.forEach(option => option.classList.add('disabled'));

    const selectedOption = Array.from(options).find(opt => opt.textContent.startsWith(selected));
    selectedOption.classList.add('selected');

    if (selected === correct) {
        selectedOption.classList.remove('selected');
        selectedOption.classList.add('correct');
        gameState.score++;
        gameState.prize = prizeTable[gameState.currentQuestion];

        setTimeout(() => {
            if (gameState.currentQuestion === 14) {
                endGame(true);
            } else {
                gameState.currentQuestion++;
                displayQuestion();
            }
        }, 1500);
    } else {
        selectedOption.classList.remove('selected');
        selectedOption.classList.add('incorrect');
        const correctOption = Array.from(options).find(opt => opt.textContent.startsWith(correct));
        correctOption.classList.add('correct');

        setTimeout(() => {
            endGame(false);
        }, 1500);
    }
}

function endGame(won) {
    showScreen('resultScreen');
    const resultTitle = document.getElementById('resultTitle');
    const resultMessage = document.getElementById('resultMessage');
    const finalPrize = document.getElementById('finalPrize');

    if (won) {
        resultTitle.textContent = '🎉 Congratulations! 🎉';
        resultMessage.textContent = 'You have won $1,000,000!';
        finalPrize.textContent = 'Prize: $1,000,000';
    } else {
        resultTitle.textContent = '😢 Game Over';
        resultMessage.textContent = `You answered ${gameState.score} out of ${gameState.currentQuestion + 1} questions correctly.`;
        finalPrize.textContent = `Prize Won: $${gameState.prize.toLocaleString()}`;
    }
}

function goHome() {
    showScreen('homeScreen');
}

// Lifelines
function useFiftyFifty() {
    if (gameState.lifelinesUsed.fiftyFifty) {
        alert('You have already used this lifeline!');
        return;
    }

    gameState.lifelinesUsed.fiftyFifty = true;
    document.getElementById('fiftyBtn').disabled = true;

    const question = gameState.questions[gameState.currentQuestion];
    const correct = question.correct;
    const options = ['A', 'B', 'C', 'D'];
    const wrongOptions = options.filter(opt => opt !== correct);
    const toEliminate = wrongOptions.sort(() => 0.5 - Math.random()).slice(0, 2);

    const optionElements = document.querySelectorAll('.option');
    optionElements.forEach(option => {
        const letter = option.textContent.charAt(0);
        if (toEliminate.includes(letter)) {
            option.classList.add('eliminated');
        }
    });

    showLifelineModal('50/50', 'Two incorrect options have been eliminated!');
}

function useCallFriend() {
    if (gameState.lifelinesUsed.callFriend) {
        alert('You have already used this lifeline!');
        return;
    }

    gameState.lifelinesUsed.callFriend = true;
    document.getElementById('callBtn').disabled = true;

    const question = gameState.questions[gameState.currentQuestion];
    const correct = question.correct;
    const options = ['A', 'B', 'C', 'D'];
    const confidence = Math.random();

    let suggestion;
    if (confidence > 0.7) {
        suggestion = `I'm quite sure it's ${correct}`;
    } else if (confidence > 0.4) {
        suggestion = `I think it might be ${correct}, but I'm not entirely sure`;
    } else {
        suggestion = `I'm really not sure, maybe ${options[Math.floor(Math.random() * 4)]}?`;
    }

    showLifelineModal('Call a Friend', `Your friend says: "${suggestion}"`);
}

function useAudiencePoll() {
    if (gameState.lifelinesUsed.audiencePoll) {
        alert('You have already used this lifeline!');
        return;
    }

    gameState.lifelinesUsed.audiencePoll = true;
    document.getElementById('audienceBtn').disabled = true;

    const question = gameState.questions[gameState.currentQuestion];
    const correct = question.correct;
    const options = ['A', 'B', 'C', 'D'];

    // Generate realistic poll results
    const polls = {};
    let remaining = 100;

    options.forEach(opt => {
        if (opt === correct) {
            polls[opt] = Math.floor(Math.random() * 40) + 40; // 40-80% for correct
        } else {
            polls[opt] = Math.floor(Math.random() * 20) + 5; // 5-25% for incorrect
        }
    });

    // Adjust to ensure total is 100
    const total = Object.values(polls).reduce((a, b) => a + b, 0);
    Object.keys(polls).forEach(key => {
        polls[key] = Math.round((polls[key] / total) * 100);
    });

    const pollMessage = `Audience votes:\n${Object.entries(polls)
        .map(([opt, percent]) => `${opt}: ${percent}%`)
        .join('\n')}`;

    showLifelineModal('Ask the Audience', pollMessage);
}

function enableAllLifelines() {
    document.getElementById('fiftyBtn').disabled = false;
    document.getElementById('callBtn').disabled = false;
    document.getElementById('audienceBtn').disabled = false;
}

// Questions Management
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            const questions = parseQuestionsFromText(content);

            if (questions.length === 0) {
                showFileStatus('No valid questions found. Please check the format.', 'error');
                return;
            }

            gameState.questions = [...gameState.questions, ...questions];
            saveQuestionsToLocalStorage();
            updateQuestionsList();
            showFileStatus(`Successfully loaded ${questions.length} questions!`, 'success');
        } catch (error) {
            showFileStatus('Error parsing file: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
}

function parseQuestionsFromText(text) {
    const questions = [];
    const questionBlocks = text.split(/\n\s*\n+/);

    questionBlocks.forEach(block => {
        const lines = block.trim().split('\n').map(l => l.trim()).filter(l => l);
        
        if (lines.length >= 6) {
            const questionText = lines[0].replace(/^Question:\s*/i, '').trim();
            const optionA = lines[1].replace(/^A\)\s*/i, '').trim();
            const optionB = lines[2].replace(/^B\)\s*/i, '').trim();
            const optionC = lines[3].replace(/^C\)\s*/i, '').trim();
            const optionD = lines[4].replace(/^D\)\s*/i, '').trim();
            const correctLine = lines.find(l => /^Correct Answer:/i.test(l));
            const correct = correctLine ? correctLine.replace(/^Correct Answer:\s*/i, '').trim().toUpperCase() : '';

            if (questionText && optionA && optionB && optionC && optionD && correct && ['A', 'B', 'C', 'D'].includes(correct)) {
                questions.push({
                    question: questionText,
                    A: optionA,
                    B: optionB,
                    C: optionC,
                    D: optionD,
                    correct: correct
                });
            }
        }
    });

    return questions;
}

function updateQuestionsList() {
    document.getElementById('questionCount').textContent = gameState.questions.length;

    const listContainer = document.getElementById('questionsList');
    listContainer.innerHTML = '';

    gameState.questions.forEach((q, index) => {
        const item = document.createElement('div');
        item.className = 'question-item';
        item.innerHTML = `
            <strong>${index + 1}. ${q.question}</strong>
            <small>
                A) ${q.A} | B) ${q.B} | C) ${q.C} | D) ${q.D}<br>
                Correct: ${q.correct}
            </small>
        `;
        listContainer.appendChild(item);
    });
}

function clearAllQuestions() {
    if (confirm('Are you sure you want to delete all questions?')) {
        gameState.questions = [];
        localStorage.removeItem('millionaireQuestions');
        updateQuestionsList();
        showFileStatus('All questions have been deleted.', 'success');
    }
}

function showFileStatus(message, type) {
    const status = document.getElementById('fileStatus');
    status.textContent = message;
    status.className = `file-status ${type}`;
}

// Local Storage
function saveQuestionsToLocalStorage() {
    localStorage.setItem('millionaireQuestions', JSON.stringify(gameState.questions));
}

function loadQuestionsFromLocalStorage() {
    const saved = localStorage.getItem('millionaireQuestions');
    if (saved) {
        gameState.questions = JSON.parse(saved);
    }
}

// UI Functions
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function toggleQuestionsPanel() {
    const panel = document.getElementById('questionsPanel');
    panel.classList.toggle('active');
    updateQuestionsList();
}

function showLifelineModal(title, message) {
    document.getElementById('lifelineTitle').textContent = title;
    document.getElementById('lifelineMessage').textContent = message;
    document.getElementById('lifelineModal').classList.add('active');
}

function closeLifelineModal() {
    document.getElementById('lifelineModal').classList.remove('active');
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('lifelineModal');
    const panel = document.getElementById('questionsPanel');
    
    if (event.target === modal) {
        closeLifelineModal();
    }
    if (event.target === panel) {
        toggleQuestionsPanel();
    }
}
