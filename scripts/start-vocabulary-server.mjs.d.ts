export const REQUIRED_NODE_VERSION: '22.19.0';

export function parseSemver(version: string): [number, number, number];
export function isNodeVersionSupported(version: string, minimum?: string): boolean;
export function assertNodeVersion(version?: string, minimum?: string): void;
export function resolveNextBinary(root?: string): string;
export function buildNextArgv(command: string): string[];
export function formatPortInUseMessage(port?: number): string;
export function probePort(port?: number, host?: string): Promise<boolean>;
export function prepareVocabularyServer(
  command: string,
  options?: {
    nodeVersion?: string;
    root?: string;
    resolveNext?: (root: string) => string;
    probe?: (port: number, host: string) => Promise<boolean>;
  },
): Promise<{
  command: string;
  nextBin: string;
  argv: string[];
  cwd: string;
  host: string;
  port: number;
}>;
export function printAccessUrls(log?: (...args: unknown[]) => void, addresses?: string[]): void;
