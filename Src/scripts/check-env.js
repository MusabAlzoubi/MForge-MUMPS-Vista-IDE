const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const MIN_NODE_MAJOR = 18;
const PACKAGER_NAME = 'vsce';

function parseVersion(versionText) {
  const match = String(versionText).trim().match(/^v?(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return null;
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    text: `${match[1]}.${match[2]}.${match[3]}`
  };
}

function getCommandVersion(command) {
  try {
    return {
      ok: true,
      value: execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
    };
  } catch (error) {
    return { ok: false, value: `unavailable (${error.message})` };
  }
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_error) {
    return null;
  }
}

function normalizeDeclaredVersion(versionRange) {
  if (typeof versionRange !== 'string') {
    return null;
  }
  const parsed = parseVersion(versionRange.replace(/^[~^=<>\s]+/, ''));
  return parsed?.text ?? null;
}

function isDeclaredVersionCompatible(declaredRange, installedVersion) {
  const normalizedDeclared = normalizeDeclaredVersion(declaredRange);
  if (!normalizedDeclared || !installedVersion) {
    return false;
  }

  if (/^\d+\.\d+\.\d+$/.test(declaredRange)) {
    return installedVersion === normalizedDeclared;
  }

  return installedVersion === normalizedDeclared || installedVersion.startsWith(`${normalizedDeclared.split('.')[0]}.`);
}

function main() {
  const extensionRoot = path.join(__dirname, '..');
  const packageJsonPath = path.join(extensionRoot, 'package.json');
  const installedVscePackagePath = path.join(extensionRoot, 'node_modules', PACKAGER_NAME, 'package.json');
  const localBinPath = path.join(extensionRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'vsce.cmd' : 'vsce');

  const packageJson = readJson(packageJsonPath) || {};
  const devDependencies = packageJson.devDependencies || {};
  const declaredVsce = devDependencies[PACKAGER_NAME] || null;
  const hasScopedVsce = Object.prototype.hasOwnProperty.call(devDependencies, '@vscode/vsce');
  const installedVscePackage = readJson(installedVscePackagePath);
  const installedVsceVersion = installedVscePackage?.version || null;

  const nodeVersion = parseVersion(process.version);
  const npmVersion = getCommandVersion('npm --version');
  const nodeOk = nodeVersion !== null && nodeVersion.major >= MIN_NODE_MAJOR;
  const npmOk = npmVersion.ok;
  const localBinExists = fs.existsSync(localBinPath);
  const installedMajorOk = installedVsceVersion ? parseVersion(installedVsceVersion)?.major === 2 : false;
  const declaredCompatible = isDeclaredVersionCompatible(declaredVsce, installedVsceVersion);
  const packageJsonOk = declaredVsce !== null && !hasScopedVsce;
  const packagingOk = nodeOk && npmOk && packageJsonOk && localBinExists && installedMajorOk && declaredCompatible;

  console.log(`Node version: ${process.version}`);
  console.log(`npm version: ${npmVersion.value}`);
  console.log(`package.json packager dependency: ${declaredVsce ? `${PACKAGER_NAME}@${declaredVsce}` : 'missing'}`);
  console.log(`installed vsce version: ${installedVsceVersion || 'not installed'}`);
  console.log(`local vsce binary path: ${localBinPath}`);
  console.log(`local vsce binary exists: ${localBinExists ? 'yes' : 'no'}`);
  console.log(`packaging requirements met: ${packagingOk ? 'yes' : 'no'}`);

  if (!nodeOk) {
    console.error('Fix: use Node.js 18 or newer for local VSIX packaging. Node 18.19.1 is supported.');
  }

  if (!npmOk) {
    console.error('Fix: install npm or ensure npm is available on PATH.');
  }

  if (hasScopedVsce) {
    console.error('Fix: remove @vscode/vsce for Node 18 packaging; current @vscode/vsce releases can pull Node-20-only dependencies.');
  }

  if (!declaredVsce) {
    console.error('Fix: add an exact Node-18-safe devDependency such as "vsce": "2.11.0" to package.json.');
  }

  if (!localBinExists || !installedVsceVersion) {
    console.error('Fix: run npm install inside Src so node_modules/vsce and node_modules/.bin/vsce are installed.');
  }

  if (installedVsceVersion && !installedMajorOk) {
    console.error(`Fix: install a Node-18-safe vsce 2.x version. Installed version is ${installedVsceVersion}.`);
  }

  if (declaredVsce && installedVsceVersion && !declaredCompatible) {
    console.error(`Fix: installed vsce ${installedVsceVersion} does not match package.json declaration ${declaredVsce}. Remove node_modules and package-lock.json, then run npm install.`);
  }

  if (!packagingOk) {
    process.exitCode = 1;
  }
}

main();
