import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const repoRoot = dirname(fileURLToPath(new URL('../../package.json', import.meta.url)));

describe('instrumentation Edge surface', () => {
  it('keeps Node signal APIs out of instrumentation.ts so Next Edge compile cannot 404 APIs', () => {
    const source = readFileSync(join(repoRoot, 'instrumentation.ts'), 'utf8');
    expect(source).not.toMatch(/process\.(once|on)\s*\(/);
    expect(source).toContain("await import('./instrumentation.node')");
    expect(source).toContain("NEXT_RUNTIME !== 'nodejs'");
  });

  it('keeps SIGTERM/SIGINT handlers in the Node-only module', () => {
    const source = readFileSync(join(repoRoot, 'instrumentation.node.ts'), 'utf8');
    expect(source).toContain("process.once('SIGTERM'");
    expect(source).toContain("process.once('SIGINT'");
  });
});
