import { lazy, Suspense } from 'react';
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Typography, useMediaQuery } from '@mui/material';
import { FiguresList } from './FiguresList';
import type { FigureItem } from '@/lib/types/database';

const MarkdownEditor = lazy(() => import('@/components/shared/MarkdownEditor').then(m => ({ default: m.MarkdownEditor })));

export const WalkthroughEditDialog = ({ open, onClose, title, value, onChange, callingFigures }: {
  open: boolean;
  onClose: () => void;
  title: string | undefined;
  value: string;
  onChange: (v: string) => void;
  callingFigures: FigureItem[] | null;
}) => {
  const isNarrow = useMediaQuery('(max-width: 900px)');

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') onClose(); }}
      fullWidth
      maxWidth={callingFigures ? 'xl' : 'md'}
      PaperProps={{ sx: { height: '90vh' } }}
    >
      <DialogTitle>{title} • Walkthrough</DialogTitle>
      <DialogContent sx={{ display: 'flex', gap: 0, p: 0, overflow: 'hidden' }}>
        {callingFigures && (
          <Box sx={{
            flex: 1,
            overflowY: 'auto',
            p: 2,
            borderRight: { md: 1 },
            borderBottom: { xs: 1, md: 0 },
            borderColor: 'divider',
            minWidth: 0,
            display: isNarrow ? 'none' : undefined,
          }}>
            <FiguresList figures={callingFigures} />
          </Box>
        )}
        <Box sx={{ flex: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column', p: 2, minWidth: 0 }}>
          <Suspense fallback={<CircularProgress size={24} />}>
            <MarkdownEditor
              label=''
              value={value}
              onChange={onChange}
              height='calc(90vh - 160px)'
              dragbar={false}
            />
          </Suspense>
          <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 1 }}>
            Changes are saved when you save the dance.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Done</Button>
      </DialogActions>
    </Dialog>
  );
};
