const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const MIN_NODE_MAJOR = 18;
const PACKAGER_NAME = 'vsce';
const SAFE_CHEERIO_VERSION = '1.0.0-rc.12';

function parseVersion(versionText) {
  const match = String(versionText).trim().match(/^v?(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
  if (!match) {
    return null;
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] || '',
    text: `${match[1]}.${match[2]}.${match[3]}${match[4] ? `-${match[4]}` : ''}`
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

  if (/^\d+\.\d+\.\d+(?:-.+)?$/.test(declaredRange)) {
    return installedVersion === normalizedDeclared;
  }

  return installedVersion === normalizedDeclared || installedVersion.startsWith(`${normalizedDeclared.split('.')[0]}.`);
}

function isCheerioNode18Safe(version) {
  if (!version) {
    return true;
  }
  if (version === SAFE_CHEERIO_VERSION) {
    return true;
  }
  const parsed = parseVersion(version);
  if (!parsed) {
    return false;
  }
  if (parsed.major === 1 && parsed.minor === 0 && parsed.prerelease.startsWith('rc.')) {
    return true;
  }
  return parsed.major === 0;
}

function packageLockStatus(extensionRoot) {
  const lockPath = path.join(extensionRoot, 'package-lock.json');
  if (!fs.existsSync(lockPath)) {
    return { exists: false, text: 'missing' };
  }
  const lock = readJson(lockPath);
  if (!lock) {
    return { exists: true, text: 'present but unreadable' };
  }
  const packages = lock.packages || {};
  const lockCheerio = packages['node_modules/cheerio']?.version || null;
  const lockUndici = packages['node_modules/undici']?.version || null;
  return {
    exists: true,
    text: `present${lockCheerio ? `, cheerio ${lockCheerio}` : ''}${lockUndici ? `, undici ${lockUndici}` : ', no undici entry'}`,
    cheerio: lockCheerio,
    undici: lockUndici
  };
}

function findInstalledPackageVersion(extensionRoot, packageName) {
  return readJson(path.join(extensionRoot, 'node_modules', packageName, 'package.json'))?.version || null;
}

function main() {
  const extensionRoot = path.join(__dirname, '..');
  const packageJsonPath = path.join(extensionRoot, 'package.json');
  const localBinPath = path.join(extensionRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'vsce.cmd' : 'vsce');

  const packageJson = readJson(packageJsonPath) || {};
  const devDependencies = packageJson.devDependencies || {};
  const overrides = packageJson.overrides || {};
  const declaredVsce = devDependencies[PACKAGER_NAME] || null;
  const hasScopedVsce = Object.prototype.hasOwnProperty.call(devDependencies, '@vscode/vsce');
  const installedVsceVersion = findInstalledPackageVersion(extensionRoot, PACKAGER_NAME);
  const installedCheerioVersion = findInstalledPackageVersion(extensionRoot, 'cheerio');
  const installedUndiciVersion = findInstalledPackageVersion(extensionRoot, 'undici');
  const lockStatus = packageLockStatus(extensionRoot);

  const nodeVersion = parseVersion(process.version);
  const npmVersion = getCommandVersion('npm --version');
  const nodeOk = nodeVersion !== null && nodeVersion.major >= MIN_NODE_MAJOR;
  const npmOk = npmVersion.ok;
  const localBinExists = fs.existsSync(localBinPath);
  const installedMajorOk = installedVsceVersion ? parseVersion(installedVsceVersion)?.major === 2 : false;
  const declaredCompatible = isDeclaredVersionCompatible(declaredVsce, installedVsceVersion);
  const packageJsonOk = declaredVsce !== null && !hasScopedVsce;
  const cheerioOverrideOk = overrides.cheerio === SAFE_CHEERIO_VERSION;
  const installedCheerioOk = isCheerioNode18Safe(installedCheerioVersion);
  const lockCheerioOk = isCheerioNode18Safe(lockStatus.cheerio);
  const nodeMajor = nodeVersion?.major ?? 0;
  const undiciBreaksNode18 = nodeMajor < 20 && Boolean(installedUndiciVersion || lockStatus.undici);
  const undiciOk = !undiciBreaksNode18;
  const packagingOk = nodeOk && npmOk && packageJsonOk && localBinExists && installedMajorOk && declaredCompatible && cheerioOverrideOk && installedCheerioOk && lockCheerioOk && undiciOk;

  console.log(`Node version: ${process.version}`);
  console.log(`npm version: ${npmVersion.value}`);
  console.log(`package.json packager dependency: ${declaredVsce ? `${PACKAGER_NAME}@${declaredVsce}` : 'missing'}`);
  console.log(`installed vsce version: ${installedVsceVersion || 'not installed'}`);
  console.log(`installed cheerio version: ${installedCheerioVersion || 'not installed'}`);
  console.log(`installed undici version: ${installedUndiciVersion || 'not installed'}`);
  console.log(`local vsce binary path: ${localBinPath}`);
  console.log(`local vsce binary exists: ${localBinExists ? 'yes' : 'no'}`);
  console.log(`package-lock status: ${lockStatus.text}`);
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

  if (!cheerioOverrideOk) {
    console.error(`Fix: package.json must include npm override "cheerio": "${SAFE_CHEERIO_VERSION}" so vsce does not install cheerio 1.1+/1.2+ with undici.`);
  }

  if (!installedCheerioOk || !lockCheerioOk) {
    console.error(`Fix: cheerio is too new for Node 18 packaging. Remove node_modules and package-lock.json, keep the cheerio ${SAFE_CHEERIO_VERSION} override, then run npm install.`);
  }

  if (!undiciOk) {
    console.error('Fix: undici is present in packaging dependencies while running Node 18. This can cause "ReferenceError: File is not defined". Remove node_modules and package-lock.json, verify the cheerio override, then run npm install.');
  }

  if (!packagingOk) {
    process.exitCode = 1;
  }
}

main();
