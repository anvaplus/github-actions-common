const core = require("@actions/core");
const { execSync } = require("child_process");

// Utility for safe execution of shell commands
function safeExecSync(command) {
  try {
    console.log(`Executing: ${command}`);
    return execSync(command).toString().trim();
  } catch (error) {
    console.error(`Error executing command: ${command}`, error.message);
    throw error;
  }
}

// Fetch tags
function fetchTags() {
  const command = `git fetch --prune --tags`;
  safeExecSync(command);
  console.log("Fetched all tags.");
}

// Get all tags
function getAllTags() {
  const command = `git tag --list --sort=-v:refname`;
  const result = safeExecSync(command);
  const tags = result ? result.split("\n").filter(tag => tag.trim() !== "") : [];
  console.log(`All tags: ${tags}`);
  return tags;
}

// Get the latest tag for a specific version type (e.g., alpha, beta)
function getLatestTagForVersionType(baseVersion, versionType) {
  const tags = getAllTags();
  const regex = new RegExp(`^${baseVersion}-${versionType}\\.\\d+$`);
  const filteredTags = tags.filter(tag => regex.test(tag));
  console.log(`Filtered tags for ${versionType}: ${filteredTags}`);
  return filteredTags[0] || null; // Return the latest tag for the version type
}

// Parse a semantic version string (e.g., v1.2.3-alpha.4)
function parseVersion(tag) {
  const baseVersionMatch = tag.match(/^v(\d+)\.(\d+)\.(\d+)/);
  if (!baseVersionMatch) throw new Error(`Invalid tag format: ${tag}`);

  const [, major, minor, patch] = baseVersionMatch.map(Number);
  const prereleaseMatch = tag.match(/-(\w+)\.(\d+)$/);

  const prerelease = prereleaseMatch ? prereleaseMatch[1] : null;
  const prereleaseNumber = prereleaseMatch ? parseInt(prereleaseMatch[2], 10) : null;

  return { major, minor, patch, prerelease, prereleaseNumber };
}

// Promote a version to the next version type
function promoteVersion(version, targetVersionType, isStable) {
  const parsed = parseVersion(version);

  if (!parsed.prerelease && !isStable) {
    throw new Error(`Version '${version}' is not a prerelease version.`);
  }

  const baseVersion = version.split('-')[0];

  if (isStable) {
    return baseVersion;
  }

  if (!targetVersionType || !/^\w+$/.test(targetVersionType)) {
    throw new Error(`Invalid promote-type: '${targetVersionType}'. Must be a non-empty word string.`);
  }

  const latestTargetTag = getLatestTagForVersionType(baseVersion, targetVersionType);

  if (!latestTargetTag) {
    return `${baseVersion}-${targetVersionType}.1`;
  }

  const { prereleaseNumber } = parseVersion(latestTargetTag);
  return `${baseVersion}-${targetVersionType}.${prereleaseNumber + 1}`;
}

// Tag the repository
function tagRepository(newTag, tagRepo) {
  console.log(`Creating new tag: ${newTag}`);

  if (!/^v\d+\.\d+\.\d+(-\w+\.\d+)?$/.test(newTag)) {
    throw new Error(`Invalid tag format: ${newTag}`);
  }

  core.setOutput("new-version", newTag);

  if (tagRepo) {
    safeExecSync(`git tag ${newTag}`);
    safeExecSync(`git push origin ${newTag}`);
    console.log(`Repository tagged with ${newTag}`);
  }
}

// Main function
async function run() {
  try {
    // Get inputs
    const versionToPromote = core.getInput("version");
    const targetVersionType = core.getInput("promote-type");
    const isStable = core.getInput("is-stable") === "true";
    const tagRepo = core.getInput("tag-repo") === "true";

    fetchTags();

    console.log(`Promoting version: ${versionToPromote}`);
    console.log(`Target version type: ${targetVersionType}`);
    console.log(`Stable promotion: ${isStable}`);

    // Promote the version
    const nextVersion = promoteVersion(versionToPromote, targetVersionType, isStable);
    console.log(`Promoted version: ${nextVersion}`);

    // Output the promoted version
    core.setOutput("promoted-version", nextVersion);

    // Tag the repository
    tagRepository(nextVersion, tagRepo);
  } catch (error) {
    core.setFailed(error.message);
  }
}

// Ensure `run()` is only called when the script is executed directly
if (require.main === module) {
  run();
}

module.exports = {
  getLatestTagForVersionType,
  promoteVersion,
  parseVersion
};
