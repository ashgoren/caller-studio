import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useNotify } from '@/hooks/useNotify';
import type { Dance, DanceVideoRow } from '@/lib/types/database';

export type PendingVideo = {
  tempId: string; // React key; equals String(id) for existing rows, uuid for new
  id?: number;
  url: string;
  description: string;
};

const addDanceVideo = async (danceId: number, url: string, description: string | null) => {
  const { data, error } = await supabase
    .from('dance_videos')
    .insert({ dance_id: danceId, url, description })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};

const removeDanceVideo = async (id: number) => {
  const { data, error } = await supabase
    .from('dance_videos')
    .delete()
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};

const updateDanceVideo = async (id: number, url: string, description: string | null) => {
  const { data, error } = await supabase
    .from('dance_videos')
    .update({ url, description })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};

export const commitVideoChanges = async (
  initialVideos: PendingVideo[],
  pendingVideos: PendingVideo[],
  danceId: number,
  fns: {
    addVideo: (args: { danceId: number; url: string; description: string | null }) => Promise<DanceVideoRow>;
    removeVideo: (args: { id: number; danceId: number }) => Promise<unknown>;
    updateVideo: (args: { id: number; danceId: number; url: string; description: string | null }) => Promise<unknown>;
  }
) => {
  const validVideos = pendingVideos.filter(v => v.url.trim());
  const removedVideos = initialVideos.filter(iv => !validVideos.some(v => v.id === iv.id));
  const addedVideoRows = await Promise.all(
    validVideos.filter(v => !v.id).map(v => fns.addVideo({ danceId, url: v.url, description: v.description || null }))
  );
  await Promise.all(removedVideos.map(v => fns.removeVideo({ id: v.id!, danceId })));
  const updatedVideos = validVideos.filter(v => {
    if (!v.id) return false;
    const orig = initialVideos.find(iv => iv.id === v.id);
    return orig && (v.url !== orig.url || v.description !== orig.description);
  }).map(v => ({ current: v, orig: initialVideos.find(iv => iv.id === v.id)! }));
  await Promise.all(
    updatedVideos.map(({ current: v }) => fns.updateVideo({ id: v.id!, danceId, url: v.url, description: v.description || null }))
  );
  return { addedVideoRows, removedVideos, updatedVideos };
};

export const usePendingVideos = (dance?: Dance) => {
  const [initialVideos] = useState<PendingVideo[]>(() =>
    dance?.dance_videos?.map(v => ({ tempId: String(v.id), id: v.id, url: v.url, description: v.description ?? '' })) ?? []
  );
  const [pendingVideos, setPendingVideos] = useState<PendingVideo[]>(initialVideos);

  const commitChanges = (danceId: number, fns: Parameters<typeof commitVideoChanges>[3]) =>
    commitVideoChanges(initialVideos, pendingVideos, danceId, fns);

  return {
    pendingVideos,
    setPendingVideos,
    hasPendingChanges: JSON.stringify(pendingVideos) !== JSON.stringify(initialVideos),
    commitChanges,
  };
};

export const useAddDanceVideo = () => {
  const { toastError } = useNotify();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ danceId, url, description }: { danceId: number; url: string; description: string | null }) =>
      addDanceVideo(danceId, url, description),
    onSuccess: (_, { danceId }) => {
      queryClient.invalidateQueries({ queryKey: ['dance', danceId] });
      queryClient.invalidateQueries({ queryKey: ['dances'] });
    },
    onError: (err: Error) => toastError(err.message || 'Error adding video'),
  });
};

export const useRemoveDanceVideo = () => {
  const { toastError } = useNotify();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number; danceId: number }) =>
      removeDanceVideo(id),
    onSuccess: (_, { danceId }) => {
      queryClient.invalidateQueries({ queryKey: ['dance', danceId] });
      queryClient.invalidateQueries({ queryKey: ['dances'] });
    },
    onError: (err: Error) => toastError(err.message || 'Error removing video'),
  });
};

export const useUpdateDanceVideo = () => {
  const { toastError } = useNotify();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, url, description }: { id: number; danceId: number; url: string; description: string | null }) =>
      updateDanceVideo(id, url, description),
    onSuccess: (_, { danceId }) => {
      queryClient.invalidateQueries({ queryKey: ['dance', danceId] });
      queryClient.invalidateQueries({ queryKey: ['dances'] });
    },
    onError: (err: Error) => toastError(err.message || 'Error updating video'),
  });
};
