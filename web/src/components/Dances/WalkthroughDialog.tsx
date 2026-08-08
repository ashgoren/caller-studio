import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, IconButton, Tooltip, Typography, useMediaQuery } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import GridOnIcon from '@mui/icons-material/GridOn';
import { useReactToPrint } from 'react-to-print';
import type { Editor } from '@tiptap/react';
import { PAGE_STYLE_WALKTHROUGH } from './printStyles';
import { FiguresList } from './FiguresList';
import { makeFiguresLabel } from './danceUtils';
import { useUndoActions } from '@/contexts/UndoContext';
import type { Dance } from '@/lib/types/database';

const RichTextEditor = lazy(() => import('@/components/shared/RichTextEditor').then(m => ({ default: m.RichTextEditor })));
const RichTextToolbar = lazy(() => import('@/components/shared/RichTextEditor').then(m => ({ default: m.RichTextToolbar })));

// Page content area: 8.5in - 2×0.4in margin = 7.7in × 10.2in, at 96px/in
const PRINT_W = 7.7 * 96;
const PRINT_H = 10.2 * 96;

export const WalkthroughDialog = ({ open, onClose, dance, onSave, onOpenCues }: {
  open: boolean;
  onClose: () => void;
  dance: Dance;
  onSave: (v: string) => Promise<void>;
  onOpenCues?: () => void;
}) => {
  const isNarrow = useMediaQuery('(max-width: 900px)');
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);
  const { setFormActive } = useUndoActions();

  const walkthroughPrintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) { setIsEditing(false); return; }
    if (!dance.walkthrough) { setDraft(''); setIsEditing(true); }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    setFormActive(isEditing);
    return () => setFormActive(false);
  }, [isEditing, setFormActive]);

  const onBeforePrint = useCallback((): Promise<void> => new Promise(resolve => {
    const el = walkthroughPrintRef.current;
    if (!el) { resolve(); return; }
    const clone = el.cloneNode(true) as HTMLElement;
    clone.style.cssText = `position:fixed;top:-9999px;left:0;width:${PRINT_W}px;visibility:hidden;`;
    document.body.appendChild(clone);
    const h = clone.scrollHeight;
    document.body.removeChild(clone);
    if (h > PRINT_H) el.style.zoom = String(PRINT_H / h);
    resolve();
  }), []);

  const onAfterPrint = useCallback(() => {
    if (walkthroughPrintRef.current) walkthroughPrintRef.current.style.zoom = '';
  }, []);

  const printWalkthrough = useReactToPrint({ contentRef: walkthroughPrintRef, documentTitle: `${dance.title} - Walkthrough`, pageStyle: PAGE_STYLE_WALKTHROUGH, onBeforePrint, onAfterPrint });

  const figuresLabel = makeFiguresLabel(dance);
  const choreographerNames = dance.dances_choreographers.map(dc => dc.choreographer.name).join(', ');
  const callingFigures = (dance.calling_figures && dance.calling_figures.length > 0)
    ? dance.calling_figures
    : (dance.figures && dance.figures.length > 0 ? dance.figures : null);
  const showColumns = !!callingFigures && !isNarrow;

  const isDirty = draft !== (dance.walkthrough ?? '');

  const handleStartEdit = () => {
    setDraft(dance.walkthrough ?? '');
    setIsEditing(true);
  };

  const handleCancel = () => { if (!dance.walkthrough) onClose(); else setIsEditing(false); };

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
    <Dialog
      open={open}
      onClose={() => { if (!isEditing) onClose(); }}
      fullScreen
    >
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>

        {/* Toolbar — view mode only */}
        {!isEditing && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 0.5, px: 1, py: 0.5, flexShrink: 0 }}>
            {!isNarrow && (
              <Tooltip title='Print'>
                <IconButton size='small' onClick={() => printWalkthrough()}><PrintIcon fontSize='small' /></IconButton>
              </Tooltip>
            )}
            <Tooltip title='Edit walkthrough'>
              <IconButton size='small' onClick={handleStartEdit}><EditIcon fontSize='small' /></IconButton>
            </Tooltip>
            <Tooltip title='Close'>
              <IconButton size='small' onClick={onClose}><CloseIcon fontSize='small' /></IconButton>
            </Tooltip>
          </Box>
        )}

        {/* Content */}
        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: showColumns ? { xs: 'column', md: 'row' } : 'row' }}>
          {showColumns && (
            <Box sx={{ flex: 1, overflowY: 'auto', p: 2, borderRight: { md: 1 }, borderBottom: { xs: 1, md: 0 }, borderColor: 'divider', minWidth: 0 }}>
              <FiguresList figures={callingFigures} />
            </Box>
          )}

          {isEditing ? (
            <Box sx={{ flex: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column', p: 2, minWidth: 0 }}>
              <Box sx={{ mb: 1, flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 0.75, minWidth: 0 }}>
                  <Typography variant='h6' component='span' sx={{ fontWeight: 700, lineHeight: 1.2 }}>{dance.title}</Typography>
                  {choreographerNames && (
                    <Typography variant='body2' component='span' color='text.secondary' sx={{ fontStyle: 'italic' }}>by {choreographerNames}</Typography>
                  )}
                  {figuresLabel && (
                    <Typography variant='body2' component='span' color={figuresLabel !== 'Improper' ? 'text.primary' : 'text.secondary'} fontWeight={figuresLabel !== 'Improper' ? 700 : undefined}>({figuresLabel})</Typography>
                  )}
                </Box>
                <Suspense fallback={null}>
                  <RichTextToolbar editor={editor} />
                </Suspense>
              </Box>
              <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                <Suspense fallback={<CircularProgress size={24} />}>
                  <RichTextEditor value={draft} onChange={setDraft} underline={false} autoFocus toolbar={false} onEditorReady={setEditor} />
                </Suspense>
              </Box>
            </Box>
          ) : (
            <Box ref={walkthroughPrintRef} sx={{ flex: 2, overflowY: 'auto', p: 3, minWidth: 0 }}>
              <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 0.75 }}>
                <Typography variant='h5' component='span' className='print-dance-title' sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {dance.title}
                </Typography>
                {choreographerNames && (
                  <Typography variant='body2' component='span' color='text.secondary' sx={{ fontStyle: 'italic' }}>by {choreographerNames}</Typography>
                )}
                {figuresLabel && (
                  <Typography variant='body2' component='span' sx={{ color: figuresLabel !== 'Improper' ? 'text.primary' : 'text.secondary', fontWeight: figuresLabel !== 'Improper' ? 700 : undefined }}>({figuresLabel})</Typography>
                )}
              </Box>
              <Box sx={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: { xs: '0.9rem', sm: '1.05rem' }, lineHeight: 1.7 }}>
                <Suspense fallback={null}>
                  <RichTextEditor value={dance.walkthrough ?? ''} editable={false} />
                </Suspense>
              </Box>
            </Box>
          )}
        </Box>

      </DialogContent>
      {isEditing ? (
        <DialogActions>
          <Button onClick={handleCancel} disabled={isSaving}>Cancel</Button>
          <Button variant='contained' onClick={handleSave} disabled={isSaving || !isDirty} color='secondary'>
            {isSaving ? <CircularProgress size={16} /> : 'Save'}
          </Button>
        </DialogActions>
      ) : onOpenCues ? (
        <DialogActions>
          <Button startIcon={<GridOnIcon />} onClick={onOpenCues} size='small'>Cue Sheet</Button>
        </DialogActions>
      ) : null}
    </Dialog>
  );
};
