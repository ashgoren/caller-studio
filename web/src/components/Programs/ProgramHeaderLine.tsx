import { Box, Typography, type SxProps, type Theme } from '@mui/material';
import { formatLocalDate } from '@/lib/utils';
import type { Program } from '@/lib/types/database';

export const ProgramHeaderLine = ({ program, sx }: { program: Program; sx?: SxProps<Theme> }) => (
  <Box sx={sx}>
    <Typography variant='h4' component='h1' sx={{ fontWeight: 600, lineHeight: 1.2 }}>
      {program.date ? formatLocalDate(program.date) : 'No date'}
    </Typography>
    {program.location && (
      <Typography variant='subtitle1' color='text.secondary' sx={{ mt: 0.5 }}>
        {program.location}
      </Typography>
    )}
  </Box>
);
