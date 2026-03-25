import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { Box, Dialog, DialogContent, IconButton, Tooltip, Typography, useMediaQuery } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
import { useReactToPrint } from 'react-to-print';
import { GRID_NATURAL_WIDTH, GRID_NATURAL_HEIGHT, CELL_HEIGHT } from './cueGridConstants';
import { CueGridView } from './CueGrid';
import { FiguresList } from './FiguresList';
import { makeFiguresLabel } from './danceUtils';
import { PrintCuesTable } from './DancePrintPortals';
import { PAGE_STYLE_CUES, PRINT_CUES_CARD } from './printStyles';
import type { Dance } from '@/lib/types/database';

export const CuesViewDialog = ({ open, onClose, dance }: {
  open: boolean;
  onClose: () => void;
  dance: Dance;
}) => {
  const isNarrow = useMediaQuery('(max-width: 900px)');
  const [windowWidth, setWindowWidth] = useState(() => window.innerWidth);
  const cuesScale = isNarrow ? Math.min(1, (windowWidth - 16) / GRID_NATURAL_WIDTH) : 1;

  useEffect(() => {
    const handler = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const cuesPrintRef = useRef<HTMLDivElement>(null);
  const printCues = useReactToPrint({ contentRef: cuesPrintRef, documentTitle: `${dance.title} - Cues`, pageStyle: PAGE_STYLE_CUES });

  const { cues, title } = dance;
  const hasCues = !!cues && Object.keys(cues).length > 0;
  const figuresLabel = makeFiguresLabel(dance);
  const choreographerNames = dance.dances_choreographers.map(dc => dc.choreographer.name).join(', ');
  const callingFigures = (dance.calling_figures && dance.calling_figures.length > 0)
    ? dance.calling_figures
    : (dance.figures && dance.figures.length > 0 ? dance.figures : null);

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth={callingFigures ? 'lg' : 'sm'} fullWidth={!!callingFigures} fullScreen={isNarrow} PaperProps={callingFigures && !isNarrow ? { sx: { maxHeight: '90vh' } } : undefined}>
        {isNarrow ? (
          /* Compact fullscreen: calling notes above (if present), then proportionally scaled cue grid */
          <DialogContent sx={{ p: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', flexShrink: 0, p: 0.5 }}>
              <Tooltip title='Close'>
                <IconButton size='small' onClick={onClose}><CloseIcon fontSize='small' /></IconButton>
              </Tooltip>
            </Box>
            <Box sx={{ overflow: 'hidden', height: GRID_NATURAL_HEIGHT * cuesScale, flexShrink: 0 }}>
              <Box sx={{ transform: `scale(${cuesScale})`, transformOrigin: 'top left', ml: '8px', width: GRID_NATURAL_WIDTH }}>
                <CueGridView cues={cues} />
              </Box>
            </Box>
          </DialogContent>
        ) : (
          /* Normal: toolbar header + content (side-by-side or stacked) */
          <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, px: 1, py: 0.5, flexShrink: 0 }}>
              <Tooltip title='Print cues'>
                <IconButton size='small' onClick={() => printCues()}><PrintIcon fontSize='small' /></IconButton>
              </Tooltip>
              <Tooltip title='Close'>
                <IconButton size='small' onClick={onClose}><CloseIcon fontSize='small' /></IconButton>
              </Tooltip>
            </Box>
            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: callingFigures ? { xs: 'column', md: 'row' } : 'row' }}>
              {callingFigures && (
                <Box sx={{ flex: 1, overflowY: 'auto', p: 2, minWidth: 0 }}>
                  <Box sx={{ height: CELL_HEIGHT, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', pt: 0.5 }}>
                    <Typography variant='h6' sx={{ fontWeight: 600, lineHeight: 1.2 }}>{dance.title}</Typography>
                    {figuresLabel && (
                      <Typography variant='body2' color='text.secondary' sx={{ mt: 0.25 }}>{figuresLabel}</Typography>
                    )}
                  </Box>
                  <FiguresList figures={callingFigures} />
                </Box>
              )}
              <Box sx={{ overflowY: 'auto', p: 2, flexShrink: 0 }}>
                <CueGridView cues={cues} />
              </Box>
            </Box>
          </DialogContent>
        )}
      </Dialog>

      {/* Standalone cues print — 5×7 */}
      {hasCues && createPortal(
        <div style={{ position: 'fixed', top: '-9999px', left: 0, width: 448 }}>
          <div ref={cuesPrintRef} style={{ background: 'white', color: 'black', fontFamily: '"Roboto","Helvetica","Arial",sans-serif', fontSize: '14px', lineHeight: 1.4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={{ fontSize: '17px', fontWeight: 'bold' }}>{title}</div>
              {figuresLabel && <div style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '12px' }}>{figuresLabel}</div>}
            </div>
            {choreographerNames && <div style={{ fontStyle: 'italic', marginBottom: '0.2em', fontSize: '12px' }}>by {choreographerNames}</div>}
            <hr style={{ border: 'none', borderTop: '1px solid black', margin: '0.2em 0 0.4em' }} />
            <PrintCuesTable cues={cues} {...PRINT_CUES_CARD} />
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
