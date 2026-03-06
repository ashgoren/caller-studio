import { RelationCell } from '@/components/RelationCell';
import { formatLocalDate } from '@/lib/utils';
import type { MRT_ColumnDef } from 'material-react-table';
import type { Program, ProgramInsert } from '@/lib/types/database';

// NEW RECORD CONFIG

export const newRecord: ProgramInsert = {
  date: null,
  location: '',
}

// TABLE & DRAWER CONFIG

export const columns: MRT_ColumnDef<Program>[] = [
  {
    accessorKey: 'date',
    header: 'Date',
    filterVariant: 'date-range',
    columnFilterModeOptions: ['between', 'greaterThan', 'lessThan', 'equals'],
    size: 50,
    minSize: 50,
    Cell: ({row}) => row.original ? formatLocalDate(row.original.date!) : '',
    meta: { inputType: 'date' }
  },
  {
    accessorKey: 'location',
    header: 'Location',
    size: 60,
    minSize: 60,
    meta: { inputType: 'text' }
  },
  {
    id: 'dances',
    header: '🔗 Dances',
    size: 300,
    minSize: 100,
    Cell: ({row}) => <RelationCell
      items={row.original.programs_dances}
      model='dance'
      getId={(joinRow) => joinRow.dance.id}
      getLabel={(joinRow) => `${joinRow.order} - ${joinRow.dance.title}`}
    />,
    meta: { inputType: 'relation' },
  }
];

export const tableInitialState = {
  sorting: [{ id: 'date', desc: true }],
  density: 'compact' as const,
  pagination: { pageSize: 100, pageIndex: 0 }
};


// QUERY CONFIG

export const queryFields = [
  { name: 'date', label: 'Date', inputType: 'date' },
  { name: 'location', label: 'Location', inputType: 'string' },
  { name: 'danceNames', label: 'Dances', inputType: 'string' },
];

export const defaultQuery = {
  combinator: 'and',
  rules: []
};


