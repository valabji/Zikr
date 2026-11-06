const bundledLoaders = {
  muyassar_ar: () => import('@assets/quran/data/tafsir_ar.json'),
  saadi_ar: () => import('@assets/quran/data/tafsir_saadi_ar.json'),
  baghawi_ar: () => import('@assets/quran/data/tafsir_baghawi_ar.json'),
  wahiduddin_en: () => import('@assets/quran/data/tafsir_wahiduddin_en.json'),
};

export async function loadBundledTafsir(id) {
  const loader = Object.hasOwn(bundledLoaders, id) ? bundledLoaders[id] : bundledLoaders.muyassar_ar;
  return (await loader()).default;
}

const API_BASE = 'https://api.quran.com/api/v4';
const cache = {};

export function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export async function fetchApiTafsir(apiId, ayahKey) {
  const k = `${apiId}:${ayahKey}`;
  if (cache[k] !== undefined) return cache[k];
  try {
    const res = await fetch(`${API_BASE}/tafsirs/${apiId}/by_ayah/${ayahKey}`, { headers: { Accept: 'application/json' } });
    const data = await res.json();
    const text = stripHtml(data?.tafsir?.text || '');
    cache[k] = text;
    return text;
  } catch {
    cache[k] = '';
    return '';
  }
}
