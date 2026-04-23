import path from 'node:path'
import { defineConfig } from 'prisma/config'
import { Pool } from 'pg'

try { process.loadEnvFile('.env.local') } catch { /* ok */ }
try { process.loadEnvFile('.env') } catch { /* ok */ }

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: { url: process.env.DIRECT_URL },
  // @ts-ignore — migrate adapter supported in Prisma 7 runtime but not yet typed
  migrate: {
    async adapter() {
      const { PrismaPg } = await import('@prisma/adapter-pg')
      const pool = new Pool({ connectionString: process.env.DIRECT_URL })
      return new PrismaPg(pool)
    },
  },
})
