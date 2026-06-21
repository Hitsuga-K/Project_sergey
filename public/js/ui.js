const authDiv = document.getElementById('auth');
const gameUIDiv = document.getElementById('gameUI');
const leaderboardDiv = document.getElementById('leaderboard');
const upgradeBtn = document.getElementById('upgradeBtn');
const coinsDiv = document.getElementById('coins');
const jumpPowerDiv = document.getElementById('jumpPower');
const leaderboardList = document.getElementById('leaderboardList');
const errorPopup = document.getElementById('errorPopup');
const errorText = document.getElementById('errorText');
const closeErrorBtn = document.getElementById('closeErrorBtn');
const chatDiv = document.getElementById('chat');
const chatToggle = document.getElementById('chatToggle');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');
const jumpBtn = document.getElementById('jumpBtn');
const wBtn = document.getElementById('wBtn');
const aBtn = document.getElementById('aBtn');
const sBtn = document.getElementById('sBtn');
const dBtn = document.getElementById('dBtn');
const mobileControls = document.getElementById('mobileControls');

function updateUI() {
    coinsDiv.textContent = `Coins: ${currentUser.coins}`;
    jumpPowerDiv.textContent = `Jump Power: ${currentUser.jump_power}`;
    upgradeBtn.textContent = `Upgrade Jump (Cost: ${currentUser.jump_power * 10})`;
}

function renderLeaderboard(leaderboard) {
    leaderboardList.innerHTML = '';
    leaderboard.forEach((user, i) => {
        const div = document.createElement('div');
        div.textContent = `${i + 1}. ${user.username}: ${user.coins} coins`;
        if (i === 0) div.style.color = '#ff00ff';
        leaderboardList.appendChild(div);
    });
}

async function loadLeaderboard() {
    const res = await fetch('/api/leaderboard');
    const data = await res.json();
    renderLeaderboard(data);
}

function showError(message) {
    errorText.textContent = message;
    errorPopup.style.display = 'block';
}

function showCoinsPopup(coins) {
    const popup = document.createElement('div');
    popup.textContent = `+${coins} coins!`;
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 48px;
        font-weight: bold;
        color: #00ffff;
        text-shadow: 0 0 20px #00ffff;
        pointer-events: none;
        z-index: 1000;
        animation: popup 1s ease-out forwards;
    `;
    document.body.appendChild(popup);
    
    setTimeout(() => popup.remove(), 1000);
}

function addChatMessage(username, message) {
    const div = document.createElement('div');
    div.innerHTML = `<span class="username">${username}:</span> ${message}`;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function sendChatMessage() {
    const message = chatInput.value.trim();
    if (message && currentUser) {
        socket.emit('chatMessage', message);
        chatInput.value = '';
    }
}

// Инициализация событий интерфейса
closeErrorBtn.onclick = () => {
    errorPopup.style.display = 'none';
};

chatToggle.onclick = () => {
    chatDiv.style.display = chatDiv.style.display === 'none' ? 'flex' : 'none';
};

chatSend.onclick = sendChatMessage;

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChatMessage();
});

upgradeBtn.onclick = () => {
    socket.emit('upgradeJump');
};

// Обработчики мобильных контроллов
const setKeyState = (key, isPressed) => {
    keys[key] = isPressed;
};

// Кнопка прыжка
jumpBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    setKeyState(' ', true);
});
jumpBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    setKeyState(' ', false);
});
jumpBtn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    setKeyState(' ', true);
});
jumpBtn.addEventListener('mouseup', (e) => {
    e.preventDefault();
    setKeyState(' ', false);
});
jumpBtn.addEventListener('mouseleave', (e) => {
    e.preventDefault();
    setKeyState(' ', false);
});

// Кнопка W
wBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    setKeyState('w', true);
});
wBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    setKeyState('w', false);
});
wBtn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    setKeyState('w', true);
});
wBtn.addEventListener('mouseup', (e) => {
    e.preventDefault();
    setKeyState('w', false);
});
wBtn.addEventListener('mouseleave', (e) => {
    e.preventDefault();
    setKeyState('w', false);
});

// Кнопка A
aBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    setKeyState('a', true);
});
aBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    setKeyState('a', false);
});
aBtn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    setKeyState('a', true);
});
aBtn.addEventListener('mouseup', (e) => {
    e.preventDefault();
    setKeyState('a', false);
});
aBtn.addEventListener('mouseleave', (e) => {
    e.preventDefault();
    setKeyState('a', false);
});

// Кнопка S
sBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    setKeyState('s', true);
});
sBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    setKeyState('s', false);
});
sBtn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    setKeyState('s', true);
});
sBtn.addEventListener('mouseup', (e) => {
    e.preventDefault();
    setKeyState('s', false);
});
sBtn.addEventListener('mouseleave', (e) => {
    e.preventDefault();
    setKeyState('s', false);
});

// Кнопка D
dBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    setKeyState('d', true);
});
dBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    setKeyState('d', false);
});
dBtn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    setKeyState('d', true);
});
dBtn.addEventListener('mouseup', (e) => {
    e.preventDefault();
    setKeyState('d', false);
});
dBtn.addEventListener('mouseleave', (e) => {
    e.preventDefault();
    setKeyState('d', false);
});
