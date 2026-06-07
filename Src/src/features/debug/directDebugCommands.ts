import * as vscode from 'vscode';

const outputChannel = vscode.window.createOutputChannel('MForge MUMPS Debug');
const zbreakHistory: string[] = [];
let positionStatusItem: vscode.StatusBarItem | undefined;
let latestZposition = '';
let lastDirectCommand = '';
let lastDirectOutput = '';
let directDebugTreeProvider: DirectDebugTreeProvider | undefined;

interface RawCommandResponse { accepted?: boolean; command?: string; message?: string; }
interface DirectDebugControl {
  text: string; label: string; description: string; icon: string; tooltip: string; command: string; priority: number; isPosition?: boolean; showInStatus?: boolean;
}

const directDebugControls: DirectDebugControl[] = [
  { text: '$(debug-console) TEST', label: 'Smoke Test', description: 'TEST', icon: 'debug-console', tooltip: 'MForge: Direct Debug Smoke Test', command: 'mforge.directDebugSmokeTest', priority: 202 },
  { text: '$(debug-alt) MDBG', label: 'Direct Debug Setup', description: 'MDBG', icon: 'debug-alt', tooltip: 'MForge: Direct Debug Setup ($ZSTEP + $ZPOSITION + current line)', command: 'mforge.directDebugSetup', priority: 201 },
  { text: '$(debug-continue) ZC', label: 'Continue', description: 'ZCONTINUE', icon: 'debug-continue', tooltip: 'MForge: ZCONTINUE', command: 'mforge.zcontinue', priority: 200 },
  { text: '$(debug-step-over) ZST', label: 'Step Over', description: 'ZSTEP', icon: 'debug-step-over', tooltip: 'MForge: ZSTEP', command: 'mforge.zstep', priority: 199 },
  { text: '$(debug-step-into) INTO', label: 'Step Into', description: 'ZSTEP INTO', icon: 'debug-step-into', tooltip: 'MForge: ZSTEP INTO', command: 'mforge.zstepInto', priority: 198 },
  { text: '$(debug-step-out) OUT', label: 'Step Out', description: 'ZSTEP OUTOF', icon: 'debug-step-out', tooltip: 'MForge: ZSTEP OUTOF', command: 'mforge.zstepOutOf', priority: 197 },
  { text: '$(debug-breakpoint) ZB', label: 'Set Breakpoint', description: 'ZBREAK', icon: 'debug-breakpoint', tooltip: 'MForge: ZBREAK...', command: 'mforge.zbreak', priority: 196 },
  { text: '$(code) ZP', label: 'Print Current Line', description: 'ZPRINT @$ZPOSITION', icon: 'code', tooltip: 'MForge: ZPRINT @$ZPOSITION', command: 'mforge.zprintAtPosition', priority: 195 },
  { text: '$(symbol-variable) ZWR', label: 'Inspect Variables', description: 'ZWRITE', icon: 'symbol-variable', tooltip: 'MForge: ZWRITE variables', command: 'mforge.zwrite', priority: 194 },
  { text: '$(list-tree) ZSH', label: 'Show Stack/Environment', description: 'ZSHOW', icon: 'list-tree', tooltip: 'MForge: ZSHOW stack/environment', command: 'mforge.zshow', priority: 193 },
  { text: '$(settings-gear) $ZSTEP', label: 'Configure Step Printing', description: '$ZSTEP', icon: 'settings-gear', tooltip: 'MForge: Configure $ZSTEP line printing', command: 'mforge.configureZstepLinePrinting', priority: 192 },
  { text: '$(location) $ZPOS', label: 'Show Current Position', description: '$ZPOSITION', icon: 'location', tooltip: 'MForge: Show $ZPOSITION', command: 'mforge.showZposition', priority: 191, isPosition: true },
  { text: '$(terminal) RAW', label: 'Run Raw Direct Command', description: 'DIRECT', icon: 'terminal', tooltip: 'MForge: Send Raw Debug Command...', command: 'mforge.sendRawDebugCommand', priority: 190, showInStatus: false },
  { text: '$(output) OUT', label: 'Open Debug Output', description: 'MForge Debug', icon: 'output', tooltip: 'MForge: Open Direct Debug Output', command: 'mforge.openDirectDebugOutput', priority: 189, showInStatus: false },
  { text: '$(copy) COPY', label: 'Copy Last Output', description: 'last result', icon: 'copy', tooltip: 'MForge: Copy Last Direct Debug Output', command: 'mforge.copyLastDirectDebugOutput', priority: 188, showInStatus: false },
  { text: '$(clear-all) CLEAR', label: 'Clear Debug Output', description: 'Output Channel', icon: 'clear-all', tooltip: 'MForge: Clear Direct Debug Output', command: 'mforge.clearDirectDebugOutput', priority: 187, showInStatus: false }
];

