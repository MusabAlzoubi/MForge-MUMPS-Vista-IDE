export interface MumpsCommandDoc {
  name: string;
  abbreviation?: string;
  description: string;
  syntax: string;
  example: string;
}

export const COMMAND_DOCS: MumpsCommandDoc[] = [
  { name: 'SET', abbreviation: 'S', description: 'Assigns a value to a local or global variable.', syntax: 'SET variable=expression', example: 'SET X=1' },
  { name: 'NEW', abbreviation: 'N', description: 'Creates a new local symbol-table scope for variables.', syntax: 'NEW variable', example: 'NEW X' },
  { name: 'DO', abbreviation: 'D', description: 'Calls a label, routine, or extrinsic entry point.', syntax: 'DO label^routine', example: 'DO EN^XUP' },
  { name: 'QUIT', abbreviation: 'Q', description: 'Exits the current block, label, or routine; may return a value from an extrinsic.', syntax: 'QUIT[:condition] [expression]', example: 'QUIT X' },
  { name: 'FOR', abbreviation: 'F', description: 'Repeats execution for a loop control expression or until explicitly quit.', syntax: 'FOR variable=start:increment:end', example: 'FOR I=1:1:10 WRITE I,!' },
  { name: 'IF', abbreviation: 'I', description: 'Conditionally executes the rest of the command line when the expression is true.', syntax: 'IF expression', example: 'IF X>0 WRITE X' },
  { name: 'ELSE', description: 'Executes when the preceding IF condition on the same execution path was false.', syntax: 'ELSE', example: 'ELSE  WRITE "No value"' },
  { name: 'KILL', abbreviation: 'K', description: 'Deletes local variables, global nodes, or entire variable trees.', syntax: 'KILL variable', example: 'KILL X' },
  { name: 'READ', abbreviation: 'R', description: 'Reads input from the current device into variables or controls input behavior.', syntax: 'READ variable', example: 'READ X' },
  { name: 'WRITE', abbreviation: 'W', description: 'Writes expressions, format controls, or text to the current device.', syntax: 'WRITE expression', example: 'WRITE "Hello",!' },
  { name: 'LOCK', abbreviation: 'L', description: 'Acquires or releases locks for local or global variable names.', syntax: 'LOCK [+|-]name[:timeout]', example: 'LOCK +^TMP($J):5' },
  { name: 'MERGE', description: 'Copies a local or global variable tree into another variable tree.', syntax: 'MERGE target=source', example: 'MERGE ^TMP($J)=DATA' },
  { name: 'OPEN', description: 'Opens a device or file for subsequent USE, READ, or WRITE operations.', syntax: 'OPEN device[:parameters]', example: 'OPEN DEVICE' },
  { name: 'USE', description: 'Selects the current input/output device.', syntax: 'USE device', example: 'USE $P' },
  { name: 'CLOSE', description: 'Closes a previously opened device.', syntax: 'CLOSE device', example: 'CLOSE DEVICE' },
  { name: 'JOB', description: 'Starts a new MUMPS process at a label or routine entry point.', syntax: 'JOB label^routine', example: 'JOB EN^TASK' },
  { name: 'HALT', description: 'Terminates the current MUMPS process.', syntax: 'HALT', example: 'HALT' }
];

const COMMAND_DOC_MAP = new Map<string, MumpsCommandDoc>();
for (const doc of COMMAND_DOCS) {
  COMMAND_DOC_MAP.set(doc.name, doc);
  if (doc.abbreviation) {
    COMMAND_DOC_MAP.set(doc.abbreviation, doc);
  }
}

export function getCommandDoc(token: string): MumpsCommandDoc | undefined {
  return COMMAND_DOC_MAP.get(token.toUpperCase());
}
