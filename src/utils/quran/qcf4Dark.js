const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const B64_REV = (() => {
  const t = new Uint8Array(128);
  for (let i = 0; i < 64; i++) t[B64.charCodeAt(i)] = i;
  return t;
})();

export function base64ToBytes(b64) {
  let len = b64.length;
  while (len > 0 && b64[len - 1] === '=') len--;
  const out = new Uint8Array(Math.floor(len * 3 / 4));
  let o = 0;
  for (let i = 0; i + 3 < len; i += 4) {
    const n = (B64_REV[b64.charCodeAt(i)] << 18) | (B64_REV[b64.charCodeAt(i + 1)] << 12)
      | (B64_REV[b64.charCodeAt(i + 2)] << 6) | B64_REV[b64.charCodeAt(i + 3)];
    out[o++] = n >> 16;
    out[o++] = (n >> 8) & 0xff;
    out[o++] = n & 0xff;
  }
  const rem = len & 3;
  if (rem) {
    const i = len - rem;
    let n = (B64_REV[b64.charCodeAt(i)] << 18) | (B64_REV[b64.charCodeAt(i + 1)] << 12);
    if (rem === 3) n |= B64_REV[b64.charCodeAt(i + 2)] << 6;
    out[o++] = n >> 16;
    if (rem === 3) out[o++] = (n >> 8) & 0xff;
  }
  return out;
}

export function bytesToBase64(bytes) {
  const chunks = [];
  let s = '';
  for (let i = 0; i + 2 < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    s += B64[n >> 18] + B64[(n >> 12) & 63] + B64[(n >> 6) & 63] + B64[n & 63];
    if (s.length >= 0x8000) { chunks.push(s); s = ''; }
  }
  const rem = bytes.length % 3;
  if (rem === 1) {
    const n = bytes[bytes.length - 1] << 16;
    s += B64[n >> 18] + B64[(n >> 12) & 63] + '==';
  } else if (rem === 2) {
    const n = (bytes[bytes.length - 2] << 16) | (bytes[bytes.length - 1] << 8);
    s += B64[n >> 18] + B64[(n >> 12) & 63] + B64[(n >> 6) & 63] + '=';
  }
  chunks.push(s);
  return chunks.join('');
}

const u16 = (b, o) => (b[o] << 8) | b[o + 1];
const u32 = (b, o) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
const setU16 = (b, o, v) => { b[o] = (v >> 8) & 0xff; b[o + 1] = v & 0xff; };

const ascii = (s) => Array.from(s, (c) => c.charCodeAt(0));
const utf16be = (s) => ascii(s).flatMap((c) => [0, c]);

function replaceInRange(bytes, start, len, from, to) {
  const end = start + len - from.length;
  for (let i = start; i <= end; i++) {
    let hit = true;
    for (let j = 0; j < from.length; j++) {
      if (bytes[i + j] !== from[j]) { hit = false; break; }
    }
    if (hit) {
      for (let j = 0; j < to.length; j++) bytes[i + j] = to[j];
      i += from.length - 1;
    }
  }
}

// Swaps CPAL's default palette to the dark set and renames _COLOR→_DARKC so iOS can register light and dark files together.
export function patchQcf4Dark(bytes) {
  const numTables = u16(bytes, 4);
  let cpal = null;
  let name = null;
  for (let i = 0; i < numTables; i++) {
    const rec = 12 + i * 16;
    const tag = String.fromCharCode(bytes[rec], bytes[rec + 1], bytes[rec + 2], bytes[rec + 3]);
    if (tag === 'CPAL') cpal = u32(bytes, rec + 8);
    if (tag === 'name') name = { off: u32(bytes, rec + 8), len: u32(bytes, rec + 12) };
  }
  if (cpal == null || !name) throw new Error('CPAL or name table missing');
  const i0 = u16(bytes, cpal + 12);
  const i1 = u16(bytes, cpal + 14);
  setU16(bytes, cpal + 12, i1);
  setU16(bytes, cpal + 14, i0);
  replaceInRange(bytes, name.off, name.len, ascii('_COLOR'), ascii('_DARKC'));
  replaceInRange(bytes, name.off, name.len, utf16be('_COLOR'), utf16be('_DARKC'));
  return bytes;
}
