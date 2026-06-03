import * as vscode from 'vscode';
import { isMumpsUri } from '../../config/language';
import { findMumpsReferenceAt } from '../../parser/routineParser';
import { MumpsRoutineIndex } from './routineIndex';
import { MumpsDefinitionProvider } from './definitionProvider';

export class MumpsNavigationHoverProvider implements vscode.HoverProvider {
  private readonly definitions: MumpsDefinitionProvider;

  constructor(private readonly routineIndex: MumpsRoutineIndex, output?: vscode.OutputChannel) {
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
    const location = await this.definitions.resolveReference(document, reference);
    if (!location) {
      return null;
    }

    const range = new vscode.Range(position.line, reference.startCharacter, position.line, reference.endCharacter);
    const markdown = new vscode.MarkdownString(`**MUMPS navigation**\n\nCtrl+Click / F12 opens \`${reference.raw}\`.`);
    return new vscode.Hover(markdown, range);
  }
}
