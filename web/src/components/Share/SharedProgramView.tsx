import { useParams } from 'react-router';
import { useEffect } from 'react';
import { Box, Divider, Typography } from '@mui/material';
import { Spinner } from '@/components/shared/Spinner';
import { FiguresList } from '@/components/Dances/FiguresList';
import { makeFiguresLabel } from '@/components/Dances/danceUtils';
import { formatLocalDate } from '@/lib/utils';
import { useSharedProgram } from '@/hooks/useShared';
import type { SharedProgramDance } from '@/lib/types/database';

const toDanceLike = (d: SharedProgramDance) => ({
  dance_type:  d.dance_type  ? { name: d.dance_type  } : null,
  formation:   d.formation   ? { name: d.formation   } : null,
  progression: d.progression ? { name: d.progression } : null,
});

export const SharedProgramView = () => {
  const { token } = useParams<{ token: string }>();
  const { data, isPending, isError } = useSharedProgram(token!);

  useEffect(() => {
    if (!data) return;
    const title = [data.date ? formatLocalDate(data.date) : null, data.location].filter(Boolean).join(' - ');
    document.title = title;
  }, [data]);

  if (isPending) return <Spinner />;
  if (isError)   return <Typography color='error' sx={{ p: 4 }}>Something went wrong loading this link.</Typography>;
  if (!data)     return <Typography color='text.secondary' sx={{ p: 4 }}>This link is not valid.</Typography>;

  const dances = data.dances ?? [];

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', px: 3, py: 4 }}>
      <Typography variant='h4' component='h1' sx={{ fontWeight: 600, lineHeight: 1.2 }}>
        {data.date ? formatLocalDate(data.date) : 'Program'}
      </Typography>
      {data.location && (
        <Typography variant='subtitle1' color='text.secondary' sx={{ mt: 0.5 }}>
          {data.location}
        </Typography>
      )}

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {dances.map(d => {
          const figuresLabel = makeFiguresLabel(toDanceLike(d));
          return (
            <Box key={d.order}>
              <Typography variant='h6' sx={{ fontWeight: 600 }}>
                {d.order}. {d.title}
              </Typography>
              {d.choreographers?.length ? (
                <Typography variant='body2' color='text.secondary'>
                  by {d.choreographers.join(', ')}
                </Typography>
              ) : null}
              {figuresLabel && (
                <Typography variant='overline' color='text.secondary' sx={{ display: 'block', mt: 0.5 }}>
                  {figuresLabel}
                </Typography>
              )}
              <Box sx={{ mt: 1 }}>
                {d.figures.length === 0 ? (
                  <Typography color='text.disabled'>No figures listed.</Typography>
                ) : (
                  <FiguresList figures={d.figures} />
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
