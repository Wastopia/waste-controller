import { NetworkModuleParams } from '../WasteKeyRing/modules/NetworkModule';
import { WasteStateStorage } from './waste_keyring'

export interface StorageData {
    vault: WasteStateStorage;
    isInitialized: boolean;
    isUnlocked: boolean;
    currentWalletId: string;
    version: string;
    networkModule: NetworkModuleParams;
}

export interface KeyringStorage {
    isSupported: boolean;
    get: (key?: string) => Promise<unknown>;
    set: (state: unknown) => Promise<void>;
    clear: () => Promise<void>;
}
