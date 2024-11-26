import type { NextFunction, Request, Response } from 'express'
import { z } from 'zod'
import { KeyType } from '../../hsm/keyType'

export const batchCreateKeySchema = z.object({
  keyIds: z.array(z.string()),
  keyType: z.nativeEnum(KeyType),
})

export const batchCreateKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log(
      `[createKey] with keyIds: '${req.jwtPayload.keyIds}', keyRingId: '${req.keyRingId}', keyType: '${req.jwtPayload.keyType}'`
    )
    if (!req.keyRingId) throw new Error('keyRingId not set on the request')

    const requests = (req.jwtPayload.keyIds as Array<string>).map(async (keyId: string) => {
      await req.hsm.createKey({
        keyType: req.jwtPayload.keyType as KeyType,
        keyId: keyId as string,
        keyRingId: req.keyRingId as string,
      })

      const publicKey = await req.hsm.getPublicKey({
        keyId: keyId as string,
        keyRingId: req.keyRingId as string,
      })
      return {
        publicKey,
        keyId,
      }
    })

    const publicKeys = await Promise.all(requests)

    const keys: Record<string, Array<number>> = publicKeys.reduce(
      (prev, curr) => ({ ...prev, [curr.keyId]: new Array(...curr.publicKey) }),
      {}
    )

    res.json({ publicKeys: keys })
  } catch (e) {
    console.error('[error] :: [createKey] :: ', e)
    next(e)
  }
}
