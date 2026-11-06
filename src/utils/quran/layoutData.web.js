const layouts = {};

export async function loadLayouts() {
  await Promise.all([
    import('@assets/quran/data/pages_lines_v1.json').then(({ default: data }) => { layouts.pages_lines_v1 = data; }),
    import('@assets/quran/data/pages_lines_v2.json').then(({ default: data }) => { layouts.pages_lines_v2 = data; }),
  ]);
}

export function getLayout(layoutFile) {
  const layout = layouts[layoutFile === 'pages_lines_v2' ? layoutFile : 'pages_lines_v1'];
  if (!layout) throw new Error('Quran layouts have not loaded yet');
  return layout;
}
