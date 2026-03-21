import { useState } from 'react';
import { useParams } from 'react-router';
import { Spinner, ErrorMessage } from '@/components/shared';
import { useDance } from '@/hooks/useDances';
import { DanceViewMode } from './DanceView';
import { DanceEditMode } from './DanceEdit';

// Routing wrapper

export const DancePage = () => {
  const { id } = useParams();
  if (id === 'new') return <DanceEditMode />;
  return <DanceDetailPage id={Number(id!)} />;
};

// Detail page with view/edit toggle

const DanceDetailPage = ({ id }: { id: number }) => {
  const { data: dance, isLoading, error } = useDance(id);
  const [isEditing, setIsEditing] = useState(false);
  const [figureMode, setFigureMode] = useState<'choreography' | 'calling'>('choreography');

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!dance) return <ErrorMessage error={new Error('Dance not found')} />;

  if (isEditing) return <DanceEditMode dance={dance} onCancel={() => setIsEditing(false)} figureMode={figureMode} onFigureModeChange={setFigureMode} />;
  return <DanceViewMode dance={dance} onEdit={() => setIsEditing(true)} figureMode={figureMode} onFigureModeChange={setFigureMode} />;
};
