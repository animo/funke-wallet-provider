import type { NextFunction, Request, Response } from 'express'
import { z } from 'zod'
import { KeyType } from '../../hsm/keyType'

export const createKeySchema = z.object({
  keyId: z.string(),
  keyType: z.nativeEnum(KeyType),
})

export const createKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log(
      `[createKey] with keyId: '${req.jwtPayload.keyId}', keyRingId: '${req.keyRingId}', keyType: '${req.jwtPayload.keyType}'`
    )
    if (!req.keyRingId) throw new Error('keyRingId not set on the request')
    await req.hsm.createKey({
      keyType: req.jwtPayload.keyType as KeyType,
      keyId: req.jwtPayload.keyId as string,
      keyRingId: req.keyRingId,
    })

    const publicKey = await req.hsm.getPublicKey({
      keyId: req.jwtPayload.keyId as string,
      keyRingId: req.keyRingId,
    })

    res.json({ publicKey: new Array(...publicKey) })
  } catch (e) {
    console.error('[error] :: [createKey] :: ', e)
    next(e)
  }
}
