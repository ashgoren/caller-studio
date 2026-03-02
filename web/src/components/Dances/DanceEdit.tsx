import { useState, useMemo, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate, useBlocker } from 'react-router';
import { Box, Button, TextField, Checkbox, FormControlLabel, Typography, Autocomplete, Divider, Stack } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import { useConfirm } from 'material-ui-confirm';
import { closeSnackbar } from 'notistack';
import { RelationEditor } from '@/components/RelationEditor';
import { FiguresEditor } from './FiguresEditor';
import { newRecord } from './config';
import { useCreateDance, useUpdateDance, useDeleteDance } from '@/hooks/useDances';
import { useAddChoreographerToDance, useRemoveChoreographerFromDance } from '@/hooks/useDancesChoreographers';
import { useAddKeyMoveToDance, useRemoveKeyMoveFromDance } from '@/hooks/useDancesKeyMoves';
import { useAddVibeToDance, useRemoveVibeFromDance } from '@/hooks/useDancesVibes';
import { useChoreographers } from '@/hooks/useChoreographers';
import { useKeyMoves } from '@/hooks/useKeyMoves';
import { useVibes } from '@/hooks/useVibes';
import { useDanceTypes } from '@/hooks/useDanceTypes';
import { useFormations } from '@/hooks/useFormations';
import { useProgressions } from '@/hooks/useProgressions';
import { usePendingRelations } from '@/hooks/usePendingRelations';
import { useFigures } from '@/hooks/useFigures';
import { useNotify } from '@/hooks/useNotify';
import { useTitle } from '@/contexts/TitleContext';
import { useUndoActions, dbRecord, beforeValues, relationOps } from '@/contexts/UndoContext';
import type { Dance, DanceInsert, DanceUpdate } from '@/lib/types/database';

