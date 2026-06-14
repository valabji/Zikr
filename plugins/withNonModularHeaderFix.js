const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const MARKER = "CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES";

const SNIPPET = `
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
        config.build_settings['CLANG_WARN_NON_MODULAR_INCLUDE_IN_FRAMEWORK_MODULE'] = 'NO'
        if ['RNFBApp', 'RNFBAnalytics'].include?(target.name)
          config.build_settings['CLANG_ENABLE_MODULES'] = 'NO'
        end
      end
    end`;

module.exports = function withNonModularHeaderFix(config) {
  return withDangerousMod(config, [
    "ios",
    (cfg) => {
      const podfilePath = path.join(cfg.modRequest.platformProjectRoot, "Podfile");
      const contents = fs.readFileSync(podfilePath, "utf8");
      if (!contents.includes(MARKER)) {
        fs.writeFileSync(
          podfilePath,
          contents.replace(/post_install do \|installer\|/, `post_install do |installer|${SNIPPET}`)
        );
      }
      return cfg;
    },
  ]);
};
