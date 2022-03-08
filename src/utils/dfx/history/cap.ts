/* eslint-disable camelcase */
/* eslint-disable no-underscore-dangle */
import axios, { AxiosResponse } from 'axios';
import { Principal } from '@dfinity/principal';
import { prettifyCapTransactions } from '@psychedelic/cap-js';
import { getTokens, getAllNFTS, TokenRegistry } from '@psychedelic/dab-js';

import { getCanisterInfo } from '../../dab';
import { recursiveParseBigint } from '../../object';
import { lebDecode } from '../../crypto/binary';

import { InferredTransaction } from '../../../interfaces/transactions';
import { uniqueMap } from '../../array';
import { XTC_ID } from '../constants';

const KYASHU_URL = 'https://kyasshu.fleek.co';

interface KyashuItem {
  contractId: string;
  event: any;
  pk: string;
  sk: string;
  userId: string;
  gs1sk: string;
  gs1pk: string;
  caller: Principal;
}

interface LastEvaluatedKey {
  pk: string;
  sk: string;
  userId: string;
}

interface KyashuResponse {
  Count: number;
  Items: KyashuItem[];
  LastEvaluatedKey: LastEvaluatedKey;
}

export interface GetUserTransactionResponse {
  total: number;
  transactions: InferredTransaction[];
  lastEvaluatedKey?: LastEvaluatedKey;
}

const parsePrincipal = pidObj =>
  pidObj?._isPrincipal
    ? Principal.fromUint8Array(
        new Uint8Array(Object.values((pidObj as any)._arr))
      ).toString()
    : pidObj;

const getTransactionCanister = (contract: string): string | undefined =>
  contract?.split('#')?.[1];

const formatTransaction = async (
  transaction: any,
  canistersInfo
): Promise<InferredTransaction> => {
  const canisterId = getTransactionCanister(transaction.contractId);
  const prettifyEvent = prettifyCapTransactions(transaction.event);
  if (canisterId) {
    prettifyEvent.details = {
      ...prettifyEvent.details,
      canisterInfo: canistersInfo[canisterId],
    };
  }
  const amount = prettifyEvent?.details?.amount;
  const parsedAmount =
    amount instanceof Array && !amount.some(value => typeof value !== 'number')
      ? lebDecode(Uint8Array.from(amount as Array<number>))
      : amount;
  const getHandledTokenInfo = async (principal) => {
    if (!principal) return;
    const canisterId = parsePrincipal(principal);
    if (canistersInfo[canisterId]?.tokenRegistryInfo) return canistersInfo[canisterId]?.tokenRegistryInfo;
    else {
      const registry = new TokenRegistry();
      const data = await registry.get(canisterId);
      return data;
    }
  }
  const tokenId = prettifyEvent?.details?.tokenId || prettifyEvent?.details?.token || '';
  const buildSonicData = async () => {
    const isSwap = prettifyEvent?.operation?.toLowerCase?.()?.includes?.('swap');
    let data: any = { token: await getHandledTokenInfo(tokenId), amount: prettifyEvent?.details?.amount };
    if (isSwap) {
      const [to, from] = (prettifyEvent?.details?.pairId as string)?.split(':');
      data.swap = {
        from: await getHandledTokenInfo(from),
        to: await getHandledTokenInfo(to),
        amountIn: prettifyEvent?.details?.amountIn,
        amountOut: prettifyEvent?.details?.amountOut
      };
    }
    return data;
  }
  return recursiveParseBigint({
    hash: transaction.sk,
    timestamp: prettifyEvent?.time,
    type: prettifyEvent?.operation,
    details: {
      ...prettifyEvent?.details,
      amount: parsedAmount,
      canisterId,
      tokenId,
      to: parsePrincipal(prettifyEvent?.details?.to),
      from: parsePrincipal(prettifyEvent?.details?.from),
      ...(canisterId === "3xwpq-ziaaa-aaaah-qcn4a-cai" ? {
        sonicData: await buildSonicData()
      } : {}),
    },
    caller: parsePrincipal(prettifyEvent?.caller) || '',
  });
};

const metadataArrayToObject = (metadata) => metadata.reduce((acum, item) =>
  ({ ...acum, [item.principal_id.toString()]: item }), {});


const getCanistersInfo = async (canisterIds: string[]): Promise<any> => {
  const dabTokensInfo = metadataArrayToObject(await getTokens());
  const dabNFTsInfo = metadataArrayToObject(await getAllNFTS({}));
  const dabInfo = await Promise.all(
    canisterIds.map(async canisterId => {
      let canisterInfo = { canisterId };
      // First check if present in nft or token registries
      if (dabTokensInfo[canisterId])
        canisterInfo['tokenRegistryInfo'] = dabTokensInfo[canisterId];
      if (dabNFTsInfo[canisterId])
        canisterInfo['nftRegistryInfo'] = dabNFTsInfo[canisterId];
      try {
        // Fetch extra metadata from canister registry
        const fetchedCanisterInfo = await getCanisterInfo(canisterId);
        canisterInfo = { ...canisterInfo, ...fetchedCanisterInfo };
      } catch (error) {
        /* eslint-disable-next-line */
        console.error('DAB error: ', error);
      }
      return canisterInfo;
    })
  );
  const canistersInfo = dabInfo.reduce(
    (acum, info) => ({ ...acum, [info.canisterId]: info }),
    {}
  );
  return canistersInfo;
};

export const getCapTransactions = async (
  principalId: string,
  lastEvaluatedKey?: string
): Promise<GetUserTransactionResponse> => {
  const url = `${KYASHU_URL}/cap/user/txns/${principalId}${
    lastEvaluatedKey ? `?LastEvaluatedKey=${lastEvaluatedKey}` : ''
  }`;
  try {
    const response = await axios.get<any, AxiosResponse<KyashuResponse>>(url);
    const canisterIds = uniqueMap<KyashuItem, string>(response.data.Items, item => getTransactionCanister(item.contractId));
    const canistersInfo = await getCanistersInfo(canisterIds);
    const transactions = await Promise.all(response.data.Items.map(async item => formatTransaction(item,canistersInfo)));
    return {
      total: response.data.Count,
      lastEvaluatedKey: response.data.LastEvaluatedKey,
      transactions,
    };
  } catch (e) {
    console.error('CAP transactions error:', e);
    return {
      total: 0,
      transactions: [],
    };
  }
};

export default {};
