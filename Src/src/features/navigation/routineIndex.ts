import * as path from 'node:path';
import * as vscode from 'vscode';
import { isMumpsUri, SUPPORTED_EXTENSIONS } from '../../config/language';
import { parseMumpsRoutine } from '../../parser/routineParser';
import { MumpsLabel, RoutineParseResult } from '../../parser/types';

const DEFAULT_MAX_WORKSPACE_FILES = 2000;
const EXCLUDED_SEGMENTS = new Set(['node_modules', '.git', 'dist', 'out', 'Old Extensions']);
const EXTENSIONS = new Set<string>(SUPPORTED_EXTENSIONS.map((extension) => extension.toLowerCase()));
const WATCHER_DEBOUNCE_MS = 250;

export interface IndexedRoutine {
  name: string;
  uri: vscode.Uri;
  filePath: string;
  uriKey: string;
  labels: MumpsLabel[];
}

export interface RoutineIndexData {
  routines: IndexedRoutine[];
}

export interface FileIndexInput {
  filePath: string;
  text: string;
  uri?: vscode.Uri;
}

export function isSupportedRoutineFile(filePath: string): boolean {
  return EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

export function shouldIgnoreRoutinePath(filePath: string): boolean {
  return filePath.split(/[\\/]+/u).some((segment) => EXCLUDED_SEGMENTS.has(segment));
}

export function shouldIgnoreRoutineUri(uri: vscode.Uri): boolean {
  const value = uriPathLike(uri);
  return !isSupportedRoutineFile(value) || shouldIgnoreRoutinePath(value);
}

export function routineNameFromFile(filePath: string): string {
  return path.basename(filePath, path.extname(filePath));
}

export function routineNameFromUri(uri: vscode.Uri): string {
  const value = uriPathLike(uri);
  const slash = Math.max(value.lastIndexOf('/'), value.lastIndexOf('\\'));
  const fileName = slash >= 0 ? value.slice(slash + 1) : value;
  const dot = fileName.lastIndexOf('.');
  return dot > 0 ? fileName.slice(0, dot) : fileName;
}

export function uriPathLike(uri: vscode.Uri): string {
  return typeof uri.fsPath === 'string' && uri.fsPath.length > 0 ? uri.fsPath : (uri.path ?? '');
}

export function uriKey(uri: vscode.Uri): string {
  return typeof uri.toString === 'function' ? uri.toString() : uriPathLike(uri);
}

export function buildRoutineIndexFromFiles(files: FileIndexInput[]): RoutineIndexData {
  const routines = files
    .filter((file) => isSupportedRoutineFile(file.filePath))
    .filter((file) => !shouldIgnoreRoutinePath(file.filePath))
    .map((file) => {
      const uri = file.uri ?? vscode.Uri.file(path.resolve(file.filePath));
      const name = file.uri ? routineNameFromUri(file.uri) : routineNameFromFile(file.filePath);
      return {
        name,
        uri,
        filePath: file.filePath,
        uriKey: uriKey(uri),
        labels: parseMumpsRoutine(file.text, name).labels
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));

  return { routines };
}

export class MumpsRoutineIndex implements vscode.Disposable {
  private routines = new Map<string, IndexedRoutine>();
  private routinesByUri = new Map<string, IndexedRoutine>();
  private documentCache = new Map<string, RoutineParseResult>();
  private built = false;
  private watcher: vscode.FileSystemWatcher | null = null;
  private dirtyTimer: ReturnType<typeof setTimeout> | null = null;
  private buildPromise: Promise<void> | null = null;

  constructor(private readonly output?: vscode.OutputChannel) {}

  dispose(): void {
    this.watcher?.dispose();
    if (this.dirtyTimer) {
      clearTimeout(this.dirtyTimer);
    }
  }

  registerWatchers(context: vscode.ExtensionContext): void {
    this.watcher = vscode.workspace.createFileSystemWatcher('**/*.{m,M,mumps,mps,rou,int}');
    context.subscriptions.push(
      this.watcher,
      this.watcher.onDidCreate(() => this.markDirtyDebounced()),
      this.watcher.onDidChange(() => this.markDirtyDebounced()),
      this.watcher.onDidDelete((uri) => {
        this.removeDocument(uri);
        this.markDirtyDebounced();
      }),
      vscode.workspace.onDidOpenTextDocument((document) => this.indexOpenDocument(document)),
      vscode.workspace.onDidChangeTextDocument((event) => this.indexOpenDocument(event.document)),
      vscode.workspace.onDidCloseTextDocument((document) => this.dropDocumentCache(document.uri)),
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('mforge.maxWorkspaceFiles') || event.affectsConfiguration('mforge.workspaceScanDebounceMs')) {
          this.markDirty();
        }
      })
    );

    for (const document of vscode.workspace.textDocuments) {
      this.indexOpenDocument(document);
    }
  }

  async ensureBuilt(): Promise<void> {
    if (this.built) {
      return;
    }
    if (!this.buildPromise) {
      this.buildPromise = this.rebuild().finally(() => {
        this.buildPromise = null;
      });
    }
    await this.buildPromise;
  }

  markDirty(): void {
    this.built = false;
  }

  clear(): void {
    this.routines.clear();
    this.routinesByUri.clear();
    this.documentCache.clear();
    this.built = false;
  }

  getLabelCount(): number {
    return this.getRoutines().reduce((total, routine) => total + routine.labels.length, 0);
  }

  markDirtyDebounced(): void {
    if (this.dirtyTimer) {
      clearTimeout(this.dirtyTimer);
    }
    this.dirtyTimer = setTimeout(() => {
      this.markDirty();
      this.dirtyTimer = null;
    }, getWorkspaceScanDebounceMs());
  }

  getRoutines(): IndexedRoutine[] {
    return Array.from(this.routines.values()).sort((left, right) => left.name.localeCompare(right.name));
  }

  findRoutine(name: string): IndexedRoutine | undefined {
    return this.routines.get(name.toUpperCase());
  }

  findRoutineByUri(uri: vscode.Uri): IndexedRoutine | undefined {
    return this.routinesByUri.get(uriKey(uri));
  }

  findLabel(routineName: string, labelName: string): MumpsLabel | undefined {
    return this.findRoutine(routineName)?.labels.find((label) => label.name.toUpperCase() === labelName.toUpperCase());
  }

  hasRoutine(name: string): boolean {
    return this.routines.has(name.toUpperCase());
  }

  parseDocument(document: vscode.TextDocument): RoutineParseResult | null {
    if (!isMumpsUri(document.uri, document.languageId)) {
      return null;
    }
    const key = uriKey(document.uri);
    const cached = this.documentCache.get(key);
    if (cached) {
      return cached;
    }
    const parsed = parseMumpsRoutine(document.getText(), routineNameFromUri(document.uri));
    this.documentCache.set(key, parsed);
    return parsed;
  }

  indexOpenDocument(document: vscode.TextDocument): void {
    if (!isMumpsUri(document.uri, document.languageId)) {
      return;
    }
    const parsed = parseMumpsRoutine(document.getText(), routineNameFromUri(document.uri));
    const routine: IndexedRoutine = {
      name: parsed.routineName ?? routineNameFromUri(document.uri),
      uri: document.uri,
      filePath: uriPathLike(document.uri),
      uriKey: uriKey(document.uri),
      labels: parsed.labels
    };
    this.documentCache.set(routine.uriKey, parsed);
    this.upsertRoutine(routine);
  }

  removeDocument(uri: vscode.Uri): void {
    const key = uriKey(uri);
    const current = this.routinesByUri.get(key);
    if (current) {
      this.routines.delete(current.name.toUpperCase());
      this.routinesByUri.delete(key);
    }
    this.documentCache.delete(key);
  }

  dropDocumentCache(uri: vscode.Uri): void {
    this.documentCache.delete(uriKey(uri));
  }

  async rebuild(): Promise<void> {
    const maxFiles = getMaxWorkspaceFiles();
    const files = await vscode.workspace.findFiles('**/*.{m,M,mumps,mps,rou,int}', '{**/node_modules/**,**/.git/**,**/dist/**,**/out/**,**/Old Extensions/**}', maxFiles);
    const inputs: FileIndexInput[] = [];

    for (const uri of files) {
      if (shouldIgnoreRoutineUri(uri)) {
        continue;
      }
      try {
        inputs.push({ filePath: uriPathLike(uri), uri, text: await readWorkspaceText(uri) });
      } catch (error) {
        this.debug(`Could not index ${uri.toString()}: ${String(error)}`);
      }
    }

    const data = buildRoutineIndexFromFiles(inputs.slice(0, maxFiles));
    this.routines = new Map();
    this.routinesByUri = new Map();
    for (const routine of data.routines) {
      this.upsertRoutine(routine);
    }
    for (const document of vscode.workspace.textDocuments) {
      this.indexOpenDocument(document);
    }
    this.built = true;
    this.output?.appendLine(`[navigation] Indexed ${this.routines.size} MUMPS routine(s), ${this.getLabelCount()} label(s).`);
    this.logDebugIndexSummary();
  }

  private upsertRoutine(routine: IndexedRoutine): void {
    const existingByName = this.routines.get(routine.name.toUpperCase());
    if (existingByName) {
      this.routinesByUri.delete(existingByName.uriKey);
    }
    this.routines.set(routine.name.toUpperCase(), routine);
    this.routinesByUri.set(routine.uriKey, routine);
  }

  private logDebugIndexSummary(): void {
    const traceLevel = vscode.workspace.getConfiguration('mforge').get<string>('trace.level', 'off');
    if (traceLevel !== 'debug') {
      return;
    }
    const routines = this.getRoutines();
    this.output?.appendLine(`[navigation] First routines: ${routines.slice(0, 20).map((routine) => routine.name).join(', ') || '(none)'}`);
    for (const name of ['UJOWXUS', 'XPAR', 'XLFSTR', 'DIE', 'DIQ']) {
      const routine = this.findRoutine(name);
      this.output?.appendLine(`[navigation] Index contains ${name}: ${routine ? `yes (${routine.uri.toString()})` : 'no'}`);
    }
  }

  private debug(message: string): void {
    const traceLevel = vscode.workspace.getConfiguration('mforge').get<string>('trace.level', 'off');
    if (traceLevel === 'debug') {
      this.output?.appendLine(`[navigation] ${message}`);
    }
  }
}

async function readWorkspaceText(uri: vscode.Uri): Promise<string> {
  const bytes = await vscode.workspace.fs.readFile(uri);
  return new TextDecoder('utf-8').decode(bytes);
}

function getMaxWorkspaceFiles(): number {
  const configured = vscode.workspace.getConfiguration('mforge').get<number>('maxWorkspaceFiles', DEFAULT_MAX_WORKSPACE_FILES);
  return Number.isFinite(configured) && configured > 0 ? Math.floor(configured) : DEFAULT_MAX_WORKSPACE_FILES;
}

function getWorkspaceScanDebounceMs(): number {
  const configured = vscode.workspace.getConfiguration('mforge').get<number>('workspaceScanDebounceMs', WATCHER_DEBOUNCE_MS);
  return Number.isFinite(configured) && configured >= 0 ? Math.floor(configured) : WATCHER_DEBOUNCE_MS;
}
