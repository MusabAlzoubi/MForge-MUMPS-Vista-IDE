declare module 'vscode' {
  export interface Disposable {
    dispose(): unknown;
  }

  export interface ExtensionContext {
    subscriptions: Disposable[];
    extensionUri: Uri;
  }

  export class Uri {
    static joinPath(base: Uri, ...pathSegments: string[]): Uri;
  }

  export class Position {
    constructor(line: number, character: number);
    line: number;
    character: number;
  }

  export class Range {
    constructor(start: Position, end: Position);
    constructor(startLine: number, startCharacter: number, endLine: number, endCharacter: number);
    start: Position;
    end: Position;
  }

  export class TextEdit {
    static replace(range: Range, newText: string): TextEdit;
    static insert(position: Position, newText: string): TextEdit;
  }

  export interface TextLine {
    text: string;
    rangeIncludingLineBreak: Range;
  }

  export interface TextDocument {
    uri: Uri;
    languageId: string;
    lineCount: number;
    getText(): string;
    lineAt(line: number): TextLine;
  }

  export interface TextDocumentChangeEvent {
    document: TextDocument;
  }

  export interface ConfigurationChangeEvent {
    affectsConfiguration(section: string): boolean;
  }

  export interface WorkspaceConfiguration {
    get<T>(section: string, defaultValue: T): T;
  }

  export interface OutputChannel extends Disposable {
    appendLine(value: string): void;
    show(): void;
  }

  export interface DocumentFormattingEditProvider {
    provideDocumentFormattingEdits(document: TextDocument): TextEdit[];
  }

  export interface FormattingOptions {
    tabSize: number;
    insertSpaces: boolean;
  }

  export interface OnTypeFormattingEditProvider {
    provideOnTypeFormattingEdits(document: TextDocument, position: Position, ch: string, options?: FormattingOptions): TextEdit[];
  }

  export enum DiagnosticSeverity {
    Error = 0,
    Warning = 1,
    Information = 2,
    Hint = 3
  }

  export class Diagnostic {
    constructor(range: Range, message: string, severity?: DiagnosticSeverity);
    range: Range;
    message: string;
    severity: DiagnosticSeverity;
    source?: string;
    code?: string | number;
  }

  export interface DiagnosticCollection extends Disposable {
    set(uri: Uri, diagnostics: Diagnostic[]): void;
    delete(uri: Uri): void;
  }

  export namespace window {
    export function createOutputChannel(name: string): OutputChannel;
    export function showInformationMessage(message: string, ...items: string[]): Promise<string | undefined>;
  }

  export namespace commands {
    export function registerCommand(command: string, callback: (...args: unknown[]) => unknown): Disposable;
    export function executeCommand<T = unknown>(command: string, ...rest: unknown[]): Promise<T>;
  }

  export namespace languages {
    export function registerDocumentFormattingEditProvider(languageId: string, provider: DocumentFormattingEditProvider): Disposable;
    export function registerOnTypeFormattingEditProvider(languageId: string, provider: OnTypeFormattingEditProvider, firstTriggerCharacter: string, ...moreTriggerCharacter: string[]): Disposable;
    export function createDiagnosticCollection(name: string): DiagnosticCollection;
  }

  export namespace workspace {
    export const textDocuments: readonly TextDocument[];
    export function getConfiguration(section?: string): WorkspaceConfiguration;
    export function onDidOpenTextDocument(listener: (document: TextDocument) => unknown): Disposable;
    export function onDidChangeTextDocument(listener: (event: TextDocumentChangeEvent) => unknown): Disposable;
    export function onDidSaveTextDocument(listener: (document: TextDocument) => unknown): Disposable;
    export function onDidCloseTextDocument(listener: (document: TextDocument) => unknown): Disposable;
    export function onDidChangeConfiguration(listener: (event: ConfigurationChangeEvent) => unknown): Disposable;
  }
}
