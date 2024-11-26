import type { NextFunction, Request, Response } from 'express'
import { z } from 'zod'

export const validateSchema =
  <T extends z.ZodType>(schema: T) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log(`[middleware] :: [validateBody] on url: '${req.url}'`)
      const validatedData = schema.parse(req.jwtPayload)
      req.jwtPayload = validatedData
      next()
    } catch (error) {
      console.error('[error] :: [middleware] :: [validateBody] :: ', error)
      if (error instanceof z.ZodError) {
        console.error('validation error: ', error.errors)
        res.status(400).json({
          message: 'Validation failed',
          errors: error.errors,
        })
      } else {
        console.error('generic error: ', error)
        res.status(500).json({
          message: 'Internal server error',
        })
      }
    }
  }
