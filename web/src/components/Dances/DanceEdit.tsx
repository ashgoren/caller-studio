import { useState, useMemo, useEffect, useRef, lazy, Suspense } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate, useBlocker } from 'react-router';
import { Box, Button, TextField, Autocomplete, Divider, Stack, InputAdornment, IconButton, CircularProgress, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import { useConfirm } from 'material-ui-confirm';
import { closeSnackbar } from 'notistack';
import { RelationEditor } from '@/components/RelationEditor';
import { FiguresEditor } from './FiguresEditor';
import { VideosEditor } from './VideosEditor';
import { isValidUrl } from '@/lib/callersBox';
import { fetchAndResolveImport } from '@/lib/danceImport';
import { newRecord } from './config';
import { useCreateDance, useUpdateDance, useDeleteDance, DANCE_JOIN_KEYS } from '@/hooks/useDances';
import { useAddChoreographerToDance, useRemoveChoreographerFromDance } from '@/hooks/useDancesChoreographers';
import { useAddKeyMoveToDance, useRemoveKeyMoveFromDance } from '@/hooks/useDancesKeyMoves';
import { useAddVibeToDance, useRemoveVibeFromDance } from '@/hooks/useDancesVibes';
import { useAddDanceVideo, useRemoveDanceVideo, useUpdateDanceVideo, usePendingVideos } from '@/hooks/useDanceVideos';
import { useChoreographers, useCreateChoreographer } from '@/hooks/useChoreographers';
import { useKeyMoves } from '@/hooks/useKeyMoves';
import { useVibes } from '@/hooks/useVibes';
import { useDanceTypes } from '@/hooks/useDanceTypes';
import { useFormations } from '@/hooks/useFormations';
import { useProgressions } from '@/hooks/useProgressions';
import { usePendingRelations } from '@/hooks/usePendingRelations';
import { useFigures } from '@/hooks/useFigures';
import { useNotify } from '@/hooks/useNotify';
import { useTitle } from '@/contexts/TitleContext';
import { useUndoActions, omit, relationOps } from '@/contexts/UndoContext';
import type { Dance, DanceInsert, DanceUpdate } from '@/lib/types/database';
const RichTextEditor = lazy(() => import('@/components/shared/RichTextEditor').then(m => ({ default: m.RichTextEditor })));

export const DanceEditMode = ({ dance, onCancel, figureMode: initialFigureMode = 'choreography', onFigureModeChange }: { dance?: Dance; onCancel?: () => void; figureMode?: 'choreography' | 'calling'; onFigureModeChange?: (mode: 'choreography' | 'calling') => void }) => {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { toastSuccess, toastError } = useNotify();
  const { pushAction, setFormActive } = useUndoActions();

  const { setTitle } = useTitle();
  useEffect(() => setTitle(dance?.title ? `Edit: ${dance.title}` : 'New Dance'), [setTitle, dance?.title]);

  useEffect(() => {
    setFormActive(true);
    closeSnackbar();
    return () => setFormActive(false);
  }, [setFormActive]);

  const { mutateAsync: createDance, isPending: isCreating } = useCreateDance();
  const { mutateAsync: updateDance, isPending: isUpdating } = useUpdateDance();
  const { mutateAsync: deleteDance } = useDeleteDance();
  const { mutateAsync: addKeyMove } = useAddKeyMoveToDance();
  const { mutateAsync: removeKeyMove } = useRemoveKeyMoveFromDance();
  const { mutateAsync: addVibe } = useAddVibeToDance();
  const { mutateAsync: removeVibe } = useRemoveVibeFromDance();
  const { mutateAsync: addChoreographer } = useAddChoreographerToDance();
  const { mutateAsync: removeChoreographer } = useRemoveChoreographerFromDance();
  const { mutateAsync: addVideo } = useAddDanceVideo();
  const { mutateAsync: removeVideo } = useRemoveDanceVideo();
  const { mutateAsync: updateVideo } = useUpdateDanceVideo();
  const { mutateAsync: createChoreographer } = useCreateChoreographer();
  const { data: choreographers } = useChoreographers();
  const { data: keyMoves } = useKeyMoves();
  const { data: vibes } = useVibes();
  const { data: danceTypes } = useDanceTypes();
  const { data: formations } = useFormations();
  const { data: progressions } = useProgressions();
  const isSaving = isCreating || isUpdating;

  const pendingChoreographers = usePendingRelations();
  const pendingKeyMoves = usePendingRelations();
  const pendingVibes = usePendingRelations();
  const pendingVideoState = usePendingVideos(dance);
  const pendingFigures = useFigures(dance);
  const pendingCallingFigures = useFigures(dance ? { figures: dance.calling_figures ?? [] } : undefined);
  const [figureMode, setFigureMode] = useState<'choreography' | 'calling'>(initialFigureMode);
  const [callingEnabled, setCallingEnabled] = useState(dance?.calling_figures !== null && dance?.calling_figures !== undefined);

  const [initialFormData] = useState<DanceUpdate>(() => ({
    title: dance?.title ?? newRecord.title,
    url: dance?.url ?? newRecord.url,
    dance_type_id: dance?.dance_type_id ?? newRecord.dance_type_id,
    formation_id: dance?.formation_id ?? newRecord.formation_id,
    progression_id: dance?.progression_id ?? newRecord.progression_id,
    difficulty: dance?.difficulty ?? newRecord.difficulty,
    notes: dance?.notes ?? newRecord.notes,
    place_in_program: dance?.place_in_program ?? newRecord.place_in_program,
  }));
  const [formData, setFormData] = useState<DanceUpdate>({ ...initialFormData });

  const [importing, setImporting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const isCreate = dance === undefined;

  // Default dance_type_id to Contra once when types load (if field is still null)
  const contraDefaultApplied = useRef(false);
  useEffect(() => {
    if (danceTypes && !contraDefaultApplied.current && formData.dance_type_id === null) {
      contraDefaultApplied.current = true;
      const defaultId = danceTypes[0].id;
      initialFormData.dance_type_id = defaultId;
      setFormData(prev => ({ ...prev, dance_type_id: defaultId }));
    }
  }, [danceTypes, formData.dance_type_id, initialFormData]);

  // ---------- Unsaved changes handling ----------

  // Has any form field changed?
  const isDirty = useMemo(() =>
    Object.keys(formData).some(key => {
      const a = (formData as Record<string, unknown>)[key];
      const b = (initialFormData as Record<string, unknown>)[key];
      if (a !== null && typeof a === 'object') return JSON.stringify(a) !== JSON.stringify(b);
      return a !== b;
    }),
    [formData, initialFormData]
  );

  // Any pending changes to relations or figures?
  const hasPendingChanges =
    pendingChoreographers.hasPendingChanges ||
    pendingKeyMoves.hasPendingChanges ||
    pendingVibes.hasPendingChanges ||
    pendingVideoState.hasPendingChanges ||
    pendingFigures.hasPendingChanges ||
    (callingEnabled && (dance?.calling_figures == null || pendingCallingFigures.hasPendingChanges));

  // Warn on in-app navigation
  const blocker = useBlocker(!isSaved && (isDirty || hasPendingChanges));
  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    confirm({
      title: 'Leave without saving?',
      description: 'Your unsaved changes will be lost.',
      confirmationText: 'Leave',
      cancellationText: 'Stay',
    }).then(({ confirmed }) => {
      if (confirmed) blocker.proceed();
      else blocker.reset();
    }).catch(() => blocker.reset());
  }, [blocker.state]); // eslint-disable-line react-hooks/exhaustive-deps

  // Warn on tab close / browser refresh
  useEffect(() => {
    if (!(isDirty || hasPendingChanges)) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty, hasPendingChanges]);

  // Warn on switch back to view mode
  const handleCancel = async () => {
    if (isDirty || hasPendingChanges) {
      const { confirmed } = await confirm({
        title: 'Discard changes?',
        description: 'Your unsaved changes will be lost.',
        confirmationText: 'Discard',
        cancellationText: 'Keep editing',
      });
      if (!confirmed) return;
    }
    if (isCreate) {
      flushSync(() => setIsSaved(true)); // Synchronously set to disable blocker before navigating away
      navigate('/dances');
    } else {
      onCancel?.(); // Go back to view mode
    }
  };


  // ---------- Form handling ----------

  const update = (key: keyof DanceUpdate, value: unknown) =>
    setFormData(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    const updatesWithFigures = {
      ...formData,
      figures: pendingFigures.figures,
      calling_figures: callingEnabled ? pendingCallingFigures.figures : (dance?.calling_figures ?? null),
    };

    const { id: danceId } = isCreate
      ? await createDance(updatesWithFigures as DanceInsert)
      : await updateDance({ id: dance!.id, updates: updatesWithFigures });

    await pendingChoreographers.commitChanges(
      (choreographerId) => addChoreographer({ aId: danceId, bId: choreographerId }),
      (choreographerId) => removeChoreographer({ aId: danceId, bId: choreographerId }),
    );
    await pendingKeyMoves.commitChanges(
      (keyMoveId) => addKeyMove({ aId: danceId, bId: keyMoveId }),
      (keyMoveId) => removeKeyMove({ aId: danceId, bId: keyMoveId }),
    );
    await pendingVibes.commitChanges(
      (vibeId) => addVibe({ aId: danceId, bId: vibeId }),
      (vibeId) => removeVibe({ aId: danceId, bId: vibeId }),
    );
    await pendingVideoState.commitChanges(danceId, { addVideo, removeVideo, updateVideo });

    if (isCreate) {
      toastSuccess('Dance created');
      flushSync(() => setIsSaved(true)); // Synchronously set to disable blocker before navigating away
      navigate(`/dances/${danceId}`);
    } else {
      toastSuccess('Dance updated');
      onCancel?.(); // Go back to view mode
    }
  };

  const handleDelete = async () => {
    const { confirmed } = await confirm({
      title: 'Delete Dance',
      description: `Are you sure you want to delete "${dance!.title}"?`,
      confirmationText: 'Delete',
      cancellationText: 'Cancel',
    });
    if (!confirmed) return;
    await deleteDance({ id: dance!.id });
    pushAction({
      label: `Delete Dance: ${dance!.title}`,
      ops: [
        { type: 'delete', table: 'dances', id: dance!.id, record: omit(dance!, DANCE_JOIN_KEYS) },
        ...relationOps('dances_choreographers', [],
          dance!.dances_choreographers.map(dc => ({ id: dc.id, dance_id: dance!.id, choreographer_id: dc.choreographer.id }))),
        ...relationOps('dances_key_moves', [],
          dance!.dances_key_moves.map(dkm => ({ id: dkm.id, dance_id: dance!.id, key_move_id: dkm.key_move.id }))),
        ...relationOps('dances_vibes', [],
          dance!.dances_vibes.map(dv => ({ id: dv.id, dance_id: dance!.id, vibe_id: dv.vibe.id }))),
        ...relationOps('programs_dances', [],
          dance!.programs_dances.map(pd => ({ id: pd.id, dance_id: dance!.id, program_id: pd.program.id, order: pd.order }))),
      ],
    });
    toastSuccess('Dance deleted');
    flushSync(() => setIsSaved(true));
    navigate('/dances');
  };


  // ---------- Figure mode toggle ----------
  const handleFigureModeChange = (_: React.MouseEvent, v: 'choreography' | 'calling' | null) => {
    if (!v) return;
    if (v === 'calling' && !callingEnabled) {
      setCallingEnabled(true);
      pendingCallingFigures.setFigures([...pendingFigures.figures]);
    }
    setFigureMode(v);
    onFigureModeChange?.(v);
  };

  // ---------- Import Dance ----------
  const importDance = async () => {
    if (formData.title || formData.formation_id || formData.progression_id || dance?.dances_choreographers.length || pendingChoreographers.pendingAdds.length || pendingFigures.figures.length) {
      const { confirmed } = await confirm({
        title: 'Replace existing data?',
        description: 'Importing will replace existing title, choreographers, formation, progression, and figures. Notes and other attributes will be preserved.',
        confirmationText: 'Replace',
        cancellationText: 'Cancel',
      });
      if (!confirmed) return;
    }

    setImporting(true);
    try {
      const result = await fetchAndResolveImport(formData.url!, {
        formations: formations ?? [],
        progressions: progressions ?? [],
        choreographers: choreographers ?? [],
      }, (name) => createChoreographer({ name }));

      // Replace existing title, formation, progression
      update('title', result.title);
      if (result.formation_id) update('formation_id', result.formation_id);
      if (result.progression_id) update('progression_id', result.progression_id);

      // Replace existing choreographers with imported ones — diff to avoid stale-state issues
      const existingIds = dance?.dances_choreographers.map(dc => dc.choreographer.id) ?? [];
      for (const id of existingIds.filter(id => !result.choreographerIds.includes(id))) pendingChoreographers.removeItem(id);
      for (const id of result.choreographerIds.filter(id => !existingIds.includes(id))) pendingChoreographers.addItem(id);

      // Replace existing figures with imported ones
      pendingFigures.setFigures(result.figures);

      toastSuccess('Dance imported', { undo: false });
    } catch (err) {
      toastError('Import failed' + (err instanceof Error ? `: ${err.message}` : ''));
    } finally {
      setImporting(false);
    }
  };


  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
      {/* Prominent header fields — full width */}
      <Stack spacing={2} sx={{ mb: 2.5 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1.1fr' }, gap: 2 }}>
          <TextField label='Title' value={formData.title ?? ''} onChange={e => update('title', e.target.value)} fullWidth variant='standard' />
          <TextField
            label='URL' value={formData.url ?? ''} onChange={e => update('url', e.target.value)} fullWidth variant='standard'
            helperText={!formData.url && "Paste a Caller's Box URL to show the dance import button."}
            slotProps={{ input: { endAdornment: isValidUrl(formData.url ?? '') && (
              <InputAdornment position='end'>
                <IconButton onClick={importDance} disabled={importing || !choreographers || !formations || !progressions} size='small' title='Import from URL'>
                  {importing ? <CircularProgress size={18} /> : <DownloadIcon fontSize='small' />}
                </IconButton>
              </InputAdornment>
            )}}}
          />
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 3 }}>
          <RelationEditor
            model='choreographer' label='Choreographer'
            relations={dance?.dances_choreographers ?? []}
            getRelationId={dc => dc.choreographer.id}
            getRelationLabel={dc => dc.choreographer.name}
            options={choreographers ?? []}
            getOptionId={c => c.id}
            getOptionLabel={c => c.name}
            pending={pendingChoreographers}
          />
          <RelationEditor
            model='key_move' label='Key Move'
            relations={dance?.dances_key_moves ?? []}
            getRelationId={dkm => dkm.key_move.id}
            getRelationLabel={dkm => dkm.key_move.name}
            options={keyMoves ?? []}
            getOptionId={km => km.id}
            getOptionLabel={km => km.name}
            pending={pendingKeyMoves}
          />
          <RelationEditor
            model='vibe' label='Vibe'
            relations={dance?.dances_vibes ?? []}
            getRelationId={dv => dv.vibe.id}
            getRelationLabel={dv => dv.vibe.name}
            options={vibes ?? []}
            getOptionId={v => v.id}
            getOptionLabel={v => v.name}
            pending={pendingVibes}
          />
        </Box>
      </Stack>

      <Divider sx={{ mb: 2.5 }} />

      {/* Two-column body */}
      <Box sx={{ display: 'flex', gap: 5, alignItems: 'flex-start', flexDirection: { xs: 'column', md: 'row' } }}>

        {/* Left: Figures + Notes */}
        <Box sx={{ flex: '1 1 0', minWidth: 0, width: { xs: '100%', md: 'auto' } }}>
          <Box sx={{ mb: 2 }}>
            <ToggleButtonGroup
              value={figureMode}
              exclusive
              onChange={handleFigureModeChange}
              size='small'
            >
              <ToggleButton value='choreography' sx={{ py: 0.25, px: 1, fontSize: '0.7rem', lineHeight: 1.5 }}>
                Choreography
              </ToggleButton>
              <ToggleButton value='calling' sx={{ py: 0.25, px: 1, fontSize: '0.7rem', lineHeight: 1.5 }}>
                Calling
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          {figureMode === 'choreography' ? (
            <FiguresEditor
              figures={pendingFigures.figures}
              onAdd={pendingFigures.addFigure}
              onAddNote={pendingFigures.addNote}
              onUpdate={pendingFigures.updateFigure}
              onUpdateNote={pendingFigures.updateNote}
              onDelete={pendingFigures.deleteFigure}
              onReorder={pendingFigures.setFigures}
            />
          ) : (
            <FiguresEditor
              figures={pendingCallingFigures.figures}
              onAdd={pendingCallingFigures.addFigure}
              onAddNote={pendingCallingFigures.addNote}
              onUpdate={pendingCallingFigures.updateFigure}
              onUpdateNote={pendingCallingFigures.updateNote}
              onDelete={pendingCallingFigures.deleteFigure}
              onReorder={pendingCallingFigures.setFigures}
            />
          )}
          <Box component='fieldset' sx={{ mt: 4, border: 1, borderColor: 'divider', borderRadius: 1, px: 2, pt: 1, pb: 2 }}>
            <Typography component='legend' variant='caption' color='text.secondary' sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: 0.5, px: 0.5 }}>Notes</Typography>
            <Suspense fallback={<CircularProgress size={24} />}>
              <RichTextEditor
                value={formData.notes ?? ''}
                onChange={v => update('notes', v)}
                underline={false}
              />
            </Suspense>
          </Box>
          <Box component='fieldset' sx={{ mt: 3, border: 1, borderColor: 'divider', borderRadius: 1, px: 2, pt: 1, pb: 2 }}>
            <Typography component='legend' variant='caption' color='text.secondary' sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: 0.5, px: 0.5 }}>Videos</Typography>
            <VideosEditor videos={pendingVideoState.pendingVideos} onChange={pendingVideoState.setPendingVideos} />
          </Box>
        </Box>

        {/* Right: Attributes */}
        <Box sx={{ flexShrink: 0, width: { xs: '100%', md: 320 } }}>
          <Stack spacing={2}>
            <Autocomplete
              options={danceTypes ?? []}
              value={(danceTypes ?? []).find(dt => dt.id === formData.dance_type_id) ?? null}
              getOptionLabel={dt => dt.name}
              onChange={(_, value) => update('dance_type_id', value?.id ?? null)}
              renderInput={(params) => <TextField {...params} label='Dance Type' variant='standard' />}
            />
            <Autocomplete
              options={formations ?? []}
              value={(formations ?? []).find(f => f.id === formData.formation_id) ?? null}
              getOptionLabel={f => f.name}
              onChange={(_, value) => update('formation_id', value?.id ?? null)}
              renderInput={(params) => <TextField {...params} label='Formation' variant='standard' />}
            />
            <Autocomplete
              options={progressions ?? []}
              value={(progressions ?? []).find(p => p.id === formData.progression_id) ?? null}
              getOptionLabel={p => p.name}
              onChange={(_, value) => update('progression_id', value?.id ?? null)}
              renderInput={(params) => <TextField {...params} label='Progression' variant='standard' />}
            />

            <Divider />

            <TextField
              label='Difficulty'
              type='number'
              value={formData.difficulty ?? ''}
              onChange={e => update('difficulty', e.target.value ? Number(e.target.value) : null)}
              variant='standard'
              sx={{ width: 100 }}
            />
            <TextField label='Place in Program' value={formData.place_in_program ?? ''} onChange={e => update('place_in_program', e.target.value)} fullWidth multiline variant='standard' />
          </Stack>
        </Box>

      </Box>

      <Box sx={{ position: 'sticky', bottom: 0, mt: 4, py: 2, borderTop: 1, borderColor: 'divider', backgroundColor: 'background.default', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          {!isCreate && (
            <Button color='error' startIcon={<DeleteIcon />} onClick={handleDelete} disabled={isSaving}>
              Delete
            </Button>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button onClick={handleCancel} disabled={isSaving} color='secondary'>Cancel</Button>
          <Button variant='contained' startIcon={<SaveIcon />} onClick={handleSave} disabled={isSaving || (!isDirty && !hasPendingChanges)} color='secondary'>
            {isSaving ? 'Saving…' : isCreate ? 'Create' : 'Save'}
          </Button>
        </Box>
      </Box>

    </Box>
  );
};

