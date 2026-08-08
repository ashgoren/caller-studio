import { newFieldRule } from '@/lib/fieldFilter';
import type { FilterGroup } from '@/lib/types/fieldFilter';
import { ExternalLink } from '@/components/shared';
import { TooltipCell } from '@/components/TooltipCell';
import { RelationCell } from '@/components/RelationCell';
import { makeChoreographerNames } from './danceUtils';
import type { MRT_ColumnDef } from 'material-react-table'
import type { Dance, DanceInsert } from '@/lib/types/database';
import '@tanstack/react-table';
import { Tooltip } from '@mui/material';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';

// NEW RECORD CONFIG

export const newRecord: DanceInsert = {
  title: '',
  dance_type_id: null,
  formation_id: null,
  progression_id: null,
  difficulty: null,
  notes: '',
  walkthrough: '',
  place_in_program: '',
  url: '',
  figures: [],
  cues: null,
  calling_figures: null,
};


// TABLE & DRAWER CONFIG

export const columns: MRT_ColumnDef<Dance>[] = [
  {
    accessorKey: 'title',
    header: 'Title',
    Cell: ({ row }) => {
      const noFigures = !row.original.figures?.some(f => f.kind === 'figure');
      return (
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {row.original.title}
          {noFigures && (
            <Tooltip title="No figures" placement="right">
              <WarningAmberRoundedIcon sx={{ fontSize: 16, color: 'warning.main', flexShrink: 0 }} />
            </Tooltip>
          )}
        </span>
      );
    },
    size: 250,
    minSize: 100,
    meta: { inputType: 'text' },
  },
  {
    accessorKey: 'url',
    header: 'URL',
    enableColumnFilter: false,
    enableSorting: false,
    size: 120,
    minSize: 50,
    meta: { inputType: 'text' }
  },
  {
    id: 'choreographers',
    header: '🔗 Choreographers',
    enableColumnFilter: false,
    size: 200,
    minSize: 170,
    Cell: ({ row }) => makeChoreographerNames(row.original),
    meta: { inputType: 'relation' },
  },
  {
    id: 'figures',
    header: 'Figures',
    enableColumnFilter: false,
    enableSorting: false,
    Cell: ({ row }) => {
      const figures = row.original.figures ?? [];
      if (!figures.length) return null;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {figures.map((figure, index) => {
            if (figure.kind === 'note') {
              return (
                <div key={index} style={{ display: 'flex', gap: 8, fontStyle: 'italic', color: '#888' }}>
                  <span style={{ width: 52, flexShrink: 0 }} />
                  <span>{figure.text}</span>
                </div>
              );
            }
            return (
              <div key={index} style={{ display: 'flex', gap: 8 }}>
                <span style={{ width: 28, flexShrink: 0 }}>{figure.phrase}</span>
                <span style={{ width: 24, flexShrink: 0 }}>{figure.beats ?? ''}</span>
                <span dangerouslySetInnerHTML={{ __html: figure.description }} />
              </div>
            );
          })}
        </div>
      );
    },
    meta: { inputType: 'relation' },
  },
  {
    id: 'keyMoves',
    header: '🔗 Key Moves',
    enableColumnFilter: false,
    size: 170,
    minSize: 170,
    Cell: ({ row }) => row.original.dances_key_moves.map(dkm => dkm.key_move.name).join(', '),
    meta: { inputType: 'relation' },
  },
  {
    id: 'vibes',
    header: '🔗 Vibes',
    enableColumnFilter: false,
    size: 170,
    minSize: 170,
    Cell: ({ row }) => row.original.dances_vibes.map(dv => dv.vibe.name).join(', '),
    meta: { inputType: 'relation' },
  },
  {
    accessorKey: 'dance_type_id',
    header: 'Dance Type',
    Cell: ({ row }) => (row.original as Dance).dance_type?.name ?? '',
    enableColumnFilter: false,
    size: 175,
    minSize: 100,
    meta: { inputType: 'select' },
  },
  {
    accessorKey: 'formation_id',
    header: 'Formation',
    Cell: ({ row }) => (row.original as Dance).formation?.name?.replace('Duple Minor - Improper', 'Improper').replace('Duple Minor - Becket', 'Becket').replace('Duple Minor - Becket CCW', 'Becket CCW') ?? '',
    enableColumnFilter: false,
    size: 175,
    minSize: 100,
    meta: { inputType: 'select' },
  },
  {
    accessorKey: 'progression_id',
    header: 'Progression',
    Cell: ({ row }) => (row.original as Dance).progression?.name ?? '',
    enableColumnFilter: false,
    size: 175,
    minSize: 100,
    meta: { inputType: 'select' },
  },
  {
    id: 'programs',
    header: '🔗 Programs',
    enableColumnFilter: false,
    size: 300,
    minSize: 100,
    Cell: ({ row }) => <RelationCell
      items={row.original.programs_dances}
      model='program'
      getId={(joinRow) => joinRow.program.id}
      getLabel={(joinRow) => `${joinRow.program.date} - ${joinRow.program.location}`}
    />,
    meta: { inputType: 'relation' },
  },
  {
    accessorKey: 'difficulty',
    header: 'Difficulty',
    size: 150,
    minSize: 50,
    filterFn: 'equalsString',
    meta: { inputType: 'number' },
  },
  {
    accessorKey: 'notes',
    header: 'Notes',
    size: 300,
    minSize: 120,
    filterFn: 'includesString',
    Cell: ({ row }) => row.original.notes ? <TooltipCell content={row.original.notes} /> : null,
    muiTableBodyCellProps: {
      sx: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
    },
    meta: { inputType: 'text' }
  },
  {
    accessorKey: 'place_in_program',
    header: 'Place in Program',
    size: 250,
    minSize: 150,
    filterFn: 'includesString',
    Cell: ({ row }) => row.original.place_in_program ? <TooltipCell content={row.original.place_in_program} /> : null,
    meta: { inputType: 'text' }
  },
  {
    id: 'videos',
    header: 'Video',
    Cell: ({ row }) => row.original.dance_videos?.map(v => <span key={v.id}>{linkVideo(v.url, v.description)}</span>),
    enableColumnFilter: false,
    enableSorting: false,
    size: 120,
    minSize: 50,
    meta: { inputType: 'text' }
  },
  {
    accessorKey: 'created_at',
    header: 'Date Added',
    enableColumnFilter: false,
    Cell: ({ row }) => new Date(row.original.created_at).toISOString().split('T')[0],
    size: 170,
    minSize: 100,
    meta: { inputType: 'date', readonly: true },
  }
]

