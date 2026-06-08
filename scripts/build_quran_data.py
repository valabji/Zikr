#!/usr/bin/env python3
"""One-shot builder: fetches Quran data from api.quran.com and writes
assets/quran/data/*.json. Run once; commit output.

Produces:
  pages.json              - per-page Uthmani text (ayah-level)
  pages_lines_v1.json     - per-page, per-line word layout matching the
                            KFGQPC 1405 H Mushaf (Madinah 1st print)
  pages_lines_v2.json     - per-page, per-line word layout for the
                            KFGQPC 1421/1441 H Mushaf (revised Madinah)
  surahs.json             - 114 surah index
  juz.json                - 30 juz index
  translation_en.json     - {"1:1": "text", ...} Pickthall (Phase 2)
  search_index.json       - normalized inverted word index (Phase 2)
  tafsir_ar.json          - {"1:1": "text", ...} Muyassar (Phase 4)
  words.json              - {"1:1": [{"ar":..,"en":..}, ...], ...} (Phase 4)
"""

import concurrent.futures
import json
import os
import re
import sys
import urllib.request

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT_DIR = os.path.join(ROOT, "assets", "quran", "data")
API = "https://api.quran.com/api/v4"

TRANSLATION_ID = 19  # M. Pickthall (classic English, public domain)
TAFSIR_ID = 16       # Tafsir Muyassar (concise Arabic)


def fetch_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "zikr-builder/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())


# ---- pages.json ---------------------------------------------------------

def fetch_page(page):
    data = fetch_json(f"{API}/verses/by_page/{page}?fields=text_uthmani&per_page=50")
    ayahs = []
    for v in data["verses"]:
        s, a = (int(x) for x in v["verse_key"].split(":"))
        ayahs.append({
            "surah": s, "ayah": a,
            "text": v["text_uthmani"],
            "juz": v["juz_number"],
        })
    return {"page": page, "ayahs": ayahs}


def build_pages():
    print("Fetching 604 pages (parallel x16)...", file=sys.stderr)
    pages = [None] * 604
    with concurrent.futures.ThreadPoolExecutor(max_workers=16) as ex:
        futures = {ex.submit(fetch_page, p): p for p in range(1, 605)}
        done = 0
        for fut in concurrent.futures.as_completed(futures):
            p = futures[fut]
            pages[p - 1] = fut.result()
            done += 1
            if done % 100 == 0:
                print(f"  pages {done}/604", file=sys.stderr)
    return pages


# ---- surahs.json --------------------------------------------------------

def build_surahs():
    print("Fetching surahs metadata...", file=sys.stderr)
    en = fetch_json(f"{API}/chapters?language=en")
    ar = fetch_json(f"{API}/chapters?language=ar")
    ar_by_id = {c["id"]: c for c in ar["chapters"]}
    out = []
    for c in en["chapters"]:
        out.append({
            "id": c["id"],
            "nameAr": ar_by_id[c["id"]]["name_arabic"],
            "nameEn": c["name_simple"],
            "translationEn": c["translated_name"]["name"],
            "startPage": c["pages"][0],
            "ayahCount": c["verses_count"],
            "type": "meccan" if c["revelation_place"] == "makkah" else "medinan",
        })
    return out


# ---- juz.json -----------------------------------------------------------

def build_juz(pages):
    seen = {}
    for pg in pages:
        for ayah in pg["ayahs"]:
            j = ayah["juz"]
            if j not in seen:
                seen[j] = {
                    "id": j, "startPage": pg["page"],
                    "startSurah": ayah["surah"], "startAyah": ayah["ayah"],
                }
    return [seen[i] for i in sorted(seen.keys())]


# ---- pages_code_v1.json --------------------------------------------------

def fetch_page_v1(page):
    data = fetch_json(f"{API}/verses/by_page/{page}?fields=code_v1,v1_page&per_page=50")
    ayahs = []
    for v in data["verses"]:
        s, a = (int(x) for x in v["verse_key"].split(":"))
        ayahs.append({
            "surah": s, "ayah": a,
            "code": v["code_v1"],
            "vp": v["v1_page"],
        })
    return {"page": page, "ayahs": ayahs}


def build_pages_v1():
    print("Fetching 604 pages of QCF v1 codes (parallel x16)...", file=sys.stderr)
    pages = [None] * 604
    with concurrent.futures.ThreadPoolExecutor(max_workers=16) as ex:
        futures = {ex.submit(fetch_page_v1, p): p for p in range(1, 605)}
        done = 0
        for fut in concurrent.futures.as_completed(futures):
            p = futures[fut]
            pages[p - 1] = fut.result()
            done += 1
            if done % 100 == 0:
                print(f"  v1 pages {done}/604", file=sys.stderr)
    return pages


# ---- translation_en.json ------------------------------------------------

