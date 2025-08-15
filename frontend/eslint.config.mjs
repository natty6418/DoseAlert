import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import pluginReactNative from "eslint-plugin-react-native";

export default [
  js.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        __DEV__: "readonly"
      },
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    plugins: {
      react: pluginReact,
      "react-native": pluginReactNative
    },
    rules: {
      ...pluginReact.configs.recommended.rules,
      ...pluginReactNative.configs.all.rules,
      "react/react-in-jsx-scope": "off", // Not needed in React Native
      "react-native/no-unused-styles": "error",
      "react-native/split-platform-components": "error",
      "react-native/no-inline-styles": "warn",
      "react-native/no-color-literals": "warn"
    },
    settings: {
      react: {
        version: "detect"
      }
    }
  }
];
