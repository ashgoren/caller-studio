const BASE = `
  html, body { margin: 0; padding: 0; height: auto !important; min-height: 0 !important; overflow: visible !important; }
`;

const BASE_SERIF = BASE + `
  body { font-family: Georgia, serif !important; font-size: 11pt !important; color: black !important; }
  * { color: black !important; border-color: black !important; font-family: Georgia, serif !important; }
`;

const BASE_SANS = BASE + `
  body { color: black !important; }
  * { color: black !important; box-shadow: none !important; background: transparent !important; }
  table { border-collapse: collapse; table-layout: fixed; }
  td { word-break: break-word; text-align: center; vertical-align: middle; }
  font[size="2"] { font-size: 0.8em; }
  font[size="4"] { font-size: 1.25em; }
`;

// Cue table cell dimensions for standalone 5×7 card print
export const PRINT_CUES_CARD = { cellHeight: 61, labelPaddingTop: 20, cellPadding: '4px 3px' } as const;

// Cue table cell dimensions for the bottom half of the 8.5×11 combined print
export const PRINT_CUES_COMBINED = { cellHeight: 55, labelPaddingTop: 16, cellPadding: '3px' } as const;

export const PAGE_STYLE_WALKTHROUGH = `
  @page { size: 8.5in 11in; margin: 0.4in; }
` + BASE_SERIF + `
  body { line-height: 1.4 !important; }
  p { margin: 0 0 1em 0 !important; font-size: 11pt !important; }
  p:last-child { margin-bottom: 0 !important; }
  .print-dance-title { font-size: 24pt !important; font-weight: bold !important; margin: 0 0 0.5em 0 !important; font-family: Georgia, serif !important; }
  h1 { font-size: 24pt !important; font-weight: bold !important; margin: 0 0 0.4em 0 !important; }
  h2 { font-size: 18pt !important; font-weight: bold !important; margin: 0 0 0.4em 0 !important; }
  h3 { font-size: 14pt !important; font-weight: bold !important; margin: 0 0 0.4em 0 !important; }
  ul, ol { margin: 0 0 0.6em 0 !important; padding-left: 1.4em !important; font-size: 11pt !important; }
  li { font-size: 11pt !important; }
  hr { margin: 1.4em 0 !important; border-color: #888 !important; }
`;

export const PAGE_STYLE_CUES = `
  @page { size: 5in 7in; margin: 0.15in; }
` + BASE_SANS + `
  body { font-family: "Roboto", "Helvetica", "Arial", sans-serif !important; }
`;

export const PAGE_STYLE_COMBINED = `
  @page { size: 8.5in 11in; margin: 0.4in; }
  @page :first { margin: 0.25in 3.5in 0.25in 0.25in; }
` + BASE_SANS + `
  .print-walkthrough-page, .print-walkthrough-page * { font-family: Georgia, serif !important; }
  .print-walkthrough-content p { margin: 0 0 1em 0 !important; font-size: 11pt !important; }
  .print-walkthrough-content p:last-child { margin-bottom: 0 !important; }
  .print-walkthrough-content h1 { font-size: 20pt !important; font-weight: bold !important; margin: 0 0 0.4em 0 !important; }
  .print-walkthrough-content h2 { font-size: 16pt !important; font-weight: bold !important; margin: 0 0 0.4em 0 !important; }
  .print-walkthrough-content h3 { font-size: 13pt !important; font-weight: bold !important; margin: 0 0 0.4em 0 !important; }
  .print-walkthrough-content ul, .print-walkthrough-content ol { margin: 0 0 0.6em 0 !important; padding-left: 1.4em !important; font-size: 11pt !important; }
  .print-walkthrough-content li { font-size: 11pt !important; }
  .print-walkthrough-content hr { margin: 1.4em 0 !important; border-color: #888 !important; }
`;

export const PAGE_STYLE_CHOREOGRAPHY = `
  @page { size: 8.5in 11in; margin: 0.5in 0.6in; }
` + BASE_SERIF + `
  body { line-height: 1.5 !important; }
  * { border-color: #aaa !important; box-shadow: none !important; }
  span, p, div { background: transparent !important; }
`;
