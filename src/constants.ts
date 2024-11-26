import { writeFileSync } from 'node:fs'

if (!process.env.WALLET_PROVIDER_P256_PRIVATE_JWK) {
  throw new Error('Missing required WALLET_PROVIDER_P256_PRIVATE_JWK')
}

export const WALLET_PROVIDER_P256_PRIVATE_JWK = process.env.WALLET_PROVIDER_P256_PRIVATE_JWK
export const GOOGLE_APPLICATION_CREDENTIALS_JSON = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
if (GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  // Write google credentials
  writeFileSync('google_credentials.json', GOOGLE_APPLICATION_CREDENTIALS_JSON)
}
