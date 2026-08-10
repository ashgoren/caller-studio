import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useNotify } from '@/hooks/useNotify';
import { useUndoActions, registerMutator, recordInsert, recordUpdate, recordDelete, pick, omit, supabaseError } from '@/contexts/UndoContext';

type AuxiliaryConfig = {
  table: string;
  label: string;        // singular display name, e.g. 'Choreographer' — used in undo labels
  selectJoin?: string;   // e.g. 'dances_choreographers(id)' — eager-loaded join for linked-count display
};

// User-editable lookup tables (choreographers, key_moves, vibes): per-user, managed via
// Settings' AuxiliaryList. Identical get/create/update/delete shape across entities —
// only the table name, display label, and eager-load join clause differ.
export function makeAuxiliaryHooks<TRow extends { id: number; name: string }>(config: AuxiliaryConfig) {
  const { table, label, selectJoin } = config;
  const selectClause = selectJoin ? `*, ${selectJoin}` : '*';
  const joinKey = selectJoin?.split('(')[0] as keyof TRow | undefined;

  const getAll = async () => {
    const { data, error } = await supabase.from(table).select(selectClause).order('name', { ascending: true });
    if (error) throw supabaseError(error);
    return data as unknown as TRow[];
  };

  const createRow = async (item: Record<string, unknown>) => {
    const { data, error } = await supabase.from(table).insert(item).select('*').single();
    if (error) throw supabaseError(error);
    return data as TRow;
  };

  const updateRow = async (id: number, updates: Record<string, unknown>) => {
    const { data, error } = await supabase.from(table).update(updates).eq('id', id).select('*').single();
    if (error) throw supabaseError(error);
    return data as TRow;
  };

  const deleteRow = async (id: number) => {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw supabaseError(error);
  };

  registerMutator(table, { insert: createRow, update: updateRow, delete: deleteRow });

  const useAll = () => useQuery({ queryKey: [table], queryFn: getAll });

  const useCreate = () => {
    const { toastError } = useNotify();
    const { pushAction } = useUndoActions();
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (item: Record<string, unknown>) => createRow(item),
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: [table] });
        recordInsert(pushAction, table, data, `Create ${label}: ${data.name}`);
      },
      onError: (err: Error) => toastError(err.message || `Error creating ${label.toLowerCase()}`),
    });
  };

  const useUpdate = () => {
    const { toastError } = useNotify();
    const { pushAction } = useUndoActions();
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, updates }: { id: number; updates: Record<string, unknown> }) => updateRow(id, updates),
      onSuccess: (_, { id, updates }) => {
        const current = queryClient.getQueryData<TRow[]>([table])?.find(r => r.id === id);
        queryClient.invalidateQueries({ queryKey: [table] });
        if (!current) return;
        const keys = Object.keys(updates) as (keyof TRow)[];
        recordUpdate(pushAction, table, id, pick(current, keys), updates, `Edit ${label}: ${current.name}`);
      },
      onError: (err: Error) => toastError(err.message || `Error updating ${label.toLowerCase()}`),
    });
  };

  const useDelete = () => {
    const { toastError } = useNotify();
    const { pushAction } = useUndoActions();
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id }: { id: number }) => deleteRow(id),
      onSuccess: (_, { id }) => {
        const current = queryClient.getQueryData<TRow[]>([table])?.find(r => r.id === id);
        queryClient.invalidateQueries({ queryKey: [table] });
        if (!current) return;
        const record = joinKey ? omit(current, [joinKey]) : current;
        recordDelete(pushAction, table, id, record, `Delete ${label}: ${current.name}`);
      },
      onError: (err: Error) => toastError(err.message || `Error deleting ${label.toLowerCase()}`),
    });
  };

  return { useAll, useCreate, useUpdate, useDelete };
}
