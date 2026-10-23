import { normalizeFilename } from './normalize-filename';

const misdecode = (name: string) => Buffer.from(name, 'utf8').toString('latin1');

describe('normalizeFilename', () => {
  it.each(['Screenshot 2026-10-22 at 11.55.42\u202fPM.png', 'revisión y año.png', '证据 📷.png'])(
    'recovers one and two multipart decoding passes for %s', name => {
      expect(normalizeFilename(misdecode(name))).toBe(name);
      expect(normalizeFilename(misdecode(misdecode(name)))).toBe(name);
    }
  );

  it.each(['normal.png', 'revisión y año.png', '证据 📷.png', 'Screenshot\u202fPM.png'])(
    'preserves an already correct name: %s', name => {
      expect(normalizeFilename(name)).toBe(name);
    }
  );
});
