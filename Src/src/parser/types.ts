export interface MumpsStringSpan {
  start: number;
  end: number;
  closed: boolean;
}

export interface MumpsCommandToken {
  token: string;
  normalized: string;
  start: number;
  end: number;
}

export interface MumpsGlobalToken {
  token: string;
  start: number;
  end: number;
}

export interface ParsedMumpsLine {
  raw: string;
  lineNumber?: number;
  code: string;
  comment: string | null;
  commentStart: number | null;
  label: string | null;
  labelStart: number | null;
  labelEnd: number | null;
  invalidLabel: string | null;
  invalidLabelStart: number | null;
  dotBlockLevel: number;
  commandTextStart: number;
  commands: MumpsCommandToken[];
  globals: MumpsGlobalToken[];
  strings: MumpsStringSpan[];
  hasUnterminatedString: boolean;
  parenBalance: number;
  hasTrailingWhitespace: boolean;
}


export interface MumpsLabel {
  name: string;
  parameters: string[];
  signature: string;
  line: number;
  startCharacter: number;
  endCharacter: number;
  nameStartCharacter: number;
  nameEndCharacter: number;
}

export interface MumpsReference {
  label: string | null;
  routine: string | null;
  startCharacter: number;
  endCharacter: number;
  labelStartCharacter: number | null;
  labelEndCharacter: number | null;
  routineStartCharacter: number | null;
  routineEndCharacter: number | null;
  raw: string;
}

export interface RoutineParseResult {
  routineName?: string;
  labels: MumpsLabel[];
  lines: ParsedMumpsLine[];
}
