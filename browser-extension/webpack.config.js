const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: {
    'content-script-simple': './src/content/content-script-simple.ts',
    'service-worker': './src/background/service-worker.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'src/[name].js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.js$/,
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'manifest.json',
          to: 'manifest.json'
        },
        {
          from: 'popup',
          to: 'popup'
        },
        {
          from: 'options',
          to: 'options'
        },
        {
          from: 'assets',
          to: 'assets'
        },
        {
          from: 'src/content/overlay.css',
          to: 'src/content/overlay.css'
        }
      ]
    })
  ],
  devtool: 'cheap-module-source-map'
};