import * as path from 'node:path';
import * as vscode from 'vscode';
import { isMumpsUri, SUPPORTED_EXTENSIONS } from '../../config/language';
import { parseMumpsRoutine } from '../../parser/routineParser';
import { MumpsLabel, RoutineParseResult } from '../../parser/types';

const DEFAULT_MAX_WORKSPACE_FILES = 5000;
const DEFAULT_MAX_ROUTINE_SEARCH_PATH_FILES = 30000;
const EXCLUDED_SEGMENTS = new Set(['node_modules', '.git', 'dist', 'out', 'Old Extensions', 'objects', 'objects_org', 'localo', 'localo_org', 'generated']);
const EXTENSIONS = new Set<string>(SUPPORTED_EXTENSIONS.map((extension) => extension.toLowerCase()));
const WATCHER_DEBOUNCE_MS = 250;
const WORKSPACE_ROUTINE_GLOB = '**/*.{m,M,mumps,mps,rou,int}';
const WORKSPACE_EXTENSIONLESS_GLOB = '**/*';
const EXCLUDE_GLOB = '{**/node_modules/**,**/.git/**,**/dist/**,**/out/**,**/Old Extensions/**,**/objects/**,**/objects_org/**,**/localo/**,**/localo_org/**,**/generated/**}';
const KEY_ROUTINES = ['UJOWXUS', 'UJOWXUS2', 'XPAR', 'XLFSTR', 'DIE', 'DIQ', 'XLFDT', 'XUS4', 'XTV'];
const AUTO_ABSOLUTE_ROUTINE_PATHS = [
  '/var/worldvista/prod/hakeem/routines',
  '/var/worldvista/prod/hakeem/localr',
  '/var/worldvista/prod/hakeem/localroutines',
  '/var/worldvista/prod/hakeem/r',
  '/var/worldvista/prod/hakeem/local'
];
const AUTO_WORKSPACE_RELATIVE_ROUTINE_PATHS = ['routines', 'localr', 'localroutines', 'r', 'src/routines'];
const AUTO_REBUILD_DELAY_MS = 1500;
const AUTO_DETECT_SCAN_LIMIT = 200;
const AUTO_DETECT_MAX_DEPTH = 3;
const FILE_TYPE_FILE = 1;
const FILE_TYPE_DIRECTORY = 2;
const STRICT_ROUTINE_NAME_PATTERN = /^%?[A-Za-z][A-Za-z0-9]{0,31}$/u;
const NON_ROUTINE_EXTENSIONLESS_NAMES = new Set(['LICENSE', 'UNLICENSE', 'README', 'CNAME', 'PACKAGE', 'PACKAGE-LOCK', 'YARN', 'PNPM-LOCK', 'TSCONFIG', 'JSCONFIG', 'MAKEFILE', 'DOCKERFILE']);
const BROAD_PATH_ENDINGS = [/\/var\/worldvista\/prod\/hakeem$/iu, /(?:^|[\/])(?:objects|objects_org|localo|localo_org|generated|node_modules|\.git)$/iu];

export interface IndexedRoutine {
  name: string;
  uri: vscode.Uri;
  filePath: string;
  uriKey: string;
  labels: MumpsLabel[];
  sourcePriority?: number;
  mtime?: number;
}

export interface RoutineIndexData {
  routines: IndexedRoutine[];
}

export interface FileIndexInput {
  filePath: string;
  text: string;
  uri?: vscode.Uri;
  sourcePriority?: number;
  labels?: MumpsLabel[];
  mtime?: number;
}

export interface RoutineIndexDiagnostics {
  workspaceFolders: string[];
  includePatterns: string[];
  excludePattern: string;
  maxWorkspaceFiles: number;
  maxRoutineSearchPathFiles: number;
  routineSearchPaths: string[];
  manualRoutineSearchPaths: string[];
  autoDetectedRoutinePaths: string[];
  effectiveRoutineSearchPaths: string[];
  autoDetectRoutinePaths: boolean;
  autoRebuildIndexOnActivation: boolean;
  indexExtensionlessRoutines: boolean;
  lastRebuildTime: string | null;
  workspaceFilesDiscovered: number;
  searchPathFilesDiscovered: number;
  skippedByExtension: number;
  skippedByExcludes: number;
  skippedByContent: number;
  indexedFiles: number;
  elapsedMs: number;
  workspaceLimitReached: boolean;
  searchPathLimitReached: boolean;
  indexedSourcePaths: string[];
  broadPathWarnings: string[];
  duplicatesRemoved: number;
  localrIndexed: number;
  routinesIndexed: number;
  cacheHits: number;
  cacheMisses: number;
  duplicateRoutineNames: number;
  duplicateRoutineNameList: string[];
  keyRoutineStatus: Record<string, string>;
}

