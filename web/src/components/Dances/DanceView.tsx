import { useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Box, Button, Divider, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Markdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import { ExternalLink } from '@/components/shared';
import { RelationCell } from '@/components/RelationCell';
import { useTitle } from '@/contexts/TitleContext';
import { makeFiguresLabel } from '@/components/Dances/danceUtils';
import type { Dance } from '@/lib/types/database';

export const DanceViewMode = ({ dance, onEdit }: { dance: Dance; onEdit: () => void }) => {
  const navigate = useNavigate();
  const { setTitle } = useTitle();

  useEffect(() => setTitle(`Dance: ${dance.title}`), [setTitle, dance.title]);

  const choreographerNames = dance.dances_choreographers.map(dc => dc.choreographer.name).join(', ');
  const figuresLabel = makeFiguresLabel(dance);

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>

      {/* Nav + actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/dances')} size='small' color='secondary'>
          Dances
        </Button>
        <Tooltip title='Edit'>
          <IconButton onClick={onEdit} size='small'><EditIcon fontSize='small' /></IconButton>
        </Tooltip>
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
          {figuresLabel && (
            <Typography variant='overline' color='text.secondary'>{figuresLabel}</Typography>
          )}
          {(dance.figures ?? []).length === 0 ? (
            <Typography color='text.disabled' sx={{ mt: 0.5 }}>—</Typography>
          ) : (
            <Box sx={{ mt: figuresLabel ? 1 : 0 }}>
              {(dance.figures ?? []).map((figure, i) => {
                const isNewPhrase = i === 0 || figure.phrase !== (dance.figures ?? [])[i - 1].phrase;
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

          {dance.walkthrough && (
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
                Walkthrough
              </Typography>
              <Markdown remarkPlugins={[remarkBreaks, remarkGfm]}>{dance.walkthrough}</Markdown>
            </Box>
          )}

          {dance.programs_dances.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography
                variant='caption'
                color='text.secondary'
                sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: 0.5 }}
              >
                Programs
              </Typography>
              <Box sx={{ mt: 0.25 }}>
                <RelationCell
                  items={dance.programs_dances}
                  model='program'
                  getId={pd => pd.program.id}
                  getLabel={pd => `${pd.program.date} - ${pd.program.location}`}
                />
              </Box>
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
            <SidebarField label='16-beat swing?'>
              {dance.swing_16 === true ? 'Yes' : dance.swing_16 === false ? 'No' : undefined}
            </SidebarField>
            <SidebarField label='Place in Program'>{dance.place_in_program || undefined}</SidebarField>
            <SidebarField label='Moves'>{dance.moves || undefined}</SidebarField>
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

        </Box>

      </Box>
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
