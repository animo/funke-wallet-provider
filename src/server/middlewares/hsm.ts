import type { NextFunction, Request, Response } from 'express'
import type { Hsm } from '../../hsm/Hsm'

export const injectHsm = (hsm: Hsm) => (req: Request, _res: Response, next: NextFunction) => {
  req.hsm = hsm
  next()
}
