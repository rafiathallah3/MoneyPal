const { withProjectBuildGradle } = require("expo/config-plugins");

/**
 * Expo config plugin that adds the @notifee/react-native local Maven repository
 * to the project-level build.gradle. This is required because notifee publishes
 * its `app.notifee:core` Android artifact to a local Maven repo inside node_modules,
 * and Gradle needs to know about it at dependency resolution time.
 */
function withNotifeeMaven(config) {
  return withProjectBuildGradle(config, (config) => {
    const buildGradle = config.modResults.contents;

    // Check if the notifee maven repo is already added
    if (buildGradle.includes("@notifee/react-native/android/libs")) {
      return config;
    }

    // Add the notifee local Maven repository inside allprojects.repositories
    const searchString = "maven { url 'https://www.jitpack.io' }";
    if (buildGradle.includes(searchString)) {
      config.modResults.contents = buildGradle.replace(
        searchString,
        `maven { url 'https://www.jitpack.io' }\n        maven { url("$rootDir/../node_modules/@notifee/react-native/android/libs") }`
      );
    } else {
      // Fallback: add after mavenCentral() in allprojects
      config.modResults.contents = buildGradle.replace(
        /mavenCentral\(\)\n(\s*)\}/,
        `mavenCentral()\n$1    maven { url("$rootDir/../node_modules/@notifee/react-native/android/libs") }\n$1}`
      );
    }

    return config;
  });
}

module.exports = withNotifeeMaven;
