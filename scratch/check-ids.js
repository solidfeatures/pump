const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DIRECT_URL
});

async function main() {
  try {
    const res = await pool.query('SELECT id, name FROM "PlannedSession"');
    console.log('Planned Sessions:', res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
