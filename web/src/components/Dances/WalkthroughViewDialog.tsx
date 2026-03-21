import { useRef } from 'react';
import { Box, Dialog, DialogContent, IconButton, Tooltip, Typography, useMediaQuery } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
import Markdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { useReactToPrint } from 'react-to-print';
import { PAGE_STYLE_WALKTHROUGH } from './printStyles';
import type { Dance } from '@/lib/types/database';

export const WalkthroughViewDialog = ({ open, onClose, dance }: {
  open: boolean;
  onClose: () => void;
  dance: Dance;
}) => {
  const isNarrow = useMediaQuery('(max-width: 900px)');
  const walkthroughPrintRef = useRef<HTMLDivElement>(null);
  const printWalkthrough = useReactToPrint({ contentRef: walkthroughPrintRef, documentTitle: `${dance.title} - Walkthrough`, pageStyle: PAGE_STYLE_WALKTHROUGH });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='md' fullScreen={isNarrow}>
      <DialogContent sx={{ position: 'relative' }}>
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
        <Box ref={walkthroughPrintRef}>
          <Typography variant='h4' className='print-dance-title' sx={{ fontWeight: 600, mb: 2, pr: 8 }}>
            {dance.title}
          </Typography>
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
      </DialogContent>
    </Dialog>
  );
};
