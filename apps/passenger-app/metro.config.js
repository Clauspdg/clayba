const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch the whole monorepo so Metro picks up changes in shared packages.
config.watchFolders = [workspaceRoot];

// Resolve modules from this app's node_modules first, then the workspace root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Required for pnpm, whose node_modules are symlinked into each workspace.
config.resolver.unstable_enableSymlinks = true;
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
