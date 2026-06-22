```markdown
 📁 server - Серверная часть

Серверная логика игры NEON JUMP, включая API и WebSocket обработку.

 📁 Структура папки
server/
├── 📄 db.js # Конфигурация базы данных
├── 📄 routes.js # API маршруты
└── 📄 socketHandler.js # WebSocket логика

text

 🗄️ db.js

Настройка подключения к PostgreSQL базе данных.

 Конфигурация:
```javascript
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});
Инициализация:
javascript
const initDB = async () => {
    // Создание таблицы users
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        coins INTEGER DEFAULT 50,
        jump_power INTEGER DEFAULT 30,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
};
Структура таблицы users:
Поле	Тип	Описание
id	SERIAL	Уникальный идентификатор
username	VARCHAR(50)	Имя пользователя (уникальное)
password	VARCHAR(255)	Хешированный пароль
coins	INTEGER	Количество монет (по умолчанию 50)
jump_power	INTEGER	Сила прыжка (по умолчанию 30)
created_at	TIMESTAMP	Дата регистрации
🛣️ routes.js
API маршруты для аутентификации и таблицы лидеров.

Маршруты:
Регистрация
http
POST /api/register
Тело запроса:

json
{
    "username": "player1",
    "password": "secure123"
}
Ответ:

json
{
    "token": "jwt_token",
    "user": {
        "id": 1,
        "username": "player1",
        "coins": 50,
        "jump_power": 30
    }
}
Вход
http
POST /api/login
Тело запроса: аналогично регистрации

Ответ: аналогично регистрации

Таблица лидеров
http
GET /api/leaderboard
Ответ:

json
[
    {
        "id": 1,
        "username": "player1",
        "coins": 1000,
        "jump_power": 50
    },
    ...
]
Безопасность:
Пароли хешируются с помощью bcrypt

JWT токены для аутентификации

Валидация входных данных

🔌 socketHandler.js
WebSocket логика для многопользовательской игры.

Состояние сервера:
javascript
const activeUsers = new Map();  // userId -> socketId
const players = new Map();      // socketId -> playerData
События WebSocket:
Клиент → Сервер
Событие	Данные	Описание
authenticate	token	Аутентификация через JWT
move	{x, y, z}	Обновление позиции игрока
jumpLand	jumpHeight	Приземление после прыжка
upgradeJump	-	Улучшение силы прыжка
chatMessage	message	Сообщение в чат
Сервер → Клиент
Событие	Данные	Описание
init	{players, myId, topPlayerId}	Инициализация игры
playerJoined	playerData	Новый игрок
playerMoved	playerData	Обновление позиции
playerLeft	playerId	Игрок вышел
coinsEarned	{coinsReward, user}	Получены монеты
upgradeSuccess/Fail	user или msg	Результат улучшения
crownUpdate	topUserId	Обновление короны
chatMessage	{username, message}	Сообщение в чате
leaderboardUpdate	leaderboard	Обновление таблицы
Игровая логика:
Начисление монет
javascript
coinsReward = Math.floor(jumpHeight * 5)
Монеты начисляются за высоту прыжка

Формула: высота * 5

Улучшение прыжка
javascript
cost = currentUser.jump_power * 10
jump_power += 2
Стоимость: сила_прыжка * 10

Увеличение: +2 к силе прыжка

Определение лидера
javascript
SELECT id FROM users ORDER BY coins DESC LIMIT 1
Выбор пользователя с максимальным количеством монет

Отправка обновления короны всем игрокам

🔒 Безопасность
JWT Аутентификация:
Все WebSocket соединения требуют валидный токен

Токен проверяется при каждом событии

Автоматическое отключение при невалидном токене

Защита от дублирования:
javascript
if (activeUsers.has(userId)) {
    // Отключаем старое соединение
    const oldSocketId = activeUsers.get(userId);
    io.sockets.sockets.get(oldSocketId).disconnect(true);
}
📊 Масштабирование
Для продакшена рекомендуется:
Использовать переменные окружения (не хардкод)

Настроить CORS политику

Добавить rate limiting

Использовать Redis для хранения сессий

Настроить load balancing

Переменные окружения:
bash
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
PORT=3000
NODE_ENV=production
