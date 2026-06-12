#!/usr/bin/env python3
"""Precompute per-line text widths for the Mushaf reader.

For every page line in pages_lines_v1/v2 this measures the exact probe string
MushafPage.js renders, in milli-em units, and writes line_widths_v{1,2}.json:

  { "qcf": [[...per-line ints]], "hafs": [[...per-line ints]] }

- "qcf" widths sum the per-page QCF font glyph advances of the word codes,
  EXCLUDING spaces (the QCF fonts have no U+0020 glyph; the app adds an
  estimated space width at runtime). Requires the 604 page fonts per version,
  downloadable from the quran.com frontend repo:
    https://raw.githubusercontent.com/quran/quran.com-frontend-next/production/public/fonts/quran/hafs/{v1,v2}/ttf/p{N}.ttf
- "hafs" widths shape the Unicode probe string (including spaces and the
  bare ayah-number digits) with HarfBuzz using the bundled UthmanicHafs font.

Non-text lines (surah headers, bismillah) are 0.

Usage: python3 scripts/build_line_widths.py /path/to/qcf_v1_fonts /path/to/qcf_v2_fonts
"""
import json
import os
import sys

import uharfbuzz as hb
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'assets', 'quran', 'data')
HAFS_FONT = os.path.join(ROOT, 'assets', 'quran', 'fonts', 'UthmanicHafs1Ver18.ttf')

ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩'

# Mirror of arForHafs in utils/mushafLayout.js (NBSP swap is width-neutral).
HAFS_CHAR_FIXES = {'۟': 'ْ', 'ۣ': 'ۜ', '۫': '۬'}


def hafs_fix(s):
    for k, v in HAFS_CHAR_FIXES.items():
        s = s.replace(k, v)
    return s


def to_arabic_digits(n):
    return ''.join(ARABIC_DIGITS[int(d)] for d in str(n))


def probe_string(line, qcf):
    """Mirror of the probeStrings useMemo in components/MushafPage.js."""
    s = ''
    prev_vk = None
    word_in_group = 0
    for w in line['words']:
        if w.get('vk') != prev_vk:
            if prev_vk is not None:
                s += ' '
            prev_vk = w.get('vk')
            word_in_group = 0
        if not qcf and w.get('type') == 'end':
            a = (w.get('vk') or ':').split(':')[1]
            s += ' ' + to_arabic_digits(int(a))
        else:
            s += ('' if word_in_group == 0 else ' ') + ((w.get('code') if qcf else w.get('ar')) or '')
        word_in_group += 1
    return s


def qcf_milli_em(font_path, s):
    font = TTFont(font_path, lazy=True)
    cmap = font.getBestCmap()
    hmtx = font['hmtx']
    upem = font['head'].unitsPerEm
    total = 0
    missing = []
    for ch in s:
        if ch == ' ':
            continue
        g = cmap.get(ord(ch))
        if g is None:
            missing.append(hex(ord(ch)))
            continue
        total += hmtx[g][0]
    font.close()
    return round(total / upem * 1000), missing


class HafsShaper:
    def __init__(self, path):
        blob = hb.Blob.from_file_path(path)
        face = hb.Face(blob)
        self.upem = face.upem
        self.font = hb.Font(face)
        self.cmap_misses = set()
        self.ttf = TTFont(path, lazy=True)
        self.cmap = self.ttf.getBestCmap()

    def milli_em(self, s):
        for ch in s:
            if ord(ch) not in self.cmap and ch != ' ':
                self.cmap_misses.add(hex(ord(ch)))
        buf = hb.Buffer()
        buf.add_str(s)
        buf.guess_segment_properties()
        hb.shape(self.font, buf)
        total = sum(pos.x_advance for pos in buf.glyph_positions)
        return round(total / self.upem * 1000)


def build(layout_name, qcf_dir):
    pages = json.load(open(os.path.join(DATA, f'pages_lines_{layout_name}.json')))
    shaper = HafsShaper(HAFS_FONT)
    qcf_out, hafs_out = [], []
    qcf_missing = {}
    for pi, page in enumerate(pages):
        page_no = page.get('page', pi + 1)
        font_path = os.path.join(qcf_dir, f'p{page_no}.ttf')
        qcf_row, hafs_row = [], []
        for line in page['lines']:
            if line.get('type') != 'text':
                qcf_row.append(0)
                hafs_row.append(0)
                continue
            qs = probe_string(line, qcf=True)
            hs = hafs_fix(probe_string(line, qcf=False))
            w, missing = qcf_milli_em(font_path, qs)
            if missing:
                qcf_missing.setdefault(page_no, []).extend(missing)
            qcf_row.append(w)
            hafs_row.append(shaper.milli_em(hs))
        qcf_out.append(qcf_row)
        hafs_out.append(hafs_row)
        if page_no % 100 == 0:
            print(f'{layout_name}: page {page_no}')
    if qcf_missing:
        n = sum(len(v) for v in qcf_missing.values())
        print(f'WARNING {layout_name}: {n} code chars missing from QCF cmaps on pages {sorted(qcf_missing)[:10]}...')
    if shaper.cmap_misses:
        print(f'WARNING {layout_name}: hafs cmap misses: {sorted(shaper.cmap_misses)}')
    out_path = os.path.join(DATA, f'line_widths_{layout_name}.json')
    with open(out_path, 'w') as f:
        json.dump({'qcf': qcf_out, 'hafs': hafs_out}, f, separators=(',', ':'))
    print(f'wrote {out_path} ({os.path.getsize(out_path)} bytes)')


if __name__ == '__main__':
    v1_dir, v2_dir = sys.argv[1], sys.argv[2]
    build('v1', v1_dir)
    build('v2', v2_dir)
