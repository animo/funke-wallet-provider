import type { NextFunction, Request, Response } from 'express'
import { z } from 'zod'
import { WalletIdNotFoundError } from '../../error/WalletIdNotFound'

export const addKeyRingId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log(`[middleware] :: [addKeyRingId] on url: '${req.url}'`)

    const keyRingId = await req.db.getKeyRingId({ walletId: req.walletId })

    req.keyRingId = keyRingId

    next()
  } catch (error) {
    console.error('[error] :: [middleware] :: [addKeyRingId] :: ', error)
    if (error instanceof z.ZodError) {
      console.error(error.errors)
      res.status(400).json({
        message: 'Validation failed',
        errors: error.errors,
      })
    } else if (error instanceof WalletIdNotFoundError) {
      res.status(403).json({
        message: error.message,
        name: error.name,
      })
    } else {
      res.status(500).json({
        message: 'Internal server error',
        error,
      })
    }
  }
}
