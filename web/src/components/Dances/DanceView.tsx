import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useReactToPrint } from 'react-to-print';
import { Box, Button, Divider, IconButton, Stack, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ArticleIcon from '@mui/icons-material/Article';
import GridOnIcon from '@mui/icons-material/GridOn';
import LinkIcon from '@mui/icons-material/Link';
import { ExternalLink } from '@/components/shared';
import { RelationCell } from '@/components/RelationCell';
import { useTitle } from '@/contexts/TitleContext';
import { useUpdateDance } from '@/hooks/useDances';
import { useUndoActions } from '@/contexts/UndoContext';
import { useNotify } from '@/hooks/useNotify';
import { FiguresList } from './FiguresList';
import { makeFiguresLabel } from './danceUtils';
import { PAGE_STYLE_COMBINED, PAGE_STYLE_CHOREOGRAPHY } from './printStyles';
import { DancePrintPortals } from './DancePrintPortals';
import { WalkthroughDialog } from './WalkthroughDialog';
import { CuesDialog } from './CuesDialog';
import type { CueGridData, Dance } from '@/lib/types/database';

const RichTextEditor = lazy(() => import('@/components/shared/RichTextEditor').then(m => ({ default: m.RichTextEditor })));

export const DanceViewMode = ({ dance, onEdit, figureMode, onFigureModeChange }: { dance: Dance; onEdit: () => void; figureMode: 'choreography' | 'calling'; onFigureModeChange: (mode: 'choreography' | 'calling') => void }) => {
  const navigate = useNavigate();
  const { mutateAsync: updateDance } = useUpdateDance();
  const { pushAction } = useUndoActions();
  const { toastSuccess } = useNotify();

  const { setTitle } = useTitle();
  useEffect(() => setTitle(dance.title), [setTitle, dance.title]);

  const [walkthroughOpen, setWalkthroughOpen] = useState(false);
  const [cuesOpen, setCuesOpen] = useState(false);
  const [cuesAutoStart, setCuesAutoStart] = useState(false);

  const handleSaveWalkthrough = async (value: string) => {
    await updateDance({ id: dance.id, updates: { walkthrough: value } });
    pushAction({
      label: `Edit Walkthrough: ${dance.title}`,
      ops: [{ type: 'update', table: 'dances', id: dance.id, before: { walkthrough: dance.walkthrough }, after: { walkthrough: value } }],
    });
    toastSuccess('Walkthrough saved');
  };

  const handleSaveCues = async (value: CueGridData | null) => {
    await updateDance({ id: dance.id, updates: { cues: value } });
    pushAction({
      label: `Edit Cues: ${dance.title}`,
      ops: [{ type: 'update', table: 'dances', id: dance.id, before: { cues: dance.cues }, after: { cues: value } }],
    });
    toastSuccess('Cues saved');
  };

  const choreographyPrintRef = useRef<HTMLDivElement>(null);
  const combinedPrintRef = useRef<HTMLDivElement>(null);
  const printChoreography = useReactToPrint({ contentRef: choreographyPrintRef, documentTitle: dance.title, pageStyle: PAGE_STYLE_CHOREOGRAPHY });
  const printCombined = useReactToPrint({ contentRef: combinedPrintRef, documentTitle: `${dance.title} - Combined`, pageStyle: PAGE_STYLE_COMBINED });

  const choreographerNames = dance.dances_choreographers.map(dc => dc.choreographer.name).join(', ');
  const figuresLabel = makeFiguresLabel(dance);
  const figures = figureMode === 'calling' ? (dance.calling_figures ?? []) : dance.figures;
  const hasCues = !!dance.cues && Object.keys(dance.cues.cells).length > 0;

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
          <Tooltip title='Copy share link'>
            <IconButton size='small' onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/share/d/${dance.share_token}`);
              toastSuccess('Share link copied', { undo: false });
            }}>
              <LinkIcon fontSize='small' />
            </IconButton>
          </Tooltip>
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
              <Tooltip title={dance.walkthrough ? 'Walkthrough' : 'Add walkthrough'}>
                <IconButton size='small' onClick={() => setWalkthroughOpen(true)}>
                  <ArticleIcon fontSize='small' sx={{ color: dance.walkthrough ? 'text.primary' : 'text.disabled' }} />
                </IconButton>
              </Tooltip>
              <Tooltip title={hasCues ? 'Cues' : 'Add cues'}>
                <IconButton size='small' onClick={() => setCuesOpen(true)}>
                  <GridOnIcon fontSize='small' sx={{ color: hasCues ? 'text.primary' : 'text.disabled' }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          {figuresLabel && (
            <Typography variant='overline' sx={{ display: 'block', mb: 0.5, color: figuresLabel !== 'Improper' ? 'text.primary' : 'text.secondary', fontWeight: figuresLabel !== 'Improper' ? 700 : undefined }}>{figuresLabel}</Typography>
          )}
          {figures.length === 0 ? (
            <Typography color='text.disabled' sx={{ mt: 0.5 }}>—</Typography>
          ) : (
            <FiguresList figures={figures} />
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
            }}>
              <Typography
                component='legend'
                variant='caption'
                color='text.secondary'
                sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: 0.5, px: 0.5 }}
              >
                Notes
              </Typography>
              <Suspense fallback={null}>
                <RichTextEditor value={dance.notes} editable={false} />
              </Suspense>
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
            <SidebarField label='Videos'>
              {dance.dance_videos.length > 0
                ? <Stack spacing={0.25}>{dance.dance_videos.map(v => <ExternalLink key={v.id} url={v.url} title={v.description || 'Video'} />)}</Stack>
                : undefined}
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

      <WalkthroughDialog open={walkthroughOpen} onClose={() => setWalkthroughOpen(false)} dance={dance} onSave={handleSaveWalkthrough} onOpenCues={() => { setWalkthroughOpen(false); setCuesAutoStart(true); setCuesOpen(true); }} />

      <CuesDialog open={cuesOpen} onClose={() => { setCuesOpen(false); setCuesAutoStart(false); }} dance={dance} onSave={handleSaveCues} autoStartTimer={cuesAutoStart} />

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
