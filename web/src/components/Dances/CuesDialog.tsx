import { createPortal } from 'react-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, IconButton, Tooltip, Typography, useMediaQuery } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ReplayIcon from '@mui/icons-material/Replay';
import { useReactToPrint } from 'react-to-print';
import { GRID_NATURAL_WIDTH, GRID_NATURAL_HEIGHT, CELL_HEIGHT } from './cueGridConstants';
import { CueGridView } from './CueGrid';
import { CueGridEditor } from './CueGridEditor';
import { FiguresList } from './FiguresList';
import { makeFiguresLabel } from './danceUtils';
import { PrintCuesTable } from './DancePrintPortals';
import { PAGE_STYLE_CUES, PRINT_CUES_CARD } from './printStyles';
import { useUndoActions } from '@/contexts/UndoContext';
import type { CueGridData, Dance } from '@/lib/types/database';

export const CuesDialog = ({ open, onClose, dance, onSave, autoStartTimer }: {
  open: boolean;
  onClose: () => void;
  dance: Dance;
  onSave: (v: CueGridData | null) => Promise<void>;
  autoStartTimer?: boolean;
}) => {
  const isNarrow = useMediaQuery('(max-width: 900px)');
  const [windowWidth, setWindowWidth] = useState(() => window.innerWidth);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<CueGridData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { setFormActive } = useUndoActions();

  useEffect(() => {
    const handler = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    if (!open) { setIsEditing(false); setTimerRunning(false); setTimerSeconds(0); return; }
    if (!dance.cues || Object.keys(dance.cues.cells).length === 0) { setDraft(dance.cues ?? null); setIsEditing(true); }
    if (autoStartTimer) setTimerRunning(true);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setTimerSeconds(s => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning]);
  useEffect(() => {
    setFormActive(isEditing);
    return () => setFormActive(false);
  }, [isEditing, setFormActive]);

  useEffect(() => {
    if (!open || !isNarrow) return;
    const handler = (e: TouchEvent) => {
      if (!(e.target as HTMLElement).closest('button')) e.preventDefault();
    };
    document.addEventListener('touchstart', handler, { passive: false });
    return () => document.removeEventListener('touchstart', handler);
  }, [open, isNarrow]);

  const cuesViewScale = isNarrow ? Math.min(1, (windowWidth - 16) / GRID_NATURAL_WIDTH) : 1;
  const cuesEditorScale = Math.min(1, (windowWidth - 96) / (GRID_NATURAL_WIDTH + 18));

  const { cues, title } = dance;
  const hasCues = !!cues && Object.keys(cues.cells).length > 0;
  const figuresLabel = makeFiguresLabel(dance);
  const choreographerNames = dance.dances_choreographers.map(dc => dc.choreographer.name).join(', ');
  const callingFigures = (dance.calling_figures && dance.calling_figures.length > 0)
    ? dance.calling_figures
    : (dance.figures && dance.figures.length > 0 ? dance.figures : null);

  const { figures } = dance;
  const figureGroups = useMemo(() => {
    const groups: { phrase: string; items: typeof figures }[] = [];
    for (const item of figures) {
      if (item.kind === 'figure') {
        const last = groups[groups.length - 1];
        if (last && last.phrase === item.phrase) last.items.push(item);
        else groups.push({ phrase: item.phrase, items: [item] });
      } else {
        groups[groups.length - 1]?.items.push(item);
      }
    }
    return groups;
  }, [figures]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const cuesPrintRef = useRef<HTMLDivElement>(null);
  const printCues = useReactToPrint({ contentRef: cuesPrintRef, documentTitle: `${dance.title} - Cues`, pageStyle: PAGE_STYLE_CUES });

  const isDirty = JSON.stringify(draft) !== JSON.stringify(dance.cues ?? null);

  const handleStartEdit = () => {
    setDraft(dance.cues ?? null);
    setIsEditing(true);
  };

  const handleCancel = () => { if (!hasCues) onClose(); else setIsEditing(false); };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(draft);
      setIsEditing(false);
    } catch {
      // error already handled (toast) by the caller
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={() => { if (!isEditing) onClose(); }}
        maxWidth={isEditing || callingFigures ? 'lg' : 'sm'}
        fullWidth={isEditing || !!callingFigures}
        fullScreen={isNarrow}
        PaperProps={
          isNarrow ? { sx: { userSelect: 'none', WebkitTouchCallout: 'none', WebkitTapHighlightColor: 'transparent' } } :
          (isEditing || callingFigures) ? { sx: { height: '90vh' } } :
          undefined
        }
      >
        {isEditing ? (
          /* Edit mode — available on all screen sizes */
          <>
          <DialogContent sx={{ display: 'flex', gap: 3, overflow: 'hidden', p: 0, flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', gap: 3, flex: 1, overflow: 'hidden', px: 2, pt: 2, pb: 2 }}>
              {/* Figures reference */}
              <Box sx={{ flexShrink: 0, overflowY: 'auto', pr: 2, '@media (max-width: 1011px)': { display: 'none' } }}>
                {dance.figures.length === 0 ? (
                  <Typography color='text.disabled' variant='body2'>No figures added yet.</Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', pt: `${15 + CELL_HEIGHT}px` }}>
                    {figureGroups.map(({ phrase, items }) => {
                      const firstFigureIdx = items.findIndex(i => i.kind === 'figure');
                      return (
                        <Box key={phrase} sx={{ minHeight: CELL_HEIGHT * 2 + 1 }}>
                          {items.map((item, idx) => item.kind === 'note' ? (
                            <Box key={item.id} sx={{ display: 'flex', gap: 2, mt: idx > 0 ? 0.5 : 0 }}>
                              <Box sx={{ width: 28, flexShrink: 0 }} />
                              <Box sx={{ width: 30, flexShrink: 0 }} />
                              <Typography variant='body2' dangerouslySetInnerHTML={{ __html: item.text }} />
                            </Box>
                          ) : (
                            <Box key={item.id} sx={{ display: 'flex', gap: 2, mt: idx > 0 ? 0.5 : 0 }}>
                              <Typography sx={{ width: 28, flexShrink: 0, fontWeight: 700, fontSize: '0.8rem', color: 'text.secondary', pt: '3px', userSelect: 'none' }}>
                                {idx === firstFigureIdx ? phrase : ''}
                              </Typography>
                              <Typography sx={{ width: 30, flexShrink: 0, color: 'text.disabled', fontSize: '0.875rem' }}>
                                {item.beats != null ? `(${item.beats})` : ''}
                              </Typography>
                              <Typography variant='body2' dangerouslySetInnerHTML={{ __html: item.description }} />
                            </Box>
                          ))}
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Box>
              {/* Cue grid editor */}
              <Box sx={{ flexShrink: 0, width: (GRID_NATURAL_WIDTH + 18) * cuesEditorScale, overflowY: 'auto', overflowX: 'hidden' }}>
                <Box sx={{ transform: `scale(${cuesEditorScale})`, transformOrigin: 'top left', width: GRID_NATURAL_WIDTH + 18 }}>
                  <CueGridEditor value={draft} onChange={setDraft} />
                </Box>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancel} disabled={isSaving}>Cancel</Button>
            <Button variant='contained' onClick={handleSave} disabled={isSaving || !isDirty} color='secondary'>
              {isSaving ? <CircularProgress size={16} /> : 'Save'}
            </Button>
          </DialogActions>
          </>
        ) : isNarrow ? (
          /* Compact fullscreen view mode (mobile/tablet) */
          <DialogContent sx={{ p: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', userSelect: 'none', WebkitTouchCallout: 'none', touchAction: 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 0.5, px: 1, py: 0.5, flexShrink: 0 }}>
              <Tooltip title='Edit cues'>
                <IconButton size='small' onClick={handleStartEdit}><EditIcon fontSize='small' /></IconButton>
              </Tooltip>
              <Tooltip title='Close'>
                <IconButton size='small' onClick={onClose}><CloseIcon fontSize='small' /></IconButton>
              </Tooltip>
            </Box>
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant='h6' sx={{ fontWeight: 600, lineHeight: 1.2 }}>{dance.title}</Typography>
                {choreographerNames && (
                  <Typography variant='body2' color='text.secondary' sx={{ fontStyle: 'italic' }}>by {choreographerNames}</Typography>
                )}
                {figuresLabel && (
                  <Typography variant='body2' color={figuresLabel !== 'Improper' ? 'text.primary' : 'text.secondary'} fontWeight={figuresLabel !== 'Improper' ? 700 : undefined}>{figuresLabel}</Typography>
                )}
              </Box>
              <Box sx={{ border: 2, borderColor: 'primary.main', borderRadius: 2, px: 2.5, py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontVariantNumeric: 'tabular-nums', fontSize: '1.75rem', fontWeight: 700, lineHeight: 1, letterSpacing: '0.02em', minWidth: 72 }}>
                  {formatTime(timerSeconds)}
                </Typography>
                <Tooltip title={timerRunning ? 'Pause timer' : 'Start timer'}>
                  <IconButton onClick={() => setTimerRunning(r => !r)}>
                    {timerRunning ? <PauseIcon /> : <PlayArrowIcon />}
                  </IconButton>
                </Tooltip>
                <Tooltip title='Reset timer'>
                  <IconButton onClick={() => { setTimerRunning(false); setTimerSeconds(0); }}>
                    <ReplayIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box sx={{ overflow: 'hidden', width: GRID_NATURAL_WIDTH * cuesViewScale, height: GRID_NATURAL_HEIGHT * cuesViewScale, flexShrink: 0 }}>
                <Box sx={{ transform: `scale(${cuesViewScale})`, transformOrigin: 'top left', width: GRID_NATURAL_WIDTH }}>
                  <CueGridView cues={cues} />
                </Box>
              </Box>
            </Box>
            </Box>
          </DialogContent>
        ) : (
          /* Desktop view mode */
          <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box sx={{ flexShrink: 0 }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 0.5, px: 1, pt: 0.5 }}>
                <Tooltip title='Print cues'>
                  <IconButton size='small' onClick={() => printCues()}><PrintIcon fontSize='small' /></IconButton>
                </Tooltip>
                <Tooltip title='Edit cues'>
                  <IconButton size='small' onClick={handleStartEdit}><EditIcon fontSize='small' /></IconButton>
                </Tooltip>
                <Tooltip title='Close'>
                  <IconButton size='small' onClick={onClose}><CloseIcon fontSize='small' /></IconButton>
                </Tooltip>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', px: 1.5, pb: 1 }}>
                <Box sx={{ border: 2, borderColor: 'primary.main', borderRadius: 2, px: 2.5, py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontVariantNumeric: 'tabular-nums', fontSize: '1.75rem', fontWeight: 700, lineHeight: 1, letterSpacing: '0.02em', minWidth: 72 }}>
                    {formatTime(timerSeconds)}
                  </Typography>
                  <Tooltip title={timerRunning ? 'Pause timer' : 'Start timer'}>
                    <IconButton onClick={() => setTimerRunning(r => !r)}>
                      {timerRunning ? <PauseIcon /> : <PlayArrowIcon />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title='Reset timer'>
                    <IconButton onClick={() => { setTimerRunning(false); setTimerSeconds(0); }}>
                      <ReplayIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: callingFigures ? { xs: 'column', md: 'row' } : 'row' }}>
              {callingFigures && (
                <Box sx={{ flex: 1, overflowY: 'auto', p: 2, minWidth: 0 }}>
                  <Box sx={{ height: CELL_HEIGHT, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', pt: 0.5 }}>
                    <Typography variant='h6' sx={{ fontWeight: 600, lineHeight: 1.2 }}>{dance.title}</Typography>
                    {choreographerNames && (
                      <Typography variant='body2' color='text.secondary' sx={{ fontStyle: 'italic', mt: 0.25 }}>by {choreographerNames}</Typography>
                    )}
                    {figuresLabel && (
                      <Typography variant='body2' color={figuresLabel !== 'Improper' ? 'text.primary' : 'text.secondary'} fontWeight={figuresLabel !== 'Improper' ? 700 : undefined} sx={{ mt: 0.25 }}>{figuresLabel}</Typography>
                    )}
                  </Box>
                  <FiguresList figures={callingFigures} />
                </Box>
              )}
              <Box sx={{ overflowY: 'auto', p: 2, flexShrink: 0 }}>
                <CueGridView cues={cues} />
              </Box>
            </Box>
          </DialogContent>
        )}
      </Dialog>

      {/* Standalone cues print — 5×7 */}
      {!isEditing && hasCues && createPortal(
        <div style={{ position: 'fixed', top: '-9999px', left: 0, width: 448 }}>
          <div ref={cuesPrintRef} style={{ background: 'white', color: 'black', fontFamily: '"Roboto","Helvetica","Arial",sans-serif', fontSize: '14px', lineHeight: 1.4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={{ fontSize: '17px', fontWeight: 'bold' }}>{title}</div>
              {figuresLabel && <div style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '12px' }}>{figuresLabel}</div>}
            </div>
            {choreographerNames && <div style={{ fontStyle: 'italic', marginBottom: '0.2em', fontSize: '12px' }}>by {choreographerNames}</div>}
            <hr style={{ border: 'none', borderTop: '1px solid black', margin: '0.2em 0 0.4em' }} />
            <PrintCuesTable cues={cues} {...PRINT_CUES_CARD} />
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
