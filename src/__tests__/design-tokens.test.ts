import {readdirSync, readFileSync} from 'node:fs';
import {extname, join} from 'node:path';

const SRC_DIR = join(process.cwd(), 'src');
const INDEX_CSS = join(SRC_DIR, 'index.css');
const SOURCE_EXTS = new Set(['.ts', '.tsx', '.css']);
const VAR_REFERENCE = /var\(\s*(--[A-Za-z0-9_-]+)/g;
const ROOT_DECLARATION = /(--[A-Za-z0-9_-]+)\s*:/g;

function walkSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, {withFileTypes: true})) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkSourceFiles(full));
      continue;
    }
    if (SOURCE_EXTS.has(extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

function collectVarNames(source: string): string[] {
  const names: string[] = [];
  VAR_REFERENCE.lastIndex = 0;
  let match: RegExpExecArray | null = VAR_REFERENCE.exec(source);
  while (match !== null) {
    names.push(match[1]);
    match = VAR_REFERENCE.exec(source);
  }
  return names;
}

function extractRootBlocks(css: string): string[] {
  const blocks: string[] = [];
  const open = /:root\s*\{/g;
  let found: RegExpExecArray | null = open.exec(css);
  while (found !== null) {
    const braceAt = found.index + found[0].lastIndexOf('{');
    let depth = 0;
    for (let i = braceAt; i < css.length; i += 1) {
      const ch = css[i];
      if (ch === '{') {
        depth += 1;
      } else if (ch === '}') {
        depth -= 1;
        if (depth === 0) {
          blocks.push(css.slice(braceAt + 1, i));
          break;
        }
      }
    }
    found = open.exec(css);
  }
  return blocks;
}

function collectRootDeclarationNames(css: string): string[] {
  const names: string[] = [];
  for (const block of extractRootBlocks(css)) {
    ROOT_DECLARATION.lastIndex = 0;
    let match: RegExpExecArray | null = ROOT_DECLARATION.exec(block);
    while (match !== null) {
      names.push(match[1]);
      match = ROOT_DECLARATION.exec(block);
    }
  }
  return names;
}

function incrementNamedCount(counts: Map<string, number>, name: string): void {
  const existing = counts.get(name);
  if (existing === undefined) {
    counts.set(name, 1);
    return;
  }
  counts.set(name, existing + 1);
}

describe('design tokens', () => {
  it('defines every consumed custom property in index.css :root', () => {
    const defined = new Set(collectRootDeclarationNames(readFileSync(INDEX_CSS, 'utf8')));
    const missing = new Set<string>();
    for (const file of walkSourceFiles(SRC_DIR)) {
      for (const name of collectVarNames(readFileSync(file, 'utf8'))) {
        if (!defined.has(name)) {
          missing.add(name);
        }
      }
    }
    expect([...missing].sort()).toEqual([]);
  });

  it('does not declare the same :root token twice across src CSS', () => {
    const counts = new Map<string, number>();
    for (const file of walkSourceFiles(SRC_DIR)) {
      if (extname(file) !== '.css') {
        continue;
      }
      for (const name of collectRootDeclarationNames(readFileSync(file, 'utf8'))) {
        incrementNamedCount(counts, name);
      }
    }
    const duplicates = [...counts.entries()]
      .filter(([, count]) => count > 1)
      .map(([name]) => name)
      .sort();
    expect(duplicates).toEqual([]);
  });
});
