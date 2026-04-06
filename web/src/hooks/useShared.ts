import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { SharedDance, SharedProgram } from '@/lib/types/database';

export const useSharedDance = (token: string) =>
  useQuery({
    queryKey: ['shared-dance', token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_shared_dance', { token });
      if (error) throw new Error(error.message);
      return data as SharedDance | null;
    },
  });

export const useSharedProgram = (token: string) =>
  useQuery({
    queryKey: ['shared-program', token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_shared_program', { token });
      if (error) throw new Error(error.message);
      return data as SharedProgram | null;
    },
  });
