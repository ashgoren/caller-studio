import { Box, Button } from '@mui/material';
import Add from '@mui/icons-material/Add';
import CreateNewFolder from '@mui/icons-material/CreateNewFolder';
import { newFieldRule, newFilterGroup } from '@/lib/fieldFilter';
import type { FilterGroup, FilterRule } from '@/lib/types/fieldFilter';

export const AddRuleGroupButtons = ({ rules, onChange, gap = 2 }: {
  rules: (FilterRule | FilterGroup)[];
  onChange: (rules: (FilterRule | FilterGroup)[]) => void;
  gap?: number;
}) => (
  <Box sx={{ display: 'flex', gap, mt: rules.length ? 2 : 0 }}>
    <Button size='small' color='secondary' startIcon={<Add />} onClick={() => onChange([...rules, newFieldRule()])}>
      Add rule
    </Button>
    <Button size='small' color='secondary' startIcon={<CreateNewFolder />} onClick={() => onChange([...rules, newFilterGroup()])}>
      Add group
    </Button>
  </Box>
);
