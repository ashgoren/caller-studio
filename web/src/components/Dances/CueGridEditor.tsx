import { useCallback, useMemo } from 'react';
import { Box } from '@mui/material';
import { SECTIONS, COLS, INTRO_COLS, CELL_HEIGHT, CELL_FONT_SIZE, cellKey } from './cueGridConstants';
import { CueColGroup } from './CueGrid';
import type { CueGridData } from '@/lib/types/database';

const CELL_PADDING = 2; // px around each <td>

// textarea height fills the fixed cell height minus cell padding on top and bottom
const TEXTAREA_HEIGHT = CELL_HEIGHT - CELL_PADDING * 2;

const textareaSx = {
  display: 'block',
  width: '100%',
  height: TEXTAREA_HEIGHT,
  textAlign: 'center',
  fontSize: CELL_FONT_SIZE, // matches view cellSx exactly
  lineHeight: 1.4,       // matches view cellSx exactly
  fontFamily: 'inherit',
  wordBreak: 'break-word', // matches view cellSx exactly — same wrap points
  color: 'text.primary',
  background: 'transparent',
  border: '1px solid transparent',
  borderRadius: '3px',
  outline: 'none',
  resize: 'none',
  overflow: 'hidden',
  py: '3px',
  px: '1px',  // cell(2px) + textarea(1px) + border(1px) = 4px per side = view's px:'4px'
  boxSizing: 'border-box',
  '&::placeholder': { color: 'text.disabled', opacity: 1 },
  '&:hover': { borderColor: 'divider' },
  '&:focus': { borderColor: 'primary.main', bgcolor: 'action.focus' },
} as const;

export const CueGridEditor = ({
  value,
  onChange,
}: {
  value: CueGridData | null;
  onChange: (v: CueGridData | null) => void;
}) => {
  const cues = useMemo(() => value ?? {}, [value]);

  const handleChange = useCallback(
    (section: string, row: number, col: number, text: string) => {
      const key = cellKey(section, row, col);
      const next = { ...cues };
      if (text) {
        next[key] = text;
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
        <Box
          component='textarea'
          value={cues[key] ?? ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            handleChange(section, row, col, e.target.value)
          }
          placeholder='•'
          sx={textareaSx}
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
