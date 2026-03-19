import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/react-query';
import type { User } from '@supabase/supabase-js';

export const useRealtimeSync = (user: User | null, paused: boolean) => {
  const pausedRef = useRef(paused);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  useEffect(() => {
    if (!user) return;

    const invalidate = () => { if (!pausedRef.current) queryClient.invalidateQueries(); };

    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dances', filter: `user_id=eq.${user.id}` }, invalidate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'programs', filter: `user_id=eq.${user.id}` }, invalidate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'choreographers', filter: `user_id=eq.${user.id}` }, invalidate)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);
};
