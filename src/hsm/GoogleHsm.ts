import { createHash } from 'node:crypto'
import { KeyManagementServiceClient } from '@google-cloud/kms'
import { AsnParser } from '@peculiar/asn1-schema'
import { SubjectPublicKeyInfo } from '@peculiar/asn1-x509'
import { v4 as uuidv4 } from 'uuid'
import type { CreateKeyOptions, GetPublicKeyOptions, Hsm, SignOptions } from './Hsm'
import { KeyType } from './keyType'

export class GoogleHsm implements Hsm {
  private projectId = 'funke-441515'
  private locationId = 'europe-west4'
  private client = new KeyManagementServiceClient()

  private keyVersionPath(keyRingId: string, keyId: string) {
    return this.client.cryptoKeyVersionPath(this.projectId, this.locationId, keyRingId, keyId, '1')
  }

  private keyRingName(keyRingId: string) {
    return this.client.keyRingPath(this.projectId, this.locationId, keyRingId)
  }

  private get locationPath() {
    return this.client.locationPath(this.projectId, this.locationId)
  }

  public async registerWallet(): Promise<string> {
    const keyRingId = uuidv4()

    await this.client.createKeyRing({
      parent: this.locationPath,
      keyRingId,
    })

    return keyRingId
  }

  public async createKey(options: CreateKeyOptions): Promise<void> {
    if (options.keyType !== KeyType.P256) {
      throw new Error(`Only keytype of '${KeyType.P256}' is allowed`)
    }

    await this.client.createCryptoKey({
      parent: this.keyRingName(options.keyRingId),
      cryptoKeyId: options.keyId,
      cryptoKey: {
        purpose: 'ASYMMETRIC_SIGN',
        versionTemplate: {
          algorithm: 'EC_SIGN_P256_SHA256',
        },
      },
    })
  }

  // Returns the uncompressed key
  public async getPublicKey(options: GetPublicKeyOptions): Promise<Uint8Array> {
    const keyName = this.keyVersionPath(options.keyRingId, options.keyId)
    const [publicKey] = await this.client.getPublicKey({ name: keyName })

    const pem = publicKey.pem

    if (!pem) {
      throw new Error(`No public key found for key id '${options.keyId}'`)
    }

    const keyBytes = pem.slice(26, pem.length - 24)
    const pemBytes = Buffer.from(keyBytes, 'base64')
    const spki = AsnParser.parse(pemBytes, SubjectPublicKeyInfo)
    const uncompressedKey = new Uint8Array(spki.subjectPublicKey)
    return new Uint8Array(uncompressedKey)
  }

  public async sign(options: SignOptions): Promise<Uint8Array> {
    const keyName = this.keyVersionPath(options.keyRingId, options.keyId)
    const hasher = createHash('sha256')
    hasher.update(options.data)
    const digest = hasher.digest()
    const [signResponse] = await this.client.asymmetricSign({
      name: keyName,
      digest: {
        sha256: digest,
      },
    })

    if (!signResponse.signature) {
      throw new Error('No signature found on the response')
    }

    return signResponse.signature as Uint8Array
  }
}
