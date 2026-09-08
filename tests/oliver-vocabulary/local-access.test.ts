import { createServer } from 'node:net';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  VOCABULARY_HOST,
  VOCABULARY_PORT,
  VOCABULARY_ROUTE,
  allowedDevOrigins,
  formatStartupUrls,
  isUsableLanIPv4,
  listLanIPv4Addresses,
  localVocabularyUrls,
  networkVocabularyUrls,
  vocabularyUrl,
} from '../../scripts/vocabulary-network.mjs';
import {
  REQUIRED_NODE_VERSION,
  assertNodeVersion,
  buildNextArgv,
  formatPortInUseMessage,
  isNodeVersionSupported,
  prepareVocabularyServer,
  probePort,
} from '../../scripts/start-vocabulary-server.mjs';

const repositoryRoot = dirname(fileURLToPath(new URL('../../package.json', import.meta.url)));

function occupyPort(port: number, host: string): Promise<{ close: () => Promise<void> }> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(port, host, () => {
      resolve({
        close: () =>
          new Promise((resolveClose, rejectClose) => {
            server.close((error) => {
              if (error) rejectClose(error);
              else resolveClose();
            });
          }),
      });
    });
  });
}

describe('Oliver Vocabulary Master local access (port 2007)', () => {
  it('keeps a fixed 0.0.0.0:2007 bind and /oliver-vocabulary route', () => {
    expect(VOCABULARY_HOST).toBe('0.0.0.0');
    expect(VOCABULARY_PORT).toBe(2007);
    expect(VOCABULARY_ROUTE).toBe('/oliver-vocabulary');
    expect(VOCABULARY_PORT).not.toBe(3007);
  });

  it('builds Next argv that bind hostname 0.0.0.0 on the fixed port 2007', () => {
    expect(buildNextArgv('dev')).toEqual(['dev', '--hostname', '0.0.0.0', '--port', '2007']);
    expect(buildNextArgv('start')).toEqual(['start', '--hostname', '0.0.0.0', '--port', '2007']);
    expect(() => buildNextArgv('preview')).toThrow(/dev\|start/);
  });

  it('wires package.json scripts through the launcher instead of next -p 3007', () => {
    const manifest = JSON.parse(readFileSync(join(repositoryRoot, 'package.json'), 'utf8'));
    expect(manifest.scripts.dev).toBe('node scripts/start-vocabulary-server.mjs dev');
    expect(manifest.scripts.start).toBe('node scripts/start-vocabulary-server.mjs start');

    const nextConfig = readFileSync(join(repositoryRoot, 'next.config.ts'), 'utf8');
    expect(nextConfig).toContain('allowedDevOrigins');
    expect(nextConfig).toContain('./scripts/vocabulary-network.mjs');
  });

  it('requires Node.js >= 22.19.0', () => {
    expect(REQUIRED_NODE_VERSION).toBe('22.19.0');
    expect(isNodeVersionSupported('22.18.0')).toBe(false);
    expect(isNodeVersionSupported('22.19.0')).toBe(true);
    expect(isNodeVersionSupported('v22.22.2')).toBe(true);
    expect(() => assertNodeVersion('22.14.0')).toThrow(/22\.19\.0/);
  });

  it('generates local and dynamic LAN URLs on 2007', () => {
    expect(localVocabularyUrls()).toEqual([
      'http://127.0.0.1:2007/oliver-vocabulary',
      'http://localhost:2007/oliver-vocabulary',
    ]);
    expect(vocabularyUrl('10.0.0.12')).toBe('http://10.0.0.12:2007/oliver-vocabulary');
    expect(networkVocabularyUrls(['10.0.0.12', '192.168.1.20'])).toEqual([
      'http://10.0.0.12:2007/oliver-vocabulary',
      'http://192.168.1.20:2007/oliver-vocabulary',
    ]);
  });

  it('excludes loopback, link-local 169.254.x.x, and non-IPv4 from LAN detection', () => {
    expect(isUsableLanIPv4('127.0.0.1')).toBe(false);
    expect(isUsableLanIPv4('127.0.0.2')).toBe(false);
    expect(isUsableLanIPv4('169.254.12.34')).toBe(false);
    expect(isUsableLanIPv4('0.0.0.0')).toBe(false);
    expect(isUsableLanIPv4('::1')).toBe(false);
    expect(isUsableLanIPv4('10.1.2.3')).toBe(true);

    const detected = listLanIPv4Addresses({
      lo: [{ address: '127.0.0.1', family: 'IPv4', internal: true }],
      eth0: [
        { address: '169.254.10.20', family: 'IPv4', internal: false },
        { address: '10.8.0.4', family: 'IPv4', internal: false },
        { address: 'fe80::1', family: 'IPv6', internal: false },
      ],
      eth1: [{ address: '10.8.0.4', family: 4, internal: false }],
    } as unknown as NodeJS.Dict<import('node:os').NetworkInterfaceInfo[]>);

    expect(detected).toEqual(['10.8.0.4']);
    expect(allowedDevOrigins(['10.8.0.4', '169.254.1.1', '127.0.0.1'])).toEqual([
      '127.0.0.1',
      'localhost',
      '10.8.0.4',
    ]);
  });

  it('prints usable URLs and never treats 0.0.0.0 as a browser host', () => {
    const printed = formatStartupUrls(['172.16.4.9']);
    expect(printed).toContain('http://127.0.0.1:2007/oliver-vocabulary');
    expect(printed).toContain('http://localhost:2007/oliver-vocabulary');
    expect(printed).toContain('http://172.16.4.9:2007/oliver-vocabulary');
    expect(printed).toMatch(/listen address, not a browser URL/);
    expect(printed).not.toMatch(/http:\/\/0\.0\.0\.0:2007\/oliver-vocabulary/);
  });

  it('probes the configured port and refuses to increment or kill an occupant', async () => {
    const holder = await occupyPort(VOCABULARY_PORT, VOCABULARY_HOST);
    try {
      await expect(probePort(VOCABULARY_PORT, VOCABULARY_HOST)).resolves.toBe(false);
      await expect(
        prepareVocabularyServer('dev', {
          nodeVersion: '22.19.0',
          resolveNext: () => '/tmp/fake-next',
        }),
      ).rejects.toThrow(/already in use/);
      expect(formatPortInUseMessage()).toMatch(/does not stop the existing process/);
      expect(formatPortInUseMessage()).toMatch(/does not switch to another port/);
      expect(formatPortInUseMessage()).toMatch(/3007/);
    } finally {
      await holder.close();
    }

    const launch = await prepareVocabularyServer('dev', {
      nodeVersion: '22.19.0',
      resolveNext: () => '/tmp/fake-next',
      probe: async () => true,
    });
    expect(launch.host).toBe('0.0.0.0');
    expect(launch.port).toBe(2007);
    expect(launch.argv).toEqual(['dev', '--hostname', '0.0.0.0', '--port', '2007']);
  });
});
