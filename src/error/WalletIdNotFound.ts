export class WalletIdNotFoundError extends Error {
  public name = 'WALLET_ID_NOT_FOUND_ERROR'

  constructor(walletId: string) {
    super(`Wallet id '${walletId}' not found`)
  }
}
