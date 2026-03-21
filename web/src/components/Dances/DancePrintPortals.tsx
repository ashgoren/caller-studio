import { createPortal } from 'react-dom';
import type { RefObject } from 'react';
import { SECTIONS, COLS, INTRO_COLS, cellKey } from './cueGridConstants';
import { PRINT_CUES_COMBINED } from './printStyles';
import type { Dance, FigureItem, CueGridData } from '@/lib/types/database';

// --- Shared print helpers ---

const PrintFigureList = ({
  figures,
  fontSize,
  phraseGap,
  contGap,
  beatsWidth,
}: {
  figures: FigureItem[];
  fontSize: string;
  phraseGap: string;
  contGap: string;
  beatsWidth: string;
}) => (
  <>
    {figures.map((figure, i) => {
      const isNewPhrase = i === 0 || figure.phrase !== figures[i - 1].phrase;
      return (
        <div key={figure.id} style={{ display: 'flex', marginTop: isNewPhrase && i > 0 ? phraseGap : contGap }}>
          <span style={{ width: '2.2em', flexShrink: 0, fontWeight: 'bold', fontSize }}>{isNewPhrase ? figure.phrase : ''}</span>
          <span style={{ width: beatsWidth, flexShrink: 0, color: '#666', fontSize }}>{figure.beats != null ? `(${figure.beats})` : ''}</span>
          <span style={{ fontSize }}>{figure.description}</span>
        </div>
      );
    })}
  </>
);

export const PrintCuesTable = ({
  cues,
  cellHeight,
  labelPaddingTop,
  cellPadding,
}: {
  cues: CueGridData;
  cellHeight: number;
  labelPaddingTop: number;
  cellPadding: string;
}) => (
  <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: '100%', fontFamily: '"Roboto","Helvetica","Arial",sans-serif', fontSize: '14px', lineHeight: 1.4 }}>
    <colgroup>
      <col style={{ width: 32 }} />
      {Array.from({ length: COLS }, (_, i) => <col key={i} style={{ width: 52 }} />)}
    </colgroup>
    <tbody>
      {SECTIONS.flatMap((section) => {
        const labelTd = (
          <td rowSpan={section.rows} style={{ fontWeight: 'bold', fontSize: '12px', textAlign: 'center', verticalAlign: 'top', paddingTop: labelPaddingTop, paddingRight: 10 }}>
            {section.label}
          </td>
        );
        if (section.rows === 1) {
          return [(
            <tr key={`${section.id}:0`}>
              {labelTd}
              <td colSpan={COLS - INTRO_COLS} />
              {Array.from({ length: INTRO_COLS }, (_, i) => {
                const col = COLS - INTRO_COLS + i;
                const text = cues[cellKey(section.id, 0, col)];
                return <td key={col} style={{ padding: cellPadding, height: cellHeight, color: text ? 'black' : '#bbb', textAlign: 'center', verticalAlign: 'middle', wordBreak: 'break-word' }} dangerouslySetInnerHTML={{ __html: text ?? '•' }} />;
              })}
            </tr>
          )];
        }
        return [0, 1].map((row, rowIdx) => (
          <tr key={`${section.id}:${row}`} style={rowIdx === 0 ? { borderTop: '1px solid #ccc' } : undefined}>
            {rowIdx === 0 && labelTd}
            {Array.from({ length: COLS }, (_, col) => {
              const text = cues[cellKey(section.id, row, col)];
              return <td key={col} style={{ padding: cellPadding, height: cellHeight, color: text ? 'black' : '#bbb', textAlign: 'center', verticalAlign: 'middle', wordBreak: 'break-word' }} dangerouslySetInnerHTML={{ __html: text ?? '•' }} />;
            })}
          </tr>
        ));
      })}
    </tbody>
  </table>
);

// --- Exported component ---

export const DancePrintPortals = ({
  dance,
  figuresLabel,
  choreographerNames,
  combinedPrintRef,
  choreographyPrintRef,
}: {
  dance: Dance;
  figuresLabel: string;
  choreographerNames: string;
  combinedPrintRef: RefObject<HTMLDivElement | null>;
  choreographyPrintRef: RefObject<HTMLDivElement | null>;
}) => {
  const { figures, cues, title } = dance;
  const hasCues = !!cues && Object.keys(cues).length > 0;

  return (
    <>
      {/* Combined print — 8.5×11, choreography top half / cues bottom half */}
      {figures.length > 0 && hasCues && createPortal(
        <div style={{ position: 'fixed', top: '-100vh', left: 0, width: 456 }}>
          <div ref={combinedPrintRef} style={{ background: 'white', color: 'black' }}>
            <div style={{ height: 504, overflow: 'hidden', boxSizing: 'border-box', borderBottom: '2px dashed #999' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontSize: '16pt', fontWeight: 'bold', lineHeight: 1.2, fontFamily: 'Georgia, serif' }}>{title}</div>
                {figuresLabel && <div style={{ fontSize: '10pt', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Georgia, serif' }}>{figuresLabel}</div>}
              </div>
              {choreographerNames && <div style={{ fontSize: '10pt', fontStyle: 'italic', marginBottom: '0.3em', fontFamily: 'Georgia, serif' }}>by {choreographerNames}</div>}
              <hr style={{ border: 'none', borderTop: '1px solid black', margin: '0.2em 0 0.8em 0' }} />
              <div style={{ fontFamily: 'Georgia, serif' }}>
                <PrintFigureList figures={figures} fontSize='10pt' phraseGap='0.8em' contGap='0.25em' beatsWidth='2.8em' />
              </div>
            </div>
            <div style={{ height: 504, overflow: 'hidden', boxSizing: 'border-box' }}>
              <PrintCuesTable cues={cues} {...PRINT_CUES_COMBINED} />
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Choreography-only print — 8.5×11 */}
      {figures.length > 0 && createPortal(
        <div style={{ position: 'fixed', top: '-100vh', left: 0, width: '680px' }}>
          <div ref={choreographyPrintRef} style={{ background: 'white', color: 'black', fontFamily: 'Georgia, serif' }}>
            <div style={{ fontSize: '26pt', fontWeight: 'bold', lineHeight: 1.2, marginBottom: '0.15em' }}>{title}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.6em' }}>
              <span style={{ fontSize: '13pt', fontStyle: 'italic' }}>{choreographerNames ? `by ${choreographerNames}` : ''}</span>
              <span style={{ fontSize: '10pt', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{figuresLabel}</span>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid black', margin: '0 0 1.2em 0' }} />
            <PrintFigureList figures={figures} fontSize='11pt' phraseGap='1em' contGap='0.3em' beatsWidth='3em' />
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
