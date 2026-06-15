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

    await this.routineIndex.ensureBuilt();
    const links: vscode.DocumentLink[] = [];
    for (let line = 0; line < document.lineCount; line++) {
      const lineText = document.lineAt(line).text;
      for (const reference of findMumpsReferencesInLine(lineText)) {
        const targetUri = reference.routine
          ? this.routineIndex.findRoutine(reference.routine)?.uri
          : (await this.definitions.resolveReference(document, reference))?.uri;
        if (!targetUri) {
          continue;
        }
        const link = new vscode.DocumentLink(new vscode.Range(line, reference.startCharacter, line, reference.endCharacter), targetUri);
        link.tooltip = reference.routine
          ? `Open ${reference.label ? `${reference.label}^` : ''}${reference.routine}`
          : `Open label ${reference.label}`;
        links.push(link);
      }
    }
    return links;
  }
}
