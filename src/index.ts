import WasteKeyRing from './WasteKeyRing';
import { getAccountId } from './utils/account';
import { getCanisterInfo, getMultipleCanisterInfo } from './utils/dab';
import { decode, encode } from './utils/idl';

export default {
  WasteKeyRing,
  getAccountId,
  getCanisterInfo,
  getMultipleCanisterInfo,
  IDLDecode: decode,
  IDLEncode: encode,
};
