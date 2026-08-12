import { createPortal } from 'react-dom';
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, IconButton, Tooltip, Typography, useMediaQuery } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ReplayIcon from '@mui/icons-material/Replay';
import { useReactToPrint } from 'react-to-print';
import { GRID_NATURAL_WIDTH, GRID_NATURAL_HEIGHT, CELL_HEIGHT } from './cueGridConstants';
import { CueGridView } from './CueGrid';
import { CueGridEditor } from './CueGridEditor';
import { FiguresList } from './FiguresList';
import { DanceHeaderLine } from './DanceHeaderLine';
import { DialogHeaderIcons } from './DialogHeaderIcons';
import { makeFiguresLabel, makeChoreographerNames } from './danceUtils';
import { PrintCuesTable } from './DancePrintPortals';
import { PAGE_STYLE_CUES, PRINT_CUES_CARD } from './printStyles';
import { useUndoActions } from '@/contexts/UndoContext';
import type { CueGridData, Dance } from '@/lib/types/database';

const RichTextEditor = lazy(() => import('@/components/shared/RichTextEditor').then(m => ({ default: m.RichTextEditor })));

const NOTES_ASIDE_WIDTH = 420;

const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

const CuesTimer = ({ seconds, running, onToggle, onReset }: {
  seconds: number; running: boolean; onToggle: () => void; onReset: () => void;
}) => (
  <Box sx={{ border: 2, borderColor: 'primary.main', borderRadius: 2, px: 2.5, py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
    <Typography sx={{ fontVariantNumeric: 'tabular-nums', fontSize: '1.75rem', fontWeight: 700, lineHeight: 1, letterSpacing: '0.02em', minWidth: 72 }}>
      {formatTime(seconds)}
    </Typography>
    <Tooltip title={running ? 'Pause timer' : 'Start timer'}>
      <IconButton onClick={onToggle}>{running ? <PauseIcon /> : <PlayArrowIcon />}</IconButton>
    </Tooltip>
    <Tooltip title='Reset timer'>
      <IconButton onClick={onReset}><ReplayIcon /></IconButton>
    </Tooltip>
  </Box>
);

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
    if (!open || !isNarrow || isEditing) return;
    const handler = (e: TouchEvent) => {
      if (!(e.target as HTMLElement).closest('button')) e.preventDefault();
    };
    document.addEventListener('touchstart', handler, { passive: false });
    return () => document.removeEventListener('touchstart', handler);
  }, [open, isNarrow, isEditing]);

  const cuesViewScale = isNarrow ? Math.min(1, (windowWidth - 16) / GRID_NATURAL_WIDTH) : 1;
  const showNotesAside = useMediaQuery('(min-width: 1200px)');
  const cuesEditorScale = Math.min(1, (windowWidth - (isNarrow ? 32 : 96) - (showNotesAside ? NOTES_ASIDE_WIDTH + 16 : 0)) / (GRID_NATURAL_WIDTH + 18));

  const { cues, title } = dance;
  const hasCues = !!cues && Object.keys(cues.cells).length > 0;
  const figuresLabel = makeFiguresLabel(dance);
  const choreographerNames = makeChoreographerNames(dance);
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

  // react-to-print focuses its hidden print iframe before printing; browsers don't reliably
  // hand focus back afterward, which breaks Escape-to-close. Force focus back into the dialog.
  const dialogContentRef = useRef<HTMLDivElement>(null);
  const restoreFocusAfterPrint = useCallback(() => {
    dialogContentRef.current?.focus({ preventScroll: true });
  }, []);

  const cuesPrintRef = useRef<HTMLDivElement>(null);
  const printCues = useReactToPrint({ contentRef: cuesPrintRef, documentTitle: `${dance.title} - Cues`, pageStyle: PAGE_STYLE_CUES, onAfterPrint: restoreFocusAfterPrint });

  const isDirty = JSON.stringify(draft) !== JSON.stringify(dance.cues ?? null);

  const handleStartEdit = () => {
    setDraft(dance.cues ?? null);
    setIsEditing(true);
  };

  const handleCancel = () => { if (!hasCues) onClose(); else setIsEditing(false); };

  const handleNotesChange = useCallback((notes: string) => {
    setDraft(d => {
      const cells = d?.cells ?? {};
      const separators = d?.separators ?? [];
      const empty = Object.keys(cells).length === 0 && separators.length === 0 && !notes;
      return empty ? null : { cells, ...(separators.length > 0 && { separators }), ...(notes && { notes }) };
    });
  }, []);

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

  const notesEditor = (minHeight: number) => (
    <Box component='fieldset' sx={{ border: 1, borderColor: 'divider', borderRadius: 1, px: 2, pt: 1, pb: 2 }}>
      <Typography component='legend' variant='caption' color='text.secondary' sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: 0.5, px: 0.5 }}>Notes</Typography>
      <Suspense fallback={<CircularProgress size={24} />}>
        <RichTextEditor value={draft?.notes ?? ''} onChange={handleNotesChange} underline={false} minHeight={minHeight} />
      </Suspense>
    </Box>
  );

  const headerIcons = <DialogHeaderIcons onPrint={() => printCues()} onEdit={handleStartEdit} editLabel='Edit cues' onClose={onClose} />;
  const timer = <CuesTimer seconds={timerSeconds} running={timerRunning} onToggle={() => setTimerRunning(r => !r)} onReset={() => { setTimerRunning(false); setTimerSeconds(0); }} />;

  return (
    <>
      <Dialog
        open={open}
        onClose={() => { if (!isEditing) onClose(); }}
        fullScreen
        PaperProps={
          isNarrow ? { sx: { userSelect: 'none', WebkitTouchCallout: 'none', WebkitTapHighlightColor: 'transparent' } } : undefined
        }
      >
        {isEditing ? (
          /* Edit mode — available on all screen sizes */
          <>
          <DialogContent sx={{ display: 'flex', gap: 3, overflow: 'hidden', p: 0, flexDirection: 'column' }}>
            <Box sx={{ px: 2, pt: 2 }}>
              <DanceHeaderLine dance={dance} />
            </Box>
            <Box sx={{ display: 'flex', gap: 3, flex: 1, overflow: 'hidden', px: 2, pb: 2 }}>
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
                {!showNotesAside && (
                  <Box sx={{ mt: 2 }}>
                    {notesEditor(60)}
                  </Box>
                )}
              </Box>
              {/* Notes, as a 3rd column when there's room */}
              {showNotesAside && (
                <Box sx={{ width: NOTES_ASIDE_WIDTH, flexShrink: 0, alignSelf: 'flex-start', overflowY: 'auto' }}>
                  {notesEditor(240)}
                </Box>
              )}
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
          <DialogContent ref={dialogContentRef} tabIndex={-1} sx={{ p: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', userSelect: 'none', WebkitTouchCallout: 'none', touchAction: 'none', '&:focus': { outline: 'none' } }}>
            {headerIcons}
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <DanceHeaderLine dance={dance} sx={{ justifyContent: 'center' }} />
              {timer}
              <Box sx={{ overflow: 'hidden', width: GRID_NATURAL_WIDTH * cuesViewScale, height: GRID_NATURAL_HEIGHT * cuesViewScale, flexShrink: 0 }}>
                <Box sx={{ transform: `scale(${cuesViewScale})`, transformOrigin: 'top left', width: GRID_NATURAL_WIDTH }}>
                  <CueGridView cues={cues} notesSx={{ textAlign: 'center', mt: 1 }} />
                </Box>
              </Box>
            </Box>
            </Box>
          </DialogContent>
        ) : (
          /* Desktop view mode */
          <DialogContent ref={dialogContentRef} tabIndex={-1} sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', '&:focus': { outline: 'none' } }}>
            <Box sx={{ flexShrink: 0 }}>
              {headerIcons}
              <Box sx={{ px: 1.5, pb: 0.5 }}>
                <DanceHeaderLine dance={dance} />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', px: 1.5, pb: 1 }}>
                {timer}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: callingFigures ? { xs: 'column', md: 'row' } : 'row' }}>
              {callingFigures && (
                <Box sx={{ flex: 1, overflowY: 'auto', p: 2, minWidth: 0 }}>
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
