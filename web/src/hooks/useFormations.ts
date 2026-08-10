import { makeLookupHook } from './factories/makeLookupHook';
import type { FormationRow } from '@/lib/types/database';

export const useFormations = makeLookupHook<FormationRow>('formations');
