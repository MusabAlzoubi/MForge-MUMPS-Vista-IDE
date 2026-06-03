const assert = require('assert');
const fs = require('fs');
const path = require('path');

const validSemanticTokenId = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;
const invalidDottedMumpsTokenId = /^mumps\./;

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8'));
}

function contributionIds(entries, contributionName) {
  assert.ok(
    entries === undefined || Array.isArray(entries),
    `package.json contributes.${contributionName} must be an array when present`
  );

  return (entries || []).map((entry, index) => {
    const id = entry && entry.id;
    assert.equal(typeof id, 'string', `package.json contributes.${contributionName}[${index}].id must be a string`);
    return { id, source: `package.json contributes.${contributionName}[${index}].id` };
  });
}

function semanticThemeIds(theme, themePath) {
  const semanticTokenColors = theme.semanticTokenColors || {};
  assert.equal(typeof semanticTokenColors, 'object', `${themePath} semanticTokenColors must be an object`);
  assert.equal(Array.isArray(semanticTokenColors), false, `${themePath} semanticTokenColors must not be an array`);

  return Object.keys(semanticTokenColors).map((selector) => ({ id: selector, source: `${themePath} semanticTokenColors.${selector}` }));
}

function assertValidSemanticTokenIds(ids) {
  const invalidIds = ids.filter(({ id }) => !validSemanticTokenId.test(id) || invalidDottedMumpsTokenId.test(id));

  assert.deepEqual(
    invalidIds,
    [],
    `Invalid semantic token ids:\n${invalidIds.map(({ id, source }) => `- ${source}: ${id}`).join('\n')}`
  );
}

const packageJson = readJson('package.json');
const contributes = packageJson.contributes || {};
const packageIds = [
  ...contributionIds(contributes.semanticTokenTypes, 'semanticTokenTypes'),
  ...contributionIds(contributes.semanticTokenModifiers, 'semanticTokenModifiers')
];

assert.ok(packageIds.length > 0, 'package.json must contribute semantic token types');
assertValidSemanticTokenIds(packageIds);

for (const themeContribution of contributes.themes || []) {
  assert.equal(typeof themeContribution.path, 'string', 'package.json contributes.themes[*].path must be a string');
  const themePath = themeContribution.path.replace(/^\.\//, '');
  const theme = readJson(themePath);
  assertValidSemanticTokenIds(semanticThemeIds(theme, themePath));
}

console.log('Semantic token contribution validation passed');
