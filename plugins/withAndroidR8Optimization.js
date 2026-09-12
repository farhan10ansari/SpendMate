const { withAppBuildGradle, withGradleProperties } = require('expo/config-plugins');

// Keep release optimization settings persistent across Expo/EAS prebuilds.
module.exports = function withAndroidR8Optimization(config) {
  config = withAppBuildGradle(config, (config) => {
    const legacyDefaults = /(['"])proguard-android\.txt\1/g;
    const optimizedDefaults = 'proguard-android-optimize.txt';

    if (legacyDefaults.test(config.modResults.contents)) {
      config.modResults.contents = config.modResults.contents.replace(
        legacyDefaults,
        (_, quote) => `${quote}${optimizedDefaults}${quote}`
      );
    } else if (!config.modResults.contents.includes(optimizedDefaults)) {
      throw new Error('Cannot locate Android ProGuard defaults to enable R8 optimization.');
    }

    return config;
  });

  return withGradleProperties(config, (config) => {
    const key = 'android.r8.optimizedResourceShrinking';
    config.modResults = config.modResults.filter((property) => property.key !== key);
    config.modResults.push({ type: 'property', key, value: 'true' });
    return config;
  });
};
