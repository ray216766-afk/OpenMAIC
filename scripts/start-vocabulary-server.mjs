#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  VOCABULARY_HOST,
  VOCABULARY_PORT,
  formatStartupUrls,
  listLanIPv4Addresses,
} from './vocabulary-network.mjs';

export const REQUIRED_NODE_VERSION = '22.19.0';

const repositoryRoot = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));

export function parseSemver(version) {
  const [core] = String(version).replace(/^v/i, '').split('-');
  const [major = '0', minor = '0', patch = '0'] = core.split('.');
  return [
    Number.parseInt(major, 10) || 0,
    Number.parseInt(minor, 10) || 0,
    Number.parseInt(patch, 10) || 0,
  ];
}

export function isNodeVersionSupported(version, minimum = REQUIRED_NODE_VERSION) {
  const left = parseSemver(version);
  const right = parseSemver(minimum);
  for (let index = 0; index < 3; index += 1) {
    if (left[index] > right[index]) return true;
    if (left[index] < right[index]) return false;
  }
  return true;
}

export function assertNodeVersion(
  version = process.versions.node,
  minimum = REQUIRED_NODE_VERSION,
) {
  if (!isNodeVersionSupported(version, minimum)) {
    throw new Error(
      `Node.js >= ${minimum} is required to start Oliver Vocabulary Master. Current: ${version}`,
    );
  }
}

export function resolveNextBinary(root = repositoryRoot) {
  const require = createRequire(join(root, 'package.json'));
  try {
    return require.resolve('next/dist/bin/next');
  } catch {
    throw new Error('Next.js is not installed. Run `pnpm install` from the repository root.');
  }
}

export function buildNextArgv(command) {
  if (command !== 'dev' && command !== 'start') {
    throw new Error('Usage: node scripts/start-vocabulary-server.mjs <dev|start>');
  }
  return [command, '--hostname', VOCABULARY_HOST, '--port', String(VOCABULARY_PORT)];
}

export function formatPortInUseMessage(port = VOCABULARY_PORT) {
  return [
    `Port ${port} is already in use.`,
    'This launcher does not stop the existing process and does not switch to another port.',
    'This Vocabulary Master entry uses 2007 so it does not fight an existing app on 3007.',
    'Free port 2007, then run `pnpm dev` again.',
    'Diagnostics: `ss -ltnp | grep 2007` (Linux/macOS) or `netstat -ano | findstr :2007` (Windows).',
  ].join('\n');
}

export function probePort(port = VOCABULARY_PORT, host = VOCABULARY_HOST) {
  return new Promise((resolveAvailable, reject) => {
    const server = createServer();
    server.unref();
    server.once('error', (error) => {
      if (error && error.code === 'EADDRINUSE') {
        resolveAvailable(false);
        return;
      }
      reject(error);
    });
    server.once('listening', () => {
      server.close((closeError) => {
        if (closeError) {
          reject(closeError);
          return;
        }
        resolveAvailable(true);
      });
    });
    server.listen(port, host);
  });
}

export async function prepareVocabularyServer(command, options = {}) {
  const {
    nodeVersion = process.versions.node,
    root = repositoryRoot,
    resolveNext = resolveNextBinary,
    probe = probePort,
  } = options;

  assertNodeVersion(nodeVersion);
  const argv = buildNextArgv(command);
  const nextBin = resolveNext(root);
  const available = await probe(VOCABULARY_PORT, VOCABULARY_HOST);
  if (!available) {
    throw new Error(formatPortInUseMessage(VOCABULARY_PORT));
  }

  return {
    command,
    nextBin,
    argv,
    cwd: root,
    host: VOCABULARY_HOST,
    port: VOCABULARY_PORT,
  };
}

export function printAccessUrls(log = console.log, addresses = listLanIPv4Addresses()) {
  log(formatStartupUrls(addresses, VOCABULARY_PORT));
}

function isMainModule() {
  const entry = process.argv[1];
  if (!entry) return false;
  return fileURLToPath(import.meta.url) === resolve(entry);
}

async function main() {
  const launch = await prepareVocabularyServer(process.argv[2]);
  printAccessUrls();

  const child = spawn(process.execPath, [launch.nextBin, ...launch.argv], {
    cwd: launch.cwd,
    env: process.env,
    stdio: 'inherit',
  });

  const forward = (signal) => {
    if (child.pid) {
      child.kill(signal);
    }
  };
  process.on('SIGINT', () => forward('SIGINT'));
  process.on('SIGTERM', () => forward('SIGTERM'));

  const exitCode = await new Promise((resolveExit, reject) => {
    child.once('error', reject);
    child.once('exit', (code) => resolveExit(code ?? 1));
  });
  process.exit(exitCode);
}

if (isMainModule()) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
