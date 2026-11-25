const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const {
    wrapWithReanimatedMetroConfig,
} = require('react-native-reanimated/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const defaultConfig = getDefaultConfig(__dirname);

const {
    resolver: { sourceExts, assetExts },
} = getDefaultConfig(__dirname);

const config = {
    transformer: {
        getTransformOptions: async () => ({
            transform: {
                experimentalImportSupport: false,
                inlineRequires: true,
            },
        }),
        babelTransformerPath: require.resolve('react-native-svg-transformer'),
    },
    resolver: {
        assetExts: [...assetExts.filter(ext => ext !== 'svg'), 'lottie'],
        sourceExts: [...sourceExts, 'svg'],
    },
};

module.exports = wrapWithReanimatedMetroConfig(mergeConfig(defaultConfig, config));