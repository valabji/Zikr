const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Keep Arabic as UTF-8 instead of expanding each character to a six-byte escape.
config.transformer.minifierConfig.output.ascii_only = false;

module.exports = config;
