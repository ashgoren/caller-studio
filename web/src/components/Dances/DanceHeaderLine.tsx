import { Box, Typography, type SxProps, type Theme } from '@mui/material';
import { makeFiguresLabel, makeChoreographerNames } from './danceUtils';
import type { Dance } from '@/lib/types/database';

// Single wrapping line: **Title** *by Choreographer* (Formation)
export const DanceHeaderLine = ({ dance, variant = 'h6', titleClassName, sx }: {
  dance: Dance;
  variant?: 'h5' | 'h6';
  titleClassName?: string;
  sx?: SxProps<Theme>;
}) => {
  const figuresLabel = makeFiguresLabel(dance);
  const choreographerNames = makeChoreographerNames(dance);

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 0.75, minWidth: 0, ...sx }}>
      <Typography variant={variant} component='span' className={titleClassName} sx={{ fontWeight: 700, lineHeight: 1.2 }}>
        {dance.title}
      </Typography>
      {choreographerNames && (
        <Typography variant='body2' component='span' color='text.secondary' sx={{ fontStyle: 'italic' }}>
          by {choreographerNames}
        </Typography>
      )}
      {figuresLabel && (
        <Typography variant='body2' component='span' color={figuresLabel !== 'Improper' ? 'text.primary' : 'text.secondary'} fontWeight={figuresLabel !== 'Improper' ? 700 : undefined}>
          ({figuresLabel})
        </Typography>
      )}
    </Box>
  );
};
