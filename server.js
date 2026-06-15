const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://project_serg_user:93YyfthPCqY8QoRqxmWPPvLtxVPoGRie@dpg-d8np7p37uimc73a48q9g-a.oregon-postgres.render.com/project_serg',
  ssl: { rejectUnauthorized: false }
});

const JWT_SECRET = 'your-secret-key-change-in-production';
const activeUsers = new Map();

const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      coins INTEGER DEFAULT 50,
      jump_power INTEGER DEFAULT 30,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

initDB();

app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username, coins, jump_power',
      [username, hashedPassword]
    );
    const token = jwt.sign({ id: result.rows[0].id }, JWT_SECRET);
    res.json({ token, user: result.rows[0] });
  } catch (err) {
    console.error('Register error:', err);
    res.status(400).json({ error: 'Username already exists' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id }, JWT_SECRET);
    res.json({ token, user: { id: user.id, username: user.username, coins: user.coins, jump_power: user.jump_power } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/leaderboard', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, coins, jump_power FROM users ORDER BY coins DESC LIMIT 10');
    res.json(result.rows);
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

const players = new Map();

const getTopPlayer = async () => {
    const result = await pool.query('SELECT id FROM users ORDER BY coins DESC LIMIT 1');
    return result.rows.length > 0 ? result.rows[0].id : null;
};

const sendCrownUpdate = async () => {
    const topPlayerId = await getTopPlayer();
    io.emit('crownUpdate', topPlayerId);
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

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Server running on port ' + PORT));
