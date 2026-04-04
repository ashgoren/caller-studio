import { useRef, useCallback, useLayoutEffect } from 'react';
import { DragDropProvider } from '@dnd-kit/react';
import { move } from '@dnd-kit/helpers';
import { useSortable } from '@dnd-kit/react/sortable';
import { Box, IconButton, Button, Select, MenuItem, FormControl, TextField } from '@mui/material';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AddIcon from '@mui/icons-material/Add';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import type { FigureItem } from '@/lib/types/database';

const PHRASE_OPTIONS = ['A1', 'A2', 'B1', 'B2'];

const isEmptyHtml = (html: string) => !html.replace(/<[^>]*>/g, '').trim();

const stripDefaultFontSize = (html: string): string => {
  const div = document.createElement('div');
  div.innerHTML = html;
  div.querySelectorAll('font[size="3"]').forEach(el => el.replaceWith(...el.childNodes));
  return div.innerHTML;
};

const DescriptionEditor = ({ value, onCommit }: { value: string; onCommit: (html: string) => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  const lastHtml = useRef<string | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (value !== lastHtml.current) {
      el.innerHTML = value;
      lastHtml.current = value;
    }
  }, [value]);

  const handleInput = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const normalized = isEmptyHtml(el.innerHTML) ? '' : stripDefaultFontSize(el.innerHTML);
    lastHtml.current = normalized;
    onCommit(normalized);
  }, [onCommit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); return; }
    if (!(e.metaKey || e.ctrlKey) || !e.shiftKey) return;
    if (e.key === '.' || e.key === '>') {
      e.preventDefault();
      const current = parseInt(document.queryCommandValue('fontSize') || '3', 10);
      document.execCommand('fontSize', false, String(Math.min(current + 1, 4)));
    } else if (e.key === ',' || e.key === '<') {
      e.preventDefault();
      const current = parseInt(document.queryCommandValue('fontSize') || '3', 10);
      document.execCommand('fontSize', false, String(Math.max(current - 1, 2)));
    }
  }, []);

  return (
    <Box
      ref={ref}
      component='div'
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      sx={{
        flex: 1,
        ml: 1,
        fontSize: '1rem',
        fontFamily: 'inherit',
        lineHeight: 1.5,
        outline: 'none',
        borderBottom: '1px solid',
        borderColor: 'transparent',
        '&:hover': { borderColor: 'text.disabled' },
        '&:focus': { borderColor: 'primary.main' },
        wordBreak: 'break-word',
        minWidth: 0,
      }}
    />
  );
};

type Props = {
  figures: FigureItem[];
  onAdd: () => void;
  onAddNote: () => void;
  onUpdate: (id: string, key: 'phrase' | 'beats' | 'description', value: string | number | null) => void;
  onUpdateNote: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onReorder: (figures: FigureItem[]) => void;
};

const Sortable = ({ figure, index, onUpdate, onUpdateNote, onDelete }: {
  figure: FigureItem,
  index: number,
  onUpdate: Props['onUpdate'],
  onUpdateNote: Props['onUpdateNote'],
  onDelete: Props['onDelete']
}) => {
  const handleRef = useRef(null);
  const { ref } = useSortable({ id: figure.id, index, handle: handleRef });

  if (figure.kind === 'note') {
    return (
      <Box ref={ref} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <DragIndicatorIcon ref={handleRef} sx={{ cursor: 'pointer' }} />
        <Box sx={{ width: 168, flexShrink: 0 }} />
        <DescriptionEditor
          value={figure.text}
          onCommit={(html) => onUpdateNote(figure.id, html)}
        />
        <IconButton size='small' onClick={() => onDelete(figure.id)}>
          <RemoveCircleOutlineIcon fontSize='small' />
        </IconButton>
      </Box>
    );
  }

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
      <DescriptionEditor
        value={figure.description}
        onCommit={(html) => onUpdate(figure.id, 'description', html)}
      />
      <IconButton size='small' onClick={() => onDelete(figure.id)}>
        <RemoveCircleOutlineIcon fontSize='small' />
      </IconButton>
    </Box>
  );
};

export const FiguresEditor = ({ figures, onAdd, onAddNote, onUpdate, onUpdateNote, onDelete, onReorder }: Props) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <DragDropProvider
        onDragEnd={(event) => {
          if (event.canceled) return;
          onReorder(move(figures, event));
        }}
      >
        {figures.map((figure, index) => (
          <Sortable key={figure.id} figure={figure} index={index} onUpdate={onUpdate} onUpdateNote={onUpdateNote} onDelete={onDelete} />
        ))}
      </DragDropProvider>
      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
        <Button
          startIcon={<AddIcon />}
          onClick={onAdd}
          size='small'
          variant='text'
          color='secondary'
        >
          Add Figure
        </Button>
        <Button
          startIcon={<AddIcon />}
          onClick={onAddNote}
          size='small'
          variant='text'
          color='secondary'
        >
          Add Note
        </Button>
      </Box>
    </Box>
  );
};
