import { lazy, Suspense } from 'react';
import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

const MarkdownEditor = lazy(() => import('@/components/shared/MarkdownEditor').then(m => ({ default: m.MarkdownEditor })));

export const WalkthroughEditDialog = ({ open, onClose, title, value, onChange }: {
  open: boolean;
  onClose: () => void;
  title: string | undefined;
  value: string;
  onChange: (v: string) => void;
}) => (
  <Dialog
    open={open}
    onClose={(_, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') onClose(); }}
    fullWidth
    maxWidth='md'
    PaperProps={{ sx: { height: '90vh' } }}
  >
    <DialogTitle>{title} • Walkthrough</DialogTitle>
    <DialogContent>
      <Suspense fallback={<CircularProgress size={24} />}>
        <MarkdownEditor
          label=''
          value={value}
          onChange={onChange}
          height='calc(90vh - 140px)'
          dragbar={false}
        />
      </Suspense>
      <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 1 }}>
        Changes are saved when you save the dance.
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Done</Button>
    </DialogActions>
  </Dialog>
);
