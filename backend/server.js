require('dotenv').config();
const app = require('./src/app');
const { pool } = require('./src/config/db');

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await pool.query('SELECT 1'); // fail fast if the database is unreachable
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Pharmacy Inventory API running on http://localhost:${PORT}`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to connect to PostgreSQL. Check DATABASE_URL in .env');
    console.error(err.message);
    process.exit(1);
  }
};

start();
