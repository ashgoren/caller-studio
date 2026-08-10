import { makeLookupHook } from './factories/makeLookupHook';
import type { DanceTypeRow } from '@/lib/types/database';

export const useDanceTypes = makeLookupHook<DanceTypeRow>('dance_types');
