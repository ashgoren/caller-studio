export type FigureCriteria = {
  phrase: string;         // '' = any phrase
  beats: number | null;   // null = any beats
  description: string;    // '' = any, otherwise contains match
};

export type FigureMatcher = {
  type: 'single';
  criteria: FigureCriteria;
};

export type FigureFilterState = {
  combinator: 'and' | 'or';
  rules: FigureMatcher[];
};

export const emptyFigureCriteria: FigureCriteria = {
  phrase: '',
  beats: null,
  description: '',
};

export const defaultFigureFilterState: FigureFilterState = {
  combinator: 'and',
  rules: [],
};
