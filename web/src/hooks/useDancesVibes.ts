import { makeJunctionHooks } from './factories/makeJunctionHooks';

const { useAdd, useRemove } = makeJunctionHooks({
  table: 'dances_vibes',
  fkA: 'dance_id',
  fkB: 'vibe_id',
  label: 'Vibe',
  invalidateKeys: (danceId) => [['dance', danceId], ['dances'], ['vibes']],
});

export const useAddVibeToDance = useAdd;
export const useRemoveVibeFromDance = useRemove;
