document.getElementById('registerBtn').onclick = async () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.token) {
        token = data.token;
        currentUser = data.user;
        startGame();
    }
};

document.getElementById('loginBtn').onclick = async () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.token) {
        token = data.token;
        currentUser = data.user;
        startGame();
    }
};

function startGame() {
    authDiv.style.display = 'none';
    gameUIDiv.style.display = 'block';
    leaderboardDiv.style.display = 'block';
    upgradeBtn.style.display = 'block';
    chatToggle.style.display = 'block';
    jumpBtn.classList.remove('hidden');
    joystickContainer.classList.remove('hidden');
    initThree();
    socket.emit('authenticate', token);
    updateUI();
    loadLeaderboard();
}