export const tableInitialState = {
  sorting: [{ id: 'created_at', desc: true }],
  columnPinning: { left: ['title'] },
  columnVisibility: {
    url: false,
    figures: false,
  },
  density: 'compact' as const,
  pagination: { pageSize: 100, pageIndex: 0 }
};


// QUERY CONFIG

export const queryFields = [
  { name: 'title', label: 'Title', inputType: 'string' },
  { name: 'choreographerNames', label: 'Choreographers', inputType: 'string' },
  { name: 'keyMoveNames', label: 'Key Moves', inputType: 'string' },
  { name: 'vibeNames', label: 'Vibes', inputType: 'string' },
  { name: 'dance_type', label: 'Dance Type', inputType: 'string' },
  { name: 'formation', label: 'Formation', inputType: 'string' },
  { name: 'progression', label: 'Progression', inputType: 'string' },
  { name: 'difficulty', label: 'Difficulty', inputType: 'number' },
  { name: 'notes', label: 'Notes', inputType: 'string' },
  { name: 'place_in_program', label: 'Place in Program', inputType: 'string' },
  { name: 'programNames', label: 'Programs', inputType: 'string' },
];

export const defaultQuery: FilterGroup = {
  id: 'root',
  combinator: 'and',
  rules: [newFieldRule()]
};


// HELPERS

// const linkTitle = (title: string, url?: string | null) =>
//   url ? <ExternalLink url={url} title={title} /> : title;

const linkVideo = (url: string, description: string | null) =>
  <ExternalLink url={url} title={description || 'Video'} />;
