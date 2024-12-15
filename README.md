![](https://storageapi.fleek.co/fleek-team-bucket/Waste-banner.png)


# Waste Controller - Controller functions for the Waste2Earn Extension
[![Fleek](https://img.shields.io/badge/Made%20by-Fleek-blue)](https://fleek.co/)
[![Discord](https://img.shields.io/badge/Discord-Channel-blue)](https://discord.gg/yVEcEzmrgm)

## Introduction

The Waste Controller is a package that provides utility & logic to the Waste browser wallet extension, as well as the account creation and management. It handles the interactions between the extension and the Internet Computer as users interact with accounts, balances, canisters, and the network.

## Installation

```
npm install @wastopia/Waste-controller
```

To install the package you need to be authenticated to Github via `npm login`, ensure that you have:

- A personal access token (create one [here]((https://github.com/settings/tokens))) with the `repo` and `read:packages` scopes to login to the [GitHub Package Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-to-github-packages).

- Have authenticated via `npm login`, using the **personal access token** as your **password**:

```
npm login --registry=https://npm.pkg.github.com --scope=@wastopia
```

## Waste KeyRing
A Waste Keyring is a class that manages the user's accounts and allow you to create/import a mnemonic and its keypair. 
```
import WasteController from '@wastopia/Waste-controller';

const keyRing = new WasteController.WasteKeyRing();

// Initialize keyring and load state from extension storage
await keyRing.init();
```

### Keyring Creation
```
// Creates the keyring and returns the default wallet
const wallet: WasteWallet = await keyRing.create(password);
```

### Mnemonic Import
```
// Creates the keyring using the provided mnemonic and returns the default wallet
const wallet: WasteWallet = await keyRing.importFromMnemonic(mnemonic, password);
```

## Documentation

Interface and Type definitions documents for the **@wastopia/Waste-controller** implementation is provided in the following [location](https://twilight-dream-0902.on.fleek.co/).

These are based in the `main release branch` and provide a good overview of the whole package (modules, IDL's, utils, etc).