import { createPortal } from 'react-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, IconButton, Tooltip, Typography, useMediaQuery } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
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

export const CuesDialog = ({ open, onClose, dance, onSave }: {
  open: boolean;
  onClose: () => void;
  dance: Dance;
  onSave: (v: CueGridData | null) => Promise<void>;
}) => {
  const isNarrow = useMediaQuery('(max-width: 900px)');
  const [windowWidth, setWindowWidth] = useState(() => window.innerWidth);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<CueGridData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { setFormActive } = useUndoActions();

  useEffect(() => {
    const handler = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    if (!open) { setIsEditing(false); return; }
    if (!dance.cues || Object.keys(dance.cues.cells).length === 0) { setDraft(dance.cues ?? null); setIsEditing(true); }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    setFormActive(isEditing);
    return () => setFormActive(false);
  }, [isEditing, setFormActive]);

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
        PaperProps={isEditing || (callingFigures && !isNarrow) ? { sx: { height: '90vh' } } : undefined}
      >
        {isNarrow ? (
          /* Compact fullscreen: just close button + scaled cue grid (no edit on mobile) */
          <DialogContent sx={{ p: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', flexShrink: 0, p: 0.5 }}>
              <Tooltip title='Close'>
                <IconButton size='small' onClick={onClose}><CloseIcon fontSize='small' /></IconButton>
              </Tooltip>
            </Box>
            <Box sx={{ overflow: 'hidden', height: GRID_NATURAL_HEIGHT * cuesViewScale, flexShrink: 0 }}>
              <Box sx={{ transform: `scale(${cuesViewScale})`, transformOrigin: 'top left', ml: '8px', width: GRID_NATURAL_WIDTH }}>
                <CueGridView cues={cues} />
              </Box>
            </Box>
          </DialogContent>
        ) : isEditing ? (
          /* Edit mode */
          <>
          <DialogContent sx={{ display: 'flex', gap: 3, overflow: 'hidden', p: 0, flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', gap: 3, flex: 1, overflow: 'hidden', px: 2, pt: 2, pb: 2 }}>
              {/* Figures reference */}
              <Box sx={{ width: 340, flexShrink: 0, overflowY: 'auto', pr: 2, '@media (max-width: 1011px)': { display: 'none' } }}>
                {dance.figures.length === 0 ? (
                  <Typography color='text.disabled' variant='body2'>No figures added yet.</Typography>
                ) : (
                  <Box sx={{ position: 'relative', height: GRID_NATURAL_HEIGHT + 18 }}>
                    {figureGroups.map(({ phrase, items }, phraseIdx) => {
                      const firstFigureIdx = items.findIndex(i => i.kind === 'figure');
                      return (
                        <Box key={phrase} sx={{ position: 'absolute', top: 15 + CELL_HEIGHT + phraseIdx * (CELL_HEIGHT * 2 + 1), left: 0, right: 0 }}>
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
              <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minWidth: 0 }}>
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
        ) : (
          /* View mode */
          <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 0.5, px: 1, py: 0.5, flexShrink: 0 }}>
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
            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: callingFigures ? { xs: 'column', md: 'row' } : 'row' }}>
              {callingFigures && (
                <Box sx={{ flex: 1, overflowY: 'auto', p: 2, minWidth: 0 }}>
                  <Box sx={{ height: CELL_HEIGHT, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', pt: 0.5 }}>
                    <Typography variant='h6' sx={{ fontWeight: 600, lineHeight: 1.2 }}>{dance.title}</Typography>
                    {figuresLabel && (
                      <Typography variant='body2' color='text.secondary' sx={{ mt: 0.25 }}>{figuresLabel}</Typography>
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
