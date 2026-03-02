import { useRef } from 'react';
import { DragDropProvider } from '@dnd-kit/react';
import { move } from '@dnd-kit/helpers';
import { useSortable } from '@dnd-kit/react/sortable';
import { Box, TextField, IconButton, Button, Select, MenuItem, FormControl } from '@mui/material';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AddIcon from '@mui/icons-material/Add';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import type { FigureItem } from '@/lib/types/database';

const PHRASE_OPTIONS = ['A1', 'A2', 'B1', 'B2'];

type Props = {
  figures: FigureItem[];
  onAdd: () => void;
  onUpdate: (id: string, key: 'phrase' | 'beats' | 'description', value: string | number | null) => void;
  onDelete: (id: string) => void;
  onReorder: (figures: FigureItem[]) => void;
};

const Sortable = ({figure, index, onUpdate, onDelete}: {
  figure: FigureItem,
  index: number,
  onUpdate: Props['onUpdate'],
  onDelete: Props['onDelete']
}) => {
  const handleRef = useRef(null);
  const {ref} = useSortable({id: figure.id, index, handle: handleRef});
  return (
    <Box ref={ref} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      <DragIndicatorIcon ref={handleRef} sx={{ cursor: 'pointer' }} />
      <FormControl size='small' sx={{ width: 100 }}>
        <Select
          value={figure.phrase || 'A1'}
          onChange={(e) => onUpdate(figure.id, 'phrase', e.target.value)}
          sx={{ '& fieldset': { border: 'none' } }}
        >
          {PHRASE_OPTIONS.map(opt => (
            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField
        size='small'
        type='number'
        value={figure.beats ?? ''}
        onChange={(e) => onUpdate(figure.id, 'beats', e.target.value === '' ? null : Number(e.target.value))}
        variant='standard'
        sx={{ width: 60 }}
      />
      <TextField
        size='small'
        value={figure.description}
        onChange={(e) => onUpdate(figure.id, 'description', e.target.value)}
        fullWidth
        variant='standard'
        sx={{ ml: 1 }}
      />
      <Box sx={{ flex: 1 }} />
      <IconButton size='small' onClick={() => onDelete(figure.id)}>
        <RemoveCircleOutlineIcon fontSize='small' />
      </IconButton>
    </Box>
  );
};

export const FiguresEditor = ({ figures, onAdd, onUpdate, onDelete, onReorder }: Props) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <DragDropProvider
        onDragEnd={(event) => {
          if (event.canceled) return;
          onReorder(move(figures, event))}
        }
      >
        {figures.map((figure, index) => (
          <Sortable key={figure.id} figure={figure} index={index} onUpdate={onUpdate} onDelete={onDelete} />
        ))}
      </DragDropProvider>
      <Button
        startIcon={<AddIcon />}
        onClick={onAdd}
        size='small'
        variant='text'
        color='secondary'
        sx={{ alignSelf: 'flex-start' }}
      >
        Add Figure
      </Button>
    </Box>
  );
};
