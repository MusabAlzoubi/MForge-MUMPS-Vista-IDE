export interface MumpsSystemVariableDoc {
  token: string;
  description: string;
  example: string;
}

export const SYSTEM_VARIABLE_DOCS: MumpsSystemVariableDoc[] = [
  { token: '$JOB', description: 'Current process or job identifier.', example: 'WRITE $JOB' },
  { token: '$HOROLOG', description: 'Current date and seconds since midnight as days,seconds.', example: 'WRITE $HOROLOG' },
  { token: '$IO', description: 'Current input/output device identifier.', example: 'WRITE $IO' },
  { token: '$I', description: 'Abbreviation for $IO, the current device identifier.', example: 'WRITE $I' },
  { token: '$T', description: 'Truth value from the most recent command or operation that sets $TEST.', example: 'IF $T WRITE "success"' },
  { token: '$X', description: 'Current horizontal cursor position on the active device.', example: 'WRITE $X' },
  { token: '$Y', description: 'Current vertical cursor position on the active device.', example: 'WRITE $Y' },
  { token: '$TEST', description: 'Truth value used by conditional execution and selected commands.', example: 'IF $TEST WRITE "true"' },
  { token: '$STACK', description: 'Current execution stack depth or stack information, depending on implementation.', example: 'WRITE $STACK' }
];

const SYSTEM_VARIABLE_DOC_MAP = new Map(SYSTEM_VARIABLE_DOCS.map((doc) => [doc.token, doc]));

export function getSystemVariableDoc(token: string): MumpsSystemVariableDoc | undefined {
  return SYSTEM_VARIABLE_DOC_MAP.get(token.toUpperCase());
}
