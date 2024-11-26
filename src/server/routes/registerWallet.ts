import type { NextFunction, Request, Response } from 'express'

export const registerWallet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log(`[registerWallet] with walletId: '${req.walletId}'`)
    const keyRingId = await req.hsm.registerWallet()
    await req.db.createWallet({ walletId: req.walletId, keyRingId })
    res.json({})
  } catch (e) {
    console.error('[error] :: [registerWallet] :: ', e)
    next(e)
  }
}
