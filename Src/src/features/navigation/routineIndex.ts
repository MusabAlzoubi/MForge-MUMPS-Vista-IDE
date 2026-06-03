import * as path from 'node:path';
import * as vscode from 'vscode';
import { isMumpsUri, SUPPORTED_EXTENSIONS } from '../../config/language';
import { parseMumpsRoutine } from '../../parser/routineParser';
import { MumpsLabel, RoutineParseResult } from '../../parser/types';

const DEFAULT_MAX_WORKSPACE_FILES = 2000;
const EXCLUDED_SEGMENTS = new Set(['node_modules', '.git', 'dist', 'out', 'Old Extensions']);
const EXTENSIONS = new Set<string>(SUPPORTED_EXTENSIONS.map((extension) => extension.toLowerCase()));
const WATCHER_DEBOUNCE_MS = 250;
const WORKSPACE_ROUTINE_GLOB = '**/*.{m,M,mumps,mps,rou,int}';
const WORKSPACE_EXTENSIONLESS_GLOB = '**/*';
const EXCLUDE_GLOB = '{**/node_modules/**,**/.git/**,**/dist/**,**/out/**,**/Old Extensions/**}';
const KEY_ROUTINES = ['UJOWXUS', 'UJOWXUS2', 'XPAR', 'XLFSTR', 'DIE', 'DIQ'];
const FILE_TYPE_FILE = 1;
const FILE_TYPE_DIRECTORY = 2;

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

export interface RoutineIndexDiagnostics {
  workspaceFolders: string[];
  includePatterns: string[];
  excludePattern: string;
  maxWorkspaceFiles: number;
  routineSearchPaths: string[];
  indexExtensionlessRoutines: boolean;
  workspaceFilesDiscovered: number;
  searchPathFilesDiscovered: number;
  skippedByExtension: number;
  skippedByExcludes: number;
  indexedFiles: number;
  duplicateRoutineNames: number;
  duplicateRoutineNameList: string[];
  keyRoutineStatus: Record<string, string>;
}

interface BuildRoutineIndexOptions {
  includeExtensionless?: boolean;
}

export function isSupportedRoutineFile(filePath: string, includeExtensionless = false): boolean {
  const extension = path.extname(filePath).toLowerCase();
  if (EXTENSIONS.has(extension)) {
    return true;
  }
  if (!includeExtensionless || extension.length > 0) {
    return false;
  }
  return path.basename(filePath).length > 0;
}

export function shouldIgnoreRoutinePath(filePath: string): boolean {
  return filePath.split(/[\\/]+/u).some((segment) => EXCLUDED_SEGMENTS.has(segment));
}

