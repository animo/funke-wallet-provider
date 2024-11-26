import type { NextFunction, Request, Response } from 'express'
import { z } from 'zod'
import { uint8arraySchema } from '../../utils'

export const signSchema = z.object({
  keyId: z.string(),
  data: uint8arraySchema,
})

export const sign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log(`[sign]: with keyId: '${req.jwtPayload.keyId}'`)
    if (!req.keyRingId) throw new Error('keyRingId not set on the request')
    const signature = await req.hsm.sign({
      data: req.jwtPayload.data as Uint8Array,
      keyId: req.jwtPayload.keyId as string,
      keyRingId: req.keyRingId,
    })
    res.json({ signature: new Array(...signature) })
  } catch (e) {
    console.error('[error] :: [sign] :: ', e)
    next(e)
  }
}
