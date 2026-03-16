const assert = require('assert');
const { test } = require('node:test');
const proxyquire = require('proxyquire');

// Mock `execSync`
let mockGitTags = ''; // Used to simulate Git command outputs
const mockExecSync = (command) => {
  console.log(`Mocked execSync called with: ${command}`);
  if (command.includes('git tag --list')) {
    return mockGitTags;
  }
  throw new Error(`Unrecognized command: ${command}`);
};

// Import the module with the mocked `execSync`
const { promoteVersion, parseVersion, getLatestTagForVersionType } = proxyquire('../index.js', {
  'child_process': { execSync: mockExecSync },
});

test('parseVersion should parse a semantic version string correctly', () => {
  const result = parseVersion('v1.2.3-alpha.4');
  assert.deepStrictEqual(result, {
    major: 1,
    minor: 2,
    patch: 3,
    prerelease: 'alpha',
    prereleaseNumber: 4,
  });
});

test('parseVersion should parse a stable semantic version string correctly', () => {
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

test('promoteVersion should promote to the next prerelease version when no tags exist', () => {
  mockGitTags = ''; // No tags in the repository
  const result = promoteVersion('v1.2.3-alpha.3', 'beta', false);
  assert.strictEqual(result, 'v1.2.3-beta.1');
});

test('promoteVersion should increment prerelease number for existing tags', () => {
  mockGitTags = 'v1.2.3-beta.2'; // Existing beta tags
  const result = promoteVersion('v1.2.3-alpha.3', 'beta', false);
  assert.strictEqual(result, 'v1.2.3-beta.3');
});

test('promoteVersion should promote to a stable version when isStable is true', () => {
  const result = promoteVersion('v1.2.3-alpha.3', null, true);
  assert.strictEqual(result, 'v1.2.3');
});

test('promoteVersion should promote from rc to a stable version when isStable is true', () => {
  const result = promoteVersion('v1.2.3-rc.1', null, true);
  assert.strictEqual(result, 'v1.2.3');
});

test('promoteVersion should promote alpha to rc when no rc tags exist', () => {
  mockGitTags = '';
  const result = promoteVersion('v1.2.3-alpha.3', 'rc', false);
  assert.strictEqual(result, 'v1.2.3-rc.1');
});

test('promoteVersion should support custom prerelease suffixes', () => {
  mockGitTags = '';
  const result = promoteVersion('v1.2.3-alpha.3', 'snapshot', false);
  assert.strictEqual(result, 'v1.2.3-snapshot.1');
});

test('getLatestTagForVersionType should return the latest tag for the given version type', () => {
  mockGitTags = 'v1.2.3-beta.2'; // Existing beta tags
  const result = getLatestTagForVersionType('v1.2.3', 'beta');
  assert.strictEqual(result, 'v1.2.3-beta.2');
});

test('getLatestTagForVersionType should return null if no tags match the version type', () => {
  mockGitTags = ''; // No tags in the repository
  const result = getLatestTagForVersionType('v1.2.3', 'beta');
  assert.strictEqual(result, null);
});
