import { v4 as uuid } from "uuid";
import { getNFTActor, getTokenActor, NFTCollection, standards } from "@wastopia/dab-js";
import { SignIdentity } from '@dfinity/agent';

import { ERRORS } from "../../../errors";
import { validateCanisterId } from "../../utils";
import { IC_URL_HOST } from "../../../utils/dfx/constants";
import { DEFAULT_MAINNET_TOKENS, TOKENS } from "../../../constants/tokens";
import { StandardToken } from "../../../interfaces/token";
import { recursiveParseBigint } from "../../../utils/object";
import { createAgent } from "../../../utils/dfx";

export type NetworkParams = {
  name: string;
  host: string;
  ledgerCanisterId?: string;
  registeredTokens?: RegisteredToken[];
  registeredNFTS?: RegisteredNFT[];
  id?: string;
  onChange?: () => void;
}

export type EditNetworkParams = {
  name?: string;
  host?: string;
  ledgerCanisterId?: string;
}

export type RegisteredToken = StandardToken & { registeredBy: Array<string> };

export type RegisteredNFT = NFTCollection &  { registeredBy: Array<string> };
// Function that takes in an array of tokens and returns an array without duplicates

type uniqueTokensType = Array<RegisteredToken | RegisteredNFT>;

export const uniqueTokens = (tokens:uniqueTokensType) => {
  const uniqueTokens = tokens.filter((token, index) => {
    return tokens.findIndex(t => t.canisterId === token.canisterId) === index;
  });
  return uniqueTokens;
}

export class Network {
  public name: string;
  public host: string;
  public ledgerCanisterId?: string;
  public id: string;
  public isCustom: boolean;
  public defaultTokens: StandardToken[];
  public registeredTokens: RegisteredToken[];
  public registeredNFTS: RegisteredNFT[];
  private onChange;
  private fetch: any

  constructor(networkParams: NetworkParams, fetch: any) {
    this.name = networkParams.name;
    this.host = networkParams.host;
    this.onChange = networkParams.onChange;
    this.id = networkParams?.id || uuid();
    this.isCustom = true;
    this.ledgerCanisterId = networkParams.ledgerCanisterId || '';
    this.defaultTokens = [{
      name: 'ICP',
      symbol: 'ICP',
      canisterId: networkParams.ledgerCanisterId || '',
      standard: standards.TOKEN.icp,
      decimals: 8,
    }];
    this.registeredTokens = [...(networkParams.registeredTokens || [])];
    this.registeredNFTS = [...(networkParams.registeredNFTS || [])];
    this.fetch = fetch;
  }

  
  get tokens(): StandardToken[] {
    return [...this.defaultTokens, ...this.registeredTokens];
  }
  
  public tokenByCanisterId(canisterId: string): StandardToken | undefined {
    return this.tokens.find(token => token.canisterId === canisterId);
  }
  
  public edit({ name, host, ledgerCanisterId }: EditNetworkParams) {
    this.name = name || this.name;
    this.host = host || this.host;
    this.ledgerCanisterId = ledgerCanisterId || this.ledgerCanisterId;
    this.onChange?.();
  }
  
  public createAgent({ defaultIdentity } : {defaultIdentity: SignIdentity})  {
    const agent = createAgent({
      defaultIdentity,
      host: this.host,
      fetch: this.fetch,
      wrapped: !this.isCustom
    });
    return agent;
  }

  public getTokenInfo = async ({ canisterId, standard, defaultIdentity }) => {
    if (!validateCanisterId(canisterId)) {
      throw new Error(ERRORS.INVALID_CANISTER_ID);
    }
    const agent = this.createAgent({ defaultIdentity });
    const tokenActor = await getTokenActor({ canisterId, standard, agent });
    const metadata = await tokenActor.getMetadata();
    if (!('fungible' in metadata)) {
      throw new Error(ERRORS.NON_FUNGIBLE_TOKEN_NOT_SUPPORTED);
    }
    const token:RegisteredToken = { ...metadata.fungible, canisterId, standard, registeredBy: []};

    this.registeredTokens = uniqueTokens([...this.registeredTokens, token]) as RegisteredToken[];
    return token;
  }

