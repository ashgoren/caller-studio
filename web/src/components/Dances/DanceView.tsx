import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Box, Button, Dialog, DialogContent, Divider, IconButton, Stack, Tooltip, Typography, useMediaQuery } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import { useReactToPrint } from 'react-to-print';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CloseIcon from '@mui/icons-material/Close';
import ArticleIcon from '@mui/icons-material/Article';
import GridOnIcon from '@mui/icons-material/GridOn';
import Markdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import { ExternalLink } from '@/components/shared';
import { RelationCell } from '@/components/RelationCell';
import { useTitle } from '@/contexts/TitleContext';
import { makeFiguresLabel } from '@/components/Dances/danceUtils';
import { CueGridView } from '@/components/Dances/CueGrid';
import { GRID_NATURAL_WIDTH, GRID_NATURAL_HEIGHT } from '@/components/Dances/cueGridConstants';
import { DancePrintPortals } from '@/components/Dances/DancePrintPortals';
import type { Dance } from '@/lib/types/database';

export const DanceViewMode = ({ dance, onEdit }: { dance: Dance; onEdit: () => void }) => {
  const navigate = useNavigate();
  const { setTitle } = useTitle();
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);
  const [cuesOpen, setCuesOpen] = useState(false);
  const isNarrow = useMediaQuery('(max-width: 900px)');
  const [windowWidth, setWindowWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const handler = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  const cuesScale = isNarrow ? Math.min(1, (windowWidth - 16) / GRID_NATURAL_WIDTH) : 1;
  const walkthroughPrintRef = useRef<HTMLDivElement>(null);
  const choreographyPrintRef = useRef<HTMLDivElement>(null);
  const cuesPrintRef = useRef<HTMLDivElement>(null);
  const combinedPrintRef = useRef<HTMLDivElement>(null);
  const printWalkthrough = useReactToPrint({
    contentRef: walkthroughPrintRef,
    documentTitle: `${dance.title} - Walkthrough`,
    pageStyle: `
      @page { size: 8.5in 11in; margin: 0.4in; }
      html, body { margin: 0; padding: 0; height: auto !important; min-height: 0 !important; overflow: visible !important; }
      body { font-family: Georgia, serif !important; font-size: 11pt !important; line-height: 1.4 !important; color: black !important; }
      * { color: black !important; border-color: black !important; font-family: Georgia, serif !important; }
      p { margin: 0 0 1em 0 !important; font-size: 11pt !important; }
      p:last-child { margin-bottom: 0 !important; }
      .print-dance-title { font-size: 24pt !important; font-weight: bold !important; margin: 0 0 0.5em 0 !important; font-family: Georgia, serif !important; }
      h1 { font-size: 24pt !important; font-weight: bold !important; margin: 0 0 0.4em 0 !important; }
      h2 { font-size: 18pt !important; font-weight: bold !important; margin: 0 0 0.4em 0 !important; }
      h3 { font-size: 14pt !important; font-weight: bold !important; margin: 0 0 0.4em 0 !important; }
      ul, ol { margin: 0 0 0.6em 0 !important; padding-left: 1.4em !important; font-size: 11pt !important; }
      li { font-size: 11pt !important; }
      hr { margin: 1.4em 0 !important; border-color: #888 !important; }
    `,
  });
  const printCues = useReactToPrint({
    contentRef: cuesPrintRef,
    documentTitle: `${dance.title} - Cues`,
    pageStyle: `
      @page { size: 5in 7in; margin: 0.15in; }
      html, body { margin: 0; padding: 0; height: auto !important; min-height: 0 !important; overflow: visible !important; }
      body { font-family: "Roboto", "Helvetica", "Arial", sans-serif !important; color: black !important; }
      * { color: black !important; box-shadow: none !important; background: transparent !important; }
      table { border-collapse: collapse; width: 100%; table-layout: fixed; }
      td { word-break: break-word; text-align: center; vertical-align: middle; }
    `,
  });
  const printCombined = useReactToPrint({
    contentRef: combinedPrintRef,
    documentTitle: `${dance.title} - Combined`,
    pageStyle: `
      @page { size: 8.5in 11in; margin: 0.25in 3.5in 0.25in 0.25in; }
      html, body { margin: 0; padding: 0; height: auto !important; min-height: 0 !important; overflow: visible !important; }
      body { color: black !important; }
      * { color: black !important; box-shadow: none !important; background: transparent !important; }
      table { border-collapse: collapse; table-layout: fixed; }
      td { word-break: break-word; text-align: center; vertical-align: middle; }
    `,
  });
  const printChoreography = useReactToPrint({
    contentRef: choreographyPrintRef,
    documentTitle: dance.title,
    pageStyle: `
      @page { size: 8.5in 11in; margin: 0.5in 0.6in; }
      html, body { margin: 0; padding: 0; height: auto !important; min-height: 0 !important; overflow: visible !important; }
      body { font-family: Georgia, serif !important; font-size: 11pt !important; line-height: 1.5 !important; color: black !important; }
      * { color: black !important; border-color: #aaa !important; font-family: Georgia, serif !important; box-shadow: none !important; }
      span, p, div { background: transparent !important; }
    `,
  });

  useEffect(() => setTitle(`Dance: ${dance.title}`), [setTitle, dance.title]);

  const choreographerNames = dance.dances_choreographers.map(dc => dc.choreographer.name).join(', ');
  const figuresLabel = makeFiguresLabel(dance);
  const figures = dance.figures;

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>

      {/* Nav + actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/dances')} size='small' color='secondary'>
          Dances
        </Button>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {figures.length > 0 && dance.cues && Object.keys(dance.cues).length > 0 && (
            <Tooltip title='Print combined (8.5×11)'>
              <IconButton size='small' onClick={() => printCombined()}><PrintIcon fontSize='small' /></IconButton>
            </Tooltip>
          )}
          <Tooltip title='Edit'>
            <IconButton onClick={onEdit} size='small'><EditIcon fontSize='small' /></IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Title + choreographers */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant='h4' component='h1' sx={{ fontWeight: 600, lineHeight: 1.2 }}>
            {dance.title}
          </Typography>
          {dance.url && (
            <IconButton
              component='a'
              href={dance.url}
              target='_blank'
              rel='noopener noreferrer'
              size='small'
              sx={{ color: 'text.secondary', alignSelf: 'flex-end', mb: '4px' }}
            >
              <OpenInNewIcon sx={{ fontSize: '1rem' }} />
            </IconButton>
          )}
        </Box>
        {choreographerNames && (
          <Typography variant='subtitle1' color='text.secondary' sx={{ mt: 0.5 }}>
            by {choreographerNames}
          </Typography>
        )}
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Two-column body */}
      <Box sx={{ display: 'flex', gap: 5, alignItems: 'flex-start', flexDirection: { xs: 'column', md: 'row' } }}>

        {/* Left: Figures + Notes */}
        <Box sx={{ flex: '1 1 0', minWidth: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Box>
              {figuresLabel && (
                <Typography variant='overline' color='text.secondary'>{figuresLabel}</Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {figures.length > 0 && (
                <Tooltip title='Print choreography'>
                  <IconButton size='small' onClick={() => printChoreography()}>
                    <PrintIcon fontSize='small' />
                  </IconButton>
                </Tooltip>
              )}
              {dance.walkthrough && (
                <Tooltip title='Walkthrough'>
                  <IconButton size='small' onClick={() => setWalkthroughOpen(true)}>
                    <ArticleIcon fontSize='small' />
                  </IconButton>
                </Tooltip>
              )}
              {dance.cues && Object.keys(dance.cues).length > 0 && (
                <Tooltip title='Cues'>
                  <IconButton size='small' onClick={() => setCuesOpen(true)}>
                    <GridOnIcon fontSize='small' />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
          {figures.length === 0 ? (
            <Typography color='text.disabled' sx={{ mt: 0.5 }}>—</Typography>
          ) : (
            <Box>
              {figures.map((figure, i) => {
                const isNewPhrase = i === 0 || figure.phrase !== figures[i - 1].phrase;
                return (
                  <Box key={figure.id} sx={{ display: 'flex', gap: 2, mt: isNewPhrase && i > 0 ? 2 : 0.5 }}>
                    <Typography sx={{
                      width: 28, flexShrink: 0,
                      fontWeight: 700, fontSize: '0.8rem',
                      color: isNewPhrase ? 'text.secondary' : 'transparent',
                      pt: '3px',
                      userSelect: 'none',
                    }}>
                      {isNewPhrase ? figure.phrase : ''}
                    </Typography>
                    <Typography sx={{ width: 30, flexShrink: 0, color: 'text.disabled', fontSize: '0.875rem' }}>
                      {figure.beats != null ? `(${figure.beats})` : ''}
                    </Typography>
                    <Typography>{figure.description}</Typography>
                  </Box>
                );
              })}
            </Box>
          )}

          {dance.notes && (
            <Box component='fieldset' sx={{
              mt: 3,
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              px: 2,
              pt: 1,
              pb: 2,
              '& p': { margin: '0 0 0.75em 0' },
              '& p:last-child': { marginBottom: 0 },
              '& hr': { margin: '1em 0', borderColor: 'divider' },
            }}>
              <Typography
                component='legend'
                variant='caption'
                color='text.secondary'
                sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: 0.5, px: 0.5 }}
              >
                Notes
              </Typography>
              <Markdown remarkPlugins={[remarkBreaks, remarkGfm]}>{dance.notes}</Markdown>
            </Box>
          )}

        </Box>

        {/* Right: Metadata sidebar */}
        <Box sx={{ flexShrink: 0, width: { xs: '100%', md: 280 } }}>

          <Stack spacing={1.5}>
            <SidebarField label='Key Move'>
              {dance.dances_key_moves.length > 0
                ? dance.dances_key_moves.map(dkm => dkm.key_move.name).join(', ')
                : undefined}
            </SidebarField>
            <SidebarField label='Vibe'>
              {dance.dances_vibes.length > 0
                ? dance.dances_vibes.map(dv => dv.vibe.name).join(', ')
                : undefined}
            </SidebarField>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={1.5}>
            <SidebarField label='Difficulty'>
              {dance.difficulty != null ? String(dance.difficulty) : undefined}
            </SidebarField>
            <SidebarField label='Place in Program'>{dance.place_in_program || undefined}</SidebarField>
            <SidebarField label='Video'>
              {dance.video ? <ExternalLink url={dance.video} title='Video' /> : undefined}
            </SidebarField>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={1.5}>
            <SidebarField label='Date Added'>
              {new Date(dance.created_at).toISOString().split('T')[0]}
            </SidebarField>
          </Stack>

          {dance.programs_dances.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <SidebarField label='Programs'>
                <RelationCell
                  items={dance.programs_dances}
                  model='program'
                  getId={pd => pd.program.id}
                  getLabel={pd => `${pd.program.date} - ${pd.program.location}`}
                />
              </SidebarField>
            </>
          )}

        </Box>

      </Box>

      <Dialog open={walkthroughOpen} onClose={() => setWalkthroughOpen(false)} fullWidth maxWidth='md' fullScreen={isNarrow}>
        <DialogContent sx={{ position: 'relative' }}>
          <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 0.5, zIndex: 1 }}>
            {!isNarrow && (
              <Tooltip title='Print'>
                <IconButton size='small' onClick={() => printWalkthrough()}><PrintIcon fontSize='small' /></IconButton>
              </Tooltip>
            )}
            <Tooltip title='Close'>
              <IconButton size='small' onClick={() => setWalkthroughOpen(false)}><CloseIcon fontSize='small' /></IconButton>
            </Tooltip>
          </Box>
          <Box ref={walkthroughPrintRef}>
            <Typography variant='h4' className='print-dance-title' sx={{ fontWeight: 600, mb: 2, pr: 8 }}>
              {dance.title}
            </Typography>
            <Box sx={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: { xs: '0.9rem', sm: '1.05rem' },
              lineHeight: 1.7,
              '& p': { margin: '0 0 1em 0' },
              '& p:last-child': { marginBottom: 0 },
              '& h1': { fontSize: { xs: '1.3rem', sm: '1.6rem' }, fontWeight: 700, mt: 0, mb: '0.4em' },
              '& h2': { fontSize: { xs: '1.15rem', sm: '1.35rem' }, fontWeight: 700, mt: 0, mb: '0.4em' },
              '& h3': { fontSize: { xs: '1rem', sm: '1.15rem' }, fontWeight: 700, mt: 0, mb: '0.4em' },
              '& ul, & ol': { pl: '1.4em', mb: '1em' },
              '& hr': { margin: '1.4em 0', borderColor: 'divider' },
            }}>
              <Markdown remarkPlugins={[remarkBreaks, remarkGfm]}>{dance.walkthrough ?? ''}</Markdown>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={cuesOpen} onClose={() => setCuesOpen(false)} maxWidth='sm' fullScreen={isNarrow}>
        {isNarrow ? (
          /* Compact fullscreen: no border/label, proportionally scaled table */
          <DialogContent sx={{ p: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', flexShrink: 0, p: 0.5 }}>
              <Tooltip title='Close'>
                <IconButton size='small' onClick={() => setCuesOpen(false)}><CloseIcon fontSize='small' /></IconButton>
              </Tooltip>
            </Box>
            <Box sx={{ overflow: 'hidden', height: GRID_NATURAL_HEIGHT * cuesScale, flexShrink: 0 }}>
              <Box sx={{ transform: `scale(${cuesScale})`, transformOrigin: 'top left', ml: '8px', width: GRID_NATURAL_WIDTH }}>
                <CueGridView cues={dance.cues} />
              </Box>
            </Box>
          </DialogContent>
        ) : (
          /* Normal: toolbar header + grid */
          <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, px: 1, py: 0.5, borderBottom: 1, borderColor: 'divider' }}>
              <Tooltip title='Print cues'>
                <IconButton size='small' onClick={() => printCues()}><PrintIcon fontSize='small' /></IconButton>
              </Tooltip>
              <Tooltip title='Close'>
                <IconButton size='small' onClick={() => setCuesOpen(false)}><CloseIcon fontSize='small' /></IconButton>
              </Tooltip>
            </Box>
            <Box sx={{ p: 2, overflow: 'auto' }}>
              <CueGridView cues={dance.cues} />
            </Box>
          </DialogContent>
        )}
      </Dialog>

      <DancePrintPortals
        dance={dance}
        figuresLabel={figuresLabel}
        choreographerNames={choreographerNames}
        cuesPrintRef={cuesPrintRef}
        combinedPrintRef={combinedPrintRef}
        choreographyPrintRef={choreographyPrintRef}
      />

    </Box>
  );
};

const SidebarField = ({ label, children }: { label: string; children?: ReactNode }) => (
  <Box>
    <Typography
      variant='caption'
      color='text.secondary'
      sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: 0.5 }}
    >
      {label}
    </Typography>
    <Typography variant='body2' component='div' sx={{ mt: 0.25 }}>
      {children ?? <Box component='span' sx={{ color: 'text.disabled' }}>—</Box>}
    </Typography>
  </Box>
);
