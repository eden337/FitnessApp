import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const sourceRoot = join(__dirname, '..', 'src');
const approvedColorFiles = new Set([
  join('theme', 'index.ts'),
  join('components', 'FoodArtwork.tsx'),
]);

const sourceFiles = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(entry) ? [path] : [];
  });

describe('design token policy', () => {
  it('keeps raw colors inside the theme and approved artwork modules', () => {
    const offenders = sourceFiles(sourceRoot)
      .filter((path) => !approvedColorFiles.has(relative(sourceRoot, path)))
      .filter((path) => /#[0-9a-f]{3,8}\b|rgba?\(/i.test(readFileSync(path, 'utf8')))
      .map((path) => relative(sourceRoot, path));

    expect(offenders).toEqual([]);
  });
});
