import type { FigureCriteria, FigureFilterState, FigureMatcher } from '@/lib/types/figureFilter';
import type { FigureItem } from '@/lib/types/database';

const matchesCriteria = (figure: FigureItem, criteria: FigureCriteria): boolean => {
  if (criteria.phrase && figure.phrase !== criteria.phrase) return false;
  if (criteria.beats !== null && figure.beats !== criteria.beats) return false;
  if (criteria.description && !figure.description.toLowerCase().includes(criteria.description.toLowerCase())) return false;
  return true;
};

const evaluateMatcher = (figures: FigureItem[], matcher: FigureMatcher): boolean => {
  return figures.some(f => matchesCriteria(f, matcher.criteria));
};

export const evaluateFigureFilter = (figures: FigureItem[], state: FigureFilterState): boolean => {
  if (!state.rules.length) return true;
  const results = state.rules.map(rule => evaluateMatcher(figures, rule));
  return state.combinator === 'and' ? results.every(Boolean) : results.some(Boolean);
};
