import { Collapse, Paper } from '@mui/material';
import { FilterSection } from './FilterSection';
import type { FilterGroup, Field } from '@/lib/types/fieldFilter';

type QueryBuilderComponentProps = {
  fields: Field[];
  query: FilterGroup;
  onQueryChange: (query: FilterGroup) => void;
  filterOpen: boolean;
  showFigures?: boolean;
};

export const QueryBuilderComponent = ({ fields, query, onQueryChange, filterOpen, showFigures }: QueryBuilderComponentProps) => {
  const isOr = query.combinator === 'or';

  return (
    <Collapse in={filterOpen}>
      <Paper sx={{ mb: 2, p: 2, boxShadow: 3, borderRadius: 2, backgroundColor: 'action.hover', border: '1px solid', borderColor: isOr ? 'info.main' : 'warning.main' }}>
        <FilterSection fields={fields} state={query} showFigures={showFigures} onChange={onQueryChange} />
      </Paper>
    </Collapse>
  );
};
