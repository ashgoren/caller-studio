import { lazy, Suspense } from 'react';
import { Box, Typography } from '@mui/material';

const RichTextEditor = lazy(() => import('./RichTextEditor').then(m => ({ default: m.RichTextEditor })));

export const NotesFieldset = ({ notes }: { notes: string | null }) => {
  if (!notes) return null;

  return (
    <Box component='fieldset' sx={{ mt: 3, border: 1, borderColor: 'divider', borderRadius: 1, px: 2, pt: 1, pb: 2 }}>
      <Typography
        component='legend'
        variant='caption'
        color='text.secondary'
        sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: 0.5, px: 0.5 }}
      >
        Notes
      </Typography>
      <Suspense fallback={null}>
        <RichTextEditor value={notes} editable={false} />
      </Suspense>
    </Box>
  );
};
