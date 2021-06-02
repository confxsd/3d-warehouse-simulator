const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: "./src/app.js",
  output: {
    filename: 'app.js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: "./src/static/index.html", to: "index.html"
        },
        {
          from: "./src/static/collector_guy.obj", to: "collector_guy.obj"
        },
        {
          from: "./src/static/styles.css", to: "styles.css"
        },
      ]
    })
  ],
  watch: false,
  devtool: false
};