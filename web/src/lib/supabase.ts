import { createClient } from '@supabase/supabase-js'

const { VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY } = import.meta.env

export const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY);

try {
  const { data, error } = await supabase.functions.invoke('hello-world', {
    body: { name: 'Wombat' },
  })
  if (error) throw error;
  console.log(data);
} catch (e) {
  console.log(e);
}
