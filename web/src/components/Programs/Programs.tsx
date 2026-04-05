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
import { usePrograms } from '@/hooks/usePrograms';
import type { Program } from '@/lib/types/database';

export const Programs = () => {
  const { setTitle } = useTitle();
  useEffect(() => setTitle('Programs'), [setTitle]);

  const navigate = useNavigate();

  const { data, error, isLoading } = usePrograms();
  const { table, query, setQuery } = useTable<Program>({
    model: 'program',
    data,
    columns,
    defaultQuery,
    tableInitialState,
    onRowClick: (row, e) => {
      if (e.metaKey || e.ctrlKey) window.open(`/programs/${row.id}`, '_blank');
      else navigate(`/programs/${row.id}`);
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
          model='program'
          onClearFilters={onClearFilters}
        />
      </Box>

      <QueryBuilderComponent
        fields={queryFields}
        query={query}
        onQueryChange={setQuery}
        filterOpen={filterOpen}
      />

      <MaterialReactTable table={table} />

      <Tooltip title='Add program' placement='left'>
        <Fab
          color='secondary'
          onClick={() => navigate('/programs/new')}
          sx={{ position: 'fixed', bottom: 32, right: 32 }}
        >
          <AddIcon />
        </Fab>
      </Tooltip>
    </>
  );
};
