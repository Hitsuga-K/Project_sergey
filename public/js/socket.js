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
