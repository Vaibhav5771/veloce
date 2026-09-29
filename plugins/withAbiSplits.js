const { withAppBuildGradle } = require("expo/config-plugins");

/**
 * Adds an opt-in per-ABI APK split to android/app/build.gradle, and renames the
 * release outputs to `veloce.apk` / `veloce-<abi>.apk`.
 *
 * Splits are off by default, so a plain `assembleRelease` (and EAS, and
 * `expo run:android`) keeps producing a single universal APK. Pass
 * `-PsplitApk=true` to also get one APK per ABI:
 *
 *   cd android && ./gradlew :app:assembleRelease -PsplitApk=true
 *
 * The ABI list comes from the `reactNativeArchitectures` gradle property, so
 * `-PreactNativeArchitectures=arm64-v8a,armeabi-v7a` narrows it per build.
 */

const APK_BASENAME = "veloce";

const MARKER = "enableSeparateBuildPerCPUArchitecture";

const DEFS = `
/**
 * Added by plugins/withAbiSplits.js — do not edit by hand, it is regenerated on prebuild.
 * Pass \`-PsplitApk=true\` to also emit one APK per ABI alongside the universal one.
 */
def enableSeparateBuildPerCPUArchitecture = (findProperty("splitApk") ?: "false").toBoolean()
def reactNativeArchitecturesList = (findProperty("reactNativeArchitectures") ?: "armeabi-v7a,arm64-v8a,x86,x86_64").split(",")
`;

const SPLITS = `    splits {
        abi {
            enable enableSeparateBuildPerCPUArchitecture
            reset()
            include(*reactNativeArchitecturesList)
            universalApk true
        }
    }

    // Name release outputs ${APK_BASENAME}.apk (universal) and ${APK_BASENAME}-<abi>.apk (splits).
    // Debug outputs are left alone so \`expo run:android\` keeps working.
    applicationVariants.all { variant ->
        if (variant.buildType.name == "release") {
            variant.outputs.all { output ->
                def abiFilter = output.getFilter(com.android.build.OutputFile.ABI)
                output.outputFileName = abiFilter ? "${APK_BASENAME}-\${abiFilter}.apk" : "${APK_BASENAME}.apk"
            }
        }
    }
`;

/** @param {string} contents @returns {string} */
function addAbiSplits(contents) {
  if (contents.includes(MARKER)) {
    return contents;
  }
  const anchor = /^android\s*\{[^\n]*\n/m;
  if (!anchor.test(contents)) {
    throw new Error(
      "withAbiSplits: could not find the `android { ... }` block in android/app/build.gradle"
    );
  }
  return contents.replace(anchor, (match) => `${DEFS}${match}${SPLITS}`);
}

/** @type {import("expo/config-plugins").ConfigPlugin} */
const withAbiSplits = (config) =>
  withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== "groovy") {
      throw new Error(
        `withAbiSplits: expected a Groovy android/app/build.gradle, got ${config.modResults.language}`
      );
    }
    config.modResults.contents = addAbiSplits(config.modResults.contents);
    return config;
  });

module.exports = withAbiSplits;
module.exports.addAbiSplits = addAbiSplits;