def build_translation(pages):
    print(f"Fetching Pickthall translation (id={TRANSLATION_ID})...", file=sys.stderr)
    # The bulk endpoint returns 6236 verses in canonical order without keys —
    # pair them with the canonical key sequence drawn from pages.json.
    data = fetch_json(f"{API}/quran/translations/{TRANSLATION_ID}")
    items = data["translations"]
    keys = []
    for pg in pages:
        for a in pg["ayahs"]:
            keys.append(f"{a['surah']}:{a['ayah']}")
    if len(items) != len(keys):
        raise SystemExit(
            f"translation count mismatch: {len(items)} translations vs {len(keys)} verses"
        )
    out = {}
    for k, t in zip(keys, items):
        out[k] = re.sub(r"<[^>]+>", "", t["text"]).strip()
    return out


# ---- tafsir_ar.json -----------------------------------------------------

def fetch_tafsir_chapter(chap):
    data = fetch_json(f"{API}/tafsirs/{TAFSIR_ID}/by_chapter/{chap}?per_page=300")
    out = {}
    for t in data["tafsirs"]:
        text = re.sub(r"<[^>]+>", "", t["text"]).strip()
        text = re.sub(r"\s+", " ", text)
        out[t["verse_key"]] = text
    return out


def build_tafsir():
    print(f"Fetching tafsir Muyassar (id={TAFSIR_ID})...", file=sys.stderr)
    out = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
        futures = {ex.submit(fetch_tafsir_chapter, c): c for c in range(1, 115)}
        done = 0
        for fut in concurrent.futures.as_completed(futures):
            out.update(fut.result())
            done += 1
            if done % 25 == 0:
                print(f"  tafsir {done}/114 chapters", file=sys.stderr)
    return out


# ---- words.json --------------------------------------------------------

def fetch_page_words(page):
    url = (f"{API}/verses/by_page/{page}?words=true"
           f"&word_translation_language=en&fields=text_uthmani&per_page=50")
    data = fetch_json(url)
    out = {}
    for v in data["verses"]:
        words = []
        for w in v.get("words", []):
            if w.get("char_type_name") == "end":
                continue
            words.append({
                "ar": w.get("text", ""),
                "en": (w.get("translation") or {}).get("text", ""),
            })
        out[v["verse_key"]] = words
    return out


def build_words():
    print("Fetching word-by-word (parallel x16)...", file=sys.stderr)
    out = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=16) as ex:
        futures = {ex.submit(fetch_page_words, p): p for p in range(1, 605)}
        done = 0
        for fut in concurrent.futures.as_completed(futures):
            out.update(fut.result())
            done += 1
            if done % 100 == 0:
                print(f"  words {done}/604 pages", file=sys.stderr)
    return out


# ---- pages_lines.json --------------------------------------------------
# Per-page, per-line word groupings matching the King Fahd Complex 1405
# Mushaf layout: each page has up to 15 lines; lines are surah headers,
# bismillah banners, or text lines of words.

def _assemble_lines(by_line, surah_first_seen):
    """Given line-grouped words and per-surah first-line info, insert
    decorative surah-header and bismillah lines and return the page's
    line list."""
    surah_header_at = {}
    bismillah_at = set()
    for s, ln in surah_first_seen.items():
        if s == 1 or s == 9:
            # Al-Fatiha: bismillah IS verse 1:1; At-Tawbah: no bismillah
            if ln - 1 >= 1:
                surah_header_at[ln - 1] = s
        else:
            if ln - 1 >= 1:
                bismillah_at.add(ln - 1)
            if ln - 2 >= 1:
                surah_header_at[ln - 2] = s

    max_line = max(
        max(by_line.keys()) if by_line else 0,
        max(surah_header_at.keys()) if surah_header_at else 0,
        *bismillah_at if bismillah_at else [0],
    )

    lines = []
    for n in range(1, max_line + 1):
        if n in surah_header_at:
            lines.append({"n": n, "type": "surah_header", "surahId": surah_header_at[n]})
        elif n in bismillah_at:
            lines.append({"n": n, "type": "bismillah"})
        elif n in by_line:
            lines.append({"n": n, "type": "text", "words": by_line[n]})
    return lines


def fetch_words_of_v1_page(page):
    """Return raw words on v1 page N, each tagged with both v1 and v2 page+line."""
    url = (f"{API}/verses/by_page/{page}?words=true&per_page=50"
           f"&word_fields=line_v1,line_v2,v1_page,v2_page,"
           f"text_uthmani,code_v1,code_v2,char_type_name")
    data = fetch_json(url)
    out = []
    for v in data["verses"]:
        vk = v["verse_key"]
        for pos, w in enumerate(v.get("words", [])):
            out.append({
                "vk": vk,
                "pos": pos,
                "ar": w.get("text_uthmani") or w.get("text"),
                "type": w["char_type_name"],
                "v1_page": w["v1_page"], "v1_line": w["line_v1"],
                "v2_page": w["v2_page"], "v2_line": w["line_v2"],
                "code_v1": w.get("code_v1"),
                "code_v2": w.get("code_v2"),
            })
    return out


