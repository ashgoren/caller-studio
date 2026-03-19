import { useState } from 'react';
import { useParams } from 'react-router';
import { Spinner, ErrorMessage } from '@/components/shared';
import { useProgram } from '@/hooks/usePrograms';
import { useUndoState } from '@/contexts/UndoContext';
import { ProgramViewMode } from './ProgramView';
import { ProgramEditMode } from './ProgramEdit';
import { ProgramChoreographyView } from './ProgramChoreographyView';

// Routing wrapper

export const ProgramPage = () => {
  const { id } = useParams();
  if (id === 'new') return <ProgramEditMode />;
  return <ProgramDetailPage id={Number(id!)} />;
};

// Detail page with view/edit/choreography toggle

type Mode = 'view' | 'edit' | 'choreography';

const ProgramDetailPage = ({ id }: { id: number }) => {
  const { data: program, isLoading, error } = useProgram(id);
  const [mode, setMode] = useState<Mode>('view');
  const { isExecuting } = useUndoState();

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!program) return <ErrorMessage error={new Error('Program not found')} />;

  if (mode === 'edit') return <ProgramEditMode program={program} onCancel={() => setMode('view')} />;
  if (mode === 'choreography') return <ProgramChoreographyView program={program} onBack={() => setMode('view')} />;
  return <ProgramViewMode program={program} onEdit={() => { if (!isExecuting) setMode('edit'); }} onChoreography={() => setMode('choreography')} />;
};
