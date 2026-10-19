export type ErrataCounts = { verified: number; held: number; reported: number };

export type RfcEntry = {
  num: number;
  title: string;
  authors: string[];
  /** As rfc-editor.org prints it, e.g. "August 2022". */
  date: string;
  status: string;
  stream: string | null;
  /** e.g. ["TXT", "HTML"] */
  formats: string[];
  obsoletes: number[];
  obsoletedBy: number[];
  updates: number[];
  updatedBy: number[];
  errata: ErrataCounts;
};

export type RfcIndex = { fetchedAt: string; entries: Record<number, RfcEntry> };
