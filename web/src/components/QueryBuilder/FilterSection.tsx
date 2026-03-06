import { Box, Button, ToggleButton, ToggleButtonGroup } from '@mui/material';
import Add from '@mui/icons-material/Add';
import CreateNewFolder from '@mui/icons-material/CreateNewFolder';
import { GroupBody } from './GroupBox';
import { newFieldRule, newFilterGroup } from '@/lib/fieldFilter';
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

      <Box sx={{ display: 'flex', gap: 4, mt: state.rules.length ? 2 : 0 }}>
        <Button size='small' color='secondary' startIcon={<Add />} onClick={() => onChange({ ...state, rules: [...state.rules, newFieldRule()] })}>
          Add rule
        </Button>
        <Button size='small' color='secondary' startIcon={<CreateNewFolder />} onClick={() => onChange({ ...state, rules: [...state.rules, newFilterGroup()] })}>
          Add group
        </Button>
      </Box>
    </>
  );
};
