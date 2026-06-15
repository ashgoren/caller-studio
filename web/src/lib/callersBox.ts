type CallersBoxData = {
  Name: string; // e.g. "Becket in the Kitchen"
  Authors: string[]; // e.g. ["Becky Hill"]
  FormationBase: string; // e.g. "Duple Minor - Becket"
  FormationDetail: string;
  Progression: string; // e.g. "Single"
  Direction: string; // e.g. "CCW"
  Mixer?: string;
  PhraseStructure: string;
  phrases: { name: string; figures: string[] }[];
  CallingNotes: string[];
  // request: string; // the original URL query string
  // download_date: string; // ISO format
  // ID: string; // e.g. "17"
  // InterpretedBy: string[];
  // Permission: string; // e.g. "full"
  // Status: string;
  // BasedOn: string[];
  // Virtual?: string;
  // Music: string[];
  // Tunes: string[];
  // Appearances: { source: string; p: string }[];
  // OtherNames: string[];
  // Videos: string[];
  // VirtualVideos: string[];
  // VariantVideos: string[];
  // VariantVirtualVideos: string[];
};

export type FigureItem =
  | { id: string; kind: 'figure'; phrase: string; beats: number | null; description: string }
  | { id: string; kind: 'note'; text: string };

export type ParsedDance = {
  title: string;
  choreographers: string[];
  formation: string;
  progression: string;
  phraseStructure: string;
  figures: FigureItem[];
};

export const parseDance = (data: CallersBoxData): ParsedDance => {
  const { Name, Authors, FormationBase, Direction, Progression, PhraseStructure, phrases } = data;
  const formation = FormationBase === 'Duple Minor - Becket' && Direction === 'CCW'
    ? 'Duple Minor - Becket CCW'
    : FormationBase;
  return {
    title: Name,
    choreographers: Authors,
    formation,
    progression: Progression,
    phraseStructure: PhraseStructure,
    figures: parsePhrases(phrases),
  };
};

export const parsePhrases = (phrases: { name: string; figures: string[] }[]): FigureItem[] => {
  const result: FigureItem[] = [];
  for (const { name: phrase, figures } of phrases) {
    for (const figure of figures) {
      const match = figure.match(/^\((\d+)\) (.+)$/);
      if (match) {
        const [, beats, description] = match;
        result.push({
          id: crypto.randomUUID(),
          kind: 'figure',
          phrase,
          beats: Number(beats),
          description: normalizeRoles(description)
        });
      } else if (figure.trim()) {
        result.push({
          id: crypto.randomUUID(),
          kind: 'note',
          text: figure
        });
      }
    }
  }
  return result;
};

const normalizeRoles = (description: string): string => {
  let result = description
    .replace(/\b(Men|men|Gents|gents)\b/g, match => match[0] === match[0].toUpperCase() ? 'Larks' : 'larks')
    .replace(/\b(Ladies|ladies|Women|women)\b/g, match => match[0] === match[0].toUpperCase() ? 'Robins' : 'robins');
  // Replace role-pair abbreviations inside semicolon-delimited parenthetical groups
  // e.g. (PR;WL;NR;ML) → (PR;RL;NR;LL)
  result = result.replace(/\(([^)]*;[^)]*)\)/g, segment =>
    segment.replace(/\b([WM])([A-Z])\b/g, (_, role, pos) =>
      (role === 'W' ? 'R' : 'L') + pos
    )
  );
  return result;
};

export const isValidUrl = (url: string): boolean =>
  /ibiblio\.org\/contradance\/thecallersbox\/dance\.php\?id=\d+$/.test(url);
