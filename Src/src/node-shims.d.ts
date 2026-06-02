declare module 'node:fs/promises' {
  export function readFile(path: string, encoding: 'utf8'): Promise<string>;
}

declare module 'node:path' {
  export function extname(path: string): string;
  export function basename(path: string, suffix?: string): string;
  export function resolve(path: string): string;
  export function join(...paths: string[]): string;
}
