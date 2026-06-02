export interface MumpsParameterSignature {
  label: string;
  documentation: string;
}

export interface MumpsSignatureDoc {
  token: string;
  label: string;
  documentation: string;
  parameters: MumpsParameterSignature[];
}

export const SIGNATURE_DOCS: MumpsSignatureDoc[] = [
  {
    token: '$P',
    label: '$PIECE(string,delimiter,piece)',
    documentation: 'Returns a delimited piece from a string.',
    parameters: [
      { label: 'string', documentation: 'Source string to inspect.' },
      { label: 'delimiter', documentation: 'Delimiter used to split the string.' },
      { label: 'piece', documentation: 'One-based piece number to return.' }
    ]
  },
  {
    token: '$G',
    label: '$GET(variable,default)',
    documentation: 'Returns a variable value or a default if undefined.',
    parameters: [
      { label: 'variable', documentation: 'Local or global variable reference.' },
      { label: 'default', documentation: 'Optional value returned when the variable is undefined.' }
    ]
  },
  {
    token: '$O',
    label: '$ORDER(variable,direction)',
    documentation: 'Returns the next or previous subscript in collating order.',
    parameters: [
      { label: 'variable', documentation: 'Subscripted variable reference to traverse.' },
      { label: 'direction', documentation: 'Optional direction: 1 for forward or -1 for reverse.' }
    ]
  },
  {
    token: '$D',
    label: '$DATA(variable)',
    documentation: 'Returns data/descendant status for a variable.',
    parameters: [{ label: 'variable', documentation: 'Local or global variable reference.' }]
  },
  {
    token: '$L',
    label: '$LENGTH(string,delimiter)',
    documentation: 'Returns string length or number of delimiter pieces.',
    parameters: [
      { label: 'string', documentation: 'Source string to measure.' },
      { label: 'delimiter', documentation: 'Optional delimiter for piece counting.' }
    ]
  },
  {
    token: '$E',
    label: '$EXTRACT(string,start,end)',
    documentation: 'Returns characters from a string by position.',
    parameters: [
      { label: 'string', documentation: 'Source string.' },
      { label: 'start', documentation: 'One-based starting character position.' },
      { label: 'end', documentation: 'Optional ending character position.' }
    ]
  },
  {
    token: '$F',
    label: '$FIND(string,substring,start)',
    documentation: 'Finds a substring and returns the position after it.',
    parameters: [
      { label: 'string', documentation: 'Source string to search.' },
      { label: 'substring', documentation: 'Text to find.' },
      { label: 'start', documentation: 'Optional one-based search start position.' }
    ]
  },
  {
    token: '$NA',
    label: '$NAME(variable,subscriptLevel)',
    documentation: 'Returns the canonical name of a variable reference.',
    parameters: [
      { label: 'variable', documentation: 'Local or global variable reference.' },
      { label: 'subscriptLevel', documentation: 'Optional number of subscripts to include.' }
    ]
  }
];

const SIGNATURE_DOC_MAP = new Map(SIGNATURE_DOCS.map((doc) => [doc.token, doc]));

export function getSignatureDoc(token: string): MumpsSignatureDoc | undefined {
  return SIGNATURE_DOC_MAP.get(token.toUpperCase());
}
