const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { pool, initDB } = require('./server/db');
const { router, JWT_SECRET } = require('./server/routes');
const { initSocketHandler } = require('./server/socketHandler');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', router);

initDB();
initSocketHandler(io, JWT_SECRET);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Server running on port ' + PORT));
