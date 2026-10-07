module.exports = function(api) {
  api.cache.using(() => process.env.NODE_ENV);
  const plugins = [
    ['module-resolver', { alias: { '@': './src', '@assets': './assets', '@modules': './modules' } }],
  ];
  if (process.env.NODE_ENV === 'production' || process.env.BABEL_ENV === 'production') {
    plugins.push(['transform-remove-console', { exclude: ['error', 'warn'] }]);
  }
  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};
