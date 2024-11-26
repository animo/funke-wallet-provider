#!/usr/bin/env ts-node

import 'dotenv/config'

import { Axios, AxiosHeaders } from 'axios'
import { v4 as uuid } from 'uuid'

import { CompactSign, type GenerateKeyPairResult, type KeyLike, exportJWK, generateKeyPair } from 'jose'

const port = process.env.PORT || 30000
const KEY_ID = uuid()
const KEY_IDS = [uuid(), uuid(), uuid()]
const headers = new AxiosHeaders({ 'Content-Type': 'application/json' })

const request = async <O>(
  c: Axios,
  keys: GenerateKeyPairResult<KeyLike>,
  route: string,
  body: Record<string, unknown>
): Promise<O> => {
  const jwt = await new CompactSign(new TextEncoder().encode(JSON.stringify(body)))
    .setProtectedHeader({ alg: 'ES256', jwk: await exportJWK(keys.publicKey) })
    .sign(keys.privateKey)

  const newBody = {
    jwt,
  }

  const result = await c.post(`http://localhost:${port}/${route}`, JSON.stringify(newBody))

  const data = result.data
  if (result.status > 299) {
    throw new Error(data)
  }

  return data
}

void (async () => {
  try {
    const keys = await generateKeyPair('ES256')
    const clientAttestationKey = await generateKeyPair('ES256')
    const client = new Axios({ headers })
    const data = new Uint8Array([1, 2, 3])
    await request(client, keys, 'register-wallet', {})

    const createKeyResult = await request<{ publicKey: Array<number> }>(client, keys, 'create-key', {
      keyId: KEY_ID,
      keyType: 'P256',
    })

    console.log(`createKeyResult: ${createKeyResult}`)

    const batchCreateKeysResult = await request<{ publicKeys: Array<number> }>(client, keys, 'batch-create-key', {
      keyIds: KEY_IDS,
      keyType: 'P256',
    })

    console.log(`batchCreateKeysResult: ${batchCreateKeysResult}`)

    const getPublicKeyResult = await request<{ publicKey: Array<number> }>(client, keys, 'get-publickey', {
      keyId: KEY_ID,
    })
    console.log(`getPublicKeyResult: ${getPublicKeyResult}`)

    const signResult = await request<{ signature: Uint8Array }>(client, keys, 'sign', {
      keyId: KEY_ID,
      data: new Array(...data),
    })
    console.log(`signResult: ${signResult}`)

    const walletAttestationResult = await request<{ walletAttestation: string }>(client, keys, 'attestation', {
      jwk: await exportJWK(clientAttestationKey.publicKey),
    })
    console.log(`walletAttestationResult: ${walletAttestationResult}`)
  } catch (e) {
    console.error(e)
  }
})()
