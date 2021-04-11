const path = require('path');

module.exports = {
  entry: "./src/demo.js",
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  watch: false,
  devtool: false
};