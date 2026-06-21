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
const joystickContainer = document.getElementById('joystickContainer');
const joystickBase = document.getElementById('joystickBase');
const joystickKnob = document.getElementById('joystickKnob');

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

// Джойстик
let joystickActive = false;
let joystickId = null;
let joystickCenter = { x: 0, y: 0 };
const joystickMaxDistance = 40;

const resetJoystick = () => {
    joystickKnob.style.transform = 'translate(-50%, -50%)';
    keys['w'] = false;
    keys['a'] = false;
    keys['s'] = false;
    keys['d'] = false;
};

const updateJoystick = (clientX, clientY) => {
    const rect = joystickBase.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    let deltaX = clientX - centerX;
    let deltaY = clientY - centerY;
    
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const angle = Math.atan2(deltaY, deltaX);
    
    const clampedDistance = Math.min(distance, joystickMaxDistance);
    const knobX = Math.cos(angle) * clampedDistance;
    const knobY = Math.sin(angle) * clampedDistance;
    
    joystickKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
    
    // Обновляем состояние клавиш
    const threshold = 15;
    keys['w'] = deltaY < -threshold;
    keys['s'] = deltaY > threshold;
    keys['a'] = deltaX < -threshold;
    keys['d'] = deltaX > threshold;
};

const handleJoystickStart = (e) => {
    e.preventDefault();
    joystickActive = true;
    const touch = e.touches ? e.touches[0] : e;
    joystickId = e.touches ? e.touches[0].identifier : null;
    updateJoystick(touch.clientX, touch.clientY);
};

const handleJoystickMove = (e) => {
    if (!joystickActive) return;
    e.preventDefault();
    
    let touch;
    if (e.touches) {
        for (let t of e.touches) {
            if (t.identifier === joystickId) {
                touch = t;
                break;
            }
        }
    } else {
        touch = e;
    }
    
    if (touch) {
        updateJoystick(touch.clientX, touch.clientY);
    }
};

const handleJoystickEnd = (e) => {
    if (e.touches) {
        let stillActive = false;
        for (let t of e.touches) {
            if (t.identifier === joystickId) {
                stillActive = true;
                break;
            }
        }
        if (stillActive) return;
    }
    joystickActive = false;
    joystickId = null;
    resetJoystick();
};

// События джойстика
joystickBase.addEventListener('touchstart', handleJoystickStart);
joystickBase.addEventListener('touchmove', handleJoystickMove);
joystickBase.addEventListener('touchend', handleJoystickEnd);
joystickBase.addEventListener('touchcancel', handleJoystickEnd);

joystickBase.addEventListener('mousedown', handleJoystickStart);
document.addEventListener('mousemove', handleJoystickMove);
document.addEventListener('mouseup', handleJoystickEnd);
