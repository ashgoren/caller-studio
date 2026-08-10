import { makeJunctionHooks } from './factories/makeJunctionHooks';

const { useAdd, useRemove } = makeJunctionHooks({
  table: 'programs_dances',
  fkA: 'program_id',
  fkB: 'dance_id',
  label: 'Dance',
  invalidateKeys: (programId, danceId) => [['program', programId], ['programs'], ['dance', danceId], ['dances']],
});

export const useAddDanceToProgram = useAdd;
export const useRemoveDanceFromProgram = useRemove;
