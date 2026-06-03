declare module 'vscode' {
  export interface Disposable {
    dispose(): unknown;
  }

  export interface ExtensionContext {
    subscriptions: Disposable[];
    extensionUri: Uri;
  }

  export interface CancellationToken {
    isCancellationRequested: boolean;
  }

  export class Uri {
    static joinPath(base: Uri, ...pathSegments: string[]): Uri;
    static file(path: string): Uri;
    fsPath: string;
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

  export class Location {
    constructor(uri: Uri, rangeOrPosition: Range | Position);
    uri: Uri;
    range: Range;
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

  export enum SymbolKind {
    File = 0,
    Module = 1,
    Namespace = 2,
    Package = 3,
    Class = 4,
    Method = 5,
    Property = 6,
    Field = 7,
    Constructor = 8,
    Enum = 9,
    Interface = 10,
    Function = 11
  }

  export class DocumentSymbol {
    constructor(name: string, detail: string, kind: SymbolKind, range: Range, selectionRange: Range);
    name: string;
    detail: string;
    kind: SymbolKind;
    range: Range;
    selectionRange: Range;
  }

  export class SymbolInformation {
    constructor(name: string, kind: SymbolKind, containerName: string, location: Location);
    name: string;
    kind: SymbolKind;
    containerName: string;
    location: Location;
  }

  export type Definition = Location | Location[];

  export class MarkdownString {
    constructor(value?: string);
    value: string;
  }

  export class Hover {
    constructor(contents: MarkdownString | string | Array<MarkdownString | string>, range?: Range);
    contents: Array<MarkdownString | string>;
    range?: Range;
  }

  export enum CompletionItemKind {
    Text = 0,
    Method = 1,
    Function = 2,
    Constructor = 3,
    Field = 4,
    Variable = 5,
    Class = 6,
    Interface = 7,
    Module = 8,
    Property = 9,
    Unit = 10,
    Value = 11,
    Enum = 12,
    Keyword = 13
  }

  export class CompletionItem {
    constructor(label: string, kind?: CompletionItemKind);
    label: string;
    kind?: CompletionItemKind;
    detail?: string;
    documentation?: string | MarkdownString;
    insertText?: string;
  }

  export class ParameterInformation {
    constructor(label: string, documentation?: string | MarkdownString);
    label: string;
    documentation?: string | MarkdownString;
  }

  export class SignatureInformation {
    constructor(label: string, documentation?: string | MarkdownString);
    label: string;
    documentation?: string | MarkdownString;
    parameters: ParameterInformation[];
  }

  export class SignatureHelp {
    signatures: SignatureInformation[];
    activeSignature: number;
    activeParameter: number;
  }

  export class SemanticTokensLegend {
    constructor(tokenTypes: string[], tokenModifiers?: string[]);
    tokenTypes: string[];
    tokenModifiers: string[];
  }

  export class SemanticTokens {
    readonly data: Uint32Array;
  }

  export class SemanticTokensBuilder {
    constructor(legend?: SemanticTokensLegend);
    push(line: number, char: number, length: number, tokenType: number, tokenModifiers?: number): void;
    build(): SemanticTokens;
  }

  export interface DocumentSemanticTokensProvider {
    provideDocumentSemanticTokens(document: TextDocument, token?: CancellationToken): SemanticTokens | Promise<SemanticTokens>;
  }

  export interface HoverProvider {
    provideHover(document: TextDocument, position: Position, token?: CancellationToken): Hover | null | Promise<Hover | null>;
  }

  export interface CompletionItemProvider {
    provideCompletionItems(document: TextDocument, position: Position, token?: CancellationToken): CompletionItem[] | Promise<CompletionItem[]>;
  }

  export interface SignatureHelpProvider {
    provideSignatureHelp(document: TextDocument, position: Position, token?: CancellationToken): SignatureHelp | null | Promise<SignatureHelp | null>;
  }

  export interface DocumentSymbolProvider {
    provideDocumentSymbols(document: TextDocument, token?: CancellationToken): DocumentSymbol[] | Promise<DocumentSymbol[]>;
  }

  export interface DefinitionProvider {
    provideDefinition(document: TextDocument, position: Position, token?: CancellationToken): Definition | null | Promise<Definition | null>;
  }

  export interface WorkspaceSymbolProvider {
    provideWorkspaceSymbols(query: string, token?: CancellationToken): SymbolInformation[] | Promise<SymbolInformation[]>;
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
    export function registerDocumentSymbolProvider(languageId: string, provider: DocumentSymbolProvider): Disposable;
    export function registerHoverProvider(languageId: string, provider: HoverProvider): Disposable;
    export function registerCompletionItemProvider(languageId: string, provider: CompletionItemProvider, ...triggerCharacters: string[]): Disposable;
    export function registerSignatureHelpProvider(languageId: string, provider: SignatureHelpProvider, ...triggerCharacters: string[]): Disposable;
    export function registerDocumentSemanticTokensProvider(languageId: string, provider: DocumentSemanticTokensProvider, legend: SemanticTokensLegend): Disposable;
    export function registerDefinitionProvider(languageId: string, provider: DefinitionProvider): Disposable;
    export function registerWorkspaceSymbolProvider(provider: WorkspaceSymbolProvider): Disposable;
    export function createDiagnosticCollection(name: string): DiagnosticCollection;
  }

  export interface FileSystemWatcher extends Disposable {
    onDidCreate(listener: (uri: Uri) => unknown): Disposable;
    onDidChange(listener: (uri: Uri) => unknown): Disposable;
    onDidDelete(listener: (uri: Uri) => unknown): Disposable;
  }

  export namespace workspace {
    export const textDocuments: readonly TextDocument[];
    export function getConfiguration(section?: string): WorkspaceConfiguration;
    export function findFiles(include: string, exclude?: string, maxResults?: number): Promise<Uri[]>;
    export function createFileSystemWatcher(globPattern: string): FileSystemWatcher;
    export function onDidOpenTextDocument(listener: (document: TextDocument) => unknown): Disposable;
    export function onDidChangeTextDocument(listener: (event: TextDocumentChangeEvent) => unknown): Disposable;
    export function onDidSaveTextDocument(listener: (document: TextDocument) => unknown): Disposable;
    export function onDidCloseTextDocument(listener: (document: TextDocument) => unknown): Disposable;
    export function onDidChangeConfiguration(listener: (event: ConfigurationChangeEvent) => unknown): Disposable;
  }
}
