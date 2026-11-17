// This is a Babel config that webpack.coverage.js uses in order to instrument
// code with coverage instrumentation.
module.exports = {
  plugins: [
    [
      'babel-plugin-istanbul',
      {
        extension: ['.js', '.vue']
      }
    ]
  ]
};
