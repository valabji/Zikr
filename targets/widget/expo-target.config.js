/** @type {import('@bacons/apple-targets').Config} */
module.exports = {
  type: "widget",
  icon: "../../assets/images/icon.png",
  colors: {
    $accent: "#1B5E20",
    $widgetBackground: "#1B5E20",
  },
  entitlements: {
    "com.apple.security.application-groups": ["group.com.valabji.zikr.widget"],
  },
  deploymentTarget: "16.0",
};
