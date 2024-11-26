import type { NextFunction, Request, Response } from 'express'
import type { Database } from '../../database'

export const injectDatabase = (db: Database) => (req: Request, _res: Response, next: NextFunction) => {
  req.db = db
  next()
}
