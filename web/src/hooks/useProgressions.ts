import { makeLookupHook } from './factories/makeLookupHook';
import type { ProgressionRow } from '@/lib/types/database';

export const useProgressions = makeLookupHook<ProgressionRow>('progressions');
