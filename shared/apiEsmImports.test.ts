import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RELATIVE_IMPORT = /from\s+['"](\.[^'"]+)['"]/g;

function walkTs(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      walkTs(path, acc);
      continue;
    }
    if (path.endsWith('.ts') && !path.endsWith('.test.ts')) acc.push(path);
  }
  return acc;
}

test('API ESM graph uses .js specifiers on relative imports', () => {
  const files = [
    ...walkTs(join(ROOT, 'api')),
    join(ROOT, 'shared/quoteCalc.ts'),
    join(ROOT, 'shared/fuel.ts'),
    join(ROOT, 'shared/money.ts'),
    join(ROOT, 'shared/snapshot.ts'),
    join(ROOT, 'shared/format.ts'),
    join(ROOT, 'shared/rates.ts'),
    join(ROOT, 'lib/sanitize.ts'),
    join(ROOT, 'lib/validation.ts'),
    join(ROOT, 'lib/customerCopy.ts'),
    join(ROOT, 'shared/memberCode.ts'),
    join(ROOT, 'shared/memberCodeFormat.ts'),
  ];

  const missing: string[] = [];
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(RELATIVE_IMPORT)) {
      const spec = match[1];
      if (!spec.endsWith('.js')) {
        missing.push(`${file.replace(`${ROOT}/`, '')}: ${spec}`);
      }
    }
  }

  assert.deepEqual(missing, [], 'Vercel Node ESM compiles .ts → .js; extensionless relative imports fail at runtime');
});
