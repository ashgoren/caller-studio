import { supabase } from '@/lib/supabase';
import { parseDance } from '@/lib/callersBox';
import type { CallersBoxData } from '@/lib/types/callers-box';
import type { FigureItem } from '@/lib/types/database';

type LookupItem = { id: number; name: string };

export type ImportResult = {
  title: string;
  formation_id: number | null;
  progression_id: number | null;
  choreographerIds: number[];
  figures: FigureItem[];
};

export const fetchAndResolveImport = async (
  url: string,
  lookups: { formations: LookupItem[]; progressions: LookupItem[]; choreographers: LookupItem[] },
  createChoreographer: (name: string) => Promise<{ id: number }>
): Promise<ImportResult> => {
  const { data, error } = await supabase.functions.invoke('callers-box', { body: { url } });
  if (error) {
    const body = error.context instanceof Response
      ? await error.context.json().catch(() => null)
      : null;
    throw new Error(body?.msg ?? error.message);
  }

  const parsed = parseDance(data as CallersBoxData);

  const choreographerIds: number[] = [];
  for (const name of parsed.choreographers) {
    const existing = lookups.choreographers.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      choreographerIds.push(existing.id);
    } else {
      const created = await createChoreographer(name);
      choreographerIds.push(created.id);
    }
  }

  return {
    title: parsed.title,
    formation_id: lookups.formations.find(f => f.name.toLowerCase() === parsed.formation.toLowerCase())?.id ?? null,
    progression_id: lookups.progressions.find(p => p.name.toLowerCase() === parsed.progression?.toLowerCase())?.id ?? null,
    choreographerIds,
    figures: parsed.figures,
  };
};
