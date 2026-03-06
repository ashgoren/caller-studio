import { useState, useEffect } from 'react';
import { defaultFigureFilterState } from '@/lib/types/figureFilter';
import type { FigureFilterState } from '@/lib/types/figureFilter';

const STORAGE_KEY = 'dance_figure_filter';

const load = (): FigureFilterState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved) as FigureFilterState;
  } catch { /* fall through */ }
  return defaultFigureFilterState;
};

const countActiveMatchers = (state: FigureFilterState): number =>
  state.rules.filter(rule =>
    rule.criteria.phrase !== '' || rule.criteria.beats !== null || rule.criteria.description !== ''
  ).length;

export const useFigureFilter = () => {
  const [figureFilter, setFigureFilter] = useState<FigureFilterState>(load);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(figureFilter));
    }, 500);
    return () => clearTimeout(timer);
  }, [figureFilter]);

return {
    figureFilter,
    setFigureFilter,
    clearFigureFilter: () => setFigureFilter(defaultFigureFilterState),
    activeRuleCount: countActiveMatchers(figureFilter),
  };
};
