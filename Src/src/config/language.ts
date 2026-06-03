import * as path from 'node:path';
import * as vscode from 'vscode';

export const MUMPS_LANGUAGE_ID = 'mumps';

export const SUPPORTED_EXTENSIONS = [
  '.m',
  '.M',
  '.mumps',
  '.mps',
  '.rou',
  '.int'
] as const;

const SUPPORTED_EXTENSION_SET = new Set<string>(SUPPORTED_EXTENSIONS.map((extension) => extension.toLowerCase()));
const IGNORED_SCHEMES = new Set(['output', 'debug', 'walkthrough', 'vscode-notebook-cell']);
const NON_FILE_MUMPS_SCHEMES = new Set(['untitled', 'vscode-remote']);

export function isMumpsUri(uri: vscode.Uri, languageId?: string): boolean {
  if (languageId && languageId !== MUMPS_LANGUAGE_ID) {
    return false;
  }

  if (uri.scheme && IGNORED_SCHEMES.has(uri.scheme)) {
    return false;
  }

  const uriText = uri.toString().toLowerCase();
  if (uriText.includes('rendererlog') || uriText.includes('output:rendererlog')) {
    return false;
  }

  if (languageId === MUMPS_LANGUAGE_ID && uri.scheme && NON_FILE_MUMPS_SCHEMES.has(uri.scheme)) {
    return true;
  }

  return hasSupportedMumpsExtension(uri);
}

export function hasSupportedMumpsExtension(uri: vscode.Uri): boolean {
  const value = typeof uri.fsPath === 'string' && uri.fsPath.length > 0 ? uri.fsPath : (uri.path ?? '');
  return SUPPORTED_EXTENSION_SET.has(path.extname(value).toLowerCase());
}
