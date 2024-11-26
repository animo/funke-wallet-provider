import { AsnParser } from '@peculiar/asn1-schema'
import { SubjectPublicKeyInfo } from '@peculiar/asn1-x509'
import type { NextFunction, Request, Response } from 'express'
import { type KeyLike, compactVerify, exportSPKI, importJWK } from 'jose'
import { z } from 'zod'
import { encodeToBase58 } from '../../utils'

const schema = z.object({
  jwt: z.string(),
})

export const validateJwtBody = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log(`[middleware] :: [validateJwtBody] on url: '${req.url}'`)
    const { jwt } = schema.parse(req.body)

    const [header] = jwt.split('.')
    const headerBytes = Buffer.from(header, 'base64url')
    const { jwk } = JSON.parse(headerBytes.toString())
    if (!jwk) {
      throw new Error('jwk entry not found in header')
    }

    const key = (await importJWK(jwk)) as KeyLike
    const publicKeySpki = await exportSPKI(key)

    const { payload } = await compactVerify(jwt, key)

    const keyString = publicKeySpki.slice(27, publicKeySpki.length - 25)
    const pemBytes = Buffer.from(keyString, 'base64')
    const parsed = AsnParser.parse(pemBytes, SubjectPublicKeyInfo)
    const uncompressedKey = new Uint8Array(parsed.subjectPublicKey)

    const decodedPayload = new TextDecoder().decode(payload)

    req.walletId = encodeToBase58(uncompressedKey)
    req.jwtPayload = JSON.parse(decodedPayload)

    next()
  } catch (error) {
    console.error('[error] :: [middleware] :: [validateJwtBody] :: ', error)
    if (error instanceof z.ZodError) {
      console.error(error.errors)
      res.status(400).json({
        message: 'Validation failed',
        errors: error.errors,
      })
    } else if (error instanceof Error && error.message === 'signature verification failed') {
      res.status(403).json({
        message: error.message,
      })
    } else {
      console.error(error)
      res.status(500).json({
        message: 'Internal server error',
        error,
      })
    }
  }
}
