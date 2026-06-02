const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const MIN_NODE = { major: 18, minor: 19, patch: 1 };
const EXPECTED_VSCE_PACKAGE = 'vsce';
const EXPECTED_VSCE_VERSION = '2.15.0';

function parseVersion(versionText) {
  const match = String(versionText).trim().match(/^v?(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return null;
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3])
  };
}

function compareVersions(left, right) {
  for (const key of ['major', 'minor', 'patch']) {
    if (left[key] !== right[key]) {
      return left[key] - right[key];
    }
  }
  return 0;
}

function getNpmVersion() {
  try {
    return execSync('npm --version', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (error) {
    return `unavailable (${error.message})`;
  }
}

function getPackageJson() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
}

function main() {
  const nodeVersionText = process.version;
  const nodeVersion = parseVersion(nodeVersionText);
  const npmVersion = getNpmVersion();
  const packageJson = getPackageJson();
  const devDependencies = packageJson.devDependencies || {};
  const vsceVersion = devDependencies[EXPECTED_VSCE_PACKAGE];
  const hasScopedVsce = Object.prototype.hasOwnProperty.call(devDependencies, '@vscode/vsce');
  const nodeOk = nodeVersion !== null && compareVersions(nodeVersion, MIN_NODE) >= 0;
  const vsceOk = vsceVersion === EXPECTED_VSCE_VERSION && !hasScopedVsce;
  const vsceBin = process.platform === 'win32' ? 'vsce.cmd' : 'vsce';
  const vsceInstalled = fs.existsSync(path.join(__dirname, '..', 'node_modules', '.bin', vsceBin));
  const packagingOk = nodeOk && vsceOk && vsceInstalled;

  console.log(`Node version: ${nodeVersionText}`);
  console.log(`npm version: ${npmVersion}`);
  console.log(`VSIX packager dependency: ${EXPECTED_VSCE_PACKAGE}@${vsceVersion || 'not installed in package.json'}`);
  console.log(`VSIX packager installed: ${vsceInstalled ? 'yes' : 'no'}`);
  console.log(`Packaging requirements met: ${packagingOk ? 'yes' : 'no'}`);

  if (!nodeOk) {
    console.error('Packaging requires Node.js 18.19.1 or newer. Use Node 18 LTS or Node 20 LTS.');
  }

  if (hasScopedVsce) {
    console.error('@vscode/vsce is not used for local packaging because current releases require Node 20+ and can fail on Node 18 with undici File globals.');
  }

  if (!vsceOk) {
    console.error(`Expected ${EXPECTED_VSCE_PACKAGE}@${EXPECTED_VSCE_VERSION} for Node 18-compatible local packaging.`);
  }

  if (!vsceInstalled) {
    console.error('The local vsce CLI is not installed. Run npm install inside Src before packaging.');
  }

  if (!packagingOk) {
    process.exitCode = 1;
  }
}

main();
