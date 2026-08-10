import { makeAuxiliaryHooks } from './factories/makeAuxiliaryHooks';
import type { KeyMove } from '@/lib/types/database';

const { useAll, useCreate, useUpdate, useDelete } = makeAuxiliaryHooks<KeyMove>({
  table: 'key_moves',
  label: 'Key Move',
  selectJoin: 'dances_key_moves(id)',
});

export const useKeyMoves = useAll;
export const useCreateKeyMove = useCreate;
export const useUpdateKeyMove = useUpdate;
export const useDeleteKeyMove = useDelete;
