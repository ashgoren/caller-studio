// Relies on generated types from database_generated.ts
// Regenerate with: supabase gen types typescript --local > database_generated.ts

import type { Database } from './database_generated';

type Tables = Database['public']['Tables'];

export type Model = 'dance' | 'program' | 'choreographer' | 'key_move' | 'vibe';
export type PrimaryModel = 'dance' | 'program';

export type DanceTypeRow = Tables['dance_types']['Row'];
export type FormationRow = Tables['formations']['Row'];
export type ProgressionRow = Tables['progressions']['Row'];

export type FigureItem =
  | { id: string; kind: 'figure'; phrase: string; beats: number | null; description: string }
  | { id: string; kind: 'note'; text: string };

export const isFigure = (item: FigureItem): item is Extract<FigureItem, { kind: 'figure' }> => item.kind === 'figure';

export type CueGridData = {
  cells: Record<string, string>;
  separators?: string[];
};

export type DanceRow = Tables['dances']['Row'];
export type DanceVideoRow = Tables['dance_videos']['Row'];
export type Dance = Omit<DanceRow, 'figures' | 'cues' | 'calling_figures'> & {
  figures: FigureItem[];
  calling_figures: FigureItem[] | null;
  cues: CueGridData | null;
  programs_dances: { id: number; order: number; program: ProgramRow }[];
  dances_choreographers: { id: number; choreographer: ChoreographerRow }[];
  dances_key_moves: { id: number; key_move: KeyMoveRow }[];
  dances_vibes: { id: number; vibe: VibeRow }[];
  dance_videos: DanceVideoRow[];
  dance_type: DanceTypeRow | null;
  formation: FormationRow | null;
  progression: ProgressionRow | null;
};
export type DanceInsert = Tables['dances']['Insert'];
export type DanceUpdate = Tables['dances']['Update'];

export type ProgramDance = Omit<DanceRow, 'figures'> & {
  figures: FigureItem[];
  dance_type: DanceTypeRow | null;
  formation: FormationRow | null;
  progression: ProgressionRow | null;
};

export type ProgramRow = Tables['programs']['Row'];
export type Program = ProgramRow & { programs_dances: { id: number; order: number; dance: ProgramDance }[] };
export type ProgramInsert = Tables['programs']['Insert'];
export type ProgramUpdate = Tables['programs']['Update'];

export type SharedDance = {
  title: string;
  choreographers: string[] | null;
  dance_type: string | null;
  formation: string | null;
  progression: string | null;
  figures: FigureItem[];
};

export type SharedProgramDance = {
  order: number;
  title: string;
  choreographers: string[] | null;
  dance_type: string | null;
  formation: string | null;
  progression: string | null;
  figures: FigureItem[];
};

export type SharedProgram = {
  location: string | null;
  date: string | null;
  dances: SharedProgramDance[];
};

export type ChoreographerRow = Tables['choreographers']['Row'];
export type Choreographer = ChoreographerRow & { dances_choreographers: { id: number }[] };
export type ChoreographerInsert = Tables['choreographers']['Insert'];
export type ChoreographerUpdate = Tables['choreographers']['Update'];

export type KeyMoveRow = Tables['key_moves']['Row'];
export type KeyMove = KeyMoveRow & { dances_key_moves: { id: number }[] };
export type KeyMoveInsert = Tables['key_moves']['Insert'];
export type KeyMoveUpdate = Tables['key_moves']['Update'];

export type VibeRow = Tables['vibes']['Row'];
export type Vibe = VibeRow & { dances_vibes: { id: number }[] };
export type VibeInsert = Tables['vibes']['Insert'];
export type VibeUpdate = Tables['vibes']['Update'];
