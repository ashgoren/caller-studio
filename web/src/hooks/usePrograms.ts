import { useNotify } from '@/hooks/useNotify';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useUndoActions, registerMutator, recordInsert, recordUpdate, pick, omit, supabaseError } from '@/contexts/UndoContext';
import { formatLocalDate } from '@/lib/utils';
import type { Program, ProgramInsert, ProgramUpdate } from '@/lib/types/database';

const PROGRAM_SELECT = '*, programs_dances(id, order, dance:dances(*, dance_type:dance_types(id, name), formation:formations(id, name), progression:progressions(id, name), dances_key_moves(id, key_move:key_moves(id, name))))';

// Keys present on the fetched/joined Program view-model that aren't real columns on the
// `programs` table — stripped out before a full row is stored as an undo insert/delete record.
export const PROGRAM_JOIN_KEYS: (keyof Program)[] = ['programs_dances'];

const getPrograms = async () => {
  const { data, error } = await supabase
    .from('programs')
    .select(PROGRAM_SELECT)
    .order('order', { referencedTable: 'programs_dances', ascending: true });
  if (error) throw supabaseError(error);
  return data as Program[];
};

const getProgram = async (id: number) => {
  const { data, error } = await supabase.from('programs').select(PROGRAM_SELECT).eq('id', id).order('order', { referencedTable: 'programs_dances', ascending: true }).single();
  if (error) throw supabaseError(error);
  return data as Program;
};

const updateProgram = async (id: number, updates: ProgramUpdate) => {
  const { data, error } = await supabase.from('programs').update(updates).eq('id', id).select(PROGRAM_SELECT).order('order', { referencedTable: 'programs_dances', ascending: true }).single();
  if (error) throw supabaseError(error);
  return data as Program;
};

const createProgram = async (newProgram: ProgramInsert) => {
  const { data, error } = await supabase.from('programs').insert(newProgram).select(PROGRAM_SELECT).order('order', { referencedTable: 'programs_dances', ascending: true }).single();
  if (error) throw supabaseError(error);
  return data as Program;
};

const deleteProgram = async (id: number) => {
  const { error } = await supabase.from('programs').delete().eq('id', id);
  if (error) throw supabaseError(error);
};

registerMutator('programs', {
  insert: (record) => createProgram(record as ProgramInsert),
  update: (id, updates) => updateProgram(id, updates as ProgramUpdate),
  delete: deleteProgram,
});

const programLabel = (program: { date?: string | null }) => program.date ? formatLocalDate(program.date) : 'Untitled';


export const usePrograms = () => {
  return useQuery({
    queryKey: ['programs'],
    queryFn: getPrograms,
    select: (data: Program[]) => data.map(program => buildProgramsColumn(program)),
  })
};

export const useProgram = (id: number) => {
  return useQuery({
    queryKey: ['program', id],
    queryFn: () => getProgram(id),
    enabled: !!id,
    select: (data: Program) => buildProgramsColumn(data)
  })
};

export const useUpdateProgram = () => {
  const { toastError } = useNotify();
  const { pushAction } = useUndoActions();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: ProgramUpdate }) =>
      updateProgram(id, updates),
    onSuccess: (_, { id, updates }) => {
      const current = queryClient.getQueryData<Program>(['program', id]);
      queryClient.invalidateQueries({ queryKey: ['program', id] });
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['dances'] });
      queryClient.invalidateQueries({ queryKey: ['dance'] });
      if (current) {
        const keys = Object.keys(updates) as (keyof Program)[];
        recordUpdate(pushAction, 'programs', id, pick(current, keys), updates, `Edit Program: ${programLabel(current)}`);
      }
    },
    onError: (err: Error) => toastError(err.message || 'Error updating program')
  });
};

export const useCreateProgram = () => {
  const { toastError } = useNotify();
  const { pushAction } = useUndoActions();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newProgram: ProgramInsert) => createProgram(newProgram),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      recordInsert(pushAction, 'programs', omit(data, PROGRAM_JOIN_KEYS), `Create Program: ${programLabel(data)}`);
    },
    onError: (err: Error) => toastError(err.message || 'Error creating program')
  });
};

export const useDeleteProgram = () => {
  const { toastError } = useNotify();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number }) => deleteProgram(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['dances'] });
      queryClient.invalidateQueries({ queryKey: ['dance'] });
    },
    onError: (err: Error) => toastError(err.message || 'Error deleting program')
  });
};


// Helpers

const buildProgramsColumn = (program: Program) => ({
  ...program,
  danceNames: program.programs_dances.map(pd => pd.dance.title).join(', ')
});
