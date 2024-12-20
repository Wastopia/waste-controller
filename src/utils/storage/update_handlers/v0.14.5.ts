import { TOKENS } from '../../../constants/tokens';
import { PlugStateStorage } from '../../../interfaces/waste_keyring';

export default (storage: any): PlugStateStorage => ({
  ...storage,
  wallets: storage.wallets.map(wallet => ({
    ...wallet,
    assets: wallet.assets.reduce(
      (acum, asset) => ({
        ...acum,
        [asset.canisterId]: {
          amount: '0',
          token: {
            name: asset.name,
            symbol: asset.symbol,
            canisterId: asset.canisterId,
            standard:
              wallet.registeredTokens[
                asset.canisterId
              ]?.standard.toUpperCase() || TOKENS[asset.symbol].standard,
            decimals:
              wallet.registeredTokens[asset.canisterId]?.decimals ||
              TOKENS[asset.symbol].decimals,
            color: wallet.registeredTokens[asset.canisterId]?.color,
          },
        },
      }),
      {}
    ),
  })),
});
