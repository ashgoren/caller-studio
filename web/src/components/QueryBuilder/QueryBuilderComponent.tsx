import { add } from 'react-querybuilder';
import { Box, Button, Collapse, Paper, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import Add from '@mui/icons-material/Add';
import CreateNewFolder from '@mui/icons-material/CreateNewFolder';
import { VisualQueryBuilder } from './VisualQueryBuilder';
import { FigureFilterSection } from '@/components/FigureFilter/FigureFilterSection';
import type { Field, RuleGroupType } from 'react-querybuilder';
import type { FigureFilterState } from '@/lib/types/figureFilter';

type QueryBuilderComponentProps = {
  fields: Field[];
  query: RuleGroupType;
  onQueryChange: (query: RuleGroupType) => void;
  filterOpen: boolean;
  figureFilter?: FigureFilterState;
  onFigureFilterChange?: (state: FigureFilterState) => void;
};

export const QueryBuilderComponent = ({ fields, query, onQueryChange, filterOpen, figureFilter, onFigureFilterChange }: QueryBuilderComponentProps) => {
  return (
    <Collapse in={filterOpen}>
      <Paper sx={{ mb: 2, p: 2, boxShadow: 3, borderRadius: 2, backgroundColor: 'action.hover' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant='body2' sx={{ fontWeight: 500 }}>Fields</Typography>
          <ToggleButtonGroup
            size='small'
            exclusive
            value={query.combinator}
            onChange={(_, value) => value && onQueryChange({ ...query, combinator: value })}
          >
            <ToggleButton value='and' color='warning'>ALL</ToggleButton>
            <ToggleButton value='or' color='info'>ANY</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <VisualQueryBuilder fields={fields} query={query} onQueryChange={onQueryChange} />

        <Box sx={{ display: 'flex', gap: 4, mt: query.rules.length ? 2 : 0 }}>
          <Button
            size='small'
            color='secondary'
            startIcon={<Add />}
            onClick={() => onQueryChange(add(query, { field: '', operator: '=', value: '' }, []))}
          >
            Add rule
          </Button>
          <Button
            size='small'
            color='secondary'
            startIcon={<CreateNewFolder />}
            onClick={() => onQueryChange(add(query, { combinator: 'and', rules: [] }, []))}
          >
            Add group
          </Button>
        </Box>

        {figureFilter && onFigureFilterChange &&
          <FigureFilterSection state={figureFilter} onChange={onFigureFilterChange} />
        }
      </Paper>
    </Collapse>
  );
};
