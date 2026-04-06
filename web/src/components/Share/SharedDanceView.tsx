import { useParams } from 'react-router';
import { useEffect } from 'react';
import { Box, Divider, Typography } from '@mui/material';
import { Spinner } from '@/components/shared/Spinner';
import { FiguresList } from '@/components/Dances/FiguresList';
import { makeFiguresLabel } from '@/components/Dances/danceUtils';
import { useSharedDance } from '@/hooks/useShared';

export const SharedDanceView = () => {
  const { token } = useParams<{ token: string }>();
  const { data, isPending, isError } = useSharedDance(token!);

  useEffect(() => { if (data) document.title = data.title; }, [data]);

  if (isPending) return <Spinner />;
  if (isError)   return <Typography color='error' sx={{ p: 4 }}>Something went wrong loading this link.</Typography>;
  if (!data)     return <Typography color='text.secondary' sx={{ p: 4 }}>This link is not valid.</Typography>;

  const choreographerLine = data.choreographers?.length ? `by ${data.choreographers.join(', ')}` : null;
  const figuresLabel = makeFiguresLabel({
    dance_type: data.dance_type ? { name: data.dance_type } : null,
    formation:  data.formation  ? { name: data.formation  } : null,
    progression: data.progression ? { name: data.progression } : null,
  });

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', px: 3, py: 4 }}>
      <Typography variant='h4' component='h1' sx={{ fontWeight: 600, lineHeight: 1.2 }}>
        {data.title}
      </Typography>
      {choreographerLine && (
        <Typography variant='subtitle1' color='text.secondary' sx={{ mt: 0.5 }}>
          {choreographerLine}
        </Typography>
      )}

      <Divider sx={{ my: 3 }} />

      {figuresLabel && (
        <Typography variant='overline' color='text.secondary' sx={{ display: 'block', mb: 1 }}>
          {figuresLabel}
        </Typography>
      )}
      {data.figures.length === 0 ? (
        <Typography color='text.disabled'>No figures listed.</Typography>
      ) : (
        <FiguresList figures={data.figures} />
      )}
    </Box>
  );
};
