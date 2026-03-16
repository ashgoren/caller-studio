import { useEffect } from 'react';
import { Link as RouterLink } from 'react-router';
import { Box, Button, Divider, Link, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTitle } from '@/contexts/TitleContext';
import { formatLocalDate } from '@/lib/utils';
import type { Program, ProgramDance } from '@/lib/types/database';

const PHRASE_COL_WIDTH = 36;
const DANCE_COL_MIN_WIDTH = 200;

const makeFiguresLabel = (dance: ProgramDance) => [
  dance.dance_type?.name?.toLowerCase() !== 'contra' ? dance.dance_type?.name : null,
  dance.formation?.name
    ?.replace('Duple Minor - Improper', 'Improper')
    .replace('Duple Minor - Becket', 'Becket')
    .replace('Duple Minor - Becket CCW', 'Becket CCW'),
  dance.progression?.name && dance.progression.name.toLowerCase() !== 'single'
    ? `${dance.progression.name} progression`
    : null,
].filter(Boolean).join(' · ');

export const ProgramChoreographyView = ({ program, onBack }: { program: Program; onBack: () => void }) => {
  const { setTitle } = useTitle();
  useEffect(
    () => setTitle(`Choreography: ${program.date ? formatLocalDate(program.date) : 'unknown'}`),
    [setTitle, program.date],
  );

  const programDances = program.programs_dances; // already sorted by order from query

  const allPhrases = [...new Set(
    programDances.flatMap(pd => (pd.dance.figures ?? []).map(f => f.phrase)),
  )];

  return (
    <Box>

      {/* Nav */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, maxWidth: 900, mx: 'auto' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack} size='small' color='secondary'>
          {program.date ? formatLocalDate(program.date) : 'Program'}
        </Button>
      </Box>

      {/* Title */}
      <Box sx={{ mb: 2, maxWidth: 900, mx: 'auto' }}>
        <Typography variant='h4' component='h1' sx={{ fontWeight: 600, lineHeight: 1.2 }}>
          {program.date ? formatLocalDate(program.date) : 'No date'}
        </Typography>
        {program.location && (
          <Typography variant='subtitle1' color='text.secondary' sx={{ mt: 0.5 }}>
            {program.location}
          </Typography>
        )}
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Choreography grid */}
      <Box sx={{ overflowX: 'auto' }}>

        {/* Column headers */}
        <Box sx={{ display: 'flex', mb: 1, minWidth: PHRASE_COL_WIDTH + programDances.length * DANCE_COL_MIN_WIDTH }}>
          <Box sx={{ width: PHRASE_COL_WIDTH, flexShrink: 0 }} />
          {programDances.map(pd => (
            <Box
              key={pd.id}
              sx={{ flex: 1, minWidth: DANCE_COL_MIN_WIDTH, px: 1.5, borderLeft: '1px solid', borderColor: 'divider' }}
            >
              <Link
                component={RouterLink}
                to={`/dances/${pd.dance.id}`}
                variant='subtitle2'
                fontWeight={700}
                underline='hover'
                color='inherit'
              >
                {pd.order}. {pd.dance.title}
              </Link>
              {makeFiguresLabel(pd.dance) && (
                <Typography variant='overline' color='text.secondary' sx={{ lineHeight: 1.6, display: 'block' }}>
                  {makeFiguresLabel(pd.dance)}
                </Typography>
              )}
            </Box>
          ))}
        </Box>

        <Divider />

        {/* Phrase rows */}
        {allPhrases.length === 0 ? (
          <Typography color='text.disabled' sx={{ mt: 2 }}>No figures recorded for these dances.</Typography>
        ) : (
          allPhrases.map(phrase => (
            <Box
              key={phrase}
              sx={{
                display: 'flex',
                borderBottom: '1px solid',
                borderColor: 'divider',
                py: 1,
                minWidth: PHRASE_COL_WIDTH + programDances.length * DANCE_COL_MIN_WIDTH,
              }}
            >
              {/* Phrase label */}
              <Box sx={{ width: PHRASE_COL_WIDTH, flexShrink: 0, pt: '3px' }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: 'text.secondary' }}>
                  {phrase}
                </Typography>
              </Box>

              {/* Dance columns */}
              {programDances.map(pd => {
                const figures = (pd.dance.figures ?? []).filter(f => f.phrase === phrase);
                return (
                  <Box
                    key={pd.id}
                    sx={{ flex: 1, minWidth: DANCE_COL_MIN_WIDTH, px: 1.5, borderLeft: '1px solid', borderColor: 'divider' }}
                  >
                    {figures.length === 0 ? (
                      <Typography color='text.disabled' sx={{ fontSize: '0.875rem' }}>—</Typography>
                    ) : (
                      figures.map(fig => (
                        <Box key={fig.id} sx={{ display: 'flex', gap: 1, mt: 0.5, '&:first-of-type': { mt: 0 } }}>
                          <Typography sx={{ width: 30, flexShrink: 0, color: 'text.disabled', fontSize: '0.875rem' }}>
                            {fig.beats != null ? `(${fig.beats})` : ''}
                          </Typography>
                          <Typography sx={{ fontSize: '0.875rem' }}>{fig.description}</Typography>
                        </Box>
                      ))
                    )}
                  </Box>
                );
              })}
            </Box>
          ))
        )}
      </Box>

    </Box>
  );
};
