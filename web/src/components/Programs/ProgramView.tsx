import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Box, Button, Divider, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { NotesFieldset, ShareLinkButton } from '@/components/shared';
import { RelationCell } from '@/components/RelationCell';
import { useTitle } from '@/contexts/TitleContext';
import { formatLocalDate } from '@/lib/utils';
import { ProgramHeaderLine } from './ProgramHeaderLine';
import type { Program } from '@/lib/types/database';

export const ProgramViewMode = ({ program, onEdit, onChoreography }: { program: Program; onEdit: () => void; onChoreography: () => void }) => {
  const navigate = useNavigate();
  const { setTitle } = useTitle();

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
          <ShareLinkButton kind='p' token={program.share_token} />
          <Tooltip title='Edit'>
            <IconButton onClick={onEdit} size='small'><EditIcon fontSize='small' /></IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Title */}
      <ProgramHeaderLine program={program} sx={{ mb: 2 }} />

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
              getSearchParams={() => `program=${program.id}`}
            />
          </Box>
        </Box>
      </Stack>

      <NotesFieldset notes={program.notes} />

    </Box>
  );
};
