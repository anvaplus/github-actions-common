const assert = require('assert');
const { test } = require('node:test');
const { parseVersion, getNextTag } = require('../index');

test('parseVersion should parse a prerelease version', () => {
  const result = parseVersion('v1.2.3-alpha.4');
  assert.deepStrictEqual(result, {
    major: 1,
    minor: 2,
    patch: 3,
    prerelease: 'alpha',
    prereleaseNumber: 4,
  });
});

test('parseVersion should parse a stable version', () => {
  const result = parseVersion('v2.5.9');
  assert.deepStrictEqual(result, {
    major: 2,
    minor: 5,
    patch: 9,
    prerelease: null,
    prereleaseNumber: null,
  });
});

test('parseVersion should throw an error for invalid tag format', () => {
  assert.throws(() => parseVersion('invalid-tag'), {
    message: 'Invalid tag format: invalid-tag',
  });
});

test('getNextTag should create 0.1.0-alpha.1 when no tags exist', () => {
  const tag = getNextTag(null, null, 'alpha');
  assert.strictEqual(tag, 'v0.1.0-alpha.1');
});

test('getNextTag should bump minor and create new alpha tag if only stable exists', () => {
  const tag = getNextTag('v1.2.0', null, 'alpha');
  assert.strictEqual(tag, 'v1.3.0-alpha.1');
});

test('getNextTag should bump minor and create new beta tag if only stable exists', () => {
  const tag = getNextTag('v1.2.0', null, 'beta');
  assert.strictEqual(tag, 'v1.3.0-beta.1');
});

test('getNextTag should bump minor and create new rc tag if only stable exists', () => {
  const tag = getNextTag('v1.2.0', null, 'rc');
  assert.strictEqual(tag, 'v1.3.0-rc.1');
});

test('getNextTag should increment existing alpha prerelease when it is ahead of stable', () => {
  const tag = getNextTag(null, 'v1.2.0-alpha.3', 'alpha');
  assert.strictEqual(tag, 'v1.2.0-alpha.4');
});

test('getNextTag should increment existing beta prerelease when it is ahead of stable', () => {
  const tag = getNextTag('v1.1.0', 'v1.2.0-beta.7', 'beta');
  assert.strictEqual(tag, 'v1.2.0-beta.8');
});

test('getNextTag should increment existing rc prerelease when it is ahead of stable', () => {
  const tag = getNextTag('v2.0.0', 'v2.1.0-rc.2', 'rc');
  assert.strictEqual(tag, 'v2.1.0-rc.3');
});

test('getNextTag should increment prerelease when prerelease base is higher than stable', () => {
  const tag = getNextTag('v1.2.0', 'v1.3.0-alpha.3', 'alpha');
  assert.strictEqual(tag, 'v1.3.0-alpha.4');
});

test('getNextTag should create snapshot prerelease when no tags exist', () => {
  const tag = getNextTag(null, null, 'snapshot');
  assert.strictEqual(tag, 'v0.1.0-snapshot.1');
});

test('getNextTag should bump minor and create nightly tag if only stable exists', () => {
  const tag = getNextTag('v1.2.0', null, 'nightly');
  assert.strictEqual(tag, 'v1.3.0-nightly.1');
});

test('getNextTag should increment existing custom prerelease tag', () => {
  const tag = getNextTag(null, 'v2.0.0-custom.5', 'custom');
  assert.strictEqual(tag, 'v2.0.0-custom.6');
});
