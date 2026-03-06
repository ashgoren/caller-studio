import { isFilterGroup, isFigureRule } from '@/lib/fieldFilter';
import type { FilterGroup } from '@/lib/types/fieldFilter';

export const countActiveRules = (rules: FilterGroup['rules']): number => {
  return rules.reduce((count, rule) => {
    if (isFilterGroup(rule)) return count + countActiveRules(rule.rules);
    if (isFigureRule(rule)) return count + (rule.phrase !== '' || rule.beats !== null || rule.description !== '' ? 1 : 0);
    return count + (rule.value !== '' && rule.value != null ? 1 : 0);
  }, 0);
};
