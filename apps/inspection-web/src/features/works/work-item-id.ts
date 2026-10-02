import { v5 as uuidv5 } from 'uuid';

// Must match inspection-api. It makes offline and server snapshots identical.
const WORK_ITEM_NAMESPACE = 'b1bc5b44-17ab-5de7-bc0a-46b18ef325f0';

export function workItemInstanceId(
  workId: string,
  assetId: string,
  formItemId: string
) {
  return uuidv5(`${workId}:${assetId}:${formItemId}`, WORK_ITEM_NAMESPACE);
}
