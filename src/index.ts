import 'dotenv/config'
// Stores google credentials
import './constants'
import type { Database } from './database'
import type { Hsm } from './hsm/Hsm'
import { startServer } from './server'

declare global {
  namespace Express {
    interface Request {
      hsm: Hsm
      db: Database
      keyRingId?: string
      jwtPayload: Record<string, unknown>
      walletId: string
    }
  }
}

const port = Number(process.env.PORT) || 3000
const hsmType = process.env.HSM || 'node'

const postgresConfig = {
  host: process.env.POSTGRES_HOST,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  port: Number(process.env.POSTGRES_PORT),
  caPath: process.env.POSTGRES_CA_PATH,
} as const

export type PostgresConfig = typeof postgresConfig

void startServer({ port, hsmType, postgresConfig }).then(() =>
  console.log(`Started server on : 'http://localhost:${port}'`)
)
