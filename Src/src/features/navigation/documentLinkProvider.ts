import * as vscode from 'vscode';
import { isMumpsUri } from '../../config/language';
import { findMumpsReferencesInLine } from '../../parser/routineParser';
import { MumpsRoutineIndex } from './routineIndex';
import { MumpsDefinitionProvider } from './definitionProvider';

export class MumpsDocumentLinkProvider implements vscode.DocumentLinkProvider {
  private readonly definitions: MumpsDefinitionProvider;

  constructor(private readonly routineIndex: MumpsRoutineIndex, output?: vscode.OutputChannel) {
    this.definitions = new MumpsDefinitionProvider(routineIndex, output);
  }

  async provideDocumentLinks(document: vscode.TextDocument): Promise<vscode.DocumentLink[]> {
    if (!isMumpsUri(document.uri, document.languageId)) {
      return [];
    }

    const links: vscode.DocumentLink[] = [];
    for (let line = 0; line < document.lineCount; line++) {
      const lineText = document.lineAt(line).text;
      for (const reference of findMumpsReferencesInLine(lineText)) {
        const target = await this.definitions.resolveReference(document, reference);
        if (!target) {
          continue;
        }
        const link = new vscode.DocumentLink(new vscode.Range(line, reference.startCharacter, line, reference.endCharacter), target.uri);
        link.tooltip = reference.routine
          ? `Open ${reference.label ? `${reference.label}^` : ''}${reference.routine}`
          : `Open label ${reference.label}`;
        links.push(link);
      }
    }
    return links;
  }
}
