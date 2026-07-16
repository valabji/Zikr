import { base64ToBytes, bytesToBase64, patchQcf4Dark } from '@/utils/qcf4Dark';

const ascii = (s) => Array.from(s, (c) => c.charCodeAt(0));
const utf16be = (s) => ascii(s).flatMap((c) => [0, c]);
const u16 = (v) => [(v >> 8) & 0xff, v & 0xff];
const u32 = (v) => [(v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff];

const CPAL_OFF = 44;
const NAME_OFF = CPAL_OFF + 16;
const NAME_CONTENT = [...ascii('QCF4001_COLOR-Regular'), ...utf16be('QCF4001_COLOR')];

function syntheticFont() {
  return new Uint8Array([
    ...u32(0x00010000), ...u16(2), ...u16(0), ...u16(0), ...u16(0),
    ...ascii('CPAL'), ...u32(0), ...u32(CPAL_OFF), ...u32(16),
    ...ascii('name'), ...u32(0), ...u32(NAME_OFF), ...u32(NAME_CONTENT.length),
    ...u16(0), ...u16(2), ...u16(2), ...u16(4), ...u32(NAME_OFF + NAME_CONTENT.length), ...u16(0), ...u16(1),
    ...NAME_CONTENT,
  ]);
}

const findSub = (haystack, needle, from, to) => {
  for (let i = from; i <= to - needle.length; i++) {
    let hit = true;
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) { hit = false; break; }
    }
    if (hit) return i;
  }
  return -1;
};

describe('base64 round-trip', () => {
  it('preserves bytes for every length mod 3 and large buffers', () => {
    for (const len of [0, 1, 2, 3, 4, 5, 60000]) {
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = (i * 31 + 7) & 0xff;
      const back = base64ToBytes(bytesToBase64(bytes));
      expect(back.length).toBe(len);
      expect(Buffer.from(back).equals(Buffer.from(bytes))).toBe(true);
    }
  });

  it('decodes padded base64 produced elsewhere', () => {
    const bytes = base64ToBytes(Buffer.from('hello!!').toString('base64'));
    expect(Buffer.from(bytes).toString()).toBe('hello!!');
  });
});

describe('patchQcf4Dark', () => {
  it('swaps the first two CPAL palette indices', () => {
    const font = patchQcf4Dark(syntheticFont());
    expect([font[CPAL_OFF + 12], font[CPAL_OFF + 13]]).toEqual([0, 1]);
    expect([font[CPAL_OFF + 14], font[CPAL_OFF + 15]]).toEqual([0, 0]);
  });

  it('renames _COLOR to _DARKC in ASCII and UTF-16BE name records', () => {
    const font = patchQcf4Dark(syntheticFont());
    const end = NAME_OFF + NAME_CONTENT.length;
    expect(findSub(font, ascii('_COLOR'), NAME_OFF, end)).toBe(-1);
    expect(findSub(font, utf16be('_COLOR'), NAME_OFF, end)).toBe(-1);
    expect(findSub(font, ascii('_DARKC'), NAME_OFF, end)).toBeGreaterThan(-1);
    expect(findSub(font, utf16be('_DARKC'), NAME_OFF, end)).toBeGreaterThan(-1);
  });

  it('leaves bytes outside CPAL indices and name table untouched', () => {
    const original = syntheticFont();
    const font = patchQcf4Dark(syntheticFont());
    for (let i = 0; i < NAME_OFF; i++) {
      if (i >= CPAL_OFF + 12 && i < CPAL_OFF + 16) continue;
      expect(font[i]).toBe(original[i]);
    }
  });

  it('throws when CPAL or name is missing', () => {
    const noTables = new Uint8Array([...u32(0x00010000), ...u16(0), ...u16(0), ...u16(0), ...u16(0)]);
    expect(() => patchQcf4Dark(noTables)).toThrow();
  });
});
