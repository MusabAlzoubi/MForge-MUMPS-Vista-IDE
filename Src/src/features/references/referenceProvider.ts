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
    const includeDeclarations = context.includeDeclaration && getIncludeDeclarations();
    return findReferencesForTarget(document, target, this.routineIndex, {
      includeDeclarations,
      maxResults: getMaxResults(),
      token
    });
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
