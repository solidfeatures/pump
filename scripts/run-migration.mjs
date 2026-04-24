// Utility: run a SQL migration file against Supabase DIRECT_URL
// Usage: node scripts/run-migration.mjs <path-to-sql-file>
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Manually load .env.local without dotenv dependency
const envPath = path.join(__dirname, '..', '.env.local')
try {
  const envFile = readFileSync(envPath, 'utf8')
  for (const line of envFile.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) {
      const key = m[1].trim()
      let val = m[2].trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1)
      process.env[key] = val
    }
  }
} catch {}

const { Client } = pg

const sqlFile = process.argv[2]
if (!sqlFile) {
  console.error('Usage: node scripts/run-migration.mjs <path-to-sql-file>')
  process.exit(1)
}

const sql = readFileSync(path.resolve(sqlFile), 'utf8')
const url = process.env.DIRECT_URL
if (!url) {
  console.error('DIRECT_URL not set in .env.local')
  process.exit(1)
}

const client = new Client({ connectionString: url })
await client.connect()
console.log(`Running: ${sqlFile}`)
try {
  await client.query(sql)
  console.log('✓ Migration applied successfully.')
} catch (err) {
  console.error('Migration failed:', err.message)
  process.exit(1)
} finally {
  await client.end()
}
