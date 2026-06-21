const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://project_serg_user:93YyfthPCqY8QoRqxmWPPvLtxVPoGRie@dpg-d8np7p37uimc73a48q9g-a.oregon-postgres.render.com/project_serg',
    ssl: { rejectUnauthorized: false }
});

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

module.exports = { pool, initDB };
