const socket = io();
let scene, camera, renderer;
let myPlayer = null;
let players = new Map();
let currentUser = null;
let token = null;
let keys = {};
let jumpStartY = null;
let maxJumpHeight = 0;

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

upgradeBtn.onclick = () => {
    socket.emit('upgradeJump');
};

closeErrorBtn.onclick = () => {
    errorPopup.style.display = 'none';
};

chatToggle.onclick = () => {
    if (chatDiv.style.display === 'none') {
        chatDiv.style.display = 'flex';
    } else {
        chatDiv.style.display = 'none';
    }
};

chatSend.onclick = sendChatMessage;

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendChatMessage();
    }
});

function sendChatMessage() {
    const message = chatInput.value.trim();
    if (message && currentUser) {
        socket.emit('chatMessage', message);
        chatInput.value = '';
    }
}

function addChatMessage(username, message) {
    const div = document.createElement('div');
    div.innerHTML = `<span class="username">${username}:</span> ${message}`;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showError(message) {
    errorText.textContent = message;
    errorPopup.style.display = 'block';
};

function startGame() {
    authDiv.style.display = 'none';
    gameUIDiv.style.display = 'block';
    leaderboardDiv.style.display = 'block';
    upgradeBtn.style.display = 'block';
    chatToggle.style.display = 'block';
    initThree();
    socket.emit('authenticate', token);
    updateUI();
    loadLeaderboard();
}

async function loadLeaderboard() {
    const res = await fetch('/api/leaderboard');
    const data = await res.json();
    renderLeaderboard(data);
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

function updateUI() {
    coinsDiv.textContent = `Coins: ${currentUser.coins}`;
    jumpPowerDiv.textContent = `Jump Power: ${currentUser.jump_power}`;
    upgradeBtn.textContent = `Upgrade Jump (Cost: ${currentUser.jump_power * 10})`;
}

function initThree() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000033);
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 20, 30);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    
    // Неоновый свет
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);
    
    const pointLight1 = new THREE.PointLight(0x00ffff, 2, 100);
    pointLight1.position.set(20, 20, 20);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0xff00ff, 2, 100);
    pointLight2.position.set(-20, 20, -20);
    scene.add(pointLight2);
    
    const pointLight3 = new THREE.PointLight(0xffff00, 2, 100);
    pointLight3.position.set(0, 30, 0);
    scene.add(pointLight3);
    
    // Одна большая платформа (неоновая сетка)
    const platformGeometry = new THREE.BoxGeometry(100, 2, 100);
    const platformMaterial = new THREE.MeshPhongMaterial({
        color: 0x0a0a0a,
        emissive: 0x00ffff,
        emissiveIntensity: 0.3
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = 0;
    scene.add(platform);
    
    // Грид для аркадного стиля
    const gridHelper = new THREE.GridHelper(100, 20, 0x00ffff, 0x00ffff);
    gridHelper.position.y = 1.1;
    scene.add(gridHelper);
    
    window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
    window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);
    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function createPlayerMesh(playerData, isMe) {
    // Простой куб с неоновым эффектом
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshPhongMaterial({
        color: isMe ? 0x00ffff : 0xff00ff,
        emissive: isMe ? 0x00ffff : 0xff00ff,
        emissiveIntensity: 0.5
    });
    const mesh = new THREE.Mesh(geometry, material);
    
    // Корона для первого места
    mesh.crown = null;
    if (playerData.isFirst) {
        const crownGeometry = new THREE.ConeGeometry(1.2, 1.5, 8);
        const crownMaterial = new THREE.MeshPhongMaterial({
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.8
        });
        const crown = new THREE.Mesh(crownGeometry, crownMaterial);
        crown.position.y = 2;
        mesh.add(crown);
        mesh.crown = crown;
    }
    
    mesh.position.set(playerData.x, playerData.y, playerData.z);
    return mesh;
}

function updatePlayerCrown(player, isFirst) {
    if (player.data.isFirst !== isFirst) {
        player.data.isFirst = isFirst;
        if (player.mesh.crown) {
            player.mesh.remove(player.mesh.crown);
            player.mesh.crown = null;
        }
        if (isFirst) {
            const crownGeometry = new THREE.ConeGeometry(1.2, 1.5, 8);
            const crownMaterial = new THREE.MeshPhongMaterial({
                color: 0xffff00,
                emissive: 0xffff00,
                emissiveIntensity: 0.8
            });
            const crown = new THREE.Mesh(crownGeometry, crownMaterial);
            crown.position.y = 2;
            player.mesh.add(crown);
            player.mesh.crown = crown;
        }
    }
}

socket.on('init', (data) => {
    data.players.forEach(playerData => {
        const mesh = createPlayerMesh(playerData, playerData.id === data.myId);
        players.set(playerData.id, { data: playerData, mesh });
        scene.add(mesh);
        if (playerData.id === data.myId) {
            myPlayer = players.get(playerData.id);
        }
    });
});

socket.on('playerJoined', (playerData) => {
    const mesh = createPlayerMesh(playerData, false);
    players.set(playerData.id, { data: playerData, mesh });
    scene.add(mesh);
});

socket.on('playerMoved', (playerData) => {
    const player = players.get(playerData.id);
    if (player && player !== myPlayer) {
        player.data = playerData;
        player.mesh.position.set(playerData.x, playerData.y, playerData.z);
    }
});

socket.on('playerLeft', (playerId) => {
    const player = players.get(playerId);
    if (player) {
        scene.remove(player.mesh);
        players.delete(playerId);
    }
});

socket.on('coinsEarned', (data) => {
    currentUser = data.user;
    myPlayer.data.user = currentUser;
    updateUI();
    loadLeaderboard();
    
    // Показать всплывающий текст с монетами
    showCoinsPopup(data.coinsReward);
});

socket.on('upgradeSuccess', (user) => {
    currentUser = user;
    myPlayer.data.user = currentUser;
    updateUI();
    loadLeaderboard();
});

socket.on('upgradeFail', (msg) => {
    showError(msg);
});

socket.on('playerUpdated', (playerData) => {
    const player = players.get(playerData.id);
    if (player) {
        player.data = playerData;
    }
});

socket.on('crownUpdate', (topUserId) => {
    players.forEach((player, id) => {
        const isFirst = player.data.user && player.data.user.id === topUserId;
        updatePlayerCrown(player, isFirst);
    });
});

socket.on('chatMessage', (data) => {
    addChatMessage(data.username, data.message);
});

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

// Добавим анимацию для попапа
const style = document.createElement('style');
style.textContent = `
    @keyframes popup {
        0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
        50% { transform: translate(-50%, -70%) scale(1.2); opacity: 1; }
        100% { transform: translate(-50%, -100%) scale(1); opacity: 0; }
    }
`;
document.head.appendChild(style);

let velY = 0;
let isJumping = false;

function animate() {
    requestAnimationFrame(animate);
    
    if (!scene || !camera || !renderer) return;
    
    if (myPlayer) {
        const speed = 0.5;
        if (keys['w']) myPlayer.data.z -= speed;
        if (keys['s']) myPlayer.data.z += speed;
        if (keys['a']) myPlayer.data.x -= speed;
        if (keys['d']) myPlayer.data.x += speed;
        
        // Начало прыжка
        if (keys[' '] && !isJumping && myPlayer.data.y <= 2) {
            jumpStartY = myPlayer.data.y;
            maxJumpHeight = myPlayer.data.y;
            velY = currentUser.jump_power / 10;
            isJumping = true;
        }
        
        velY -= 0.3;
        myPlayer.data.y += velY;
        
        // Отслеживаем максимальную высоту прыжка
        if (isJumping && myPlayer.data.y > maxJumpHeight) {
            maxJumpHeight = myPlayer.data.y;
        }
        
        // Приземление
        if (myPlayer.data.y <= 2) {
            myPlayer.data.y = 2;
            if (isJumping && jumpStartY !== null) {
                const jumpHeight = maxJumpHeight - jumpStartY;
                if (jumpHeight > 0) {
                    socket.emit('jumpLand', jumpHeight);
                }
                jumpStartY = null;
                maxJumpHeight = 0;
            }
            velY = 0;
            isJumping = false;
        }
        
        myPlayer.mesh.position.set(myPlayer.data.x, myPlayer.data.y, myPlayer.data.z);
        
        // Повернуть куб при движении
        if (keys['w'] || keys['s'] || keys['a'] || keys['d']) {
            myPlayer.mesh.rotation.y += 0.05;
        }
        
        camera.position.set(
            myPlayer.data.x,
            myPlayer.data.y + 15,
            myPlayer.data.z + 25
        );
        camera.lookAt(myPlayer.data.x, myPlayer.data.y, myPlayer.data.z);
        
        socket.emit('move', {
            x: myPlayer.data.x,
            y: myPlayer.data.y,
            z: myPlayer.data.z
        });
    }
    
    renderer.render(scene, camera);
}

animate();
