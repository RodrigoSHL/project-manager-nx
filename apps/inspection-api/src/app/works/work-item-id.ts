import { v5 as uuidv5 } from 'uuid';

// Stable across browser and API so an offline work produces the same snapshot
// when the server validates its Push operation.
const WORK_ITEM_NAMESPACE = 'b1bc5b44-17ab-5de7-bc0a-46b18ef325f0';

export function workItemInstanceId(
  workId: string,
  assetId: string,
  formItemId: string
) {
  return uuidv5(`${workId}:${assetId}:${formItemId}`, WORK_ITEM_NAMESPACE);
}
