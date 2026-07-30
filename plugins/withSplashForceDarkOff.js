const { withAndroidStyles } = require("@expo/config-plugins");

module.exports = function withSplashForceDarkOff(config) {
  return withAndroidStyles(config, (cfg) => {
    for (const style of cfg.modResults.resources.style || []) {
      if (["AppTheme", "Theme.App.SplashScreen"].includes(style.$.name)) {
        style.item = (style.item || []).filter((i) => i.$.name !== "android:forceDarkAllowed");
        style.item.push({ _: "false", $: { name: "android:forceDarkAllowed", "tools:targetApi": "29" } });
      }
    }
    return cfg;
  });
};
