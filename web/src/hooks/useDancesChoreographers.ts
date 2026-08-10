import { makeJunctionHooks } from './factories/makeJunctionHooks';

const { useAdd, useRemove } = makeJunctionHooks({
  table: 'dances_choreographers',
  fkA: 'dance_id',
  fkB: 'choreographer_id',
  label: 'Choreographer',
  invalidateKeys: (danceId) => [['dance', danceId], ['dances'], ['choreographers']],
});

export const useAddChoreographerToDance = useAdd;
export const useRemoveChoreographerFromDance = useRemove;
