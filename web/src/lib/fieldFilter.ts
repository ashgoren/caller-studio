import type { FilterGroup, FilterRule, FigureRule } from '@/lib/types/fieldFilter';

export const isFilterGroup = (item: FilterRule | FilterGroup): item is FilterGroup => 'rules' in item;
export const isFigureRule = (item: FilterRule | FilterGroup): item is FigureRule => !('rules' in item) && item.type === 'figure';

export const newFieldRule = () => ({ id: crypto.randomUUID(), type: 'field' as const, field: '', operator: '=', value: '' });
export const newFigureRule = () => ({ id: crypto.randomUUID(), type: 'figure' as const, negate: false, phrase: '', beats: null as number | null, description: '' });
export const newFilterGroup = (): FilterGroup => ({ id: crypto.randomUUID(), combinator: 'and', rules: [] });
export const emptyFilter = (): FilterGroup => ({ id: 'root', combinator: 'and', rules: [] });
