import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useNotify } from '@/hooks/useNotify';
import { useUndoActions, registerMutator, recordInsert, recordDelete, supabaseError } from '@/contexts/UndoContext';

type JunctionConfig = {
  table: string;       // e.g. 'dances_choreographers'
  fkA: string;          // e.g. 'dance_id'
  fkB: string;          // e.g. 'choreographer_id'
  label: string;         // singular display name for the "other side", e.g. 'Choreographer' — used in fallback undo labels
  invalidateKeys: (aId: number, bId: number) => QueryKey[];
};

// Many-to-many junction tables (dances_choreographers, dances_key_moves, dances_vibes,
// programs_dances): add/remove mutations only, no query of their own. Live "remove" deletes
// by the (aId, bId) foreign-key pair — the UI never sees the junction row's own id — but
// undo-replay of a previous "add" needs to delete by that row's own id, since that's what
// was captured when the insert happened. Those are two distinct, both-correct ways to reach
// a row, not two competing sources of truth.
export function makeJunctionHooks(config: JunctionConfig) {
  const { table, fkA, fkB, label, invalidateKeys } = config;

  const insertRow = async (record: Record<string, unknown>) => {
    const { data, error } = await supabase.from(table).insert(record).select().single();
    if (error) throw supabaseError(error);
    return data as Record<string, unknown> & { id: number };
  };

  const addRow = (aId: number, bId: number, extra?: Record<string, unknown>) =>
    insertRow({ [fkA]: aId, [fkB]: bId, ...extra });

  const removeRow = async (aId: number, bId: number) => {
    const { data, error } = await supabase.from(table).delete().eq(fkA, aId).eq(fkB, bId).select().single();
    if (error) throw supabaseError(error);
    return data as Record<string, unknown> & { id: number };
  };

  const deleteById = async (id: number) => {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw supabaseError(error);
  };

  registerMutator(table, { insert: insertRow, delete: deleteById });

  const useAdd = () => {
    const { toastError } = useNotify();
    const { pushAction } = useUndoActions();
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ aId, bId, label: actionLabel, ...extra }: { aId: number; bId: number; label?: string } & Record<string, unknown>) =>
        addRow(aId, bId, extra),
      onSuccess: (data, { aId, bId, label: actionLabel }) => {
        invalidateKeys(aId, bId).forEach(key => queryClient.invalidateQueries({ queryKey: key }));
        recordInsert(pushAction, table, data, actionLabel ?? `Add ${label}`);
      },
      onError: (err: Error) => toastError(err.message || `Error adding ${label.toLowerCase()}`),
    });
  };

  const useRemove = () => {
    const { toastError } = useNotify();
    const { pushAction } = useUndoActions();
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ aId, bId }: { aId: number; bId: number; label?: string }) => removeRow(aId, bId),
      onSuccess: (data, { aId, bId, label: actionLabel }) => {
        invalidateKeys(aId, bId).forEach(key => queryClient.invalidateQueries({ queryKey: key }));
        recordDelete(pushAction, table, data.id, data, actionLabel ?? `Remove ${label}`);
      },
      onError: (err: Error) => toastError(err.message || `Error removing ${label.toLowerCase()}`),
    });
  };

  return { useAdd, useRemove };
}
