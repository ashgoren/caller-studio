/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useCallback, useState, useMemo, useEffect, useRef } from 'react';
import { queryClient } from '@/lib/react-query';
import { closeSnackbar, enqueueSnackbar } from 'notistack';
import { useNavigate, useLocation } from 'react-router';
import type { ReactNode, RefObject, Dispatch, SetStateAction } from 'react';

type UndoOp =
  | { type: 'insert'; table: string; record: Record<string, unknown> }
  | { type: 'update'; table: string; id: number; before: Record<string, unknown>; after: Record<string, unknown> }
  | { type: 'delete'; table: string; id: number; record: Record<string, unknown> };

export type UndoAction = {
  label: string;
  ops: UndoOp[];
};

type UndoState = {
  canUndo: boolean;
  canRedo: boolean;
  undoLabel: string | null;
  redoLabel: string | null;
  isExecuting: boolean;
};

type UndoActions = {
  pushAction: (action: UndoAction) => void;
  clearStacks: () => void;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  setFormActive: (v: boolean) => void;
};

const UndoStateContext = createContext<UndoState | null>(null);
const UndoActionsContext = createContext<UndoActions | null>(null);

function invertOps(ops: UndoOp[]): UndoOp[] {
  return ops.map(op => {
    switch (op.type) {
      case 'insert':
        return { type: 'delete', table: op.table, id: (op.record as { id: number }).id, record: op.record };
      case 'delete':
        return { type: 'insert', table: op.table, record: op.record };
      case 'update':
        return { type: 'update', table: op.table, id: op.id, before: op.after, after: op.before };
    }
  });
}

function isDependent(op: UndoOp): boolean {
  const record = op.type === 'update' ? op.after : op.record;
  return Object.keys(record).some(k => k.endsWith('_id'));
}

function isFkViolation(error: unknown): boolean {
  return !!error && typeof error === 'object' && (error as { code?: string }).code === '23503';
}

// Wrap a Supabase/Postgres error as a real Error (so `err.message` keeps working everywhere
// it's used today) while preserving `.code`, so isFkViolation can still recognize it after
// it's been thrown and caught rather than read straight off the raw { error } result.
export function supabaseError(error: { message: string; code?: string }): Error {
  return Object.assign(new Error(error.message), { code: error.code });
}

// Table name -> the actual insert/update/delete functions used for live mutations on that
// table, registered by each hook file. Lets undo/redo replay call the exact same code a live
// edit would, instead of a second, separate raw-Supabase path.
type Mutator = {
  insert?: (record: Record<string, unknown>) => Promise<unknown>;
  update?: (id: number, updates: Record<string, unknown>) => Promise<unknown>;
  delete?: (id: number) => Promise<unknown>;
};
const mutatorRegistry = new Map<string, Mutator>();

export function registerMutator(table: string, mutator: Mutator): void {
  mutatorRegistry.set(table, mutator);
}

function getMutator(table: string): Mutator {
  const mutator = mutatorRegistry.get(table);
  if (!mutator) throw new Error(`No mutator registered for table "${table}"`);
  return mutator;
}

function sortOps(ops: UndoOp[]): UndoOp[] {
  return [...ops].sort((a, b) => {
    if (a.type === 'delete' && b.type === 'insert') return -1;
    if (a.type === 'insert' && b.type === 'delete') return 1;
    if (a.type === 'insert' && b.type === 'insert') {
      return Number(isDependent(a)) - Number(isDependent(b));
    }
    if (a.type === 'delete' && b.type === 'delete') {
      return Number(isDependent(b)) - Number(isDependent(a));
    }
    return 0;
  });
}

async function executeOps(ops: UndoOp[], onPartial?: () => void): Promise<void> {
  const sorted = sortOps(ops);
  let skipped = 0;

  for (const op of sorted) {
    const mutator = getMutator(op.table);
    try {
      switch (op.type) {
        case 'insert':
          if (!mutator.insert) throw new Error(`No insert mutator for table "${op.table}"`);
          await mutator.insert(op.record);
          break;
        case 'delete':
          if (!mutator.delete) throw new Error(`No delete mutator for table "${op.table}"`);
          await mutator.delete(op.id);
          break;
        case 'update':
          if (!mutator.update) throw new Error(`No update mutator for table "${op.table}"`);
          await mutator.update(op.id, op.after);
          break;
      }
    } catch (error) {
      if (op.type === 'insert' && isDependent(op) && isFkViolation(error)) {
        skipped++;
      } else {
        throw error;
      }
    }
  }

  if (skipped > 0) onPartial?.();
}

const TABLE_PATHS: Record<string, string> = { dances: '/dances', programs: '/programs' };

function navigateAwayIfOnDeletedRecord(ops: UndoOp[], navigate: (path: string) => void, path: string) {
  const deleted = ops.find(op => op.type === 'delete' && op.table in TABLE_PATHS);
  if (!deleted || deleted.type !== 'delete') return;
  const parentRoute = TABLE_PATHS[deleted.table];
  if (path.startsWith(`${parentRoute}/${deleted.id}`)) {
    navigate(parentRoute);
  }
}

