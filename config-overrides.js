const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");

module.exports = function override(config, env) {
  config.resolve = {
    alias: {
      "monaco-editor": "monaco-editor/esm/vs/editor/editor.api.js"
    }
  };
  config.plugins.push(
    new MonacoWebpackPlugin({
      languages: ["sql"]
    })
  );
  return config;
};