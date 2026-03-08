import { supabase } from '@/lib/supabase';
import type { FigureItem } from '@/lib/types/database';
import type { CallersBoxData } from '@/lib/types/callers-box';

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
  lookups: { formations: LookupItem[]; progressions: LookupItem[]; choreographers: LookupItem[] }
): Promise<ImportResult> => {
  const { data, error } = await supabase.functions.invoke('callers-box', { body: { url } });
  if (error) throw error;

  const { Name, Authors, FormationBase, Direction, Progression, phrases } = data as CallersBoxData;

  // Special case for Becket CCW, which is listed separately in our formations
  const formation = FormationBase === 'Duple Minor - Becket' && Direction === 'CCW' ? 'Duple Minor - Becket CCW' : FormationBase;

  return {
    title: Name,
    formation_id: lookups.formations.find(f => f.name.toLowerCase() === formation.toLowerCase())?.id ?? null,
    progression_id: lookups.progressions.find(p => p.name.toLowerCase() === Progression?.toLowerCase())?.id ?? null,
    choreographerIds: Authors
      .map(author => lookups.choreographers.find(c => c.name.toLowerCase() === author.toLowerCase())?.id)
      .filter((id): id is number => id !== undefined),
    figures: parsePhrases(phrases),
  };
};

export const parsePhrases = (phrases: { name: string; figures: string[] }[]): FigureItem[] => {
  const result: FigureItem[] = [];
  for (const { name: phrase, figures } of phrases) {
    for (const figure of figures) {
      const match = figure.match(/^\((\d+)\) (.+)$/);
      if (!match) throw new Error(`Unrecognized figure format: ${figure}`);
      const [, beats, description] = match;
      result.push({ id: crypto.randomUUID(), phrase, beats: Number(beats), description: normalizeRoles(description) });
    }
  }
  return result;
};

const normalizeRoles = (description: string): string => {
  // Replace full words first
  let result = description
    .replace(/\b(Men|men|Gents|gents)\b/g, match => match[0] === match[0].toUpperCase() ? 'Larks' : 'larks')
    .replace(/\b(Ladies|ladies|Women|women)\b/g, match => match[0] === match[0].toUpperCase() ? 'Robins' : 'robins');

  // Replace role-pair abbreviations inside semicolon-delimited parenthetical groups
  // e.g. (PR;WL;NR;ML) → (PR;RL;NR;LL)
  // Only matches 2-letter codes where first letter is W or M followed by a second uppercase letter
  result = result.replace(/\(([^)]*;[^)]*)\)/g, segment =>
    segment.replace(/\b([WM])([A-Z])\b/g, (_, role, pos) =>
      (role === 'W' ? 'R' : 'L') + pos
    )
  );

  return result;
};

export const isValidUrl = (url: string): boolean => {
  return /^https:\/\/www\.ibiblio\.org\/contradance\/thecallersbox\/dance\.php\?id=\d+$/.test(url);
};
