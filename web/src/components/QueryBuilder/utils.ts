import type { RuleGroupType } from 'react-querybuilder';

export const countActiveRules = (rules: RuleGroupType['rules']): number => {
  return rules.reduce((count, rule) => {
    if ('combinator' in rule) {
      return count + countActiveRules(rule.rules); // Recursive case: it's a group
    }
    return count + (rule.value !== '' && rule.value != null ? 1 : 0); // Base case: it's a rule, count if value is non-empty
  }, 0);
};
