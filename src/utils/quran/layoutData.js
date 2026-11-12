const layouts = {};

export function getLayout(layoutFile) {
  if (!layouts[layoutFile]) {
    layouts[layoutFile] = layoutFile === 'pages_lines_v2'
      ? require('@assets/quran/data/pages_lines_v2.json')
      : require('@assets/quran/data/pages_lines_v1.json');
  }
  return layouts[layoutFile];
}
