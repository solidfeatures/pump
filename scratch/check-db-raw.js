const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrlMatch = envContent.match(/DIRECT_URL="(.+)"/);
const dbUrl = dbUrlMatch ? dbUrlMatch[1] : null;

if (!dbUrl) {
  console.error('DATABASE_URL not found in .env');
  process.exit(1);
}

const pool = new Pool({
  connectionString: dbUrl
});

async function main() {
  try {
    const sessions = await pool.query('SELECT id, name, day_of_week, phase_id FROM "planned_sessions"');
    console.log('Planned Sessions in DB:', sessions.rows);
    
    const phases = await pool.query('SELECT id, name, is_current FROM "training_phases"');
    console.log('Training Phases in DB:', phases.rows);
  } catch (err) {
    console.error('Error querying DB:', err.message);
  } finally {
    await pool.end();
  }
}

main();