interface BuildRoutineIndexOptions {
  includeExtensionless?: boolean;
}

interface RoutineFileCacheEntry {
  mtime: number | null;
  labels: MumpsLabel[];
  routineName: string;
  filePath: string;
  uri: vscode.Uri;
  sourcePriority: number;
}

export function isSupportedRoutineFile(filePath: string, includeExtensionless = false, text?: string): boolean {
  const extension = path.extname(filePath).toLowerCase();
  if (EXTENSIONS.has(extension)) {
    return true;
  }
  if (!includeExtensionless || extension.length > 0) {
    return false;
  }
  if (!isSafeExtensionlessRoutinePath(filePath)) {
    return false;
  }
  return text === undefined || looksLikeMumpsRoutineText(text, routineNameFromFile(filePath));
}

export function isSafeExtensionlessRoutinePath(filePath: string): boolean {
  const baseName = path.basename(filePath);
  if (!baseName || baseName.startsWith('.') || !STRICT_ROUTINE_NAME_PATTERN.test(baseName)) {
    return false;
  }
  return !NON_ROUTINE_EXTENSIONLESS_NAMES.has(baseName.toUpperCase());
}

export function looksLikeMumpsRoutineText(text: string, routineName?: string): boolean {
  const firstCodeLine = text.split(/\r?\n/u).map((line) => line.trimEnd()).find((line) => line.trim().length > 0);
  if (!firstCodeLine) {
    return false;
  }
  const trimmed = firstCodeLine.trimStart();
  if (trimmed.startsWith(';') || trimmed.startsWith('\t') || /^\s+[A-Za-z.]?\s/u.test(firstCodeLine)) {
    return true;
  }
  const label = /^%?[A-Za-z][A-Za-z0-9]{0,31}(?:\(|\s|;|$)/u.exec(trimmed)?.[0]?.replace(/[\s;(].*$/u, '');
  if (!label) {
    return false;
  }
  return !routineName || label.toUpperCase() === routineName.toUpperCase() || STRICT_ROUTINE_NAME_PATTERN.test(label);
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
    .filter((file) => isSupportedRoutineFile(file.filePath, includeExtensionless, file.text))
    .filter((file) => !shouldIgnoreRoutinePath(file.filePath))
    .map((file) => {
      const uri = file.uri ?? vscode.Uri.file(path.resolve(file.filePath));
      const name = file.uri ? routineNameFromUri(file.uri) : routineNameFromFile(file.filePath);
      return {
        name,
        uri,
        filePath: file.filePath,
        uriKey: uriKey(uri),
        labels: file.labels ?? parseMumpsRoutine(file.text, name).labels,
        sourcePriority: file.sourcePriority ?? routineSourcePriority(uri, file.filePath),
        mtime: file.mtime
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));

  return { routines };
}

export class MumpsRoutineIndex implements vscode.Disposable {
  private routines = new Map<string, IndexedRoutine>();
  private routinesByUri = new Map<string, IndexedRoutine>();
  private documentCache = new Map<string, RoutineParseResult>();
  private fileCache = new Map<string, RoutineFileCacheEntry>();
  private cacheHits = 0;
  private cacheMisses = 0;
  private built = false;
  private watcher: vscode.FileSystemWatcher | null = null;
  private dirtyTimer: ReturnType<typeof setTimeout> | null = null;
  private buildPromise: Promise<void> | null = null;
  private rebuildGeneration = 0;
  private autoRebuildTimer: ReturnType<typeof setTimeout> | null = null;
  private autoDetectedRoutinePathUris: vscode.Uri[] = [];
  private autoRebuildStarted = false;
  private lastPathSignature: string | null = null;
  private lastRebuildTime: string | null = null;
  private lastDiagnostics: RoutineIndexDiagnostics = createEmptyDiagnostics();

  constructor(private readonly output?: vscode.OutputChannel) {}

  dispose(): void {
    this.watcher?.dispose();
    if (this.dirtyTimer) {
      clearTimeout(this.dirtyTimer);
    }
    if (this.autoRebuildTimer) {
      clearTimeout(this.autoRebuildTimer);
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
          event.affectsConfiguration('mforge.maxRoutineSearchPathFiles') ||
          event.affectsConfiguration('mforge.workspaceScanDebounceMs') ||
          event.affectsConfiguration('mforge.routineSearchPaths') ||
          event.affectsConfiguration('mforge.autoDetectRoutinePaths') ||
          event.affectsConfiguration('mforge.autoRebuildIndexOnActivation') ||
          event.affectsConfiguration('mforge.indexExtensionlessRoutines')
        ) {
          this.autoDetectedRoutinePathUris = [];
          this.markDirty();
          this.scheduleAutoRebuildOnActivation();
        }
      })
    );

    if (typeof vscode.workspace.onDidChangeWorkspaceFolders === 'function') {
      context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(() => {
        this.autoDetectedRoutinePathUris = [];
        this.markDirty();
        this.scheduleAutoRebuildOnActivation();
      }));
    }

    for (const document of vscode.workspace.textDocuments) {
      this.indexOpenDocument(document);
    }
  }

  async ensureBuilt(): Promise<void> {
    if (this.built) {
      return;
    }
    await this.rebuild();
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

  getLastRebuildTime(): string | null {
    return this.lastRebuildTime;
  }

  scheduleAutoRebuildOnActivation(delayMs = AUTO_REBUILD_DELAY_MS): void {
    if (!getAutoRebuildIndexOnActivation() || this.autoRebuildStarted) {
      return;
    }
    if (this.autoRebuildTimer) {
      clearTimeout(this.autoRebuildTimer);
    }
    this.autoRebuildTimer = setTimeout(async () => {
      this.autoRebuildTimer = null;
      if (this.autoRebuildStarted || this.buildPromise) {
        return;
      }
      const pathState = await this.getRoutinePathState(true);
      const signature = `${pathState.effectivePaths.join('|')}|${getIndexExtensionlessRoutines()}|${getMaxWorkspaceFiles()}|${getMaxRoutineSearchPathFiles()}`;
      if (this.built && this.lastPathSignature === signature) {
        this.debug('Skipped activation auto rebuild because the routine index is already current.');
        return;
      }
      await this.saveAutoDetectedPathsToSettingsIfUnset(pathState.manualPaths, pathState.autoDetectedPaths);
      if (pathState.effectivePaths.length === 0) {
        this.output?.appendLine('[navigation] Auto routine path detection found no routine folders; lazy workspace indexing remains available.');
        return;
      }
      this.autoRebuildStarted = true;
      this.lastPathSignature = signature;
      this.output?.appendLine('[navigation] Auto rebuilding MUMPS routine index after activation.');
      this.debug(`Manual routine paths: ${pathState.manualPaths.join(', ') || '(none)'}`);
      this.debug(`Auto-detected routine paths: ${pathState.autoDetectedPaths.join(', ') || '(none)'}`);
      this.debug(`Effective routine paths: ${pathState.effectivePaths.join(', ') || '(none)'}`);
      await this.rebuild();
    }, delayMs);
  }


  private async saveAutoDetectedPathsToSettingsIfUnset(manualPaths: string[], autoDetectedPaths: string[]): Promise<void> {
    if (manualPaths.length > 0 || autoDetectedPaths.length === 0) {
      return;
    }
    const preferred = autoDetectedPaths.filter((entry) => /(?:^|[\/])(?:localr|routines)$/iu.test(entry));
    const toSave = preferred.length > 0 ? preferred : autoDetectedPaths;
    try {
      await vscode.workspace.getConfiguration('mforge').update('routineSearchPaths', toSave, vscode.ConfigurationTarget.Global);
      this.output?.appendLine(`[navigation] Saved detected routine paths to mforge.routineSearchPaths: ${toSave.join(', ')}`);
    } catch (error) {
      this.debug(`Could not save detected routine paths: ${String(error)}`);
    }
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
      labels: parsed.labels,
      sourcePriority: 1000
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
    if (this.buildPromise) {
      await this.buildPromise;
      return;
    }
    this.buildPromise = this.rebuildIndex().finally(() => {
      this.buildPromise = null;
    });
    await this.buildPromise;
  }

  private async rebuildIndex(): Promise<void> {
    const startTime = Date.now();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    const generation = ++this.rebuildGeneration;
    const maxFiles = getMaxWorkspaceFiles();
    const maxRoutineSearchPathFiles = getMaxRoutineSearchPathFiles();
    const includeExtensionless = getIndexExtensionlessRoutines();
    const pathState = await this.getRoutinePathState(true);
    const includePattern = includeExtensionless ? WORKSPACE_EXTENSIONLESS_GLOB : WORKSPACE_ROUTINE_GLOB;
    const diagnostics = createEmptyDiagnostics();
    diagnostics.workspaceFolders = getWorkspaceFolders().map((folder) => folder.uri.toString());
    diagnostics.includePatterns = pathState.effectivePaths.map((configuredPath) => `${configuredPath}/**/*`);
    diagnostics.excludePattern = EXCLUDE_GLOB;
    diagnostics.maxWorkspaceFiles = maxFiles;
    diagnostics.maxRoutineSearchPathFiles = maxRoutineSearchPathFiles;
    diagnostics.routineSearchPaths = pathState.effectivePaths;
    diagnostics.manualRoutineSearchPaths = pathState.manualPaths;
    diagnostics.autoDetectedRoutinePaths = pathState.autoDetectedPaths;
    diagnostics.effectiveRoutineSearchPaths = pathState.effectivePaths;
    diagnostics.autoDetectRoutinePaths = getAutoDetectRoutinePaths();
    diagnostics.autoRebuildIndexOnActivation = getAutoRebuildIndexOnActivation();
    diagnostics.indexExtensionlessRoutines = includeExtensionless;
    diagnostics.indexedSourcePaths = pathState.effectivePaths;
    diagnostics.broadPathWarnings = pathState.broadPathWarnings;

    const seenUris = new Set<string>();
    const inputs: FileIndexInput[] = [];

    // Navigation indexing is intentionally isolated from workspace-root scans.
    // Only configured or auto-detected routine source folders feed the routine index.
    diagnostics.workspaceFilesDiscovered = 0;
    diagnostics.workspaceLimitReached = false;

    const localrUris = await this.findConfiguredRoutineUris(maxRoutineSearchPathFiles, diagnostics, isLocalrRoutinePath);
    await this.collectInputs(localrUris, inputs, seenUris, diagnostics, includeExtensionless);
    this.commitIndexInputs(inputs, diagnostics, includeExtensionless, startTime);
    diagnostics.localrIndexed = localrUris.length;

    if (generation !== this.rebuildGeneration) {
      this.debug('Discarded stale localr-first rebuild after a newer rebuild started.');
      return;
    }

    const remainingLimit = Math.max(0, maxRoutineSearchPathFiles - localrUris.length);
    const remainingUris = remainingLimit > 0
      ? await this.findConfiguredRoutineUris(remainingLimit, diagnostics, (uri) => !isLocalrRoutinePath(uri))
      : [];
    await this.collectInputs(remainingUris, inputs, seenUris, diagnostics, includeExtensionless);
    diagnostics.routinesIndexed = remainingUris.filter(isRoutinesRoutinePath).length;

    const duplicateNames = findDuplicateRoutineNames(buildRoutineIndexFromFiles(inputs, { includeExtensionless }).routines);
    diagnostics.duplicateRoutineNames = duplicateNames.length;
    diagnostics.duplicateRoutineNameList = duplicateNames;

    if (generation !== this.rebuildGeneration) {
      this.debug('Discarded stale full rebuild after a newer rebuild started.');
      return;
    }

    this.commitIndexInputs(inputs, diagnostics, includeExtensionless, startTime);
    diagnostics.duplicatesRemoved = Math.max(0, inputs.length - this.routines.size);
    diagnostics.cacheHits = this.cacheHits;
    diagnostics.cacheMisses = this.cacheMisses;
    this.lastDiagnostics = diagnostics;
    this.output?.appendLine(`[navigation] Indexed ${this.routines.size} MUMPS routine(s), ${this.getLabelCount()} label(s) in ${diagnostics.elapsedMs}ms.`);
    if (diagnostics.workspaceLimitReached || diagnostics.searchPathLimitReached) {
      this.output?.appendLine('[navigation] Routine index file limit reached; some routines may not be indexed. Increase mforge.maxWorkspaceFiles or mforge.maxRoutineSearchPathFiles.');
    }
    for (const warning of diagnostics.broadPathWarnings) {
      this.output?.appendLine(`[navigation] ${warning}`);
    }
    this.output?.appendLine(`[navigation] Key routines: ${KEY_ROUTINES.map((name) => `${name}=${diagnostics.keyRoutineStatus[name]?.startsWith('FOUND') ? 'FOUND' : 'not indexed'}`).join(', ')}`);
    this.logDebugIndexSummary();
  }

  private commitIndexInputs(inputs: FileIndexInput[], diagnostics: RoutineIndexDiagnostics, includeExtensionless: boolean, startTime: number): void {
    const data = buildRoutineIndexFromFiles(inputs, { includeExtensionless });
    this.routines = new Map();
    this.routinesByUri = new Map();
    for (const routine of data.routines) {
      this.upsertRoutine(routine);
    }
    for (const document of vscode.workspace.textDocuments) {
      this.indexOpenDocument(document);
    }
    diagnostics.indexedFiles = this.routines.size;
    diagnostics.elapsedMs = Date.now() - startTime;
    diagnostics.cacheHits = this.cacheHits;
    diagnostics.cacheMisses = this.cacheMisses;
    this.lastRebuildTime = new Date().toISOString();
    diagnostics.lastRebuildTime = this.lastRebuildTime;
    diagnostics.keyRoutineStatus = this.createKeyRoutineStatus();
    this.lastDiagnostics = diagnostics;
    this.built = true;
  }

  async findRoutineCandidatesInSearchPaths(name: string): Promise<vscode.Uri[]> {
    const target = name.toUpperCase();
    const diagnostics = createEmptyDiagnostics();
    const uris = await this.findConfiguredRoutineUris(getMaxRoutineSearchPathFiles(), diagnostics);
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
        const mtime = await getWorkspaceMtime(uri);
        const cached = this.fileCache.get(key);
        if (cached && cached.mtime !== null && mtime !== null && cached.mtime === mtime) {
          this.cacheHits += 1;
          inputs.push({
            filePath: cached.filePath,
            uri: cached.uri,
            text: '',
            labels: cached.labels,
            sourcePriority: cached.sourcePriority,
            mtime: cached.mtime ?? undefined
          });
          continue;
        }

        this.cacheMisses += 1;
        const text = await readWorkspaceText(uri);
        if (!isSupportedRoutineFile(value, includeExtensionless, text)) {
          diagnostics.skippedByContent += 1;
          this.debug(`Skipped by extensionless routine safety checks: ${uri.toString()}`);
          continue;
        }
        const routineName = routineNameFromUri(uri);
        const labels = parseMumpsRoutine(text, routineName).labels;
        const sourcePriority = routineSourcePriority(uri, value);
        this.fileCache.set(key, { mtime, labels, routineName, filePath: value, uri, sourcePriority });
        inputs.push({ filePath: value, uri, text, labels, sourcePriority, mtime: mtime ?? undefined });
      } catch (error) {
        this.debug(`Could not index ${uri.toString()}: ${String(error)}`);
      }
    }
  }

  private async findConfiguredRoutineUris(maxFiles: number, diagnostics: RoutineIndexDiagnostics, rootPredicate?: (uri: vscode.Uri) => boolean): Promise<vscode.Uri[]> {
    const roots = (await this.getEffectiveRoutineSearchRootUris(false)).filter((root) => !rootPredicate || rootPredicate(root));
    const results: vscode.Uri[] = [];
    const seen = new Set<string>();
    for (const root of roots) {
      await this.collectDirectoryUris(root, results, seen, diagnostics, maxFiles);
      if (results.length >= maxFiles) {
        diagnostics.searchPathLimitReached = true;
        break;
      }
    }
    diagnostics.searchPathLimitReached = diagnostics.searchPathLimitReached || results.length >= maxFiles;
    return results;
  }

  async getRoutinePathState(refreshAuto = false): Promise<{ manualPaths: string[]; autoDetectedPaths: string[]; effectivePaths: string[]; broadPathWarnings: string[] }> {
    const manualUris = getManualRoutineSearchRoots();
    const autoUris = getAutoDetectRoutinePaths() ? (refreshAuto || this.autoDetectedRoutinePathUris.length === 0 ? await this.detectAutoRoutinePaths() : this.autoDetectedRoutinePathUris) : [];
    const effectiveUris = dedupeUris([...manualUris, ...autoUris]);
    const broadPathWarnings = manualUris.filter(isBroadRoutineSearchPath).map((uri) => `Routine search path ${displayRoutinePath(uri)} looks broad and may slow indexing. Consider selecting routines/localr instead.`);
    return {
      manualPaths: manualUris.map(displayRoutinePath),
      autoDetectedPaths: autoUris.map(displayRoutinePath),
      effectivePaths: effectiveUris.map(displayRoutinePath),
      broadPathWarnings
    };
  }

  async detectAutoRoutinePaths(): Promise<vscode.Uri[]> {
    if (!getAutoDetectRoutinePaths()) {
      this.autoDetectedRoutinePathUris = [];
      return [];
    }
    const includeExtensionless = getIndexExtensionlessRoutines();
    const candidates = getAutoRoutinePathCandidates();
    const detected: vscode.Uri[] = [];
    for (const candidate of candidates) {
      if (await this.directoryContainsRoutineFile(candidate, includeExtensionless)) {
        detected.push(candidate);
      }
    }
    this.autoDetectedRoutinePathUris = dedupeUris(detected);
    if (this.autoDetectedRoutinePathUris.length > 0) {
      this.debug(`Auto-detected routine paths: ${this.autoDetectedRoutinePathUris.map(displayRoutinePath).join(', ')}`);
    }
    return this.autoDetectedRoutinePathUris;
  }

  private async getEffectiveRoutineSearchRootUris(refreshAuto: boolean): Promise<vscode.Uri[]> {
    const pathState = await this.getRoutinePathState(refreshAuto);
    return pathState.effectivePaths.map(pathToRoutineUri);
  }

  private async directoryContainsRoutineFile(root: vscode.Uri, includeExtensionless: boolean, depth = 0, visited = { count: 0 }): Promise<boolean> {
    if (depth > AUTO_DETECT_MAX_DEPTH || visited.count >= AUTO_DETECT_SCAN_LIMIT || shouldIgnoreRoutinePath(uriPathLike(root))) {
      return false;
    }
    try {
      const entries = await vscode.workspace.fs.readDirectory(root);
      for (const [name, type] of entries) {
        if (visited.count >= AUTO_DETECT_SCAN_LIMIT) {
          return false;
        }
        const child = vscode.Uri.joinPath(root, name);
        const childPath = uriPathLike(child);
        if (shouldIgnoreRoutinePath(childPath)) {
          continue;
        }
        visited.count += 1;
        if ((type & FILE_TYPE_FILE) === FILE_TYPE_FILE || type === 0) {
          if (isSupportedRoutineFile(childPath, includeExtensionless)) {
            return true;
          }
        } else if ((type & FILE_TYPE_DIRECTORY) === FILE_TYPE_DIRECTORY && await this.directoryContainsRoutineFile(child, includeExtensionless, depth + 1, visited)) {
          return true;
        }
      }
    } catch (error) {
      this.debug(`Auto-detect skipped ${root.toString()}: ${String(error)}`);
    }
    return false;
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
        if (shouldIgnoreRoutinePath(uriPathLike(child))) {
          diagnostics.skippedByExcludes += 1;
          continue;
        }
        if ((type & FILE_TYPE_DIRECTORY) === FILE_TYPE_DIRECTORY) {
          await this.collectDirectoryUris(child, results, seen, diagnostics, maxFiles);
        } else if ((type & FILE_TYPE_FILE) === FILE_TYPE_FILE || type === 0) {
          const childPath = uriPathLike(child);
          if (!isSupportedRoutineFile(childPath, getIndexExtensionlessRoutines())) {
            diagnostics.skippedByExtension += 1;
            continue;
          }
          const key = uriKey(child);
          if (!seen.has(key)) {
            seen.add(key);
            diagnostics.searchPathFilesDiscovered += 1;
            results.push(child);
          }
          if (results.length >= maxFiles) {
            diagnostics.searchPathLimitReached = true;
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
    const normalizedRoutine = { ...routine, name: normalized, sourcePriority: routine.sourcePriority ?? routineSourcePriority(routine.uri, routine.filePath) };
    if (existingByName && (existingByName.sourcePriority ?? 0) > (normalizedRoutine.sourcePriority ?? 0)) {
      this.routinesByUri.set(normalizedRoutine.uriKey, normalizedRoutine);
      return;
    }
    if (existingByName) {
      this.routinesByUri.delete(existingByName.uriKey);
    }
    this.routines.set(normalized, normalizedRoutine);
    this.routinesByUri.set(routine.uriKey, normalizedRoutine);
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
    this.output?.appendLine(`[navigation] mforge.maxRoutineSearchPathFiles: ${diagnostics.maxRoutineSearchPathFiles}`);
    this.output?.appendLine(`[navigation] mforge.routineSearchPaths (manual): ${diagnostics.manualRoutineSearchPaths.join(', ') || '(none)'}`);
    this.output?.appendLine(`[navigation] auto-detected routine paths: ${diagnostics.autoDetectedRoutinePaths.join(', ') || '(none)'}`);
    this.output?.appendLine(`[navigation] effective routine paths: ${diagnostics.effectiveRoutineSearchPaths.join(', ') || '(none)'}`);
    this.output?.appendLine(`[navigation] mforge.autoDetectRoutinePaths: ${diagnostics.autoDetectRoutinePaths}`);
    this.output?.appendLine(`[navigation] mforge.autoRebuildIndexOnActivation: ${diagnostics.autoRebuildIndexOnActivation}`);
    this.output?.appendLine(`[navigation] mforge.indexExtensionlessRoutines: ${diagnostics.indexExtensionlessRoutines}`);
    this.output?.appendLine(`[navigation] elapsedMs: ${diagnostics.elapsedMs}`);
    this.output?.appendLine(`[navigation] limit reached: workspace=${diagnostics.workspaceLimitReached}, searchPaths=${diagnostics.searchPathLimitReached}`);
    this.output?.appendLine(`[navigation] skipped by content: ${diagnostics.skippedByContent}`);
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


async function getWorkspaceMtime(uri: vscode.Uri): Promise<number | null> {
  const fsWithStat = vscode.workspace.fs as typeof vscode.workspace.fs & { stat?: (uri: vscode.Uri) => Promise<{ mtime?: number }> };
  if (typeof fsWithStat.stat !== 'function') {
    return null;
  }
  try {
    const stat = await fsWithStat.stat(uri);
    return typeof stat.mtime === 'number' ? stat.mtime : null;
  } catch {
    return null;
  }
}

function isLocalrRoutinePath(uri: vscode.Uri): boolean {
  const value = displayRoutinePath(uri).replace(/\\/gu, '/').toLowerCase();
  return value.endsWith('/localr') || value.includes('/localr/') || value.endsWith('/localroutines') || value.includes('/localroutines/');
}

function isRoutinesRoutinePath(uri: vscode.Uri): boolean {
  const value = displayRoutinePath(uri).replace(/\\/gu, '/').toLowerCase();
  return value.endsWith('/routines') || value.includes('/routines/');
}

function getMaxWorkspaceFiles(): number {
  const configured = vscode.workspace.getConfiguration('mforge').get<number>('maxWorkspaceFiles', DEFAULT_MAX_WORKSPACE_FILES);
  return Number.isFinite(configured) && configured > 0 ? Math.floor(configured) : DEFAULT_MAX_WORKSPACE_FILES;
}


function getMaxRoutineSearchPathFiles(): number {
  const configured = vscode.workspace.getConfiguration('mforge').get<number>('maxRoutineSearchPathFiles', DEFAULT_MAX_ROUTINE_SEARCH_PATH_FILES);
  return Number.isFinite(configured) && configured > 0 ? Math.floor(configured) : DEFAULT_MAX_ROUTINE_SEARCH_PATH_FILES;
}

function routineSourcePriority(uri: vscode.Uri, filePath: string): number {
  const value = displayRoutinePath(uri).toLowerCase();
  const pathValue = filePath.toLowerCase();
  let priority = 10;
  if (value.includes('/localr/') || pathValue.includes('/localr/') || value.endsWith('/localr') || pathValue.endsWith('/localr')) {
    priority += 30;
  }
  if (value.includes('/localroutines/') || pathValue.includes('/localroutines/')) {
    priority += 25;
  }
  if (value.includes('/routines/') || pathValue.includes('/routines/')) {
    priority += 10;
  }
  return priority;
}

function isBroadRoutineSearchPath(uri: vscode.Uri): boolean {
  const value = displayRoutinePath(uri).replace(/\\/gu, '/').replace(/\/+$/u, '');
  return BROAD_PATH_ENDINGS.some((pattern) => pattern.test(value));
}

function getWorkspaceScanDebounceMs(): number {
  const configured = vscode.workspace.getConfiguration('mforge').get<number>('workspaceScanDebounceMs', WATCHER_DEBOUNCE_MS);
  return Number.isFinite(configured) && configured >= 0 ? Math.floor(configured) : WATCHER_DEBOUNCE_MS;
}

function getManualRoutineSearchPaths(): string[] {
  const configured = vscode.workspace.getConfiguration('mforge').get<string[]>('routineSearchPaths', []);
  return Array.isArray(configured) ? configured.filter((entry) => typeof entry === 'string' && entry.trim().length > 0).map((entry) => entry.trim()) : [];
}

function getAutoDetectRoutinePaths(): boolean {
  return vscode.workspace.getConfiguration('mforge').get<boolean>('autoDetectRoutinePaths', true);
}

function getAutoRebuildIndexOnActivation(): boolean {
  return vscode.workspace.getConfiguration('mforge').get<boolean>('autoRebuildIndexOnActivation', true);
}

function getIndexExtensionlessRoutines(): boolean {
  return vscode.workspace.getConfiguration('mforge').get<boolean>('indexExtensionlessRoutines', false);
}

function getWorkspaceFolders(): readonly vscode.WorkspaceFolder[] {
  return vscode.workspace.workspaceFolders ?? [];
}

function getManualRoutineSearchRoots(): vscode.Uri[] {
  const folders = getWorkspaceFolders();
  const roots: vscode.Uri[] = [];
  for (const configuredPath of getManualRoutineSearchPaths()) {
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
  return dedupeUris(roots);
}

function getAutoRoutinePathCandidates(): vscode.Uri[] {
  const candidates = AUTO_ABSOLUTE_ROUTINE_PATHS.map((candidate) => vscode.Uri.file(candidate));
  for (const folder of getWorkspaceFolders()) {
    for (const relativePath of AUTO_WORKSPACE_RELATIVE_ROUTINE_PATHS) {
      candidates.push(vscode.Uri.joinPath(folder.uri, relativePath));
    }
  }
  return dedupeUris(candidates);
}

function pathToRoutineUri(value: string): vscode.Uri {
  if (/^[a-z][a-z0-9+.-]*:/iu.test(value) && typeof vscode.Uri.parse === 'function') {
    return vscode.Uri.parse(value);
  }
  return vscode.Uri.file(value);
}

function displayRoutinePath(uri: vscode.Uri): string {
  if (uri.scheme === 'file') {
    return uriPathLike(uri);
  }
  return uri.toString();
}

function dedupeUris(uris: vscode.Uri[]): vscode.Uri[] {
  const seen = new Set<string>();
  const result: vscode.Uri[] = [];
  for (const uri of uris) {
    const key = uriKey(uri).toUpperCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(uri);
    }
  }
  return result;
}

function createEmptyDiagnostics(): RoutineIndexDiagnostics {
  return {
    workspaceFolders: [],
    includePatterns: [],
    excludePattern: EXCLUDE_GLOB,
    maxWorkspaceFiles: DEFAULT_MAX_WORKSPACE_FILES,
    maxRoutineSearchPathFiles: DEFAULT_MAX_ROUTINE_SEARCH_PATH_FILES,
    routineSearchPaths: [],
    manualRoutineSearchPaths: [],
    autoDetectedRoutinePaths: [],
    effectiveRoutineSearchPaths: [],
    autoDetectRoutinePaths: true,
    autoRebuildIndexOnActivation: true,
    indexExtensionlessRoutines: false,
    lastRebuildTime: null,
    workspaceFilesDiscovered: 0,
    searchPathFilesDiscovered: 0,
    skippedByExtension: 0,
    skippedByExcludes: 0,
    skippedByContent: 0,
    indexedFiles: 0,
    elapsedMs: 0,
    workspaceLimitReached: false,
    searchPathLimitReached: false,
    indexedSourcePaths: [],
    broadPathWarnings: [],
    duplicatesRemoved: 0,
    localrIndexed: 0,
    routinesIndexed: 0,
    cacheHits: 0,
    cacheMisses: 0,
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