def build_pages_lines():
    print("Fetching v1-paginated word stream (parallel x16)...", file=sys.stderr)
    all_words = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=16) as ex:
        futures = {ex.submit(fetch_words_of_v1_page, p): p for p in range(1, 605)}
        done = 0
        for fut in concurrent.futures.as_completed(futures):
            all_words.extend(fut.result())
            done += 1
            if done % 100 == 0:
                print(f"  pages {done}/604", file=sys.stderr)
    print(f"  total words: {len(all_words)}", file=sys.stderr)

    # Group by (vk, pos) to dedupe — a word may appear via multiple by_page
    # fetches if the API includes border words in both. Keep one copy each.
    seen = {}
    for w in all_words:
        key = (w["vk"], w["pos"])
        if key not in seen:
            seen[key] = w
    unique = list(seen.values())
    print(f"  unique words: {len(unique)}", file=sys.stderr)

    def assemble_layout(page_key, line_key, code_key):
        by_page_line = {}      # {page_num: {line_num: [entries]}}
        surah_first = {}       # {page_num: {surah_id: first_line_num}}
        for w in unique:
            pg = w[page_key]
            ln = w[line_key]
            entry = {
                "ar": w["ar"], "code": w[code_key],
                "type": w["type"], "vk": w["vk"],
            }
            by_page_line.setdefault(pg, {}).setdefault(ln, []).append(entry)
            s, a = (int(x) for x in w["vk"].split(":"))
            if a == 1:
                page_surah = surah_first.setdefault(pg, {})
                if s not in page_surah:
                    page_surah[s] = ln

        out = [None] * 604
        for pg in range(1, 605):
            lines = _assemble_lines(by_page_line.get(pg, {}), surah_first.get(pg, {}))
            out[pg - 1] = {"page": pg, "lines": lines}
        return out

    v1_pages = assemble_layout("v1_page", "v1_line", "code_v1")
    v2_pages = assemble_layout("v2_page", "v2_line", "code_v2")
    return v1_pages, v2_pages


# ---- search_index.json -------------------------------------------------

TASHKEEL = re.compile(r"[ً-ٰٟۖ-ۭٓ-ٕ]")
TATWEEL = re.compile(r"ـ")
NONLETTER = re.compile(r"[^ء-يٱٲٳٵپ ]")


def normalize_ar(text):
    t = TASHKEEL.sub("", text)
    t = TATWEEL.sub("", t)
    # Unify alif/hamza variants
    t = t.replace("ٱ", "ا").replace("آ", "ا")
    t = t.replace("أ", "ا").replace("إ", "ا")
    t = t.replace("ى", "ي")  # alif maqsura -> ya
    t = t.replace("ة", "ه")  # ta marbuta -> ha
    t = NONLETTER.sub(" ", t)
    return re.sub(r"\s+", " ", t).strip()


def build_search_index(pages):
    print("Building search index...", file=sys.stderr)
    inv = {}
    for pg in pages:
        for ayah in pg["ayahs"]:
            key = f"{ayah['surah']}:{ayah['ayah']}"
            norm = normalize_ar(ayah["text"])
            for word in norm.split(" "):
                if len(word) < 2:
                    continue
                inv.setdefault(word, []).append(key)
    # dedupe per-key lists while keeping order
    for w in inv:
        seen = set()
        deduped = []
        for k in inv[w]:
            if k not in seen:
                seen.add(k)
                deduped.append(k)
        inv[w] = deduped
    return inv


# ---- main --------------------------------------------------------------

def write(path, data, compact=True):
    full = os.path.join(OUT_DIR, path)
    with open(full, "w", encoding="utf-8") as f:
        if compact:
            json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
        else:
            json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  wrote {path}: {os.path.getsize(full)/1024:.1f} KB", file=sys.stderr)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    pages = build_pages()
    surahs = build_surahs()
    juz = build_juz(pages)
    write("pages.json", pages)
    write("surahs.json", surahs, compact=False)
    write("juz.json", juz, compact=False)

    translation = build_translation(pages)
    write("translation_en.json", translation)

    tafsir = build_tafsir()
    write("tafsir_ar.json", tafsir)

    words = build_words()
    write("words.json", words)

    v1_lines, v2_lines = build_pages_lines()
    write("pages_lines_v1.json", v1_lines)
    write("pages_lines_v2.json", v2_lines)

    index = build_search_index(pages)
    write("search_index.json", index)

    print("All done.", file=sys.stderr)


if __name__ == "__main__":
    main()
