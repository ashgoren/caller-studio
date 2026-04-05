import { useState, useMemo } from 'react';
import { usePersistState, loadPersistence } from './usePersistence';
import { useMaterialReactTable } from 'material-react-table';
import { evaluateQuery } from '@/components/QueryBuilder/queryEvaluator';
import type { FilterGroup } from '@/lib/types/fieldFilter';
import type { MRT_RowData, MRT_ColumnDef, MRT_TableOptions } from 'material-react-table';
import type { Model } from '@/lib/types/database';
import type React from 'react';

export const useTable = <TData extends MRT_RowData>({ model, data, columns, defaultQuery, tableInitialState, onRowClick }: {
  model: Model,
  data: TData[] | undefined,
  columns: MRT_ColumnDef<TData>[],
  defaultQuery : FilterGroup,
  tableInitialState: Partial<MRT_TableOptions<TData>>['initialState'],
  onRowClick?: (row: TData, event: React.MouseEvent) => void,
}) => {
  const [initialState] = useState(() =>
    loadPersistence(`mrt_${model}`, {
      query: defaultQuery,
      sorting: tableInitialState?.sorting ?? [],
      columnVisibility: tableInitialState?.columnVisibility ?? {},
      columnOrder: tableInitialState?.columnOrder ?? [],
      columnPinning: tableInitialState?.columnPinning ?? {},
      columnSizing: tableInitialState?.columnSizing ?? {},
      density: tableInitialState?.density ?? 'comfortable',
      pagination: tableInitialState?.pagination ?? { pageIndex: 0, pageSize: 50 }
    })
  );
  const [query, setQuery] = useState<FilterGroup>(initialState.query);
  const [sorting, setSorting] = useState(initialState.sorting);
  const [columnVisibility, setColumnVisibility] = useState(initialState.columnVisibility);
  const [columnOrder, setColumnOrder] = useState<string[]>(initialState.columnOrder);
  const [columnPinning, setColumnPinning] = useState(initialState.columnPinning);
  const [columnSizing, setColumnSizing] = useState(initialState.columnSizing);
  const [density, setDensity] = useState(initialState.density);
  const [pagination, setPagination] = useState(initialState.pagination);

  const filteredData = useMemo(
    () => (data ?? []).filter(row => evaluateQuery(row, query)),
    [data, query]
  );

  const tableState = { sorting, columnVisibility, columnOrder, columnPinning, columnSizing, density, pagination, query };

  usePersistState(`mrt_${model}`, { ...tableState, query });

  const table = useMaterialReactTable({
    columns,
    data: filteredData,
    state: tableState,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onColumnPinningChange: setColumnPinning,
    onColumnSizingChange: setColumnSizing,
    onDensityChange: setDensity,
    onPaginationChange: setPagination,
    enableColumnPinning: true,
    enableColumnOrdering: true,
    enableColumnFilterModes: false,
    enableColumnFilters: false,
    enableGlobalFilter: false,
    enableFilterMatchHighlighting: false,
    layoutMode: 'grid',
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    muiTableBodyRowProps: ({ row }) => ({
      onClick: (event) => onRowClick?.(row.original, event),
      sx: { cursor: onRowClick ? 'pointer' : 'default' }
    }),
    initialState: tableInitialState
  });

  return { table, query, setQuery };
};
