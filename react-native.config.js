// react-native.config.js
module.exports = {
  project: {
    ios: {},
    android: {},
  },
  assets: ['./src/assets/fonts'], // ← usa slashes normales y solo fonts
  dependencies: {
    boost: {
      platforms: {
        ios: null,
        android: null,
      },
    },
  },
};
