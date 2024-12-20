import { NFTCollection } from '@wastopia/dab-js';
import { Network, NetworkModuleParams } from '../WasteKeyRing/modules/NetworkModule';
import { ConnectedApp } from './account';
import { TokenBalance } from './token';
import { Types } from '../utils/account/constants';
import { GenericSignIdentity } from '../utils/identity/genericSignIdentity'


export interface ICNSData {
    names?: string[];
    reverseResolvedName?: string;
  }
  
export interface WasteWalletArgs {
    name?: string;
    walletId: string;
    orderNumber: number;
    walletNumber?: number;
    icon?: string;
    fetch: any;
    icnsData?: { names?: string[]; reverseResolvedName?: string };
    network: Network,
    identity: GenericSignIdentity,
    type: Types,
}

export interface Assets {
    [canisterId: string]: TokenBalance
}

export interface JSONWallet {
    name: string;
    walletId: string;
    orderNumber: number;
    walletNumber?: number;
    principal: string;
    accountId: string;
    icon?: string;
    icnsData: ICNSData;
    networkModule?: NetworkModuleParams;
    type: Types;
    keyPair: string;
}

export interface NFTDetailsBase<idT = bigint> {
    index: idT;
    canister: string;
    url: string;
    standard: string;
}
  
export interface WalletNFTCollection extends Omit<NFTCollection, 'tokens'> {
    tokens: NFTDetailsBase<bigint | string>[];
}

export interface WalletNFTInfo extends NFTCollection {
    registeredBy: Array<string>;
}
