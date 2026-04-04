import { Box, Typography } from '@mui/material';
import type { FigureItem } from '@/lib/types/database';

export const FiguresList = ({ figures }: { figures: FigureItem[] }) => (
  <Box>
    {figures.map((figure, i) => {
      if (figure.kind === 'note') {
        return (
          <Box key={figure.id} sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
            <Box sx={{ width: 28, flexShrink: 0 }} />
            <Box sx={{ width: 30, flexShrink: 0 }} />
            <Typography dangerouslySetInnerHTML={{ __html: figure.text }} />
          </Box>
        );
      }

      // Find the phrase of the previous figure-kind item (skip over notes)
      let prevFigurePhrase: string | null = null;
      for (let j = i - 1; j >= 0; j--) {
        const prev = figures[j];
        if (prev.kind === 'figure') { prevFigurePhrase = prev.phrase; break; }
      }
      const isNewPhrase = prevFigurePhrase === null || figure.phrase !== prevFigurePhrase;

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
