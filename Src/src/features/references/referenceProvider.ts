import * as vscode from 'vscode';
import { isMumpsUri } from '../../config/language';
import { MumpsRoutineIndex } from '../navigation/routineIndex';
import { findReferencesForTarget, resolveReferenceTarget } from './referenceSearch';

const DEFAULT_MAX_RESULTS = 5000;

export class MForgeReferenceProvider implements vscode.ReferenceProvider {
  constructor(private readonly routineIndex: MumpsRoutineIndex, private readonly output?: vscode.OutputChannel) {}

  async provideReferences(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.ReferenceContext,
    token: vscode.CancellationToken
  ): Promise<vscode.Location[]> {
    if (!isMumpsUri(document.uri, document.languageId) || !isReferencesEnabled()) {
      return [];
    }

    const target = await resolveReferenceTarget(document, position, this.routineIndex);
    if (!target || token.isCancellationRequested) {
      return [];
    }

    this.debug(`Finding references for ${target.kind} '${target.name}' in ${document.uri.toString()}.`);
    if (target.reference?.routine) {
      await this.routineIndex.ensureBuilt();
      if (!this.routineIndex.findRoutine(target.reference.routine)) {
        this.output?.appendLine(`[references] Routine ${target.reference.routine} is not indexed. Add routine folder or run Rebuild Routine Index.`);
      }
    }

    const includeDeclarations = context.includeDeclaration && getIncludeDeclarations();
    const search = () => findReferencesForTarget(document, target, this.routineIndex, {
      includeDeclarations,
      maxResults: getMaxResults(),
      token
    });
    const windowWithProgress = vscode.window as (typeof vscode.window & { withProgress?: <T>(options: unknown, task: () => Thenable<T>) => Thenable<T> }) | undefined;
    if (target.kind === 'routineReference' && typeof windowWithProgress?.withProgress === 'function' && vscode.ProgressLocation) {
      return windowWithProgress.withProgress({ location: vscode.ProgressLocation.Notification, title: `MForge: Finding references for ${target.name}`, cancellable: true }, search);
    }
    return search();
  }

  private debug(message: string): void {
    const traceLevel = vscode.workspace.getConfiguration('mforge').get<string>('trace.level', 'off');
    if (traceLevel === 'debug') {
      this.output?.appendLine(`[references] ${message}`);
    }
  }
}

export function isReferencesEnabled(): boolean {
  return vscode.workspace.getConfiguration('mforge').get<boolean>('references.enabled', true);
}

function getIncludeDeclarations(): boolean {
  return vscode.workspace.getConfiguration('mforge').get<boolean>('references.includeDeclarations', true);
}

function getMaxResults(): number {
  const configured = vscode.workspace.getConfiguration('mforge').get<number>('references.maxResults', DEFAULT_MAX_RESULTS);
  return Number.isFinite(configured) && configured > 0 ? Math.floor(configured) : DEFAULT_MAX_RESULTS;
}
