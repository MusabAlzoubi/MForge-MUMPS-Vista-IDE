const assert = require('assert');
const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const semanticTokenTypes = packageJson.contributes && packageJson.contributes.semanticTokenTypes;
const validSemanticTokenTypeId = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

assert.ok(Array.isArray(semanticTokenTypes), 'package.json contributes.semanticTokenTypes must be an array');

const invalidIds = semanticTokenTypes
  .map((tokenType) => tokenType && tokenType.id)
  .filter((id) => typeof id !== 'string' || !validSemanticTokenTypeId.test(id));

assert.deepEqual(invalidIds, [], `Invalid semantic token type ids: ${invalidIds.join(', ')}`);

console.log('Semantic token contribution validation passed');