class DirectDebugTreeItem extends vscode.TreeItem {
  constructor(control: DirectDebugControl) {
    super(control.label, vscode.TreeItemCollapsibleState.None);
    this.description = control.isPosition && latestZposition ? latestZposition : control.description;
    this.tooltip = control.isPosition && latestZposition ? `${control.tooltip}: ${latestZposition}` : control.tooltip;
    this.iconPath = new vscode.ThemeIcon(control.icon);
    this.command = { command: control.command, title: control.tooltip };
    this.contextValue = 'mforgeDirectDebugAction';
  }
}

class DirectDebugTreeProvider implements vscode.TreeDataProvider<DirectDebugTreeItem> {
  private readonly changeEmitter = new vscode.EventEmitter<DirectDebugTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this.changeEmitter.event;
  refresh(): void { this.changeEmitter.fire(); }
  getTreeItem(element: DirectDebugTreeItem): vscode.TreeItem { return element; }
  getChildren(): DirectDebugTreeItem[] { return directDebugControls.map((control) => new DirectDebugTreeItem(control)); }
}

export function registerDirectDebugCommands(context: vscode.ExtensionContext): void {
  const register = (command: string, callback: (...args: never[]) => unknown) => context.subscriptions.push(vscode.commands.registerCommand(command, callback));
  const aliases: Array<[string, (...args: never[]) => unknown]> = [
    ['zstep', zstep], ['zcontinue', zcontinue], ['zwrite', zwrite], ['zshow', zshow], ['zbreak', zbreak], ['zprintAtPosition', zprintAtPosition],
    ['zstepInto', zstepInto], ['zstepOutOf', zstepOutOf], ['zprint', zprint], ['configureZstepLinePrinting', configureZstepLinePrinting], ['showZposition', showZposition],
    ['directDebugSetup', directDebugSetup], ['directDebugSmokeTest', directDebugSmokeTest], ['sendRawDebugCommand', sendRawDebugCommand], ['openDirectDebugOutput', openDirectDebugOutput],
    ['copyLastDirectDebugOutput', copyLastDirectDebugOutput], ['clearDirectDebugOutput', clearDirectDebugOutput]
  ];
  for (const [name, callback] of aliases) {
    register(`mforge.${name}`, callback);
    register(`mumps.${name}`, callback);
  }
  directDebugTreeProvider = new DirectDebugTreeProvider();
  context.subscriptions.push(vscode.window.registerTreeDataProvider('mforgeDirectDebug', directDebugTreeProvider));
  const statusItems = directDebugControls.filter((control) => control.showInStatus !== false).map((control) => {
    const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, control.priority);
    item.text = control.text; item.tooltip = control.tooltip; item.command = control.command;
    if (control.isPosition) positionStatusItem = item;
    context.subscriptions.push(item);
    return item;
  });
  const updateVisibility = () => {
    const isMumpsDebugSession = vscode.debug.activeDebugSession?.type === 'mumps';
    for (const item of statusItems) isMumpsDebugSession ? item.show() : item.hide();
    if (!isMumpsDebugSession) updateDirectDebugPosition('');
  };
  context.subscriptions.push(vscode.debug.onDidStartDebugSession(updateVisibility), vscode.debug.onDidTerminateDebugSession(updateVisibility), vscode.debug.onDidChangeActiveDebugSession(updateVisibility));
  updateVisibility();
}

