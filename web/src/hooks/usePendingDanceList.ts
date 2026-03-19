import { useState } from 'react';
import type { Program, Dance } from '@/lib/types/database';

export type DisplayDance = { danceId: number; title: string };

export const usePendingDanceList = (initialProgramDances: Program['programs_dances']) => {
  const [dances, setDances] = useState<DisplayDance[]>(() =>
    initialProgramDances.map(pd => ({ danceId: pd.dance.id, title: pd.dance.title })));

  const addDance = (dance: Dance) =>
    setDances(prev => [...prev, { danceId: dance.id, title: dance.title }]);

  const removeDance = (danceId: number) =>
    setDances(prev => prev.filter(d => d.danceId !== danceId));

  const reorder = (newDances: DisplayDance[]) => setDances(newDances);

  const hasPendingChanges =
    dances.length !== initialProgramDances.length ||
    dances.some((d, i) => d.danceId !== initialProgramDances[i].dance.id);

  const commitChanges = async <TResult>(
    onAdd: (danceId: number, order: number) => Promise<TResult>,
    onRemove: (danceId: number) => Promise<TResult>,
  ): Promise<{ added: TResult[]; removed: TResult[] }> => {
    const removed = await Promise.all(initialProgramDances.map(pd => onRemove(pd.dance.id)));
    const added = await Promise.all(dances.map((d, i) => onAdd(d.danceId, i + 1)));
    return { added, removed };
  };

  return { dances, addDance, removeDance, reorder, hasPendingChanges, commitChanges };
};
