import { makeJunctionHooks } from './factories/makeJunctionHooks';

const { useAdd, useRemove } = makeJunctionHooks({
  table: 'dances_key_moves',
  fkA: 'dance_id',
  fkB: 'key_move_id',
  label: 'Key Move',
  invalidateKeys: (danceId) => [['dance', danceId], ['dances'], ['key_moves']],
});

export const useAddKeyMoveToDance = useAdd;
export const useRemoveKeyMoveFromDance = useRemove;
