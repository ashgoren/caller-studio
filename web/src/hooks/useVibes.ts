import { makeAuxiliaryHooks } from './factories/makeAuxiliaryHooks';
import type { Vibe } from '@/lib/types/database';

const { useAll, useCreate, useUpdate, useDelete } = makeAuxiliaryHooks<Vibe>({
  table: 'vibes',
  label: 'Vibe',
  selectJoin: 'dances_vibes(id)',
});

export const useVibes = useAll;
export const useCreateVibe = useCreate;
export const useUpdateVibe = useUpdate;
export const useDeleteVibe = useDelete;
