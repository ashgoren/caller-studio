import { createPortal } from 'react-dom';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Box, Menu, MenuItem, useMediaQuery } from '@mui/material';
import { SECTIONS, COLS, INTRO_COLS, CELL_HEIGHT, CELL_FONT_SIZE, cellKey } from './cueGridConstants';
import { CueColGroup } from './CueGrid';
import type { CueGridData } from '@/lib/types/database';

const CELL_PADDING = 2; // px around each <td>
const CONTENT_HEIGHT = CELL_HEIGHT - CELL_PADDING * 2;

const isEmptyHtml = (html: string) => !html.replace(/<[^>]*>/g, '').trim();

// Remove <font size="3"> tags (browser default — semantically a no-op) so they
// don't cause false dirty-state mismatches against unformatted original content.
const stripDefaultFontSize = (html: string): string => {
  const div = document.createElement('div');
  div.innerHTML = html;
  div.querySelectorAll('font[size="3"]').forEach(el => el.replaceWith(...el.childNodes));
  return div.innerHTML;
};

const editableSx = {
  display: 'block',
  width: '100%',
  height: CONTENT_HEIGHT,
  textAlign: 'center',
  fontSize: CELL_FONT_SIZE,
  lineHeight: 1.4,
  fontFamily: 'inherit',
  wordBreak: 'break-word',
  color: 'text.primary',
  background: 'transparent',
  border: '1px solid transparent',
  borderRadius: '3px',
  outline: 'none',
  overflow: 'hidden',
  py: '3px',
  px: '1px',  // cell(2px) + editable(1px) + border(1px) = 4px per side = view's px:'4px'
  boxSizing: 'border-box',
  cursor: 'text',
  '&[data-empty]::before': {
    content: '"•"',
    color: 'text.disabled',
    pointerEvents: 'none',
  },
  '&:hover': { borderColor: 'divider' },
  '&:focus': { borderColor: 'primary.main', bgcolor: 'action.focus' },
} as const;

const CueCell = ({ initialHtml, onCommit }: { initialHtml: string; onCommit: (html: string) => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  const lastHtml = useRef<string | null>(null);

  // Seed innerHTML on mount and sync external changes (e.g. reset), but skip
  // when the value echoes back from our own onCommit to avoid cursor jumps.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (initialHtml !== lastHtml.current) {
      el.innerHTML = initialHtml;
      lastHtml.current = initialHtml;
      if (initialHtml) el.removeAttribute('data-empty');
      else el.setAttribute('data-empty', '');
    }
  }, [initialHtml]);

  const handleInput = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const normalized = isEmptyHtml(el.innerHTML) ? '' : stripDefaultFontSize(el.innerHTML);
    lastHtml.current = normalized;
    if (normalized) el.removeAttribute('data-empty');
    else el.setAttribute('data-empty', '');
    onCommit(normalized);
  }, [onCommit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!(e.metaKey || e.ctrlKey) || !e.shiftKey) return;
    if (e.key === '.' || e.key === '>') {
      e.preventDefault();
      const current = parseInt(document.queryCommandValue('fontSize') || '3', 10);
      document.execCommand('fontSize', false, String(Math.min(current + 1, 4)));
    } else if (e.key === ',' || e.key === '<') {
      e.preventDefault();
      const current = parseInt(document.queryCommandValue('fontSize') || '3', 10);
      document.execCommand('fontSize', false, String(Math.max(current - 1, 2)));
    }
  }, []);

  return (
    <Box
      ref={ref}
      component='div'
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      data-empty=''
      sx={editableSx}
    />
  );
};

