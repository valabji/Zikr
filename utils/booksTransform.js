function joinEnglish(english) {
  if (!english) return '';
  if (typeof english === 'string') return english.trim();
  return [english.narrator, english.text]
    .map((part) => (part == null ? '' : String(part).trim()))
    .filter(Boolean)
    .join(' ')
    .trim();
}

function buildChapterIndex(raw) {
  const list = raw && Array.isArray(raw.chapters) ? raw.chapters : [];
  const byId = new Map();
  for (const c of list) {
    if (!c || c.id == null) continue;
    byId.set(c.id, {
      ar: c.arabic == null ? '' : String(c.arabic).trim(),
      en: c.english == null ? '' : String(c.english).trim(),
    });
  }
  return byId;
}

function transformRawBook(raw) {
  const hadiths = raw && Array.isArray(raw.hadiths) ? raw.hadiths : [];
  const chapterById = buildChapterIndex(raw);
  const entries = [];
  const usedChapterIds = [];
  const seenChapters = new Set();
  for (const h of hadiths) {
    if (!h) continue;
    const textAr = h.arabic == null ? '' : String(h.arabic).trim();
    if (!textAr) continue;
    const textEn = joinEnglish(h.english);
    const n = h.idInBook != null ? h.idInBook : h.id != null ? h.id : entries.length + 1;
    const entry = textEn ? { n, textAr, textEn } : { n, textAr };
    const cid = h.chapterId;
    if (cid != null && chapterById.has(cid)) {
      entry.c = cid;
      if (!seenChapters.has(cid)) {
        seenChapters.add(cid);
        usedChapterIds.push(cid);
      }
    }
    entries.push(entry);
  }
  if (usedChapterIds.length > 1) {
    const chapters = usedChapterIds.map((id) => ({ id, ...chapterById.get(id) }));
    return { chapters, entries };
  }
  for (const entry of entries) delete entry.c;
  return { entries };
}

module.exports = { transformRawBook, joinEnglish };
