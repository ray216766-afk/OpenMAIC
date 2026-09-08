export const VOCABULARY_HOST: '0.0.0.0';
export const VOCABULARY_PORT: 2007;
export const VOCABULARY_ROUTE: '/oliver-vocabulary';

export function isLoopbackIPv4(address: string): boolean;
export function isLinkLocalIPv4(address: string): boolean;
export function isUsableLanIPv4(address: string): boolean;
export function listLanIPv4Addresses(
  interfaces?: NodeJS.Dict<import('node:os').NetworkInterfaceInfo[]>,
): string[];
export function vocabularyUrl(host: string, port?: number, route?: string): string;
export function localVocabularyUrls(port?: number): string[];
export function networkVocabularyUrls(addresses?: string[], port?: number): string[];
export function allowedDevOrigins(addresses?: string[]): string[];
export function formatStartupUrls(addresses?: string[], port?: number): string;
