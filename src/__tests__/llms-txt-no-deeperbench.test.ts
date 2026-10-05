import { readFileSync } from 'fs';
import { join } from 'path';

describe('public/llms.txt', () => {
  it('does not mention the unpublished DeeperBench route', () => {
    const txt = readFileSync(join(__dirname, '..', '..', 'public', 'llms.txt'), 'utf8');
    expect(txt).not.toMatch(/deeperbench/i);
  });
});
