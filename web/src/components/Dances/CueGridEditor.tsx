import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { Box } from '@mui/material';
import { SECTIONS, COLS, INTRO_COLS, CELL_HEIGHT, CELL_FONT_SIZE, cellKey } from './cueGridConstants';
import { CueColGroup } from './CueGrid';
import type { CueGridData } from '@/lib/types/database';

const CELL_PADDING = 2; // px around each <td>
const CONTENT_HEIGHT = CELL_HEIGHT - CELL_PADDING * 2;

const isEmptyHtml = (html: string) => !html.replace(/<[^>]*>/g, '').trim();

const editableSx = {
  display: 'block',
  width: '100%',
  height: CONTENT_HEIGHT,
  textAlign: 'center',
  fontSize: CELL_FONT_SIZE,
  lineHeight: 1.4,
  fontFamily: 'inherit',
  wordBreak: 'break-word',
  color: 'text.primary',
  background: 'transparent',
  border: '1px solid transparent',
  borderRadius: '3px',
  outline: 'none',
  overflow: 'hidden',
  py: '3px',
  px: '1px',  // cell(2px) + editable(1px) + border(1px) = 4px per side = view's px:'4px'
  boxSizing: 'border-box',
  cursor: 'text',
  '&[data-empty]::before': {
    content: '"•"',
    color: 'text.disabled',
    pointerEvents: 'none',
  },
  '&:hover': { borderColor: 'divider' },
  '&:focus': { borderColor: 'primary.main', bgcolor: 'action.focus' },
} as const;

const CueCell = ({ initialHtml, onCommit }: { initialHtml: string; onCommit: (html: string) => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  const lastHtml = useRef<string | null>(null);

  // Seed innerHTML on mount and sync external changes (e.g. reset), but skip
  // when the value echoes back from our own onCommit to avoid cursor jumps.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (initialHtml !== lastHtml.current) {
      el.innerHTML = initialHtml;
      lastHtml.current = initialHtml;
      if (initialHtml) el.removeAttribute('data-empty');
      else el.setAttribute('data-empty', '');
    }
  }, [initialHtml]);

  const handleInput = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const normalized = isEmptyHtml(el.innerHTML) ? '' : el.innerHTML;
    lastHtml.current = normalized;
    if (normalized) el.removeAttribute('data-empty');
    else el.setAttribute('data-empty', '');
    onCommit(normalized);
  }, [onCommit]);

  return (
    <Box
      ref={ref}
      component='div'
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      data-empty=''
      sx={editableSx}
    />
  );
};

export const CueGridEditor = ({
  value,
  onChange,
}: {
  value: CueGridData | null;
  onChange: (v: CueGridData | null) => void;
}) => {
  const cues = useMemo(() => value ?? {}, [value]);

  const handleChange = useCallback(
    (section: string, row: number, col: number, html: string) => {
      const key = cellKey(section, row, col);
      const next = { ...cues };
      if (html) {
        next[key] = html;
      } else {
        delete next[key];
      }
      onChange(Object.keys(next).length > 0 ? next : null);
    },
    [cues, onChange],
  );

  const renderCell = (section: string, row: number, col: number) => {
    const key = cellKey(section, row, col);
    return (
      <Box component='td' key={col} sx={{ p: `${CELL_PADDING}px`, height: CELL_HEIGHT }}>
        <CueCell
          initialHtml={cues[key] ?? ''}
          onCommit={(html) => handleChange(section, row, col, html)}
        />
      </Box>
    );
  };

  return (
    <Box>
      <Box sx={{ overflowX: 'auto', border: 1, borderColor: 'divider', borderRadius: 1, p: 1, width: 'fit-content', maxWidth: '100%' }}>
        <Box component='table' sx={{
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
        }}>
          <CueColGroup />
          <Box component='tbody'>
            {SECTIONS.flatMap((section) => {
              const labelCell = (
                <Box
                  component='td'
                  rowSpan={section.rows}
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    textAlign: 'center',
                    verticalAlign: 'top',
                    color: 'text.disabled',
                    userSelect: 'none',
                    pr: 4,
                    pt: 1
                  }}
                >
                  {section.label}
                </Box>
              );

              if (section.rows === 1) {
                return [(
                  <Box component='tr' key={`${section.id}:0`}>
                    {labelCell}
                    <Box component='td' colSpan={COLS - INTRO_COLS} />
                    {Array.from({ length: INTRO_COLS }, (_, i) =>
                      renderCell(section.id, 0, COLS - INTRO_COLS + i)
                    )}
                  </Box>
                )];
              }

              return [0, 1].map((row, rowIdx) => (
                <Box
                  key={`${section.id}:${row}`}
                  component='tr'
                  sx={rowIdx === 0 ? { '& td': { borderTop: '1px solid', borderColor: 'divider' } } : undefined}
                >
                  {rowIdx === 0 && labelCell}
                  {Array.from({ length: COLS }, (_, col) => renderCell(section.id, row, col))}
                </Box>
              ));
            })}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
