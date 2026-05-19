import { lazy, Suspense, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Box, Button, Divider, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LinkIcon from '@mui/icons-material/Link';
import { RelationCell } from '@/components/RelationCell';
import { useTitle } from '@/contexts/TitleContext';
import { useNotify } from '@/hooks/useNotify';
import { formatLocalDate } from '@/lib/utils';
import type { Program } from '@/lib/types/database';

const RichTextEditor = lazy(() => import('@/components/shared/RichTextEditor').then(m => ({ default: m.RichTextEditor })));

export const ProgramViewMode = ({ program, onEdit, onChoreography }: { program: Program; onEdit: () => void; onChoreography: () => void }) => {
  const navigate = useNavigate();
  const { setTitle } = useTitle();
  const { toastSuccess } = useNotify();

  useEffect(() => setTitle(`${program.date ? formatLocalDate(program.date) : 'unknown'}`), [setTitle, program.date]);

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>

      {/* Nav + actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Button color='secondary' startIcon={<ArrowBackIcon />} onClick={() => navigate('/programs')} size='small'>
          Programs
        </Button>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button size='small' variant='outlined' color='secondary' onClick={onChoreography}>
            Choreography
          </Button>
          <Tooltip title='Copy share link'>
            <IconButton size='small' onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/share/p/${program.share_token}`);
              toastSuccess('Share link copied', { undo: false });
            }}>
              <LinkIcon fontSize='small' />
            </IconButton>
          </Tooltip>
          <Tooltip title='Edit'>
            <IconButton onClick={onEdit} size='small'><EditIcon fontSize='small' /></IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Title */}
      <Box sx={{ mb: 2 }}>
        <Typography variant='h4' component='h1' sx={{ fontWeight: 600, lineHeight: 1.2 }}>
          {formatDate(program) || 'No date'}
        </Typography>
        {program.location && (
          <Typography variant='subtitle1' color='text.secondary' sx={{ mt: 0.5 }}>
            {program.location}
          </Typography>
        )}
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Stack spacing={2}>
        <Box>
          <Typography variant='overline' color='text.secondary'>Dances</Typography>
          <Box sx={{ mt: 0.5 }}>
            <RelationCell
              items={program.programs_dances}
              model='dance'
              getId={pd => pd.dance.id}
              getLabel={pd => `${pd.order} - ${pd.dance.title}`}
            />
          </Box>
        </Box>
      </Stack>

      {program.notes && (
        <Box component='fieldset' sx={{
          mt: 3,
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          px: 2,
          pt: 1,
          pb: 2,
        }}>
          <Typography
            component='legend'
            variant='caption'
            color='text.secondary'
            sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: 0.5, px: 0.5 }}
          >
            Notes
          </Typography>
          <Suspense fallback={null}>
            <RichTextEditor value={program.notes} editable={false} />
          </Suspense>
        </Box>
      )}

    </Box>
  );
};

const formatDate = (program: { date?: string | null }) =>
  program.date ? formatLocalDate(program.date) : '';
