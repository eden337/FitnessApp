const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');
const config = getDefaultConfig(projectRoot);
const reactNativeRoot = path.dirname(require.resolve('react-native/package.json'));

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.unstable_enableSymlinks = true;
config.transformer.assetRegistryPath = require.resolve(
  '@react-native/assets-registry/registry',
  { paths: [reactNativeRoot] },
);
config.resolver.resolveRequest = (context, moduleName, platform) => {
  try {
    return context.resolveRequest(context, moduleName, platform);
  } catch (error) {
    if (moduleName.startsWith('.') && moduleName.endsWith('.js')) {
      return context.resolveRequest(
        context,
        moduleName.slice(0, -'.js'.length),
        platform,
      );
    }
    throw error;
  }
};

module.exports = config;