export function shouldIgnoreRoutineUri(uri: vscode.Uri, includeExtensionless = false): boolean {
  const value = uriPathLike(uri);
  return !isSupportedRoutineFile(value, includeExtensionless) || shouldIgnoreRoutinePath(value);
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

export function buildRoutineIndexFromFiles(files: FileIndexInput[], options: BuildRoutineIndexOptions = {}): RoutineIndexData {
  const includeExtensionless = options.includeExtensionless ?? false;
  const routines = files
    .filter((file) => isSupportedRoutineFile(file.filePath, includeExtensionless))
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
  private rebuildGeneration = 0;
  private lastDiagnostics: RoutineIndexDiagnostics = createEmptyDiagnostics();

  constructor(private readonly output?: vscode.OutputChannel) {}

  dispose(): void {
    this.watcher?.dispose();
    if (this.dirtyTimer) {
      clearTimeout(this.dirtyTimer);
    }
  }

  registerWatchers(context: vscode.ExtensionContext): void {
    this.watcher = vscode.workspace.createFileSystemWatcher(WORKSPACE_ROUTINE_GLOB);
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
        if (
          event.affectsConfiguration('mforge.maxWorkspaceFiles') ||
          event.affectsConfiguration('mforge.workspaceScanDebounceMs') ||
          event.affectsConfiguration('mforge.routineSearchPaths') ||
          event.affectsConfiguration('mforge.indexExtensionlessRoutines')
        ) {
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

  getLastDiagnostics(): RoutineIndexDiagnostics {
    return this.lastDiagnostics;
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
    const generation = ++this.rebuildGeneration;
    const maxFiles = getMaxWorkspaceFiles();
    const includeExtensionless = getIndexExtensionlessRoutines();
    const searchPaths = getRoutineSearchPaths();
    const includePattern = includeExtensionless ? WORKSPACE_EXTENSIONLESS_GLOB : WORKSPACE_ROUTINE_GLOB;
    const diagnostics = createEmptyDiagnostics();
    diagnostics.workspaceFolders = getWorkspaceFolders().map((folder) => folder.uri.toString());
    diagnostics.includePatterns = [includePattern, ...searchPaths.map((configuredPath) => `${configuredPath}/**/*`)];
    diagnostics.excludePattern = EXCLUDE_GLOB;
    diagnostics.maxWorkspaceFiles = maxFiles;
    diagnostics.routineSearchPaths = searchPaths;
    diagnostics.indexExtensionlessRoutines = includeExtensionless;

    const seenUris = new Set<string>();
    const inputs: FileIndexInput[] = [];

    const workspaceUris = await vscode.workspace.findFiles(includePattern, EXCLUDE_GLOB, maxFiles);
    diagnostics.workspaceFilesDiscovered = workspaceUris.length;
    await this.collectInputs(workspaceUris, inputs, seenUris, diagnostics, includeExtensionless);

    const searchPathUris = await this.findConfiguredRoutineUris(maxFiles, diagnostics);
    await this.collectInputs(searchPathUris, inputs, seenUris, diagnostics, includeExtensionless);

    const data = buildRoutineIndexFromFiles(inputs, { includeExtensionless });
    const duplicateNames = findDuplicateRoutineNames(data.routines);
    diagnostics.indexedFiles = inputs.length;
    diagnostics.duplicateRoutineNames = duplicateNames.length;
    diagnostics.duplicateRoutineNameList = duplicateNames;

    if (generation !== this.rebuildGeneration && data.routines.length < this.routines.size) {
      this.debug(`Discarded stale rebuild with ${data.routines.length} routine(s); current index has ${this.routines.size}.`);
      return;
    }

    this.routines = new Map();
    this.routinesByUri = new Map();
    for (const routine of data.routines) {
      this.upsertRoutine(routine);
    }
    for (const document of vscode.workspace.textDocuments) {
      this.indexOpenDocument(document);
    }
    diagnostics.indexedFiles = this.routines.size;
    diagnostics.keyRoutineStatus = this.createKeyRoutineStatus();
    this.lastDiagnostics = diagnostics;
    this.built = true;
    this.output?.appendLine(`[navigation] Indexed ${this.routines.size} MUMPS routine(s), ${this.getLabelCount()} label(s).`);
    this.output?.appendLine(
      `[navigation] Scan diagnostics: workspace=${diagnostics.workspaceFilesDiscovered}, searchPaths=${diagnostics.searchPathFilesDiscovered}, skippedExtension=${diagnostics.skippedByExtension}, skippedExcludes=${diagnostics.skippedByExcludes}, duplicates=${diagnostics.duplicateRoutineNames}.`
    );
    this.logDebugIndexSummary();
  }

  async findRoutineCandidatesInSearchPaths(name: string): Promise<vscode.Uri[]> {
    const target = name.toUpperCase();
    const diagnostics = createEmptyDiagnostics();
    const uris = await this.findConfiguredRoutineUris(getMaxWorkspaceFiles() * 5, diagnostics);
    return uris.filter((uri) => routineNameFromUri(uri).toUpperCase().includes(target));
  }

  private async collectInputs(
    uris: vscode.Uri[],
    inputs: FileIndexInput[],
    seenUris: Set<string>,
    diagnostics: RoutineIndexDiagnostics,
    includeExtensionless: boolean
  ): Promise<void> {
    for (const uri of uris) {
      const key = uriKey(uri);
      if (seenUris.has(key)) {
        continue;
      }
      seenUris.add(key);
      const value = uriPathLike(uri);
      if (shouldIgnoreRoutinePath(value)) {
        diagnostics.skippedByExcludes += 1;
        this.debug(`Skipped by exclude: ${uri.toString()}`);
        continue;
      }
      if (!isSupportedRoutineFile(value, includeExtensionless)) {
        diagnostics.skippedByExtension += 1;
        continue;
      }
      try {
        inputs.push({ filePath: value, uri, text: await readWorkspaceText(uri) });
      } catch (error) {
        this.debug(`Could not index ${uri.toString()}: ${String(error)}`);
      }
    }
  }

  private async findConfiguredRoutineUris(maxFiles: number, diagnostics: RoutineIndexDiagnostics): Promise<vscode.Uri[]> {
    const roots = getConfiguredRoutineSearchRoots();
    const results: vscode.Uri[] = [];
    const seen = new Set<string>();
    for (const root of roots) {
      await this.collectDirectoryUris(root, results, seen, diagnostics, maxFiles);
      if (results.length >= maxFiles) {
        break;
      }
    }
    return results;
  }

  private async collectDirectoryUris(
    root: vscode.Uri,
    results: vscode.Uri[],
    seen: Set<string>,
    diagnostics: RoutineIndexDiagnostics,
    maxFiles: number
  ): Promise<void> {
    if (results.length >= maxFiles) {
      return;
    }
    try {
      const entries = await vscode.workspace.fs.readDirectory(root);
      for (const [name, type] of entries) {
        const child = vscode.Uri.joinPath(root, name);
        if ((type & FILE_TYPE_DIRECTORY) === FILE_TYPE_DIRECTORY) {
          await this.collectDirectoryUris(child, results, seen, diagnostics, maxFiles);
        } else if ((type & FILE_TYPE_FILE) === FILE_TYPE_FILE || type === 0) {
          const key = uriKey(child);
          if (!seen.has(key)) {
            seen.add(key);
            diagnostics.searchPathFilesDiscovered += 1;
            results.push(child);
          }
          if (results.length >= maxFiles) {
            return;
          }
        }
      }
    } catch (error) {
      this.debug(`Could not scan routine search path ${root.toString()}: ${String(error)}`);
    }
  }

  private upsertRoutine(routine: IndexedRoutine): void {
    const normalized = routine.name.toUpperCase();
    const existingByName = this.routines.get(normalized);
    if (existingByName) {
      this.routinesByUri.delete(existingByName.uriKey);
    }
    this.routines.set(normalized, { ...routine, name: normalized });
    this.routinesByUri.set(routine.uriKey, { ...routine, name: normalized });
  }

  private createKeyRoutineStatus(): Record<string, string> {
    const status: Record<string, string> = {};
    for (const name of KEY_ROUTINES) {
      const routine = this.findRoutine(name);
      status[name] = routine ? `FOUND ${routine.uri.toString()} (${routine.labels.length} label(s))` : 'not indexed';
    }
    return status;
  }

  private logDebugIndexSummary(): void {
    const traceLevel = vscode.workspace.getConfiguration('mforge').get<string>('trace.level', 'off');
    if (traceLevel !== 'debug') {
      return;
    }
    const routines = this.getRoutines();
    const diagnostics = this.lastDiagnostics;
    this.output?.appendLine(`[navigation] Workspace folders: ${diagnostics.workspaceFolders.join(', ') || '(none)'}`);
    this.output?.appendLine(`[navigation] Include patterns: ${diagnostics.includePatterns.join(', ')}`);
    this.output?.appendLine(`[navigation] Exclude pattern: ${diagnostics.excludePattern}`);
    this.output?.appendLine(`[navigation] mforge.maxWorkspaceFiles: ${diagnostics.maxWorkspaceFiles}`);
    this.output?.appendLine(`[navigation] mforge.routineSearchPaths: ${diagnostics.routineSearchPaths.join(', ') || '(none)'}`);
    this.output?.appendLine(`[navigation] mforge.indexExtensionlessRoutines: ${diagnostics.indexExtensionlessRoutines}`);
    this.output?.appendLine(`[navigation] First routines: ${routines.slice(0, 20).map((routine) => routine.name).join(', ') || '(none)'}`);
    if (diagnostics.duplicateRoutineNameList.length > 0) {
      this.output?.appendLine(`[navigation] Duplicate routine names: ${diagnostics.duplicateRoutineNameList.join(', ')}`);
    }
    for (const name of KEY_ROUTINES) {
      this.output?.appendLine(`[navigation] Index contains ${name}: ${diagnostics.keyRoutineStatus[name] ?? 'not indexed'}`);
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

function getRoutineSearchPaths(): string[] {
  const configured = vscode.workspace.getConfiguration('mforge').get<string[]>('routineSearchPaths', []);
  return Array.isArray(configured) ? configured.filter((entry) => typeof entry === 'string' && entry.trim().length > 0).map((entry) => entry.trim()) : [];
}

function getIndexExtensionlessRoutines(): boolean {
  return vscode.workspace.getConfiguration('mforge').get<boolean>('indexExtensionlessRoutines', false);
}

function getWorkspaceFolders(): readonly vscode.WorkspaceFolder[] {
  return vscode.workspace.workspaceFolders ?? [];
}

function getConfiguredRoutineSearchRoots(): vscode.Uri[] {
  const folders = getWorkspaceFolders();
  const roots: vscode.Uri[] = [];
  for (const configuredPath of getRoutineSearchPaths()) {
    if (/^[a-z][a-z0-9+.-]*:/iu.test(configuredPath) && typeof vscode.Uri.parse === 'function') {
      roots.push(vscode.Uri.parse(configuredPath));
    } else if (path.isAbsolute(configuredPath)) {
      roots.push(vscode.Uri.file(configuredPath));
    } else if (folders.length > 0) {
      for (const folder of folders) {
        roots.push(vscode.Uri.joinPath(folder.uri, configuredPath));
      }
    } else {
      roots.push(vscode.Uri.file(path.resolve(configuredPath)));
    }
  }
  return roots;
}

function createEmptyDiagnostics(): RoutineIndexDiagnostics {
  return {
    workspaceFolders: [],
    includePatterns: [],
    excludePattern: EXCLUDE_GLOB,
    maxWorkspaceFiles: DEFAULT_MAX_WORKSPACE_FILES,
    routineSearchPaths: [],
    indexExtensionlessRoutines: false,
    workspaceFilesDiscovered: 0,
    searchPathFilesDiscovered: 0,
    skippedByExtension: 0,
    skippedByExcludes: 0,
    indexedFiles: 0,
    duplicateRoutineNames: 0,
    duplicateRoutineNameList: [],
    keyRoutineStatus: {}
  };
}

function findDuplicateRoutineNames(routines: IndexedRoutine[]): string[] {
  const counts = new Map<string, number>();
  for (const routine of routines) {
    const normalized = routine.name.toUpperCase();
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([name]) => name)
    .sort();
}
