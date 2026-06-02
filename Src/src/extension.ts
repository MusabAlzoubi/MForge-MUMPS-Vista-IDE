import * as vscode from 'vscode';
import { MUMPS_LANGUAGE_ID, SUPPORTED_EXTENSIONS } from './config/language';
import { registerDiagnosticsFeature } from './features/diagnostics';
import { registerFormatterFeature } from './features/formatter';
import { registerNavigationFeature } from './features/navigation';

const OUTPUT_CHANNEL_NAME = 'MForge MUMPS & VistA IDE';

export function activate(context: vscode.ExtensionContext): void {
  const output = vscode.window.createOutputChannel(OUTPUT_CHANNEL_NAME);
  context.subscriptions.push(output);

  output.appendLine(`${OUTPUT_CHANNEL_NAME} activated for language '${MUMPS_LANGUAGE_ID}'.`);
  output.appendLine(`Supported extensions: ${SUPPORTED_EXTENSIONS.join(', ')}`);

  registerFormatterFeature(context);
  registerDiagnosticsFeature(context);
  registerNavigationFeature(context, output);

  context.subscriptions.push(
    vscode.commands.registerCommand('mforge.showGettingStarted', async () => {
      const selection = await vscode.window.showInformationMessage(
        'MForge MUMPS & VistA IDE is ready. Stage 3 includes syntax highlighting, snippets, formatting, diagnostics, symbols, and navigation.',
        'Open README',
        'Show Output'
      );

      if (selection === 'Open README') {
        const readme = vscode.Uri.joinPath(context.extensionUri, 'README.md');
        await vscode.commands.executeCommand('vscode.open', readme);
      }

      if (selection === 'Show Output') {
        output.show();
      }
    })
  );
}

export function deactivate(): void {
  // MForge features register disposables through context.subscriptions.
}
