import { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate, useBlocker } from 'react-router';
import { Box, Button, CircularProgress, Stack, TextField, Typography } from '@mui/material';

const MarkdownEditor = lazy(() => import('@/components/shared/MarkdownEditor').then(m => ({ default: m.MarkdownEditor })));
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import { useConfirm } from 'material-ui-confirm';
import { closeSnackbar } from 'notistack';
import { ProgramDancesEditor } from './ProgramDancesEditor';
import { newRecord } from './config';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateProgram, useUpdateProgram, useDeleteProgram } from '@/hooks/usePrograms';
import { useAddDanceToProgram, useRemoveDanceFromProgram } from '@/hooks/useProgramsDances';
import { useDances } from '@/hooks/useDances';
import { usePendingDanceList } from '@/hooks/usePendingDanceList';
import { useNotify } from '@/hooks/useNotify';
import { useTitle } from '@/contexts/TitleContext';
import { useUndoActions, dbRecord, beforeValues, relationOps } from '@/contexts/UndoContext';
import { formatLocalDate } from '@/lib/utils';
import type { Program, ProgramInsert, ProgramUpdate } from '@/lib/types/database';

export const ProgramEditMode = ({ program, onCancel }: { program?: Program; onCancel?: () => void }) => {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const { toastSuccess } = useNotify();
  const { pushAction, setFormActive } = useUndoActions();
  const { setTitle } = useTitle();

  useEffect(
    () => setTitle(program?.date ? `Edit: ${formatLocalDate(program.date)}` : 'New Program'),
    [setTitle, program?.date]
  );

  useEffect(() => {
    setFormActive(true);
    closeSnackbar();
    return () => setFormActive(false);
  }, [setFormActive]);

  const isCreate = program === undefined;

  const { mutateAsync: createProgram } = useCreateProgram();
  const { mutateAsync: updateProgram } = useUpdateProgram();
  const { mutateAsync: deleteProgram } = useDeleteProgram();
  const { mutateAsync: addDance } = useAddDanceToProgram();
  const { mutateAsync: removeDance } = useRemoveDanceFromProgram();

  const { data: dances } = useDances();

  const pendingDances = usePendingDanceList(program?.programs_dances ?? []);

  const [initialFormData] = useState<ProgramUpdate>(() => ({
    date: program?.date ?? newRecord.date,
    location: program?.location ?? newRecord.location,
    notes: program?.notes ?? newRecord.notes,
  }));
  const [formData, setFormData] = useState<ProgramUpdate>({ ...initialFormData });
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);


  // ---------- Unsaved changes handling ----------

  const isDirty = useMemo(() =>
    Object.keys(formData).some(key =>
      (formData as Record<string, unknown>)[key] !== (initialFormData as Record<string, unknown>)[key]
    ),
    [formData, initialFormData]
  );

  const hasPendingChanges = pendingDances.hasPendingChanges;

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

  useEffect(() => {
    if (!(isDirty || hasPendingChanges)) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty, hasPendingChanges]);

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
      flushSync(() => setIsSaved(true));
      navigate('/programs');
    } else {
      onCancel?.();
    }
  };


  // ---------- Delete ----------

  const handleDelete = async () => {
    const { confirmed } = await confirm({
      title: 'Delete Program',
      description: `Are you sure you want to delete "${formatDate(program!)}"?`,
      confirmationText: 'Delete',
      cancellationText: 'Cancel',
    });
    if (!confirmed) return;
    await deleteProgram({ id: program!.id });
    pushAction({
      label: `Delete Program: ${formatDate(program!)}`,
      ops: [
        { type: 'delete', table: 'programs', id: program!.id, record: dbRecord(program!, newRecord) },
        ...relationOps('programs_dances', [],
          program!.programs_dances.map(pd => ({ id: pd.id, program_id: program!.id, dance_id: pd.dance.id, order: pd.order }))),
      ],
    });
    toastSuccess('Program deleted');
    flushSync(() => setIsSaved(true));
    navigate('/programs');
  };


  // ---------- Form handling ----------

  const update = (key: keyof ProgramUpdate, value: unknown) =>
    setFormData(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { id: programId } = isCreate
        ? await createProgram(formData as ProgramInsert)
        : await updateProgram({ id: program!.id, updates: formData });

      const { added, removed } = await pendingDances.commitChanges(
        (danceId, order) => addDance({ programId, danceId, order }),
        (danceId) => removeDance({ programId, danceId }),
      );

      if (isCreate) {
        pushAction({
          label: `Create Program: ${formatDate(formData)}`,
          ops: [
            { type: 'insert', table: 'programs', record: { id: programId, ...formData } },
            ...relationOps('programs_dances', added, []),
          ],
        });
        toastSuccess('Program created');
        flushSync(() => setIsSaved(true));
        navigate(`/programs/${programId}`);
      } else {
        pushAction({
          label: `Edit Program: ${formatDate(formData)}`,
          ops: [
            {
              type: 'update', table: 'programs', id: programId,
              before: beforeValues(program!, formData, newRecord),
              after: dbRecord(formData, newRecord),
            },
            ...relationOps('programs_dances', added, removed),
          ],
        });
        await queryClient.refetchQueries({ queryKey: ['program', programId] });
        toastSuccess('Program updated');
        onCancel?.();
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Typography variant='h5' sx={{ mb: 2 }}>
        {isCreate ? 'New Program' : `Edit: ${formatDate(program!)}`}
      </Typography>

      <Stack spacing={2.5}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <TextField
            label='Date'
            type='date'
            value={formData.date ?? ''}
            onChange={e => update('date', e.target.value || null)}
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label='Location'
            value={formData.location ?? ''}
            onChange={e => update('location', e.target.value)}
            fullWidth
          />
        </Box>

        <ProgramDancesEditor
          orderedDances={pendingDances.dances}
          allDances={dances ?? []}
          onAdd={pendingDances.addDance}
          onRemove={pendingDances.removeDance}
          onReorder={pendingDances.reorder}
        />
        <Suspense fallback={<CircularProgress size={24} />}>
          <MarkdownEditor
            label='Notes'
            value={formData.notes ?? ''}
            onChange={v => update('notes', v)}
          />
        </Suspense>
      </Stack>

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
          <Button variant='contained' startIcon={<SaveIcon />} onClick={handleSave} disabled={isSaving || (!isDirty && !hasPendingChanges)} color='secondary'>
            {isSaving ? 'Saving…' : isCreate ? 'Create' : 'Save'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

const formatDate = (program: { date?: string | null }) =>
  program.date ? formatLocalDate(program.date) : '';