export const DanceEditMode = ({ dance, onCancel }: { dance?: Dance; onCancel?: () => void }) => {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { toastSuccess } = useNotify();
  const { pushAction, setFormActive } = useUndoActions();
  const { setTitle } = useTitle();

  useEffect(
    () => setTitle(dance?.title ? `Edit: ${dance.title}` : 'New Dance'),
    [setTitle, dance?.title]
  );

  useEffect(() => {
    setFormActive(true);
    closeSnackbar();
    return () => setFormActive(false);
  }, [setFormActive]);

  const isCreate = dance === undefined;

  const { mutateAsync: createDance, isPending: isCreating } = useCreateDance();
  const { mutateAsync: updateDance, isPending: isUpdating } = useUpdateDance();
  const { mutateAsync: deleteDance } = useDeleteDance();
  const { mutateAsync: addChoreographer } = useAddChoreographerToDance();
  const { mutateAsync: removeChoreographer } = useRemoveChoreographerFromDance();
  const { mutateAsync: addKeyMove } = useAddKeyMoveToDance();
  const { mutateAsync: removeKeyMove } = useRemoveKeyMoveFromDance();
  const { mutateAsync: addVibe } = useAddVibeToDance();
  const { mutateAsync: removeVibe } = useRemoveVibeFromDance();

  const { data: choreographers } = useChoreographers();
  const { data: keyMoves } = useKeyMoves();
  const { data: vibes } = useVibes();
  const { data: danceTypes } = useDanceTypes();
  const { data: formations } = useFormations();
  const { data: progressions } = useProgressions();

  const pendingChoreographers = usePendingRelations();
  const pendingKeyMoves = usePendingRelations();
  const pendingVibes = usePendingRelations();
  const pendingFigures = useFigures(dance);

  const [initialFormData] = useState<DanceUpdate>(() => ({
    title: dance?.title ?? newRecord.title,
    url: dance?.url ?? newRecord.url,
    video: dance?.video ?? newRecord.video,
    dance_type_id: dance?.dance_type_id ?? newRecord.dance_type_id,
    formation_id: dance?.formation_id ?? newRecord.formation_id,
    progression_id: dance?.progression_id ?? newRecord.progression_id,
    difficulty: dance?.difficulty ?? newRecord.difficulty,
    swing_16: dance?.swing_16 ?? newRecord.swing_16,
    notes: dance?.notes ?? newRecord.notes,
    place_in_program: dance?.place_in_program ?? newRecord.place_in_program,
    moves: dance?.moves ?? newRecord.moves,
  }));
  const [formData, setFormData] = useState<DanceUpdate>({ ...initialFormData });
  const [isSaved, setIsSaved] = useState(false);

  const isSaving = isCreating || isUpdating;


  // ---------- Unsaved changes handling ----------

  // Has any form field changed?
  const isDirty = useMemo(() =>
    Object.keys(formData).some(key =>
      (formData as Record<string, unknown>)[key] !== (initialFormData as Record<string, unknown>)[key]
    ),
    [formData, initialFormData]
  );

  // Any pending changes to relations or figures?
  const hasPendingChanges =
    pendingChoreographers.hasPendingChanges ||
    pendingKeyMoves.hasPendingChanges ||
    pendingVibes.hasPendingChanges ||
    pendingFigures.hasPendingChanges;

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


  // ---------- Delete ----------

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
        { type: 'delete', table: 'dances', id: dance!.id, record: dbRecord(dance!, newRecord) },
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


  // ---------- Form handling ----------

  const update = (key: keyof DanceUpdate, value: unknown) =>
    setFormData(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    const updatesWithFigures = { ...formData, figures: pendingFigures.figures };

    const { id: danceId } = isCreate
      ? await createDance(updatesWithFigures as DanceInsert)
      : await updateDance({ id: dance!.id, updates: updatesWithFigures });

    const { added: addedChoreographers, removed: removedChoreographers } = await pendingChoreographers.commitChanges(
      (choreographerId) => addChoreographer({ danceId, choreographerId }),
      (choreographerId) => removeChoreographer({ danceId, choreographerId }),
    );
    const { added: addedKeyMoves, removed: removedKeyMoves } = await pendingKeyMoves.commitChanges(
      (keyMoveId) => addKeyMove({ danceId, keyMoveId }),
      (keyMoveId) => removeKeyMove({ danceId, keyMoveId }),
    );
    const { added: addedVibes, removed: removedVibes } = await pendingVibes.commitChanges(
      (vibeId) => addVibe({ danceId, vibeId }),
      (vibeId) => removeVibe({ danceId, vibeId }),
    );

    if (isCreate) {
      pushAction({
        label: `Create Dance: ${formData.title}`,
        ops: [
          { type: 'insert', table: 'dances', record: { id: danceId, ...updatesWithFigures } },
          ...relationOps('dances_choreographers', addedChoreographers, []),
          ...relationOps('dances_key_moves', addedKeyMoves, []),
          ...relationOps('dances_vibes', addedVibes, []),
        ],
      });
      toastSuccess('Dance created');
      flushSync(() => setIsSaved(true)); // Synchronously set to disable blocker before navigating away
      navigate(`/dances/${danceId}`);
    } else {
      pushAction({
        label: `Edit Dance: ${formData.title}`,
        ops: [
          {
            type: 'update', table: 'dances', id: danceId,
            before: beforeValues(dance!, updatesWithFigures, newRecord),
            after: dbRecord(updatesWithFigures, newRecord),
          },
          ...relationOps('dances_choreographers', addedChoreographers, removedChoreographers),
          ...relationOps('dances_key_moves', addedKeyMoves, removedKeyMoves),
          ...relationOps('dances_vibes', addedVibes, removedVibes),
        ],
      });
      toastSuccess('Dance updated');
      onCancel?.(); // Go back to view mode
    }
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
      <Typography variant='h5' sx={{ mb: 2.5 }}>
        {isCreate ? 'New Dance' : `Edit: ${dance!.title}`}
      </Typography>

      {/* Prominent header fields — full width */}
      <Stack spacing={2} sx={{ mb: 2.5 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <TextField label='Title' value={formData.title ?? ''} onChange={e => update('title', e.target.value)} fullWidth variant='standard' />
          <TextField label='URL' value={formData.url ?? ''} onChange={e => update('url', e.target.value)} fullWidth variant='standard' />
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
        <Box sx={{ flex: '1 1 0', minWidth: 0 }}>
          <FiguresEditor
            figures={pendingFigures.figures}
            onAdd={pendingFigures.addFigure}
            onUpdate={pendingFigures.updateFigure}
            onDelete={pendingFigures.deleteFigure}
            onReorder={pendingFigures.reorderFigures}
          />
          <TextField
            label='Notes'
            value={formData.notes ?? ''}
            onChange={e => update('notes', e.target.value)}
            fullWidth multiline variant='standard'
            sx={{ mt: 4 }}
          />
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
            <FormControlLabel
              label='16-beat swing?'
              control={
                <Checkbox
                  checked={Boolean(formData.swing_16)}
                  onChange={e => update('swing_16', e.target.checked)}
                  sx={{ pl: 0 }}
                />
              }
            />

            <TextField label='Place in Program' value={formData.place_in_program ?? ''} onChange={e => update('place_in_program', e.target.value)} fullWidth multiline variant='standard' />
            <TextField label='Moves' value={formData.moves ?? ''} onChange={e => update('moves', e.target.value)} fullWidth multiline variant='standard' />
            <TextField label='Video' value={formData.video ?? ''} onChange={e => update('video', e.target.value)} fullWidth variant='standard' />
          </Stack>
        </Box>

      </Box>

      <Box sx={{ display: 'flex', mt: 3, justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          {!isCreate && (
            <Button color='error' startIcon={<DeleteIcon />} onClick={handleDelete} disabled={isSaving}>
              Delete
            </Button>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button onClick={handleCancel} disabled={isSaving} color='secondary'>Cancel</Button>
          <Button variant='contained' startIcon={<SaveIcon />} onClick={handleSave} disabled={isSaving} color='secondary'>
            {isSaving ? 'Saving…' : isCreate ? 'Create' : 'Save'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
