import express, { type NextFunction, type Request, type Response } from 'express'
import type { PostgresConfig } from '..'
import { Database } from '../database'
import { GoogleHsm, NodeHsm } from '../hsm'
import { addKeyRingId, injectDatabase, injectHsm, validateJwtBody, validateSchema } from './middlewares'
import {
  createKey,
  createKeySchema,
  getPublicKey,
  getPublicKeySchema,
  registerWallet,
  sign,
  signSchema,
} from './routes'
import { batchCreateKey, batchCreateKeySchema } from './routes/batchCreateKey'
import { getWalletAttestation, getWalletAttestationSchema } from './routes/getWalletAttestation'

type StartServerOptions = {
  port?: number
  hsmType: string
  postgresConfig: PostgresConfig
}

export const startServer = async ({ port, hsmType, postgresConfig }: StartServerOptions) => {
  const app = express()
  const db = await Database.initialize(postgresConfig)

  const hsm = hsmType === 'node' ? new NodeHsm() : hsmType === 'google' ? new GoogleHsm() : undefined
  if (!hsm) {
    throw new Error(`Invalid HSM type: '${hsmType}'`)
  }

  app.use(express.json())
  app.use(injectHsm(hsm))
  app.use(injectDatabase(db))
  app.use(validateJwtBody)

  app.post('/register-wallet', registerWallet)
  app.post('/create-key', addKeyRingId, validateSchema(createKeySchema), createKey)
  app.post('/batch-create-key', addKeyRingId, validateSchema(batchCreateKeySchema), batchCreateKey)
  app.post('/get-publickey', addKeyRingId, validateSchema(getPublicKeySchema), getPublicKey)
  app.post('/sign', addKeyRingId, validateSchema(signSchema), sign)
  app.post('/attestation', addKeyRingId, validateSchema(getWalletAttestationSchema), getWalletAttestation)

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ ...err })
  })

  new Promise<void>((r) => app.listen(port ?? 3000, r))
}
