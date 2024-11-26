import type { KeyType } from './keyType'

export type SignOptions = {
  keyId: string
  keyRingId: string
  data: Uint8Array
}

export type CreateKeyOptions = {
  keyId: string
  keyRingId: string
  keyType: KeyType
}

export type GetPublicKeyOptions = {
  keyId: string
  keyRingId: string
}

export interface Hsm {
  registerWallet(): Promise<string>
  createKey(options: CreateKeyOptions): Promise<void>
  getPublicKey(options: GetPublicKeyOptions): Promise<Uint8Array>
  sign(options: SignOptions): Promise<Uint8Array>
}
