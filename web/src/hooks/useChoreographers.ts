import { makeAuxiliaryHooks } from './factories/makeAuxiliaryHooks';
import type { Choreographer } from '@/lib/types/database';

const { useAll, useCreate, useUpdate, useDelete } = makeAuxiliaryHooks<Choreographer>({
  table: 'choreographers',
  label: 'Choreographer',
  selectJoin: 'dances_choreographers(id)',
});

export const useChoreographers = useAll;
export const useCreateChoreographer = useCreate;
export const useUpdateChoreographer = useUpdate;
export const useDeleteChoreographer = useDelete;
