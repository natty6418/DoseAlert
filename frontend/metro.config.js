const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname, { isCSSEnabled: true });

// Add "cjs" extension to the resolver's source extensions
config.resolver.sourceExts.push("cjs");

module.exports = withNativeWind(config, { input: "./global.css" });