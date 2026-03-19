const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool: 'cheap-module-source-map',
  
  entry: {
    background: './src/background/background.js',
    popup: './src/popup/popup.js',
    options: './src/options/options.js',
    content: './src/content/content.js'
  },
  
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',  // This creates background.js, popup.js, etc. in dist root
    clean: true
  },
  
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  
  plugins: [
    new CopyPlugin({
      patterns: [
        // Copy manifest to dist root
        { from: 'src/manifest.json', to: 'manifest.json' },
        
        // Copy popup HTML and CSS to dist/popup/
        { from: 'src/popup/popup.html', to: 'popup/popup.html' },
        { from: 'src/popup/popup.css', to: 'popup/popup.css' },
        
        // Copy options HTML and CSS to dist/options/
        { from: 'src/options/options.html', to: 'options/options.html' },
        { from: 'src/options/options.css', to: 'options/options.css' },
        
        // Copy icons if they exist
        { from: 'icons', to: 'icons', noErrorOnMissing: true }
      ]
    })
  ]
};