import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link as RouterLink } from 'react-router';
import { Box, Button, Divider, IconButton, Link, Tooltip, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintIcon from '@mui/icons-material/Print';
import { useReactToPrint } from 'react-to-print';
import { formatLocalDate } from '@/lib/utils';
import { makeFiguresLabel } from '@/components/Dances/danceUtils';
import { ProgramHeaderLine } from './ProgramHeaderLine';
import type { Program } from '@/lib/types/database';
import { isFigure } from '@/lib/types/database';

const PHRASE_COL_WIDTH = 28;
const DANCE_COL_MIN_WIDTH = 200;

export const ProgramChoreographyView = ({ program, onBack }: { program: Program; onBack: () => void }) => {
  const programDances = program.programs_dances;

  // For contras this is usually just ['A1', 'A2', 'B1', 'B2']
  const allPhrases = [...new Set(
    programDances.flatMap(pd => (pd.dance.figures ?? []).filter(isFigure).map(f => f.phrase))
  )];

  const printRef = useRef<HTMLDivElement>(null);
  const printTitle = (() => {
    const parts: string[] = [];
    if (program.date) {
      const [year, month, day] = program.date.split('-').map(Number);
      parts.push(new Date(year, month - 1, day).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).replace(',', ''));
    }
    if (program.location) parts.push(program.location);
    parts.push('Choreography');
    return parts.join(' - ');
  })();
  const printChoreography = useReactToPrint({
    contentRef: printRef,
    documentTitle: printTitle,
    pageStyle: `
      @page { size: landscape; margin: 0.4in; }
      html, body { margin: 0; padding: 0; height: auto !important; overflow: visible !important; }
      body { font-family: Georgia, serif !important; font-size: 8pt !important; color: black !important; }
      * { color: black !important; font-family: Georgia, serif !important; box-sizing: border-box !important; }
      table { border-collapse: collapse !important; width: 100% !important; }
      th { font-size: 8pt !important; font-weight: bold !important; }
      td { font-size: 7.5pt !important; }
      .phrase-cell { font-weight: bold !important; font-size: 8pt !important; white-space: nowrap !important; text-align: center !important; }
    `,
  });

  return (
    <Box>

      {/* Nav */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, maxWidth: 900, mx: 'auto' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack} size='small' color='secondary'>
          Program
        </Button>
        {allPhrases.length > 0 && (
          <Tooltip title='Print choreography'>
            <IconButton size='small' onClick={() => printChoreography()} sx={{ '@media (max-width: 900px)': { display: 'none' } }}><PrintIcon fontSize='small' /></IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Title */}
      <ProgramHeaderLine program={program} sx={{ mb: 2, maxWidth: 900, mx: 'auto' }} />
      <Divider sx={{ mb: 4, maxWidth: 900, mx: 'auto' }} />

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
                color='secondary'
              >
                {pd.order}. {pd.dance.title}
              </Link>
              {makeFiguresLabel(pd.dance) && (
                <Typography variant='overline' color='text.secondary' sx={{ lineHeight: 1.6, display: 'block' }}>
                  {makeFiguresLabel(pd.dance)}
                </Typography>
              )}
              {pd.dance.dances_key_moves.length > 0 && (
                <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
                  <strong>Key moves:</strong> {pd.dance.dances_key_moves.map(dkm => dkm.key_move.name).join(', ')}
                </Typography>
              )}
            </Box>
          ))}
        </Box>

        <Divider />

        {/* Phrase rows */}
        {allPhrases.length === 0 ? (
          <Typography color='text.disabled' sx={{ mt: 2 }}>No figures listed for these dances.</Typography>
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
                const figures = (pd.dance.figures ?? []).filter(isFigure).filter(f => f.phrase === phrase);
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

      {createPortal(
        <div style={{ position: 'fixed', top: '-9999px', left: 0, width: '1000px' }}>
          <div ref={printRef} style={{ background: 'white', color: 'black', fontFamily: 'Georgia, serif' }}>
            <div style={{ fontSize: '16pt', fontWeight: 'bold', marginBottom: '0.1em' }}>
              {program.date ? formatLocalDate(program.date) : 'No date'}
            </div>
            {program.location && (
              <div style={{ fontSize: '11pt', marginBottom: '0.6em' }}>{program.location}</div>
            )}
            <table style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '2em' }} />
                {programDances.map(pd => <col key={pd.id} />)}
                <col style={{ width: '1px' }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={{ width: '2em', border: '1px solid #aaa', padding: '4pt 2pt', verticalAlign: 'top', textAlign: 'center' }} />
                  {programDances.map(pd => (
                    <th key={pd.id} style={{ textAlign: 'left', border: '1px solid #aaa', padding: '4pt 5pt', verticalAlign: 'top' }}>
                      <div>{pd.order}. {pd.dance.title}</div>
                      {makeFiguresLabel(pd.dance) && (
                        <div style={{ fontWeight: 'normal', fontSize: '7.5pt', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {makeFiguresLabel(pd.dance)}
                        </div>
                      )}
                      {pd.dance.dances_key_moves.length > 0 && (
                        <div style={{ fontWeight: 'normal', fontSize: '7.5pt' }}>
                          <strong>Key moves:</strong> {pd.dance.dances_key_moves.map(dkm => dkm.key_move.name).join(', ')}
                        </div>
                      )}
                    </th>
                  ))}
                  <th style={{ width: 0, padding: 0, border: '1px solid #aaa' }} />
                </tr>
              </thead>
              <tbody>
                {allPhrases.map(phrase => (
                  <tr key={phrase}>
                    <td className='phrase-cell' style={{ border: '1px solid #aaa', padding: '4pt 2pt', verticalAlign: 'top' }}>{phrase}</td>
                    {programDances.map(pd => {
                      const figures = (pd.dance.figures ?? []).filter(isFigure).filter(f => f.phrase === phrase);
                      return (
                        <td key={pd.id} style={{ border: '1px solid #aaa', padding: '4pt 5pt', verticalAlign: 'top' }}>
                          {figures.length === 0 ? '—' : figures.map(fig => (
                            <div key={fig.id} style={{ display: 'flex', gap: '4pt', marginTop: '2pt' }}>
                              <span style={{ flexShrink: 0, width: '2em', color: '#555' }}>
                                {fig.beats != null ? `(${fig.beats})` : ''}
                              </span>
                              <span>{fig.description}</span>
                            </div>
                          ))}
                        </td>
                      );
                    })}
                    <td style={{ width: 0, padding: 0, border: '1px solid #aaa' }} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>,
        document.body
      )}

    </Box>
  );
};
