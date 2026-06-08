import * as vscode from 'vscode';

const RECOMMENDED_HAKEEM_ROUTINE_PATHS = [
  '/var/worldvista/prod/hakeem/localr',
  '/var/worldvista/prod/hakeem/routines'
];

const MFORGE_SETTING_KEYS = [
  'trace.level',
  'formatter.enabled',
  'diagnostics.enabled',
  'navigation.enabled',
  'maxWorkspaceFiles',
  'hover.enabled',
  'completion.enabled',
  'signatureHelp.enabled',
  'semanticHighlighting.enabled',
  'workspaceScanDebounceMs',
  'routineSearchPaths',
  'indexExtensionlessRoutines',
  'autoDetectRoutinePaths',
  'autoRebuildIndexOnActivation',
  'references.enabled',
  'references.includeDeclarations',
  'references.maxResults',
  'maxRoutineSearchPathFiles',
  'standards.profile',
  'standards.enforceRoutineHeader',
  'standards.namespacePrefixes',
  'standards.enforceLabelLength',
  'standards.enforceLocalVariableNames',
  'standards.enforceTmpGlobalSubscript',
  'standards.enforcePercentGlobalProtection',
  'debug.showOutputOnCommand',
  'debug.directCommandTimeoutMs'
];

export function registerSettingsCommands(context: vscode.ExtensionContext, output?: vscode.OutputChannel): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('mforge.applyRecommendedHakeemSettings', async () => applyRecommendedHakeemSettings(output)),
    vscode.commands.registerCommand('mforge.resetSettingsToDefaults', async () => resetMForgeSettingsToDefaults(output))
  );
}

export async function applyRecommendedHakeemSettings(output?: vscode.OutputChannel): Promise<void> {
  const configuration = vscode.workspace.getConfiguration('mforge');
  await configuration.update('routineSearchPaths', RECOMMENDED_HAKEEM_ROUTINE_PATHS, vscode.ConfigurationTarget.Global);
  await configuration.update('indexExtensionlessRoutines', false, vscode.ConfigurationTarget.Global);
  await configuration.update('autoDetectRoutinePaths', true, vscode.ConfigurationTarget.Global);
  await configuration.update('autoRebuildIndexOnActivation', true, vscode.ConfigurationTarget.Global);
  await configuration.update('trace.level', 'info', vscode.ConfigurationTarget.Global);
  output?.appendLine(`[settings] Applied recommended Hakeem routine paths: ${RECOMMENDED_HAKEEM_ROUTINE_PATHS.join(', ')}`);
  output?.appendLine('[settings] Recommended Hakeem settings applied. Run MForge: Rebuild Routine Index if the index is already built.');
  vscode.window.showInformationMessage('MForge recommended Hakeem settings applied. Run MForge: Rebuild Routine Index if needed.');
}

export async function resetMForgeSettingsToDefaults(output?: vscode.OutputChannel): Promise<void> {
  const configuration = vscode.workspace.getConfiguration('mforge');
  for (const key of MFORGE_SETTING_KEYS) {
    await resetSetting(configuration, key, vscode.ConfigurationTarget.Global);
    await resetSetting(configuration, key, vscode.ConfigurationTarget.Workspace);
    if (vscode.workspace.workspaceFolders) {
      for (const folder of vscode.workspace.workspaceFolders) {
        await resetSetting(configuration, key, vscode.ConfigurationTarget.WorkspaceFolder, folder.uri);
      }
    }
  }
  output?.appendLine(`[settings] Reset ${MFORGE_SETTING_KEYS.length} MForge setting(s) to package defaults.`);
  vscode.window.showInformationMessage('MForge settings reset to package defaults. Unrelated VS Code settings were not changed.');
}

async function resetSetting(configuration: vscode.WorkspaceConfiguration, key: string, target: vscode.ConfigurationTarget, scope?: vscode.Uri): Promise<void> {
  try {
    await configuration.update(key, undefined, target, false);
  } catch {
    if (!scope) {
      return;
    }
    try {
      await configuration.update(key, undefined, target, false);
    } catch {
      // Some VS Code hosts do not support folder-scoped updates for extension settings.
    }
  }
}
