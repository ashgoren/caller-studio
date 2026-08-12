import { lazy, Suspense } from 'react';
import { Box } from '@mui/material';
import type { CueGridData } from '@/lib/types/database';
import { SECTIONS, COLS, INTRO_COLS, CELL_HEIGHT, CELL_FONT_SIZE, LABEL_WIDTH, COL_WIDTH, cellKey } from './cueGridConstants';

const RichTextEditor = lazy(() => import('@/components/shared/RichTextEditor').then(m => ({ default: m.RichTextEditor })));

// Shared column group — guarantees identical column widths in view and edit
export const CueColGroup = () => (
  <Box component='colgroup'>
    <Box component='col' sx={{ width: LABEL_WIDTH }} />
    {Array.from({ length: COLS }, (_, i) => (
      <Box key={i} component='col' sx={{ width: COL_WIDTH }} />
    ))}
  </Box>
);

const cellSx = {
  textAlign: 'center',
  fontSize: CELL_FONT_SIZE,
  lineHeight: 1.4,
  px: '4px',
  wordBreak: 'break-word',
  height: CELL_HEIGHT,
  verticalAlign: 'middle',
} as const;

const CueTableBody = ({ cues }: { cues: CueGridData }) => {
  const cells = cues.cells;
  const separators = new Set(cues.separators ?? []);
  return (
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
              color: 'text.secondary',
              userSelect: 'none',
              pr: 4,
              pt: 3.25
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
              {Array.from({ length: INTRO_COLS }, (_, i) => {
                const col = COLS - INTRO_COLS + i;
                const key = cellKey(section.id, 0, col);
                const text = cells[key];
                return (
                  <Box key={col} component='td' sx={{ ...cellSx, color: text ? 'text.primary' : 'text.disabled', ...(separators.has(key) && { borderRight: '3px solid', borderRightColor: 'divider' }) }}
                    dangerouslySetInnerHTML={{ __html: text ?? '•' }}
                  />
                );
              })}
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
            {Array.from({ length: COLS }, (_, col) => {
              const key = cellKey(section.id, row, col);
              const text = cells[key];
              return (
                <Box key={col} component='td' sx={{ ...cellSx, color: text ? 'text.primary' : 'text.disabled', ...(separators.has(key) && { borderRight: '3px solid', borderRightColor: 'divider' }) }}
                  dangerouslySetInnerHTML={{ __html: text ?? '•' }}
                />
              );
            })}
          </Box>
        ));
      })}
    </Box>
  );
};

export const CueNotesView = ({ notes, sx }: { notes?: string | null; sx?: object }) => {
  if (!notes) return null;
  return (
    <Box sx={{ mb: 2, ...sx }}>
      <Suspense fallback={null}>
        <RichTextEditor value={notes} editable={false} />
      </Suspense>
    </Box>
  );
};

export const CueGridView = ({ cues }: { cues: CueGridData | null }) => {
  if (!cues || Object.keys(cues.cells).length === 0) return null;

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Box component='table' sx={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <CueColGroup />
        <CueTableBody cues={cues} />
      </Box>
    </Box>
  );
};
