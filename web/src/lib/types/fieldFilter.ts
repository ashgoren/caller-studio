export type FieldRule = {
  id: string;
  type: 'field';
  field: string;
  operator: string;
  value: string;
};

export type FigureRule = {
  id: string;
  type: 'figure';
  phrase: string;       // '' = any phrase
  beats: number | null; // null = any beats
  description: string;  // '' = any description (contains match)
};

export type FilterRule = FieldRule | FigureRule;

export type FilterGroup = {
  id: string;
  combinator: 'and' | 'or';
  rules: (FilterRule | FilterGroup)[];
};

export type Field = { name: string; label: string; inputType: string };