function shouldShowOutput(): boolean { return vscode.workspace.getConfiguration('mforge').get<boolean>('debug.showOutputOnCommand', true) ?? true; }
function directCommandTimeoutMs(): number { return vscode.workspace.getConfiguration('mforge').get<number>('debug.directCommandTimeoutMs', 5000) ?? 5000; }
function appendOutput(message: string, forceShow = false): void { outputChannel.appendLine(message); if (forceShow || shouldShowOutput()) outputChannel.show(true); }
function logCommand(command: string, label?: string): void { appendOutput(`[${new Date().toISOString()}] ${label ? `${label}: ` : ''}${command}`); }
function isDirectCommandError(message: string): boolean { return message.includes('***DIRECTERR') || message.includes('no direct output was returned'); }
function appendCommandResult(command: string, label: string | undefined, message: string): void {
  const normalizedMessage = (message || 'MDEBUG command completed with no output.').trim();
  lastDirectCommand = command; lastDirectOutput = normalizedMessage; updatePositionFromDirectOutput(command, normalizedMessage);
  const isError = isDirectCommandError(normalizedMessage);
  appendOutput(`--- ${isError ? 'ERROR: ' : ''}${label || 'MUMPS Direct Command'} result ---`);
  appendOutput(`Command: ${command}`); appendOutput(normalizedMessage); appendOutput('--- end result ---');
  if (isError) vscode.window.showWarningMessage('MUMPS direct command returned an error. See the MForge MUMPS Debug output channel.');
}
function updatePositionFromDirectOutput(command: string, message: string): void {
  if (!command.toUpperCase().includes('$ZPOSITION')) return;
  const position = message.split(/\r?\n/u).map((line) => line.trim()).find((line) => /^[^\s]+\^[^\s]+$/u.test(line));
  if (position) updateDirectDebugPosition(position);
}
function isLikelyEntryReference(target: string): boolean { return /^[A-Za-z%][A-Za-z0-9%]*(\+\d+)?\^[A-Za-z%][A-Za-z0-9%]*$/u.test(target.trim()); }
function rememberZbreakTarget(target: string): void { const existing = zbreakHistory.indexOf(target); if (existing >= 0) zbreakHistory.splice(existing, 1); zbreakHistory.unshift(target); while (zbreakHistory.length > 5) zbreakHistory.pop(); }
async function pickZbreakTarget(): Promise<string | undefined> {
  if (zbreakHistory.length === 0) return vscode.window.showInputBox({ prompt: 'ZBREAK target (for example: TEST+3^KJOTEST)', placeHolder: 'TAG+OFFSET^ROUTINE' });
  const selected = await vscode.window.showQuickPick([{ label: '$(edit) Enter a new ZBREAK target' }, ...zbreakHistory.map((target) => ({ label: target, target }))], { placeHolder: 'Select a recent ZBREAK target or enter a new one' });
  return selected && 'target' in selected && selected.target ? selected.target : vscode.window.showInputBox({ prompt: 'ZBREAK target (for example: TEST+3^KJOTEST)', placeHolder: 'TAG+OFFSET^ROUTINE' });
}
async function sendDebugCommand(command: string, label?: string): Promise<RawCommandResponse | undefined> {
  const session = vscode.debug.activeDebugSession;
  if (!session || session.type !== 'mumps') {
    const message = 'No active MUMPS debug session.'; appendOutput(`[warning] ${message}`, true); vscode.window.showWarningMessage(message); return undefined;
  }
  logCommand(command, label);
  try {
    const response = await session.customRequest('mumps.rawCommand', { command, timeoutMs: directCommandTimeoutMs() }) as RawCommandResponse | undefined;
    appendCommandResult(command, label, response?.message ?? `MDEBUG accepted command: ${command}`);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error); appendOutput(`[error] ${message}`, true); vscode.window.showErrorMessage(`MUMPS debug command failed: ${message}`); return undefined;
  }
}

