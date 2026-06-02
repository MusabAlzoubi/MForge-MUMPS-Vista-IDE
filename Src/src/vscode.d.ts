declare module 'vscode' {
  export interface Disposable {
    dispose(): unknown;
  }

  export interface ExtensionContext {
    subscriptions: Disposable[];
    extensionUri: Uri;
  }

  export class Uri {
    static joinPath(base: Uri, ...pathSegments: string[]): Uri;
  }

  export interface OutputChannel extends Disposable {
    appendLine(value: string): void;
    show(): void;
  }

  export namespace window {
    export function createOutputChannel(name: string): OutputChannel;
    export function showInformationMessage(message: string, ...items: string[]): Promise<string | undefined>;
  }

  export namespace commands {
    export function registerCommand(command: string, callback: (...args: unknown[]) => unknown): Disposable;
    export function executeCommand<T = unknown>(command: string, ...rest: unknown[]): Promise<T>;
  }
}
