import { useNotify } from '@/hooks/useNotify';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const addDanceToProgram = async (programId: number, danceId: number, order: number) => {
  const { data, error } = await supabase
    .from('programs_dances')
    .insert({ program_id: programId, dance_id: danceId, order })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};

const removeDanceFromProgram = async (programId: number, danceId: number) => {
  const { data, error } = await supabase
    .from('programs_dances')
    .delete()
    .eq('program_id', programId)
    .eq('dance_id', danceId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};

export const useAddDanceToProgram = () => {
  const { toastError } = useNotify();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ programId, danceId, order }: { programId: number; danceId: number; order: number }) =>
      addDanceToProgram(programId, danceId, order),
    onSuccess: (_, { programId, danceId }) => {
      queryClient.invalidateQueries({ queryKey: ['program', programId] });
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['dance', danceId] });
      queryClient.invalidateQueries({ queryKey: ['dances'] });
      // success('Dance added to program');
    },
    onError: (err: Error) => toastError(err.message || 'Error adding dance to program')
  });
};

export const useRemoveDanceFromProgram = () => {
  const { toastError } = useNotify();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ programId, danceId }: { programId: number; danceId: number }) =>
      removeDanceFromProgram(programId, danceId),
    onSuccess: (_, { programId, danceId }) => {
      queryClient.invalidateQueries({ queryKey: ['program', programId] });
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['dance', danceId] });
      queryClient.invalidateQueries({ queryKey: ['dances'] });
      // success('Dance removed from program');
    },
    onError: (err: Error) => toastError(err.message || 'Error removing dance from program')
  });
};
