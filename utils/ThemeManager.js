import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import JSZip from 'jszip';
import { FONT_FAMILY } from '../constants/Fonts';

export const CUSTOM_THEMES_KEY = '@custom_themes';
export const HIDDEN_THEMES_KEY = '@hidden_themes';

export const THEME_COLOR_KEYS = [
  'primary', 'primaryMedium', 'primaryDark',
  'accent', 'accentDark',
  'background', 'surface', 'text', 'textSecondary',
  'currentPrayer', 'nextPrayer', 'pastPrayer',
  'noticeBackground', 'noticeText', 'noticeAccent',
  'warningBackground', 'warningText', 'warningAccent',
];

export const BACKGROUND_KEYS = ['bgImage1', 'bgImage2', 'headerImage', 'starImage'];
export const SOUND_KEYS = ['clickSound'];
export const FILE_ASSET_KEYS = [...BACKGROUND_KEYS, ...SOUND_KEYS];

const HEX_RE = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/;

export const isValidHex = (value) => typeof value === 'string' && HEX_RE.test(value);

const isHexArray = (arr) => Array.isArray(arr) && arr.length > 0 && arr.every(isValidHex);

export const validateTheme = (theme) => {
  if (!theme || typeof theme !== 'object') return 'invalid';
  if (typeof theme.name !== 'string' || !theme.name.trim()) return 'missingName';
  const badColor = THEME_COLOR_KEYS.find((key) => !isValidHex(theme[key]));
  if (badColor) return `badColor:${badColor}`;
  if (theme.headerGradient !== undefined && !isHexArray(theme.headerGradient)) return 'badGradient';
  if (theme.itemGradients !== undefined && !(Array.isArray(theme.itemGradients) && theme.itemGradients.length > 0 && theme.itemGradients.every(isHexArray))) return 'badGradient';
  if (theme.itemFg !== undefined && !isValidHex(theme.itemFg)) return 'badGradient';
  if (theme.patternColor !== undefined && !isValidHex(theme.patternColor)) return 'badColor:patternColor';
  return null;
};

export const sanitizeTheme = (theme) => {
  const clean = { fontFamily: FONT_FAMILY, custom: true };
  clean.name = String(theme.name || '').trim();
  clean.nameAr = String(theme.nameAr || clean.name).trim();
  THEME_COLOR_KEYS.forEach((key) => { clean[key] = theme[key]; });
  if (theme.headerGradient) clean.headerGradient = theme.headerGradient.map(String);
  if (theme.itemGradients) clean.itemGradients = theme.itemGradients.map((pair) => pair.map(String));
  if (theme.itemFg) clean.itemFg = theme.itemFg;
  if (theme.patternColor) clean.patternColor = theme.patternColor;
  if (theme.hidePattern) clean.hidePattern = true;
  FILE_ASSET_KEYS.forEach((key) => { if (theme[key]) clean[key] = theme[key]; });
  return clean;
};

