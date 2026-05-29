import { useState, useEffect } from 'react';
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
import type { Dance } from '@/lib/types/database';

export const Dances = () => {
  const { setTitle } = useTitle();
  useEffect(() => setTitle('Dances'), [setTitle]);

  const navigate = useNavigate();

  const { data, error, isLoading } = useDances();

  const { table, query, setQuery } = useTable<Dance>({
    model: 'dance',
    data,
    columns,
    defaultQuery,
    tableInitialState,
    onRowClick: (row, e) => {
      if (e.metaKey || e.ctrlKey) window.open(`/dances/${row.id}`, '_blank');
      else navigate(`/dances/${row.id}`);
    }
  });

  const [filterOpen, setFilterOpen] = useState(countActiveRules(query.rules) > 0);

  const onClearFilters = () => {
    setQuery(defaultQuery);
    setFilterOpen(false);
  };

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <FilterButton
          onClick={() => setFilterOpen(prev => !prev)}
          activeRuleCount={countActiveRules(query.rules)}
        />
        <TableOverflowMenu
          model='dance'
          onClearFilters={onClearFilters}
          onExport={() => {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'dances.json';
            a.click();
            URL.revokeObjectURL(url);
          }}
        />
      </Box>

      <QueryBuilderComponent
        fields={queryFields}
        query={query}
        onQueryChange={setQuery}
        filterOpen={filterOpen}
        showFigures
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
