import { Box, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { GroupBody } from './GroupBox';
import { AddRuleGroupButtons } from './AddRuleGroupButtons';
import type { FilterGroup, Field } from '@/lib/types/fieldFilter';

export const FilterSection = ({ fields, state, showFigures = false, onChange }: {
  fields: Field[];
  state: FilterGroup;
  showFigures?: boolean;
  onChange: (state: FilterGroup) => void;
}) => {
  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: state.rules.length ? 1 : 0 }}>
        <ToggleButtonGroup
          size='small'
          exclusive
          value={state.combinator}
          onChange={(_, value) => value && onChange({ ...state, combinator: value })}
        >
          <ToggleButton value='and' color='warning'>ALL</ToggleButton>
          <ToggleButton value='or' color='info'>ANY</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <GroupBody group={state} fields={fields} showFigures={showFigures} onChange={onChange} />

      <AddRuleGroupButtons rules={state.rules} onChange={rules => onChange({ ...state, rules })} gap={4} />
    </>
  );
};
