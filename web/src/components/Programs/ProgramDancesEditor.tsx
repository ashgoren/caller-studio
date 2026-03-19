import { useRef } from 'react';
import { DragDropProvider } from '@dnd-kit/react';
import { move } from '@dnd-kit/helpers';
import { useSortable } from '@dnd-kit/react/sortable';
import { Box, Typography, Autocomplete, TextField, IconButton } from '@mui/material';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import type { Dance } from '@/lib/types/database';
import type { DisplayDance } from '@/hooks/usePendingDanceList';

type Props = {
  orderedDances: DisplayDance[];
  allDances: Dance[];
  onAdd: (dance: Dance) => void;
  onRemove: (danceId: number) => void;
  onReorder: (newDances: DisplayDance[]) => void;
};

const SortableDanceItem = ({ dance, index, onRemove }: {
  dance: DisplayDance;
  index: number;
  onRemove: (danceId: number) => void;
}) => {
  const handleRef = useRef(null);
  const { ref } = useSortable({ id: String(dance.danceId), index, handle: handleRef });
  return (
    <Box
      ref={ref}
      sx={{
        display: 'flex',
        alignItems: 'center',
        py: 0.5,
        '&:not(:last-child)': { borderBottom: '1px solid', borderColor: 'divider' },
      }}
    >
      <DragIndicatorIcon ref={handleRef} sx={{ cursor: 'grab', color: 'text.secondary', mr: 1, flexShrink: 0 }} />
      <Typography variant='body2' sx={{ flex: 1 }}>{index + 1} — {dance.title}</Typography>
      <IconButton size='small' onClick={() => onRemove(dance.danceId)}>
        <RemoveCircleOutlineIcon fontSize='small' />
      </IconButton>
    </Box>
  );
};

export const ProgramDancesEditor = ({ orderedDances, allDances, onAdd, onRemove, onReorder }: Props) => {
  const usedIds = new Set(orderedDances.map(d => d.danceId));
  const availableDances = allDances
    .filter(d => !usedIds.has(d.id))
    .sort((a, b) => a.title.localeCompare(b.title));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
      <Typography variant='caption' color='text.secondary'>
        Dances
      </Typography>
      <DragDropProvider
        onDragEnd={(event) => {
          if (event.canceled) return;
          onReorder(move(orderedDances as any, event) as DisplayDance[]);
        }}
      >
        {orderedDances.map((dance, index) => (
          <SortableDanceItem key={dance.danceId} dance={dance} index={index} onRemove={onRemove} />
        ))}
      </DragDropProvider>
      <Autocomplete
        size='small'
        value={null}
        onChange={(_, value) => { if (value) onAdd(value); }}
        options={availableDances}
        getOptionLabel={dance => dance.title}
        renderInput={(params) => (
          <TextField {...params} placeholder='Add dance...' />
        )}
        sx={{ mt: 1 }}
      />
    </Box>
  );
};