  public getNftInfo = async ({ canisterId, identity, standard }) => {
    if (!validateCanisterId(canisterId)) {
      throw new Error(ERRORS.INVALID_CANISTER_ID);
    }
    try {
      const agent = this.createAgent({ defaultIdentity: identity });
      const nftActor = getNFTActor({ canisterId, agent, standard });
      const metadata = await nftActor.getMetadata();
      const nft = {...metadata, registeredBy: []};
      return nft
    } catch(e) {
      throw new Error(ERRORS.CANISTER_INTERFACE_ERROR);
    }
  }

  public registerNFT = async ({
    canisterId, standard, walletId, identity,
  }) => {
    const nft = this.registeredNFTS.find(({ canisterId: id }) => id === canisterId);
    
    if (nft) { 
      throw new Error(ERRORS.NFT_ALREADY_REGISTERED);
    }

    const nftInfo = await this.getNftInfo({ canisterId, identity, standard });
    this.registeredNFTS = uniqueTokens([...this.registeredNFTS, nftInfo]) as RegisteredNFT[];
    
    this.registeredNFTS = this.registeredNFTS.map(n => n.canisterId === canisterId ? {...n, registeredBy: [...n?.registeredBy, walletId]} : n);
    await this.onChange?.();
    return this.registeredNFTS;
  };

  public registerToken = async ({ canisterId, standard, walletId, defaultIdentity, logo }: { canisterId: string, standard: string, walletId: string, defaultIdentity: SignIdentity, logo?: string }) => {
    const token = this.registeredTokens.find(({ canisterId: id }) => id === canisterId);
    const defaultToken = this.defaultTokens.find(({ canisterId: id }) => id === canisterId);
    if (defaultToken) {
      return this.defaultTokens;
    }
    if (!token) {
      await this.getTokenInfo({ canisterId, standard, defaultIdentity });
    }
    this.registeredTokens = this.registeredTokens.map(
      t => t.canisterId === canisterId ? { ...t, logo, registeredBy: [...t?.registeredBy, walletId] } : t
    );
    await this.onChange?.();
    return this.registeredTokens;
  }

  public removeToken = async ({ canisterId }: { canisterId: string }): Promise<RegisteredToken[]> => {
    if (!this.registeredTokens.map(t => t.canisterId).includes(canisterId)) {
      return this.registeredTokens;
    }
    const newTokens = this.registeredTokens.filter(t => t.canisterId !== canisterId);
    this.registeredTokens = newTokens;
    await this.onChange?.();
    return newTokens;
  };

  public getTokens = (walletId) => {
    return [
      ...this.defaultTokens,
      ...this.registeredTokens.filter(t => t?.registeredBy?.includes(walletId)),
    ];
  }

  public toJSON(): Omit<NetworkParams, 'onChange'> {
    return {
      name: this.name,
      host: this.host,
      ledgerCanisterId: this.ledgerCanisterId,
      registeredTokens: this.registeredTokens?.map(recursiveParseBigint),
      id: this.id,
    };
  }
}



export class Mainnet extends Network {
  constructor({ registeredTokens, onChange }: { registeredTokens?: RegisteredToken[], onChange?: () => void }, fetch: any) {
    super({
      onChange,
      registeredTokens,
      name: 'Mainnet',
      host: `https://${IC_URL_HOST}`,
      ledgerCanisterId: TOKENS.ICP.canisterId,
    }, fetch);
    this.id = 'mainnet';
    this.isCustom = false;
    this.defaultTokens = DEFAULT_MAINNET_TOKENS;
    this.registeredTokens = registeredTokens || [];
  }

  public edit(): void {
    return;
  }
}
