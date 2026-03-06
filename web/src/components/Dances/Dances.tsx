import { useState, useEffect, useMemo } from 'react';
import { Box, Fab, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router';
import { useTable } from '@/hooks/useTable';
import { useTitle } from '@/contexts/TitleContext';
import { MaterialReactTable } from 'material-react-table';
import { FilterButton } from '@/components/QueryBuilder/FilterButton';
import { countActiveRules } from '@/components/QueryBuilder/utils';
import { QueryBuilderComponent } from '@/components/QueryBuilder';
import { TableOverflowMenu } from '@/components/TableOverflowMenu';
import { Spinner, ErrorMessage } from '@/components/shared';
import { queryFields, defaultQuery, columns, tableInitialState } from './config';
import { useDances } from '@/hooks/useDances';
import { useFigureFilter } from '@/hooks/useFigureFilter';
import { evaluateFigureFilter } from '@/components/FigureFilter/figureFilterEvaluator';
import type { Dance } from '@/lib/types/database';

export const Dances = () => {
  const { setTitle } = useTitle();
  useEffect(() => setTitle('Dances'), [setTitle]);

  const navigate = useNavigate();

  const { data, error, isLoading } = useDances();
  const { figureFilter, setFigureFilter, clearFigureFilter, activeRuleCount: figureActiveRuleCount } = useFigureFilter();

  const filteredData = useMemo(
    () => (data ?? []).filter(dance => evaluateFigureFilter(dance.figures, figureFilter)),
    [data, figureFilter]
  );

  const { table, query, setQuery } = useTable<Dance>({
    model: 'dance',
    data: filteredData,
    columns,
    defaultQuery,
    tableInitialState,
    onRowClick: (row) => navigate(`/dances/${row.id}`)
  });

  const [filterOpen, setFilterOpen] = useState(countActiveRules(query.rules) + figureActiveRuleCount > 0);

  const onClearFilters = () => {
    setQuery(defaultQuery);
    clearFigureFilter();
    setFilterOpen(false);
  };

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <FilterButton
          onClick={() => setFilterOpen(prev => !prev)}
          activeRuleCount={countActiveRules(query.rules) + figureActiveRuleCount}
        />
        <TableOverflowMenu
          model='dance'
          onClearFilters={onClearFilters}
        />
      </Box>

      <QueryBuilderComponent
        fields={queryFields}
        defaultQuery={defaultQuery}
        query={query}
        onQueryChange={setQuery}
        filterOpen={filterOpen}
        setFilterOpen={setFilterOpen}
        figureFilter={figureFilter}
        onFigureFilterChange={setFigureFilter}
      />

      <MaterialReactTable table={table} />

      <Tooltip title='Add dance' placement='left'>
        <Fab
          color='secondary'
          onClick={() => navigate('/dances/new')}
          sx={{ position: 'fixed', bottom: 32, right: 32 }}
        >
          <AddIcon />
        </Fab>
      </Tooltip>
    </>
  );
};