export const UndoProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);
  const [redoStack, setRedoStack] = useState<UndoAction[]>([]);
  const undoStackRef = useRef(undoStack);
  const redoStackRef = useRef(redoStack);
  const navigateRef = useRef(navigate);
  const locationRef = useRef(location);

  const [isFormActive, setFormActive] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const isExecutingRef = useRef(false);

  useEffect(() => { undoStackRef.current = undoStack; }, [undoStack]);
  useEffect(() => { redoStackRef.current = redoStack; }, [redoStack]);
  useEffect(() => { navigateRef.current = navigate; }, [navigate]);
  useEffect(() => { locationRef.current = location; }, [location]);

  // console.log(`Undo Stack (${undoStack.length}): ${undoStack.map(a => a.label)}`);
  // console.log(`Redo Stack (${redoStack.length}): ${redoStack.map(a => a.label)}`);

  const state: UndoState = {
    canUndo: !isFormActive && undoStack.length > 0,
    canRedo: !isFormActive && redoStack.length > 0,
    undoLabel: undoStack.at(-1)?.label ?? null,
    redoLabel: redoStack.at(-1)?.label ?? null,
    isExecuting,
  };

  const pushAction = useCallback((action: UndoAction) => {
    setUndoStack(prev => [...prev, action]);
    setRedoStack([]);
  }, []);

  const clearStacks = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  const executeAction = useCallback(async (
    sourceRef: RefObject<UndoAction[]>,
    popStack: Dispatch<SetStateAction<UndoAction[]>>,
    pushStack: Dispatch<SetStateAction<UndoAction[]>>,
  ) => {
    if (isExecutingRef.current) return;
    const action = sourceRef.current.at(-1);
    if (!action) return;

    isExecutingRef.current = true;
    setIsExecuting(true);
    try {
      const ops = invertOps(action.ops);
      closeSnackbar();
      await executeOps(ops, () => enqueueSnackbar('Restored with some relations missing — linked records may have been deleted.', { variant: 'warning' }));
      popStack(prev => prev.slice(0, -1));
      pushStack(prev => [...prev, { label: action.label, ops }]);
      navigateAwayIfOnDeletedRecord(ops, navigateRef.current, locationRef.current.pathname);
    } catch (e) {
      console.error('Undo/redo failed:', e);
    } finally {
      await queryClient.refetchQueries({ type: 'active' });
      isExecutingRef.current = false;
      setIsExecuting(false);
    }
  }, []);

  const undo = useCallback(() => executeAction(undoStackRef, setUndoStack, setRedoStack), [executeAction]);
  const redo = useCallback(() => executeAction(redoStackRef, setRedoStack, setUndoStack), [executeAction]);

  const actions = useMemo(() => ({ pushAction, undo, redo, clearStacks, setFormActive }), [pushAction, undo, redo, clearStacks, setFormActive]);

  return (
    <UndoActionsContext.Provider value={actions}>
      <UndoStateContext.Provider value={state}>
        {children}
      </UndoStateContext.Provider>
    </UndoActionsContext.Provider>
  );
};

export const useUndoState = () => {
  const context = useContext(UndoStateContext);
  if (!context) throw new Error('useUndoState must be used within UndoProvider');
  return context;
};

export const useUndoActions = () => {
  const context = useContext(UndoActionsContext);
  if (!context) throw new Error('useUndoActions must be used within UndoProvider');
  return context;
};


// Helpers for building undo ops at call sites

export function pick<T extends object>(obj: T | undefined | null, keys: (keyof T)[]): Partial<T> {
  if (!obj) return {};
  return Object.fromEntries(keys.filter(k => k in obj).map(k => [k, obj[k]])) as Partial<T>;
}

export function omit<T extends object>(obj: T, keys: (keyof T)[]): Partial<T> {
  const excluded = new Set(keys);
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !excluded.has(key as keyof T))
  ) as Partial<T>;
}

export function recordInsert(
  pushAction: UndoActions['pushAction'],
  table: string,
  record: Record<string, unknown>,
  label: string
): void {
  pushAction({ label, ops: [{ type: 'insert', table, record }] });
}

export function recordUpdate(
  pushAction: UndoActions['pushAction'],
  table: string,
  id: number,
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  label: string
): void {
  pushAction({ label, ops: [{ type: 'update', table, id, before, after }] });
}

export function recordDelete(
  pushAction: UndoActions['pushAction'],
  table: string,
  id: number,
  record: Record<string, unknown>,
  label: string
): void {
  pushAction({ label, ops: [{ type: 'delete', table, id, record }] });
}

export function relationOps(
  table: string,
  added: Record<string, unknown>[],
  removed: ({ id: number } & Record<string, unknown>)[]
): UndoOp[] {
  return [
    ...added.map((record): UndoOp => ({ type: 'insert', table, record })),
    ...removed.map((record): UndoOp => ({ type: 'delete', table, id: record.id, record })),
  ];
}
