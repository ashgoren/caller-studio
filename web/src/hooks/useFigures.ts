import { useState } from 'react';
import type { FigureItem } from '@/lib/types/database';
import { isFigure } from '@/lib/types/database';

const PHRASES = ['A1', 'A2', 'B1', 'B2'];

export const useFigures = (
  dance: { figures?: FigureItem[] } | undefined,
) => {
  const [pendingFigures, setPendingFigures] = useState<FigureItem[] | null>(null);
  const figures = pendingFigures ?? (dance?.figures ?? []);

  const addFigure = () => {
    const totalBeats = figures.filter(isFigure).reduce((sum, f) => sum + (f.beats ?? 0), 0);
    const phraseIndex = Math.min(Math.floor(totalBeats / 16), PHRASES.length - 1);
    const nextPhrase = PHRASES[phraseIndex];
    const beatsRemaining = Math.min(16 - (totalBeats % 16), 8);
    setPendingFigures([...figures, { id: crypto.randomUUID(), kind: 'figure', phrase: nextPhrase, beats: beatsRemaining, description: '' }]);
  };

  const addNote = () => {
    setPendingFigures([...figures, { id: crypto.randomUUID(), kind: 'note', text: '' }]);
  };

  const updateFigure = (id: string, key: 'phrase' | 'beats' | 'description', value: string | number | null) => {
    setPendingFigures(figures.map(figure => figure.id === id ? { ...figure, [key]: value } : figure));
  };

  const updateNote = (id: string, text: string) => {
    setPendingFigures(figures.map(figure => figure.id === id ? { ...figure, text } : figure));
  };

  const deleteFigure = (id: string) => {
    setPendingFigures(figures.filter(figure => figure.id !== id));
  };

  const setFigures = (newFigures: FigureItem[]) => {
    setPendingFigures(newFigures);
  };

  return {
    figures,
    addFigure,
    addNote,
    updateFigure,
    updateNote,
    deleteFigure,
    setFigures,
    hasPendingChanges: pendingFigures !== null && JSON.stringify(pendingFigures) !== JSON.stringify(dance?.figures ?? [])
  };
};
