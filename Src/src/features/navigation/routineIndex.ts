import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as vscode from 'vscode';
import { SUPPORTED_EXTENSIONS } from '../../config/language';
import { parseMumpsRoutine } from '../../parser/routineParser';
import { MumpsLabel } from '../../parser/types';

const DEFAULT_MAX_WORKSPACE_FILES = 2000;
const EXCLUDED_SEGMENTS = new Set(['node_modules', '.git', 'dist', 'out', 'Old Extensions']);
const EXTENSIONS = new Set<string>(SUPPORTED_EXTENSIONS.map((extension) => extension.toLowerCase()));

export interface IndexedRoutine {
  name: string;
  uri: vscode.Uri;
  filePath: string;
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

export function routineNameFromFile(filePath: string): string {
  return path.basename(filePath, path.extname(filePath));
}

export function buildRoutineIndexFromFiles(files: FileIndexInput[]): RoutineIndexData {
  const routines = files
    .filter((file) => isSupportedRoutineFile(file.filePath))
    .filter((file) => !shouldIgnoreRoutinePath(file.filePath))
    .map((file) => {
      const name = routineNameFromFile(file.filePath);
      return {
        name,
        uri: file.uri ?? vscode.Uri.file(path.resolve(file.filePath)),
        filePath: file.filePath,
        labels: parseMumpsRoutine(file.text, name).labels
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));

  return { routines };
}

export class MumpsRoutineIndex implements vscode.Disposable {
  private routines = new Map<string, IndexedRoutine>();
  private built = false;
  private watcher: vscode.FileSystemWatcher | null = null;

  constructor(private readonly output?: vscode.OutputChannel) {}

  dispose(): void {
    this.watcher?.dispose();
  }

  registerWatchers(context: vscode.ExtensionContext): void {
    this.watcher = vscode.workspace.createFileSystemWatcher('**/*.{m,M,mumps,mps,rou,int}');
    context.subscriptions.push(
      this.watcher,
      this.watcher.onDidCreate(() => this.markDirty()),
      this.watcher.onDidChange(() => this.markDirty()),
      this.watcher.onDidDelete(() => this.markDirty()),
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('mforge.maxWorkspaceFiles')) {
          this.markDirty();
        }
      })
    );
  }

  async ensureBuilt(): Promise<void> {
    if (!this.built) {
      await this.rebuild();
    }
  }

  markDirty(): void {
    this.built = false;
  }

  getRoutines(): IndexedRoutine[] {
    return Array.from(this.routines.values()).sort((left, right) => left.name.localeCompare(right.name));
  }

  findRoutine(name: string): IndexedRoutine | undefined {
    return this.routines.get(name.toUpperCase());
  }

  findLabel(routineName: string, labelName: string): MumpsLabel | undefined {
    return this.findRoutine(routineName)?.labels.find((label) => label.name.toUpperCase() === labelName.toUpperCase());
  }

  async rebuild(): Promise<void> {
    const maxFiles = getMaxWorkspaceFiles();
    const files = await vscode.workspace.findFiles('**/*.{m,M,mumps,mps,rou,int}', '{**/node_modules/**,**/.git/**,**/dist/**,**/out/**,**/Old Extensions/**}', maxFiles);
    const inputs: FileIndexInput[] = [];

    for (const uri of files) {
      if (shouldIgnoreRoutinePath(uri.fsPath)) {
        continue;
      }
      try {
        inputs.push({ filePath: uri.fsPath, uri, text: await fs.readFile(uri.fsPath, 'utf8') });
      } catch (error) {
        this.output?.appendLine(`[navigation] Could not index ${uri.fsPath}: ${String(error)}`);
      }
    }

    const data = buildRoutineIndexFromFiles(inputs.slice(0, maxFiles));
    this.routines = new Map(data.routines.map((routine) => [routine.name.toUpperCase(), routine]));
    this.built = true;
    this.output?.appendLine(`[navigation] Indexed ${this.routines.size} MUMPS routine(s).`);
  }
}

function getMaxWorkspaceFiles(): number {
  const configured = vscode.workspace.getConfiguration('mforge').get<number>('maxWorkspaceFiles', DEFAULT_MAX_WORKSPACE_FILES);
  return Number.isFinite(configured) && configured > 0 ? Math.floor(configured) : DEFAULT_MAX_WORKSPACE_FILES;
}
