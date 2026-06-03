import * as vscode from 'vscode';
import { isMumpsUri } from '../../config/language';
import { findMumpsReferenceAt } from '../../parser/routineParser';
import { MumpsRoutineIndex } from './routineIndex';
import { MumpsDefinitionProvider } from './definitionProvider';

export class MumpsNavigationHoverProvider implements vscode.HoverProvider {
  private readonly definitions: MumpsDefinitionProvider;

  constructor(private readonly routineIndex: MumpsRoutineIndex, private readonly output?: vscode.OutputChannel) {
    this.definitions = new MumpsDefinitionProvider(routineIndex, output);
  }

  async provideHover(document: vscode.TextDocument, position: vscode.Position): Promise<vscode.Hover | null> {
    if (!isMumpsUri(document.uri, document.languageId)) {
      return null;
    }
    const reference = findMumpsReferenceAt(document.lineAt(position.line).text, position.character);
    if (!reference) {
      return null;
    }
    const range = new vscode.Range(position.line, reference.startCharacter, position.line, reference.endCharacter);
    const location = await this.definitions.resolveReference(document, reference);
    if (!location) {
      if (this.isDebugTraceEnabled() && reference.routine) {
        const debugMarkdown = new vscode.MarkdownString([
          '### MForge Navigation',
          '',
          `Reference detected: \`${reference.raw}\`.`,
          '',
          `Target routine \`${reference.routine}\` is not indexed.`,
          '',
          'Run **MForge: Rebuild Routine Index** or add the folder to `mforge.routineSearchPaths`.'
        ].join('\n'));
        return new vscode.Hover(debugMarkdown, range);
      }
      return null;
    }

    const markdown = new vscode.MarkdownString([
      `### MForge Navigation`,
      '',
      `Ctrl+Click / F12 opens \`${reference.raw}\`.`,
      '',
      `[Open ${reference.raw}](command:editor.action.revealDefinition)`
    ].join('\n'));
    markdown.isTrusted = true;
    return new vscode.Hover(markdown, range);
  }

  private isDebugTraceEnabled(): boolean {
    const traceLevel = vscode.workspace.getConfiguration('mforge').get<string>('trace.level', 'off');
    return traceLevel === 'debug';
  }
}
