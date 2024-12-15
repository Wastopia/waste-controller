import type WasteWallet from '../WasteWallet'
import {
    JSONWallet
  } from '../interfaces/waste_wallet';

export interface WasteState {
  password?: string;
  currentWalletId?: string;
  mnemonicWalletCount: number;
  walletIds?: Array<string>
}
export interface WasteStateStorage extends WasteState {
  wallets: { [key : string]: JSONWallet };
}

export interface WasteStateInstance extends WasteState {
  wallets: { [key : string]: WasteWallet };
}
