import { type Jwk, Oauth2Client } from '@animo-id/oauth2'
import { getOauth2Callbacks } from './callbacks'

function addSecondsToDate(date: Date, seconds: number) {
  return new Date(date.getTime() + seconds * 1000)
}

export async function createClientAttestation(options: {
  clientJwk: Jwk
  clientId: string
}) {
  const client = new Oauth2Client({
    callbacks: getOauth2Callbacks(),
  })

  return await client.createClientAttestationJwt({
    clientId: options.clientId,
    confirmation: {
      jwk: options.clientJwk,
      // key is stored in encrypted database of which the key is derived from a pin
      user_authentication: 'internal_pin',
      // Client attestation key is software at the moment and also used for dpop
      key_type: 'software',
    },
    issuer: 'https://wallet.paradym.id',
    signer: {
      method: 'custom',
      alg: 'ES256',
    },

    // valid for 5 minutes currently
    expiresAt: addSecondsToDate(new Date(), 300),
  })
}
