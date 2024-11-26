import { v4 as uuidv4 } from 'uuid'
import type { CreateKeyOptions, GetPublicKeyOptions, Hsm, SignOptions } from './Hsm'

import { type KeyObject, createSign, generateKeyPairSync } from 'node:crypto'
import { AsnParser } from '@peculiar/asn1-schema'
import { SubjectKeyIdentifier, SubjectPublicKeyInfo } from '@peculiar/asn1-x509'
import { KeyType } from './keyType'

type KeyPair = {
  publicKey: KeyObject
  privateKey: KeyObject
}

export class NodeHsm implements Hsm {
  private keyStore: Record<string, Record<string, KeyPair>> = {}

  private getKey(keyRingId: string, keyId: string) {
    const keyRing = this.getKeyRing(keyRingId)
    if (!(keyId in keyRing)) {
      throw new Error(`Could not find key with key id: '${keyId}' in keyring with id: '${keyRingId}'`)
    }
    return keyRing[keyId]
  }

  private getKeyRing(keyRingId: string) {
    if (!(keyRingId in this.keyStore)) {
      throw new Error(`Could not find keyring with keyring id: '${keyRingId}'`)
    }
    return this.keyStore[keyRingId]
  }

  public async registerWallet(): Promise<string> {
    const keyRingId = uuidv4()

    this.keyStore[keyRingId] = {}

    return keyRingId
  }

  public async createKey(options: CreateKeyOptions): Promise<void> {
    let key: KeyPair
    switch (options.keyType) {
      case KeyType.P256:
        key = generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
        this.keyStore[options.keyRingId][options.keyId] = key
        return
      default:
        throw new Error(`Unsupported key type: '${options.keyType}'`)
    }
  }

  // Returns the uncompressed key
  public async getPublicKey(options: GetPublicKeyOptions): Promise<Uint8Array> {
    const key = this.getKey(options.keyRingId, options.keyId)
    const pem = key.publicKey.export({ type: 'spki', format: 'pem' }) as string
    const keyBytes = pem.slice(26, pem.length - 24)
    const pemBytes = Buffer.from(keyBytes, 'base64')
    const { subjectPublicKey } = AsnParser.parse(pemBytes, SubjectPublicKeyInfo)
    return new Uint8Array(subjectPublicKey)
  }

  public async sign(options: SignOptions): Promise<Uint8Array> {
    const key = this.getKey(options.keyRingId, options.keyId)

    const signer = createSign('SHA256')
    signer.update(options.data)
    const signature = signer.sign(key.privateKey)

    return new Uint8Array(signature)
  }
}
