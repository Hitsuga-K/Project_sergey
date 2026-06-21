const jwt = require('jsonwebtoken');
const { pool } = require('./db');

const activeUsers = new Map();
const players = new Map();
let JWT_SECRET;

const initSocketHandler = (io, secret) => {
    JWT_SECRET = secret;

    const getTopPlayer = async () => {
        const result = await pool.query('SELECT id FROM users ORDER BY coins DESC LIMIT 1');
        return result.rows.length > 0 ? result.rows[0].id : null;
    };

    const getLeaderboard = async () => {
        const result = await pool.query('SELECT id, username, coins, jump_power FROM users ORDER BY coins DESC LIMIT 10');
        return result.rows;
    };

    const sendCrownUpdate = async () => {
        const topPlayerId = await getTopPlayer();
        io.emit('crownUpdate', topPlayerId);
    };

    const sendLeaderboardUpdate = async () => {
        const leaderboard = await getLeaderboard();
        io.emit('leaderboardUpdate', leaderboard);
    };

    io.on('connection', (socket) => {
        let currentUser = null;
        let userId = null;

        socket.on('authenticate', async (token) => {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                userId = decoded.id;

                if (activeUsers.has(userId)) {
                    const oldSocketId = activeUsers.get(userId);
                    if (io.sockets.sockets.has(oldSocketId)) {
                        io.sockets.sockets.get(oldSocketId).disconnect(true);
                    }
                    players.delete(oldSocketId);
                }

                const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
                if (result.rows.length > 0) {
                    currentUser = result.rows[0];
                    activeUsers.set(userId, socket.id);
                    const topPlayerId = await getTopPlayer();
                    players.set(socket.id, {
                        id: socket.id,
                        user: currentUser,
                        x: 0,
                        y: 2,
                        z: 0,
                        velY: 0,
                        isJumping: false,
                        isFirst: currentUser.id === topPlayerId
                    });
                    socket.emit('init', {
                        players: Array.from(players.values()),
                        myId: socket.id,
                        topPlayerId
                    });
                    socket.broadcast.emit('playerJoined', players.get(socket.id));
                }
            } catch (err) {
                console.error('Auth error:', err);
            }
        });

        socket.on('move', (data) => {
            if (players.has(socket.id)) {
                const player = players.get(socket.id);
                Object.assign(player, data);
                socket.broadcast.emit('playerMoved', player);
            }
        });

        socket.on('jumpLand', async (jumpHeight) => {
            if (!currentUser) return;
            const coinsReward = Math.floor(jumpHeight * 5);
            if (coinsReward > 0) {
                await pool.query('UPDATE users SET coins = coins + $1 WHERE id = $2', [coinsReward, currentUser.id]);
                const result = await pool.query('SELECT * FROM users WHERE id = $1', [currentUser.id]);
                currentUser = result.rows[0];
                players.get(socket.id).user = currentUser;
                await sendCrownUpdate();
                await sendLeaderboardUpdate();
                socket.emit('coinsEarned', { coinsReward, user: currentUser });
            }
        });

        socket.on('upgradeJump', async () => {
            if (!currentUser) return;
            const cost = currentUser.jump_power * 10;
            if (currentUser.coins >= cost) {
                await pool.query('UPDATE users SET coins = coins - $1, jump_power = jump_power + 2 WHERE id = $2', [cost, currentUser.id]);
                const result = await pool.query('SELECT * FROM users WHERE id = $1', [currentUser.id]);
                currentUser = result.rows[0];
                players.get(socket.id).user = currentUser;
                await sendCrownUpdate();
                await sendLeaderboardUpdate();
                socket.emit('upgradeSuccess', currentUser);
                io.emit('playerUpdated', players.get(socket.id));
            } else {
                socket.emit('upgradeFail', 'Не хватает монет! Нужно: ' + cost + ', у вас: ' + currentUser.coins);
            }
        });

        socket.on('chatMessage', (message) => {
            if (currentUser) {
                io.emit('chatMessage', {
                    username: currentUser.username,
                    message: message
                });
            }
        });

        socket.on('disconnect', () => {
            if (socket.id) {
                if (userId) {
                    activeUsers.delete(userId);
                }
                players.delete(socket.id);
                socket.broadcast.emit('playerLeft', socket.id);
            }
        });
    });
};

module.exports = { initSocketHandler };
