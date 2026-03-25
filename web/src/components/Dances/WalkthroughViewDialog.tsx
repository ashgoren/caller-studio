import { useCallback, useRef } from 'react';
import { Box, Dialog, DialogContent, IconButton, Tooltip, Typography, useMediaQuery } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
import Markdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { useReactToPrint } from 'react-to-print';
import { PAGE_STYLE_WALKTHROUGH } from './printStyles';
import { FiguresList } from './FiguresList';
import { makeFiguresLabel } from './danceUtils';
import type { Dance } from '@/lib/types/database';

// Page content area: 8.5in - 2×0.4in margin = 7.7in × 10.2in, at 96px/in
const PRINT_W = 7.7 * 96;
const PRINT_H = 10.2 * 96;

export const WalkthroughViewDialog = ({ open, onClose, dance }: {
  open: boolean;
  onClose: () => void;
  dance: Dance;
}) => {
  const isNarrow = useMediaQuery('(max-width: 900px)');
  const walkthroughPrintRef = useRef<HTMLDivElement>(null);

  const onBeforePrint = useCallback((): Promise<void> => new Promise(resolve => {
    const el = walkthroughPrintRef.current;
    if (!el) { resolve(); return; }
    const clone = el.cloneNode(true) as HTMLElement;
    clone.style.cssText = `position:fixed;top:-9999px;left:0;width:${PRINT_W}px;visibility:hidden;`;
    document.body.appendChild(clone);
    const h = clone.scrollHeight;
    document.body.removeChild(clone);
    if (h > PRINT_H) el.style.zoom = String(PRINT_H / h);
    resolve();
  }), []);

  const onAfterPrint = useCallback(() => {
    if (walkthroughPrintRef.current) walkthroughPrintRef.current.style.zoom = '';
  }, []);

  const printWalkthrough = useReactToPrint({ contentRef: walkthroughPrintRef, documentTitle: `${dance.title} - Walkthrough`, pageStyle: PAGE_STYLE_WALKTHROUGH, onBeforePrint, onAfterPrint });

  const figuresLabel = makeFiguresLabel(dance);
  const callingFigures = (dance.calling_figures && dance.calling_figures.length > 0)
    ? dance.calling_figures
    : (dance.figures && dance.figures.length > 0 ? dance.figures : null);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth={(callingFigures && !isNarrow) ? 'xl' : 'md'} fullScreen={isNarrow}>
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: isNarrow ? '100%' : undefined }}>
        <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 0.5, zIndex: 1 }}>
          {!isNarrow && (
            <Tooltip title='Print'>
              <IconButton size='small' onClick={() => printWalkthrough()}><PrintIcon fontSize='small' /></IconButton>
            </Tooltip>
          )}
          <Tooltip title='Close'>
            <IconButton size='small' onClick={onClose}><CloseIcon fontSize='small' /></IconButton>
          </Tooltip>
        </Box>
        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: (callingFigures && !isNarrow) ? { xs: 'column', md: 'row' } : 'row' }}>
          {callingFigures && !isNarrow && (
            <Box sx={{ flex: 1, overflowY: 'auto', p: 2, borderRight: { md: 1 }, borderBottom: { xs: 1, md: 0 }, borderColor: 'divider', minWidth: 0 }}>
              <FiguresList figures={callingFigures} />
            </Box>
          )}
          <Box ref={walkthroughPrintRef} sx={{ flex: 2, overflowY: 'auto', p: 3, pr: (callingFigures && !isNarrow) ? 3 : 8, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 2, pr: (callingFigures && !isNarrow) ? 6 : 0 }}>
              <Typography variant='h5' className='print-dance-title' sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                {dance.title}
              </Typography>
              {figuresLabel && (
                <Typography variant='body2' color='text.secondary'>{figuresLabel}</Typography>
              )}
            </Box>
            <Box sx={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: { xs: '0.9rem', sm: '1.05rem' },
              lineHeight: 1.7,
              '& p': { margin: '0 0 1em 0' },
              '& p:last-child': { marginBottom: 0 },
              '& h1': { fontSize: { xs: '1.3rem', sm: '1.6rem' }, fontWeight: 700, mt: 0, mb: '0.4em' },
              '& h2': { fontSize: { xs: '1.15rem', sm: '1.35rem' }, fontWeight: 700, mt: 0, mb: '0.4em' },
              '& h3': { fontSize: { xs: '1rem', sm: '1.15rem' }, fontWeight: 700, mt: 0, mb: '0.4em' },
              '& ul, & ol': { pl: '1.4em', mb: '1em' },
              '& hr': { margin: '1.4em 0', borderColor: 'divider' },
            }}>
              <Markdown remarkPlugins={[remarkBreaks, remarkGfm]}>{dance.walkthrough ?? ''}</Markdown>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
