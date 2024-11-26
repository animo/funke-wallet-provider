import { readFileSync } from 'node:fs'
import { Pool } from 'pg'
import { WalletIdNotFoundError } from '../error/WalletIdNotFound'
import type { PostgresConfig } from '../index'

export type CreateWalletOptions = {
  walletId: string
  keyRingId: string
}

export type GetKeyRingIdOptions = {
  walletId: string
}

export class Database {
  public constructor(private pool: Pool) {}

  public static async initialize(postgresConfig: PostgresConfig) {
    const ca = postgresConfig.caPath ? readFileSync(postgresConfig.caPath) : undefined
    const pool = new Pool({
      idleTimeoutMillis: 30000,
      host: postgresConfig.host,
      password: postgresConfig.password,
      database: postgresConfig.database,
      port: postgresConfig.port,
      user: postgresConfig.user,
      ssl: ca ? { ca } : undefined,
    })
    const db = new Database(pool)
    await db.createTable()
    return db
  }

  public async createTable() {
    const query = 'CREATE TABLE IF NOT EXISTS wallets (walletId VARCHAR(255) PRIMARY KEY, keyRingId VARCHAR(255));'
    await this.pool.query(query)
  }

  public async createWallet(options: CreateWalletOptions) {
    console.log('createWallet walletId: ', options.walletId)
    const query = 'INSERT INTO wallets (walletId, keyRingId) VALUES ($1, $2) RETURNING *'
    await this.pool.query(query, [options.walletId, options.keyRingId])
  }

  public async getKeyRingId(options: GetKeyRingIdOptions) {
    console.log('getKeyRingId walletId: ', options.walletId)
    const query = 'SELECT keyRingId FROM wallets WHERE walletId=$1'
    const result = await this.pool.query(query, [options.walletId])
    if (result.rows.length === 0) {
      throw new WalletIdNotFoundError(options.walletId)
    }
    return (result.rows[0] as { keyringid: string }).keyringid
  }
}
