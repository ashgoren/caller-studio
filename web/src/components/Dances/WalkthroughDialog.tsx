import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, IconButton, Tooltip, Typography, useMediaQuery } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import { useReactToPrint } from 'react-to-print';
import { PAGE_STYLE_WALKTHROUGH } from './printStyles';
import { FiguresList } from './FiguresList';
import { makeFiguresLabel } from './danceUtils';
import { useUndoActions } from '@/contexts/UndoContext';
import type { Dance } from '@/lib/types/database';

const RichTextEditor = lazy(() => import('@/components/shared/RichTextEditor').then(m => ({ default: m.RichTextEditor })));

// Page content area: 8.5in - 2×0.4in margin = 7.7in × 10.2in, at 96px/in
const PRINT_W = 7.7 * 96;
const PRINT_H = 10.2 * 96;

export const WalkthroughDialog = ({ open, onClose, dance, onSave }: {
  open: boolean;
  onClose: () => void;
  dance: Dance;
  onSave: (v: string) => Promise<void>;
}) => {
  const isNarrow = useMediaQuery('(max-width: 900px)');
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [isSaving, setIsSaving] = useState(false);
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
  const callingFigures = (dance.calling_figures && dance.calling_figures.length > 0)
    ? dance.calling_figures
    : (dance.figures && dance.figures.length > 0 ? dance.figures : null);
  const showColumns = !!(callingFigures && !isNarrow);

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
      fullWidth
      maxWidth={showColumns ? 'xl' : 'md'}
      fullScreen={isNarrow}
    >
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: isNarrow ? '100%' : undefined }}>

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
              <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                <Suspense fallback={<CircularProgress size={24} />}>
                  <RichTextEditor value={draft} onChange={setDraft} underline={false} autoFocus />
                </Suspense>
              </Box>
            </Box>
          ) : (
            <Box ref={walkthroughPrintRef} sx={{ flex: 2, overflowY: 'auto', p: 3, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 2 }}>
                <Typography variant='h5' className='print-dance-title' sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                  {dance.title}
                </Typography>
                {figuresLabel && (
                  <Typography variant='body2' color='text.secondary'>{figuresLabel}</Typography>
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
      {isEditing && (
        <DialogActions>
          <Button onClick={handleCancel} disabled={isSaving}>Cancel</Button>
          <Button variant='contained' onClick={handleSave} disabled={isSaving || !isDirty} color='secondary'>
            {isSaving ? <CircularProgress size={16} /> : 'Save'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};
