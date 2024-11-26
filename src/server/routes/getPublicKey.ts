import type { NextFunction, Request, Response } from 'express'
import { z } from 'zod'

export const getPublicKeySchema = z.object({
  keyId: z.string(),
})

export const getPublicKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log(`[getPublicKey] with keyId: '${req.jwtPayload.keyId}', keyRingId: '${req.keyRingId}'`)
    if (!req.keyRingId) throw new Error('keyRingId not set on the request')
    const publicKey = await req.hsm.getPublicKey({ keyId: req.jwtPayload.keyId as string, keyRingId: req.keyRingId })
    res.json({ publicKey: new Array(...publicKey) })
  } catch (e) {
    console.error('[error] :: [getPublicKey] :: ', e)
    next(e)
  }
}
