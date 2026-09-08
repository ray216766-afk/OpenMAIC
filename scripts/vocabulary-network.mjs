import { networkInterfaces } from 'node:os';

export const VOCABULARY_HOST = '0.0.0.0';
export const VOCABULARY_PORT = 2007;
export const VOCABULARY_ROUTE = '/oliver-vocabulary';

const IPV4_PATTERN = /^(?:\d{1,3}\.){3}\d{1,3}$/;

export function isLoopbackIPv4(address) {
  return typeof address === 'string' && address.startsWith('127.');
}

export function isLinkLocalIPv4(address) {
  return typeof address === 'string' && address.startsWith('169.254.');
}

export function isUsableLanIPv4(address) {
  if (typeof address !== 'string' || !IPV4_PATTERN.test(address)) {
    return false;
  }
  if (address === VOCABULARY_HOST) {
    return false;
  }
  if (isLoopbackIPv4(address) || isLinkLocalIPv4(address)) {
    return false;
  }
  return true;
}

function isIPv4Family(family) {
  return family === 'IPv4' || family === 4;
}

export function listLanIPv4Addresses(interfaces = networkInterfaces()) {
  const addresses = [];
  for (const entries of Object.values(interfaces ?? {})) {
    for (const entry of entries ?? []) {
      if (!entry || entry.internal || !isIPv4Family(entry.family)) {
        continue;
      }
      if (!isUsableLanIPv4(entry.address)) {
        continue;
      }
      if (!addresses.includes(entry.address)) {
        addresses.push(entry.address);
      }
    }
  }
  return addresses;
}

export function vocabularyUrl(host, port = VOCABULARY_PORT, route = VOCABULARY_ROUTE) {
  return `http://${host}:${port}${route}`;
}

export function localVocabularyUrls(port = VOCABULARY_PORT) {
  return [vocabularyUrl('127.0.0.1', port), vocabularyUrl('localhost', port)];
}

export function networkVocabularyUrls(addresses = listLanIPv4Addresses(), port = VOCABULARY_PORT) {
  return addresses.filter(isUsableLanIPv4).map((address) => vocabularyUrl(address, port));
}

export function allowedDevOrigins(addresses = listLanIPv4Addresses()) {
  return Array.from(new Set(['127.0.0.1', 'localhost', ...addresses.filter(isUsableLanIPv4)]));
}

export function formatStartupUrls(addresses = listLanIPv4Addresses(), port = VOCABULARY_PORT) {
  const lines = [
    `Oliver Vocabulary Master binds ${VOCABULARY_HOST}:${port}.`,
    `${VOCABULARY_HOST} is the listen address, not a browser URL. Open:`,
    '',
    ...localVocabularyUrls(port).map((url) => `  Local:    ${url}`),
  ];

  const networkUrls = networkVocabularyUrls(addresses, port);
  if (networkUrls.length === 0) {
    lines.push('  Network:  (no non-loopback IPv4 detected)');
  } else {
    for (const url of networkUrls) {
      lines.push(`  Network:  ${url}`);
    }
  }

  return lines.join('\n');
}
