export const SECTIONS = [
  { id: 'intro', label: '', rows: 1 as const },
  { id: 'A1', label: 'A1', rows: 2 as const },
  { id: 'A2', label: 'A2', rows: 2 as const },
  { id: 'B1', label: 'B1', rows: 2 as const },
  { id: 'B2', label: 'B2', rows: 2 as const },
];

export const COLS = 8;
export const INTRO_COLS = 4;
export const CELL_HEIGHT = 70;
export const CELL_FONT_SIZE = '1rem';
export const LABEL_WIDTH = 36;  // px, section label column
export const COL_WIDTH = 60;    // px, each beat column

export const cellKey = (section: string, row: number, col: number) =>
  `${section}:${row}:${col}`;

// Natural pixel dimensions of the table — used externally for CSS-transform scaling
export const GRID_NATURAL_WIDTH = LABEL_WIDTH + COLS * COL_WIDTH; // 516
export const GRID_NATURAL_HEIGHT =
  SECTIONS.reduce((sum, s) => sum + s.rows, 0) * CELL_HEIGHT   // 9 × 70 = 630
  + SECTIONS.filter(s => s.rows > 1).length;                    // + 4 section borders = 634
