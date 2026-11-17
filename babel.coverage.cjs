// This is a Babel config that webpack.coverage.js uses in order to instrument
// code with coverage instrumentation.
export default {
  plugins: [
    [
      'babel-plugin-istanbul',
      {
        extension: ['.js', '.vue']
      }
    ]
  ]
};
