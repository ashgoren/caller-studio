/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useCallback, useState, useMemo, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
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
    switch (op.type) {
      case 'insert': {
        const { error } = await supabase.from(op.table).insert(op.record);
        if (error) {
          if (error.code === '23503' && isDependent(op)) {
            skipped++;
          } else {
            throw error;
          }
        }
        break;
      }
      case 'delete': {
        const { error } = await supabase.from(op.table).delete().eq('id', op.id);
        if (error) throw error;
        break;
      }
      case 'update': {
        const { error } = await supabase.from(op.table).update(op.after).eq('id', op.id);
        if (error) throw error;
        break;
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

export function dbRecord<T extends object>(
  record: T,
  configRecord: Record<string, unknown>
): Record<string, unknown> {
  const keys = new Set(['id', 'created_at', ...Object.keys(configRecord)]);
  return Object.fromEntries(
    Object.entries(record).filter(([key]) => keys.has(key))
  );
}

export function beforeValues<T extends object>(
  current: T,
  updates: Record<string, unknown>,
  configRecord: Record<string, unknown>
): Record<string, unknown> {
  const keys = new Set(['id', 'created_at', ...Object.keys(configRecord)]);
  return Object.fromEntries(
    Object.keys(updates)
      .filter(key => keys.has(key))
      .map(key => [key, (current as Record<string, unknown>)[key]])
  );
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
