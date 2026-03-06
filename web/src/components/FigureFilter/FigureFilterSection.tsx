import { Box, Button, Divider, IconButton, MenuItem, Select, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { emptyFigureCriteria } from '@/lib/types/figureFilter';
import type { FigureCriteria, FigureFilterState, FigureMatcher } from '@/lib/types/figureFilter';

const PHRASES = ['A1', 'A2', 'B1', 'B2'];

const CriteriaEditor = ({ criteria, onChange }: {
  criteria: FigureCriteria;
  onChange: (criteria: FigureCriteria) => void;
}) => (
  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flex: 1 }}>
    <Select
      size='small'
      value={criteria.phrase}
      onChange={e => onChange({ ...criteria, phrase: e.target.value })}
      displayEmpty
      sx={{ minWidth: 110 }}
    >
      <MenuItem value=''>Any phrase</MenuItem>
      {PHRASES.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
    </Select>
    <TextField
      size='small'
      type='number'
      placeholder='Beats'
      slotProps={{ input: { inputProps: { min: 0, max: 16 } } }}
      value={criteria.beats ?? ''}
      onChange={e => onChange({ ...criteria, beats: e.target.value === '' ? null : Number(e.target.value) })}
      sx={{ width: 90 }}
    />
    <TextField
      size='small'
      value={criteria.description}
      onChange={e => onChange({ ...criteria, description: e.target.value })}
      sx={{ flex: 1 }}
    />
  </Box>
);

export const FigureFilterSection = ({ state, onChange }: {
  state: FigureFilterState;
  onChange: (state: FigureFilterState) => void;
}) => {
  const updateRule = (index: number, matcher: FigureMatcher) => {
    const rules = [...state.rules];
    rules[index] = matcher;
    onChange({ ...state, rules });
  };

  const removeRule = (index: number) => {
    onChange({ ...state, rules: state.rules.filter((_, i) => i !== index) });
  };

  const addRule = () => {
    onChange({ ...state, rules: [...state.rules, { type: 'single' as const, criteria: { ...emptyFigureCriteria } }] });
  };

  return (
    <>
      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: state.rules.length ? 1 : 0 }}>
        <Typography variant='body2' sx={{ fontWeight: 500 }}>Figures</Typography>
        <ToggleButtonGroup
          size='small'
          exclusive
          value={state.combinator}
          onChange={(_, value) => value && onChange({ ...state, combinator: value })}
        >
          <ToggleButton value='and'>All (AND)</ToggleButton>
          <ToggleButton value='or'>Any (OR)</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {state.rules.map((rule, index) => (
          <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <CriteriaEditor
              criteria={rule.criteria}
              onChange={criteria => updateRule(index, { ...rule, criteria })}
            />
            <Tooltip title='Remove rule'>
              <IconButton size='small' onClick={() => removeRule(index)}>
                <DeleteIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          </Box>
        ))}
      </Box>

      <Button
        size='small'
        startIcon={<AddIcon />}
        onClick={addRule}
        sx={{ mt: state.rules.length ? 1 : 0 }}
      >
        Add figure rule
      </Button>
    </>
  );
};
