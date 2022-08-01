/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable camelcase */
import { HttpAgent } from '@dfinity/agent';
import { BinaryBlob, blobFromUint8Array } from '@dfinity/candid';
import crossFetch from 'cross-fetch';

import Secp256k1KeyIdentity from '../crypto/secpk256k1/identity';
import { wrappedFetch } from './wrappedFetch';
import { IC_MAINNET_URLS, PLUG_PROXY_HOST } from './constants';

export interface CreateAgentArgs {
  secretKey: BinaryBlob;
  defaultIdentity?: Secp256k1KeyIdentity;
  fetch?: any;
  host?: string;
  wrapped?: boolean,
}

export const createIdentity = (secretKey: BinaryBlob): Secp256k1KeyIdentity =>
  Secp256k1KeyIdentity.fromSecretKey(secretKey);

export const createAgent = ({
  secretKey,
  defaultIdentity,
  fetch = crossFetch,
  host,
  wrapped = true,
}: CreateAgentArgs): HttpAgent => {
  const identity =
    defaultIdentity || createIdentity(blobFromUint8Array(secretKey));
  const agent = new HttpAgent({
    host: (wrapped ? PLUG_PROXY_HOST : host)|| PLUG_PROXY_HOST,
    fetch: wrapped ?  wrappedFetch(fetch) : fetch,
    identity,
  });
  if (host && !IC_MAINNET_URLS.includes(host)) {
    agent.fetchRootKey();
  }
  return agent;
};

export { createNNSActor } from './nns_uid';
