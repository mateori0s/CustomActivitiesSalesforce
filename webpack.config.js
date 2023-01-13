const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
   mode: 'production',
   entry: './src/public/js/customActivity.js',
   output: {
     filename: 'customActivity.js',
     path: path.resolve(__dirname, 'dist', 'public', 'js'),
   },
   plugins: [
    new CopyPlugin({
      patterns: [
        { from: "src/public/assets", to: path.resolve(__dirname, 'dist', 'public') },
      ],
    }),
  ],
};
