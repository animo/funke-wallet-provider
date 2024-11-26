import { randomUUID } from 'node:crypto'
import type { Jwk } from '@animo-id/oauth2'
import type { NextFunction, Request, Response } from 'express'
import { z } from 'zod'
import { createClientAttestation } from '../oauth2/clientAttestations'

export const getWalletAttestationSchema = z.object({
  jwk: z.object({
    kty: z.literal('EC'),
    crv: z.literal('P-256'),
    x: z.string(),
    y: z.string(),
  }),
})

export const getWalletAttestation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('[getWalletAttestation]')

    if (!req.keyRingId) throw new Error('keyRingId not set on the request')

    // Client id doesn't really matter we use our domain as prefix to prevent collision
    const walletAttestation = await createClientAttestation({
      clientId: `https://wallet.paradym.id/${randomUUID()}`,
      // TODO: we now just take the key passed by the client until we can do proper app integrity
      clientJwk: req.jwtPayload.jwk as Jwk,
    })

    res.json({ walletAttestation })
  } catch (e) {
    console.error('[error] :: [getWalletAttestation] :: ', e)
    next(e)
  }
}
