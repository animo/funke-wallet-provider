import { createHash, getRandomValues } from 'node:crypto'
import { type CallbackContext, type Jwk, clientAuthenticationNone } from '@animo-id/oauth2'
import { SignJWT, exportJWK, importJWK } from 'jose'
import { WALLET_PROVIDER_P256_PRIVATE_JWK } from '../../constants'

export const getOauth2Callbacks = () => {
  return {
    clientAuthentication: clientAuthenticationNone(),
    generateRandom: (length: number) => getRandomValues(new Uint8Array(length)),
    hash: (data, alg) => createHash(alg).update(data).digest(),
    verifyJwt: () => {
      throw new Error('Not implemented')
    },
    signJwt: async (signer, { header, payload }) => {
      const privateKey = await importJWK(JSON.parse(WALLET_PROVIDER_P256_PRIVATE_JWK))
      const { d, ...publicKeyJwk } = await exportJWK(privateKey)

      const signed = await new SignJWT(payload).setProtectedHeader(header).sign(privateKey)

      return {
        jwt: signed,
        signerJwk: publicKeyJwk as Jwk,
      }
    },
  } satisfies Partial<CallbackContext>
}
