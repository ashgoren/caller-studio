// If change this, update also in callersBox.ts
export type CallersBoxData = {
  // request: string; // e.g. "http://www.ibiblio.org/contradance/thecallersbox/dance.php?id=17&format=JSON"
  // download_date: string; // ISO format
  // ID: string; // e.g. "17"
  Name: string; // e.g. "Becket in the Kitchen"
  Authors: string[]; // e.g. ["Becky Hill"]
  // InterpretedBy: string[];
  // Permission: string; // e.g. "full"
  // Status: string;
  // BasedOn: string[];
  FormationBase: string; // e.g. "Duple Minor - Becket"
  FormationDetail: string;
  Progression: string; // e.g. "Single"
  Direction: string; // e.g. "CCW"
  Mixer?: string;
  // Virtual?: string;
  PhraseStructure: string;
  // Music: string[];
  // Tunes: string[];
  phrases: { name: string; figures: string[] }[];
  CallingNotes: string[];
  // Appearances: { source: string; p: string }[];
  // OtherNames: string[];
  // Videos: string[];
  // VirtualVideos: string[];
  // VariantVideos: string[];
  // VariantVirtualVideos: string[];
};
