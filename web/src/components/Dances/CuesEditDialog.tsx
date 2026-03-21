import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { CELL_HEIGHT, GRID_NATURAL_HEIGHT, GRID_NATURAL_WIDTH } from './cueGridConstants';
import { CueGridEditor } from './CueGridEditor';
import type { CueGridData, FigureItem } from '@/lib/types/database';

export const CuesEditDialog = ({ open, onClose, title, figuresLabel, figures, value, onChange }: {
  open: boolean;
  onClose: () => void;
  title: string | undefined;
  figuresLabel: string;
  figures: FigureItem[];
  value: CueGridData | null;
  onChange: (v: CueGridData | null) => void;
}) => {
  const [windowWidth, setWindowWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const handler = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  const cuesEditorScale = Math.min(1, (windowWidth - 96) / (GRID_NATURAL_WIDTH + 18));

  const figureGroups = useMemo(() => {
    const groups: { phrase: string; figures: FigureItem[] }[] = [];
    for (const figure of figures) {
      const last = groups[groups.length - 1];
      if (last && last.phrase === figure.phrase) last.figures.push(figure);
      else groups.push({ phrase: figure.phrase, figures: [figure] });
    }
    return groups;
  }, [figures]);

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') onClose(); }}
      fullWidth
      maxWidth='lg'
      PaperProps={{ sx: { height: '90vh' } }}
    >
      <DialogTitle sx={{ pb: figuresLabel ? 0.5 : undefined }}>
        {title || 'Edit Cues'}
        {figuresLabel && (
          <Typography variant='body2' color='text.secondary' sx={{ mt: 0.25 }}>
            {figuresLabel}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', gap: 3, overflow: { xs: 'auto', md: 'hidden' }, p: 2 }}>

        {/* Left: figures reference — hidden below ~1012px */}
        <Box sx={{ width: 340, flexShrink: 0, overflowY: 'auto', pr: 2, '@media (max-width: 1011px)': { display: 'none' } }}>
          {figures.length === 0 ? (
            <Typography color='text.disabled' variant='body2'>No figures added yet.</Typography>
          ) : (
            <Box sx={{ position: 'relative', height: GRID_NATURAL_HEIGHT + 18 }}>
              {figureGroups.map(({ phrase, figures: groupFigures }, phraseIdx) => (
                <Box key={phrase} sx={{ position: 'absolute', top: 15 + CELL_HEIGHT + phraseIdx * (CELL_HEIGHT * 2 + 1), left: 0, right: 0 }}>
                  {groupFigures.map((figure, figIdx) => (
                    <Box key={figure.id ?? figIdx} sx={{ display: 'flex', gap: 2, mt: figIdx > 0 ? 0.5 : 0 }}>
                      <Typography sx={{ width: 28, flexShrink: 0, fontWeight: 700, fontSize: '0.8rem', color: 'text.secondary', pt: '3px', userSelect: 'none' }}>
                        {figIdx === 0 ? phrase : ''}
                      </Typography>
                      <Typography sx={{ width: 30, flexShrink: 0, color: 'text.disabled', fontSize: '0.875rem' }}>
                        {figure.beats != null ? `(${figure.beats})` : ''}
                      </Typography>
                      <Typography variant='body2'>{figure.description}</Typography>
                    </Box>
                  ))}
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* Right: cue grid editor */}
        <Box sx={{ flex: 1, overflowY: { xs: 'visible', md: 'auto' }, overflowX: 'hidden', minWidth: 0 }}>
          <Box sx={{ transform: `scale(${cuesEditorScale})`, transformOrigin: 'top left', width: GRID_NATURAL_WIDTH + 18 }}>
            <CueGridEditor value={value} onChange={onChange} />
          </Box>
        </Box>

      </DialogContent>
      <DialogActions>
        <Typography variant='caption' color='text.secondary' sx={{ flex: 1, ml: 2 }}>
          Changes are saved when you save the dance.
        </Typography>
        <Button onClick={onClose}>Done</Button>
      </DialogActions>
    </Dialog>
  );
};
