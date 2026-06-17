function joinEnglish(english) {
  if (!english) return '';
  if (typeof english === 'string') return english.trim();
  return [english.narrator, english.text]
    .map((part) => (part == null ? '' : String(part).trim()))
    .filter(Boolean)
    .join(' ')
    .trim();
}

function transformRawBook(raw) {
  const hadiths = raw && Array.isArray(raw.hadiths) ? raw.hadiths : [];
  const entries = [];
  for (const h of hadiths) {
    if (!h) continue;
    const textAr = h.arabic == null ? '' : String(h.arabic).trim();
    if (!textAr) continue;
    const textEn = joinEnglish(h.english);
    const n = h.idInBook != null ? h.idInBook : h.id != null ? h.id : entries.length + 1;
    entries.push(textEn ? { n, textAr, textEn } : { n, textAr });
  }
  return { entries };
}

module.exports = { transformRawBook, joinEnglish };
