import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useReactToPrint } from 'react-to-print';
import { Box, Button, Divider, IconButton, Stack, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ArticleIcon from '@mui/icons-material/Article';
import GridOnIcon from '@mui/icons-material/GridOn';
import Markdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { ExternalLink } from '@/components/shared';
import { RelationCell } from '@/components/RelationCell';
import { useTitle } from '@/contexts/TitleContext';
import { makeFiguresLabel } from './danceUtils';
import { PAGE_STYLE_COMBINED, PAGE_STYLE_CHOREOGRAPHY } from './printStyles';
import { DancePrintPortals } from './DancePrintPortals';
import { WalkthroughViewDialog } from './WalkthroughViewDialog';
import { CuesViewDialog } from './CuesViewDialog';
import type { Dance } from '@/lib/types/database';

export const DanceViewMode = ({ dance, onEdit, figureMode, onFigureModeChange }: { dance: Dance; onEdit: () => void; figureMode: 'choreography' | 'calling'; onFigureModeChange: (mode: 'choreography' | 'calling') => void }) => {
  const navigate = useNavigate();

  const { setTitle } = useTitle();
  useEffect(() => setTitle(`Dance: ${dance.title}`), [setTitle, dance.title]);

  const [walkthroughOpen, setWalkthroughOpen] = useState(false);
  const [cuesOpen, setCuesOpen] = useState(false);

  const choreographyPrintRef = useRef<HTMLDivElement>(null);
  const combinedPrintRef = useRef<HTMLDivElement>(null);
  const printChoreography = useReactToPrint({ contentRef: choreographyPrintRef, documentTitle: dance.title, pageStyle: PAGE_STYLE_CHOREOGRAPHY });
  const printCombined = useReactToPrint({ contentRef: combinedPrintRef, documentTitle: `${dance.title} - Combined`, pageStyle: PAGE_STYLE_COMBINED });

  const choreographerNames = dance.dances_choreographers.map(dc => dc.choreographer.name).join(', ');
  const figuresLabel = makeFiguresLabel(dance);
  const figures = figureMode === 'calling' ? (dance.calling_figures ?? []) : dance.figures;

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>

      {/* Nav + actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/dances')} size='small' color='secondary'>
          Dances
        </Button>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {figures.length > 0 && dance.cues && Object.keys(dance.cues).length > 0 && (
            <Tooltip title='Print combined (8.5x11)'>
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
        <Box sx={{ flex: '1 1 0', minWidth: 0, width: { xs: '100%', md: 'auto' } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <ToggleButtonGroup
              value={figureMode}
              exclusive
              onChange={(_, v) => { if (v) onFigureModeChange(v); }}
              size='small'
            >
              <ToggleButton value='choreography' sx={{ py: 0.25, px: 1, fontSize: '0.7rem', lineHeight: 1.5 }}>
                Choreography
              </ToggleButton>
              <ToggleButton value='calling' disabled={!dance.calling_figures} sx={{ py: 0.25, px: 1, fontSize: '0.7rem', lineHeight: 1.5 }}>
                Calling
              </ToggleButton>
            </ToggleButtonGroup>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {dance.figures.length > 0 && (
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
          {figuresLabel && (
            <Typography variant='overline' color='text.secondary' sx={{ display: 'block', mb: 0.5 }}>{figuresLabel}</Typography>
          )}
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
                    <Typography dangerouslySetInnerHTML={{ __html: figure.description }} />
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

      <WalkthroughViewDialog open={walkthroughOpen} onClose={() => setWalkthroughOpen(false)} dance={dance} />

      <CuesViewDialog open={cuesOpen} onClose={() => setCuesOpen(false)} dance={dance} />

      <DancePrintPortals
        dance={dance}
        figuresLabel={figuresLabel}
        choreographerNames={choreographerNames}
        combinedPrintRef={combinedPrintRef}
        choreographyPrintRef={choreographyPrintRef}
        choreographyFigures={figures}
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