// Floating toolbar button — prevents focus loss on both mouse and touch.
const FmtBtn = ({ label, title, onAction, style }: {
  label: string; title: string; onAction: () => void; style?: React.CSSProperties;
}) => (
  <Box
    component='button'
    title={title}
    sx={{
      border: 'none', background: 'none', cursor: 'pointer',
      px: '9px', py: '7px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      lineHeight: 1, color: 'text.primary',
      '&:hover': { bgcolor: 'action.hover' },
      '&:active': { bgcolor: 'action.selected' },
    }}
    style={style}
    onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
    onTouchStart={(e: React.TouchEvent) => e.preventDefault()}
    onTouchEnd={(e: React.TouchEvent) => { e.preventDefault(); onAction(); }}
    onClick={onAction}
  >
    {label}
  </Box>
);

export const CueGridEditor = ({
  value,
  onChange,
}: {
  value: CueGridData | null;
  onChange: (v: CueGridData | null) => void;
}) => {
  const isNarrow = useMediaQuery('(max-width: 900px)');
  const cells = useMemo(() => value?.cells ?? {}, [value]);
  const separators = useMemo(() => new Set(value?.separators ?? []), [value]);

  const [menuState, setMenuState] = useState<{ x: number; y: number; key: string } | null>(null);

  // Long-press separator toggle
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  }, []);

  // Selection formatting popup
  const editorRef = useRef<HTMLDivElement>(null);
  const [selPopup, setSelPopup] = useState<{ x: number; y: number } | null>(null);
  const savedRange = useRef<Range | null>(null);

  useEffect(() => {
    const onSel = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount || !editorRef.current) {
        setSelPopup(null);
        return;
      }
      const range = sel.getRangeAt(0);
      if (!editorRef.current.contains(range.commonAncestorContainer)) {
        setSelPopup(null);
        return;
      }
      savedRange.current = range.cloneRange();
      if (!isNarrow) return;
      const rect = range.getBoundingClientRect();
      setSelPopup({ x: rect.left + rect.width / 2, y: rect.top });
    };
    document.addEventListener('selectionchange', onSel);
    return () => document.removeEventListener('selectionchange', onSel);
  }, []);

  // Restore saved selection, run a formatting command, then re-save the range.
  const applyCmd = useCallback((cmd: () => void) => {
    const r = savedRange.current;
    if (r) {
      const sel = window.getSelection();
      if (sel) { sel.removeAllRanges(); sel.addRange(r); }
    }
    cmd();
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed && sel.rangeCount) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      setSelPopup({ x: rect.left + rect.width / 2, y: rect.top });
    }
  }, []);

  const applyFontSize = useCallback((delta: 1 | -1) => {
    applyCmd(() => {
      const current = parseInt(document.queryCommandValue('fontSize') || '3', 10);
      document.execCommand('fontSize', false, String(Math.min(Math.max(current + delta, 2), 4)));
    });
  }, [applyCmd]);

  const writeBack = useCallback(
    (nextCells: Record<string, string>, nextSeps: Set<string>) => {
      const sepArray = [...nextSeps];
      const empty = Object.keys(nextCells).length === 0 && sepArray.length === 0;
      onChange(empty ? null : { cells: nextCells, ...(sepArray.length > 0 && { separators: sepArray }) });
    },
    [onChange],
  );

  const handleChange = useCallback(
    (section: string, row: number, col: number, html: string) => {
      const key = cellKey(section, row, col);
      const nextCells = { ...cells };
      if (html) nextCells[key] = html;
      else delete nextCells[key];
      writeBack(nextCells, separators);
    },
    [cells, separators, writeBack],
  );

  const handleToggleSeparator = useCallback(
    (key: string) => {
      const next = new Set(separators);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      writeBack(cells, next);
    },
    [cells, separators, writeBack],
  );

  const renderCell = (section: string, row: number, col: number) => {
    const key = cellKey(section, row, col);
    const hasSep = separators.has(key);
    const isLastCol = col === COLS - 1;
    return (
      <Box
        component='td'
        key={col}
        sx={{
          p: `${CELL_PADDING}px`,
          height: CELL_HEIGHT,
          ...(hasSep && { borderRight: '3px solid', borderRightColor: 'divider' }),
        }}
        onContextMenu={!isLastCol ? (e) => {
          e.preventDefault();
          setMenuState({ x: e.clientX, y: e.clientY, key });
        } : undefined}
        onTouchStart={!isLastCol ? () => {
          longPressTimer.current = setTimeout(() => {
            longPressTimer.current = null;
            // Don't steal a text-selection gesture
            const sel = window.getSelection();
            if (sel && !sel.isCollapsed) return;
            handleToggleSeparator(key);
          }, 600);
        } : undefined}
        onTouchEnd={cancelLongPress}
        onTouchMove={cancelLongPress}
      >
        <CueCell
          initialHtml={cells[key] ?? ''}
          onCommit={(html) => handleChange(section, row, col, html)}
        />
      </Box>
    );
  };

  return (
    <Box ref={editorRef}>
      <Box sx={{ overflowX: 'auto', border: 1, borderColor: 'divider', borderRadius: 1, p: 1, width: 'fit-content', maxWidth: '100%' }}>
        <Box component='table' sx={{
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
        }}>
          <CueColGroup />
          <Box component='tbody'>
            {SECTIONS.flatMap((section) => {
              const labelCell = (
                <Box
                  component='td'
                  rowSpan={section.rows}
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    textAlign: 'center',
                    verticalAlign: 'top',
                    color: 'text.disabled',
                    userSelect: 'none',
                    pr: 4,
                    pt: 1
                  }}
                >
                  {section.label}
                </Box>
              );

              if (section.rows === 1) {
                return [(
                  <Box component='tr' key={`${section.id}:0`}>
                    {labelCell}
                    <Box component='td' colSpan={COLS - INTRO_COLS} />
                    {Array.from({ length: INTRO_COLS }, (_, i) =>
                      renderCell(section.id, 0, COLS - INTRO_COLS + i)
                    )}
                  </Box>
                )];
              }

              return [0, 1].map((row, rowIdx) => (
                <Box
                  key={`${section.id}:${row}`}
                  component='tr'
                  sx={rowIdx === 0 ? { '& td': { borderTop: '1px solid', borderColor: 'divider' } } : undefined}
                >
                  {rowIdx === 0 && labelCell}
                  {Array.from({ length: COLS }, (_, col) => renderCell(section.id, row, col))}
                </Box>
              ));
            })}
          </Box>
        </Box>
      </Box>

      <Menu
        open={!!menuState}
        onClose={() => setMenuState(null)}
        anchorReference='anchorPosition'
        anchorPosition={menuState ? { top: menuState.y, left: menuState.x } : undefined}
      >
        <MenuItem onClick={() => { handleToggleSeparator(menuState!.key); setMenuState(null); }}>
          {menuState && separators.has(menuState.key) ? 'Remove separator' : 'Add separator after cell'}
        </MenuItem>
      </Menu>

      {selPopup && createPortal(
        <Box sx={{
          position: 'fixed',
          top: selPopup.y - 6,
          left: selPopup.x,
          transform: 'translate(-50%, -100%)',
          zIndex: 1500,
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          boxShadow: 4,
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
        }}>
          <FmtBtn label='B' title='Bold' onAction={() => applyCmd(() => document.execCommand('bold'))}
            style={{ fontWeight: 700, fontSize: '0.875rem' }} />
          <FmtBtn label='I' title='Italic' onAction={() => applyCmd(() => document.execCommand('italic'))}
            style={{ fontStyle: 'italic', fontSize: '0.875rem' }} />
          <Box sx={{ width: '1px', alignSelf: 'stretch', bgcolor: 'divider', my: '4px' }} />
          <FmtBtn label='A' title='Smaller text' onAction={() => applyFontSize(-1)}
            style={{ fontWeight: 700, fontSize: '0.625rem' }} />
          <FmtBtn label='A' title='Larger text' onAction={() => applyFontSize(1)}
            style={{ fontWeight: 700, fontSize: '1rem' }} />
        </Box>,
        document.body
      )}
    </Box>
  );
};