export async function zstep(): Promise<void> { await sendDebugCommand('ZSTEP', 'Step'); }
export async function zcontinue(): Promise<void> { await sendDebugCommand('ZCONTINUE', 'Continue'); }
export async function zwrite(): Promise<void> { await sendDebugCommand('ZWRITE', 'Inspect variables'); }
export async function zshow(): Promise<void> { await sendDebugCommand('ZSHOW', 'Show stack/environment'); }
export async function zbreak(): Promise<void> { const target = (await pickZbreakTarget())?.trim(); if (!target) return; if (!isLikelyEntryReference(target) && await vscode.window.showWarningMessage(`'${target}' does not look like TAG+OFFSET^ROUTINE. Send it anyway?`, { modal: false }, 'Send Anyway') !== 'Send Anyway') return; rememberZbreakTarget(target); await sendDebugCommand(`ZBREAK ${target}`, 'Set breakpoint'); }
export async function zprintAtPosition(): Promise<void> { await sendDebugCommand('ZPRINT @$ZPOSITION', 'Print current line'); }
export async function zprint(): Promise<void> { const target = await vscode.window.showInputBox({ prompt: 'ZPRINT target. Leave the default to print the current $ZPOSITION.', value: '@$ZPOSITION', placeHolder: '@$ZPOSITION or TAG+OFFSET^ROUTINE' }); if (target) await sendDebugCommand(`ZPRINT ${target.trim()}`, 'Print code'); }
export async function zstepInto(): Promise<void> { await sendDebugCommand('ZSTEP INTO', 'Step into'); }
export async function zstepOutOf(): Promise<void> { await sendDebugCommand('ZSTEP OUTOF', 'Step out'); }
export async function configureZstepLinePrinting(): Promise<void> { await sendDebugCommand('SET $ZSTEP="ZPRINT @$ZPOSITION BREAK"', 'Configure $ZSTEP line printing'); }
export async function directDebugSetup(): Promise<void> { appendOutput('=== MForge MUMPS Direct Debug Setup ===', true); await configureZstepLinePrinting(); await showZposition(); await zprintAtPosition(); appendOutput('=== End MForge MUMPS Direct Debug Setup ==='); }
export async function directDebugSmokeTest(): Promise<void> { appendOutput('=== MForge MUMPS Direct Debug Smoke Test ===', true); const steps = [['WRITE $ZPOSITION', 'Show $ZPOSITION'], ['ZPRINT @$ZPOSITION', 'Print current line'], ['ZWRITE', 'Inspect variables'], ['ZSHOW', 'Show stack/environment']] as const; let failures = 0; for (const [command, label] of steps) { const response = await sendDebugCommand(command, `Smoke: ${label}`); if (!response?.message || isDirectCommandError(response.message)) failures++; } appendOutput(`Smoke test completed: ${steps.length - failures}/${steps.length} commands returned output without direct-command errors.`); appendOutput('=== End MForge MUMPS Direct Debug Smoke Test ==='); }
export async function showZposition(): Promise<void> { await sendDebugCommand('WRITE $ZPOSITION', 'Show $ZPOSITION'); }
export async function sendRawDebugCommand(): Promise<void> { const command = await vscode.window.showInputBox({ prompt: 'MUMPS/GT.M debug command (for example: ZWRITE, ZSHOW, ZPRINT @$ZPOSITION)' }); if (command) await sendDebugCommand(command, 'Raw command'); }
export function openDirectDebugOutput(): void { outputChannel.show(true); }
export function clearDirectDebugOutput(): void { outputChannel.clear(); lastDirectCommand = ''; lastDirectOutput = ''; appendOutput('MForge MUMPS Debug output cleared.', true); }
export async function copyLastDirectDebugOutput(): Promise<void> { if (!lastDirectOutput) { const message = 'No MUMPS direct debug output has been captured yet.'; appendOutput(`[warning] ${message}`, true); vscode.window.showWarningMessage(message); return; } await vscode.env.clipboard.writeText(lastDirectCommand ? `Command: ${lastDirectCommand}\n${lastDirectOutput}` : lastDirectOutput); vscode.window.showInformationMessage('Copied last MUMPS direct debug output.'); }
export function updateDirectDebugPosition(position: string): void { latestZposition = position; if (positionStatusItem) { positionStatusItem.text = `$(location) ${position || '$ZPOS'}`; positionStatusItem.tooltip = position ? `MUMPS current $ZPOSITION: ${position}` : 'MForge: Show $ZPOSITION'; } directDebugTreeProvider?.refresh(); }
