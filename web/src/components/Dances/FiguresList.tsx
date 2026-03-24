import { Box, Typography } from '@mui/material';
import type { FigureItem } from '@/lib/types/database';

export const FiguresList = ({ figures }: { figures: FigureItem[] }) => (
  <Box>
    {figures.map((figure, i) => {
      const isNewPhrase = i === 0 || figure.phrase !== figures[i - 1].phrase;
      return (
        <Box key={figure.id} sx={{ display: 'flex', gap: 2, mt: isNewPhrase && i > 0 ? 2 : 0.5 }}>
          <Typography sx={{ width: 28, flexShrink: 0, fontWeight: 700, color: isNewPhrase ? 'text.secondary' : 'transparent', pt: '3px', userSelect: 'none' }}>
            {isNewPhrase ? figure.phrase : ''}
          </Typography>
          <Typography sx={{ width: 30, flexShrink: 0, color: 'text.disabled' }}>
            {figure.beats != null ? `(${figure.beats})` : ''}
          </Typography>
          <Typography dangerouslySetInnerHTML={{ __html: figure.description }} />
        </Box>
      );
    })}
  </Box>
);
