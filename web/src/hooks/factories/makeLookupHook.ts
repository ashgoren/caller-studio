import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Read-only lookup tables (dance_types, formations, progressions): global, seeded via
// migrations, no mutations from the app. Identical shape across entities — only the
// table name and row type differ.
export function makeLookupHook<TRow>(table: string, orderColumn = 'sort_order') {
  return function useLookup() {
    return useQuery({
      queryKey: [table],
      queryFn: async () => {
        const { data, error } = await supabase.from(table).select('*').order(orderColumn, { ascending: true });
        if (error) throw new Error(error.message);
        return data as TRow[];
      },
    });
  };
}
