import { useNotify } from '@/hooks/useNotify';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Dance, DanceInsert, DanceUpdate } from '@/lib/types/database';

const DANCE_SELECT = '*, programs_dances(id, order, program:programs(*)), dances_choreographers(id, choreographer:choreographers(*)), dances_key_moves(id, key_move:key_moves(*)), dances_vibes(id, vibe:vibes(*)), dance_type:dance_types(id, name, sort_order), formation:formations(id, name, sort_order), progression:progressions(id, name, sort_order)';

const getDances = async () => {
  const { data, error } = await supabase.from('dances').select(DANCE_SELECT);
  if (error) throw new Error(error.message);
  return data as Dance[];
};

const getDance = async (id: number) => {
  const { data, error } = await supabase.from('dances').select(DANCE_SELECT).eq('id', id).single();
  if (error) throw new Error(error.message);
  return data as Dance;
};

const updateDance = async (id: number, updates: DanceUpdate) => {
  const { data, error } = await supabase.from('dances').update(updates).eq('id', id).select(DANCE_SELECT).single();
  if (error) throw new Error(error.message);
  return data as Dance;
};

const createDance = async (newDance: DanceInsert) => {
  const { data, error } = await supabase.from('dances').insert(newDance).select(DANCE_SELECT).single();
  if (error) throw new Error(error.message);
  return data as Dance;
};

const deleteDance = async (id: number) => {
  const { error } = await supabase.from('dances').delete().eq('id', id);
  if (error) throw new Error(error.message);
};


export const useDances = () => {
  return useQuery({
    queryKey: ['dances'],
    queryFn: getDances,
    select: ((data: Dance[]) => data.map(buildRelationsColumns))
  });
};

export const useDance = (id: number) => {
  return useQuery({
    queryKey: ['dance', id],
    queryFn: () => getDance(id),
    enabled: !!id,
    select: (data: Dance) => buildRelationsColumns(data)
  })
};

export const useUpdateDance = () => {
  const { toastError } = useNotify();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: DanceUpdate }) =>
      updateDance(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dance', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dances'] });
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['program'] });
      queryClient.invalidateQueries({ queryKey: ['choreographers'] });
      queryClient.invalidateQueries({ queryKey: ['key_moves'] });
      queryClient.invalidateQueries({ queryKey: ['vibes'] });
    },
    onError: (err: Error) => toastError(err.message || 'Error updating dance')
  });
};

export const useCreateDance = () => {
  const { toastError } = useNotify();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newDance: DanceInsert) => createDance(newDance),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dances'] });
    },
    onError: (err: Error) => toastError(err.message || 'Error creating dance')
  });
};

export const useDeleteDance = () => {
  const { toastError } = useNotify();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number }) => deleteDance(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dances'] });
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['program'] });
      queryClient.invalidateQueries({ queryKey: ['choreographers'] });
      queryClient.invalidateQueries({ queryKey: ['key_moves'] });
      queryClient.invalidateQueries({ queryKey: ['vibes'] });
    },
    onError: (err: Error) => toastError(err.message || 'Error deleting dance')
  });
};


// Helpers

const buildRelationsColumns = (dance: Dance) => {
  const sortedPrograms = (dance.programs_dances ?? []).sort((a, b) => {
    const dateA = a.program?.date || '';
    const dateB = b.program?.date || '';
    return dateA.localeCompare(dateB);
  }).reverse();

  const sortedChoreographers = (dance.dances_choreographers ?? []).sort((a, b) => {
    const nameA = a.choreographer?.name || '';
    const nameB = b.choreographer?.name || '';
    return nameA.localeCompare(nameB);
  });

  const sortedKeyMoves = (dance.dances_key_moves ?? []).sort((a, b) => {
    const nameA = a.key_move?.name || '';
    const nameB = b.key_move?.name || '';
    return nameA.localeCompare(nameB);
  });

  const sortedVibes = (dance.dances_vibes ?? []).sort((a, b) => {
    const nameA = a.vibe?.name || '';
    const nameB = b.vibe?.name || '';
    return nameA.localeCompare(nameB);
  });

  return {
    ...dance,
    programs_dances: sortedPrograms,
    programNames: sortedPrograms.map(pd => `${pd.program.date} ${pd.program.location}`).join(' '),
    dances_choreographers: sortedChoreographers,
    choreographerNames: sortedChoreographers.map(dc => dc.choreographer.name).join(', '),
    dances_key_moves: sortedKeyMoves,
    keyMoveNames: sortedKeyMoves.map(dk => dk.key_move.name).join(', '),
    dances_vibes: sortedVibes,
    vibeNames: sortedVibes.map(dv => dv.vibe.name).join(', ')
  };
};