export const generateThemeId = () => `custom_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;

export const cloneTheme = (source, name, nameAr) => {
  const copy = { ...source, name, nameAr };
  FILE_ASSET_KEYS.forEach((key) => { delete copy[key]; });
  return sanitizeTheme(copy);
};

export const loadCustomThemes = async () => {
  try {
    const raw = await AsyncStorage.getItem(CUSTOM_THEMES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const persistCustomTheme = async (id, theme) => {
  const all = await loadCustomThemes();
  all[id] = theme;
  await AsyncStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(all));
  return all;
};

const themeAssetDir = (id) => `${FileSystem.documentDirectory}themes/${id}/`;

export const removeCustomTheme = async (id) => {
  const all = await loadCustomThemes();
  delete all[id];
  await AsyncStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(all));
  if (Platform.OS !== 'web') {
    try { await FileSystem.deleteAsync(themeAssetDir(id), { idempotent: true }); } catch {}
  }
  return all;
};

export const loadHiddenThemes = async () => {
  try {
    const raw = await AsyncStorage.getItem(HIDDEN_THEMES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const persistHiddenThemes = async (keys) => {
  await AsyncStorage.setItem(HIDDEN_THEMES_KEY, JSON.stringify(keys));
};

const extFromUri = (uri) => {
  const match = /\.(jpg|jpeg|png|webp|mp3|wav|m4a|aac|ogg)$/i.exec((uri || '').split('?')[0]);
  return match ? match[1].toLowerCase() : 'jpg';
};

export const saveThemeAsset = async (id, key, sourceUri) => {
  const dir = themeAssetDir(id);
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  const dest = `${dir}${key}_${Date.now()}.${extFromUri(sourceUri)}`;
  await FileSystem.copyAsync({ from: sourceUri, to: dest });
  return dest;
};

const slugify = (name) => (name || 'theme').trim().replace(/[^a-zA-Z0-9؀-ۿ]+/g, '_').replace(/^_+|_+$/g, '') || 'theme';

export const buildThemeZip = async (theme) => {
  const zip = new JSZip();
  const exported = { ...theme };
  const assets = {};
  for (const key of FILE_ASSET_KEYS) {
    delete exported[key];
    if (theme[key] && Platform.OS !== 'web') {
      const path = `assets/${key}.${extFromUri(theme[key])}`;
      const data = await FileSystem.readAsStringAsync(theme[key], { encoding: FileSystem.EncodingType.Base64 });
      zip.file(path, data, { base64: true });
      assets[key] = path;
    }
  }
  zip.file('theme.json', JSON.stringify({ format: 'zikr-theme', version: 1, theme: exported, assets }, null, 2));
  return zip;
};

export const exportTheme = async (theme) => {
  const zip = await buildThemeZip(theme);
  const filename = `${slugify(theme.name)}.zikrtheme`;
  if (Platform.OS === 'web') {
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    return null;
  }
  const Sharing = require('expo-sharing');
  const base64 = await zip.generateAsync({ type: 'base64' });
  const uri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
  await Sharing.shareAsync(uri, { mimeType: 'application/zip', dialogTitle: filename });
  return uri;
};

export const importThemeFromData = async (data, options = {}) => {
  const zip = await JSZip.loadAsync(data, options.base64 ? { base64: true } : undefined);
  const entry = zip.file('theme.json');
  if (!entry) throw new Error('notATheme');
  let manifest;
  try {
    manifest = JSON.parse(await entry.async('string'));
  } catch {
    throw new Error('notATheme');
  }
  if (manifest.format !== 'zikr-theme' || !manifest.theme) throw new Error('notATheme');
  const error = validateTheme(manifest.theme);
  if (error) throw new Error(error);
  const theme = sanitizeTheme(manifest.theme);
  const id = generateThemeId();
  if (Platform.OS !== 'web' && manifest.assets) {
    for (const key of FILE_ASSET_KEYS) {
      const path = manifest.assets[key];
      const file = path && zip.file(path);
      if (!file) continue;
      const dir = themeAssetDir(id);
      const info = await FileSystem.getInfoAsync(dir);
      if (!info.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      const dest = `${dir}${key}_${Date.now()}.${extFromUri(path)}`;
      await FileSystem.writeAsStringAsync(dest, await file.async('base64'), { encoding: FileSystem.EncodingType.Base64 });
      theme[key] = dest;
    }
  }
  await persistCustomTheme(id, theme);
  return { id, theme };
};

export const pickAndImportTheme = async () => {
  const DocumentPicker = require('expo-document-picker');
  const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, type: '*/*' });
  if (result.canceled || !result.assets || !result.assets.length) return null;
  const asset = result.assets[0];
  if (Platform.OS === 'web') {
    const response = await fetch(asset.uri);
    return importThemeFromData(await response.arrayBuffer());
  }
  const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
  return importThemeFromData(base64, { base64: true });
};
