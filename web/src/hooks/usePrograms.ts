import { useNotify } from '@/hooks/useNotify';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Program, ProgramInsert, ProgramUpdate } from '@/lib/types/database';

const PROGRAM_SELECT = '*, programs_dances(id, order, dance:dances(*, dance_type:dance_types(id, name), formation:formations(id, name), progression:progressions(id, name)))';

const getPrograms = async () => {
  const { data, error } = await supabase
    .from('programs')
    .select(PROGRAM_SELECT)
    .order('order', { referencedTable: 'programs_dances', ascending: true });
  if (error) throw new Error(error.message);
  return data as Program[];
};

const getProgram = async (id: number) => {
  const { data, error } = await supabase.from('programs').select(PROGRAM_SELECT).eq('id', id).order('order', { referencedTable: 'programs_dances', ascending: true }).single();
  if (error) throw new Error(error.message);
  return data as Program;
};

const updateProgram = async (id: number, updates: ProgramUpdate) => {
  const { data, error } = await supabase.from('programs').update(updates).eq('id', id).select(PROGRAM_SELECT).order('order', { referencedTable: 'programs_dances', ascending: true }).single();
  if (error) throw new Error(error.message);
  return data as Program;
};

const createProgram = async (newProgram: ProgramInsert) => {
  const { data, error } = await supabase.from('programs').insert(newProgram).select(PROGRAM_SELECT).order('order', { referencedTable: 'programs_dances', ascending: true }).single();
  if (error) throw new Error(error.message);
  return data as Program;
};

const deleteProgram = async (id: number) => {
  const { error } = await supabase.from('programs').delete().eq('id', id);
  if (error) throw new Error(error.message);
};


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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: ProgramUpdate }) =>
      updateProgram(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['program', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['dances'] });
      queryClient.invalidateQueries({ queryKey: ['dance'] });
    },
    onError: (err: Error) => toastError(err.message || 'Error updating program')
  });
};

export const useCreateProgram = () => {
  const { toastError } = useNotify();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newProgram: ProgramInsert) => createProgram(newProgram),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
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
