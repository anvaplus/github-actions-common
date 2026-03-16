const core = require("@actions/core");
const { execSync } = require("child_process");

const SAFE_TAG_PATTERN = /^v\d+\.\d+\.\d+-\w+\.\d+$/;

// Utility for safe execution of shell commands
function safeExecSync(command) {
  try {
    console.log(`Executing ${command}`);
    return execSync(command).toString().trim();
  } catch (error) {
    console.error(`Error executing command: ${command}`, error.message);
    throw error;
  }
}

// Fetch all tags
function fetchTags() {
  const command = `git fetch --prune --tags`;
  safeExecSync(command);
  console.log("Fetched all tags.");
}

// Get all tags sorted
function getAllTags() {
  const command = `git tag --list --sort=-v:refname`;
  const result = safeExecSync(command);
  const tags = result.split("\n").filter(tag => tag.trim() !== ""); // Split by newline and clean up
  console.log(`All tags: ${tags}`);
  return tags;
}

// Get the latest stable tag (non-prerelease)
function getLatestStableTag() {
  const tags = getAllTags();
  const stableTags = tags.filter(tag => /^v[0-9]+\.[0-9]+\.[0-9]+$/.test(tag)); // Match stable format
  console.log(`Stable tags: ${stableTags}`);
  return stableTags[0] || null; // Return the latest stable tag
}

// Get the latest tag by version type (e.g., alpha)
function getLatestTag(versionType) {
  const tags = getAllTags();
  const prereleaseTags = tags.filter(tag => new RegExp(`^v[0-9]+\\.[0-9]+\\.[0-9]+-${versionType}\\.\\d+$`).test(tag));
  console.log(`Prerelease (${versionType}) tags: ${prereleaseTags}`);
  return prereleaseTags[0] || null; // Return the latest prerelease tag
}


// Parse a semantic version string (e.g., v1.2.3-alpha.1)
function parseVersion(tag) {
  const baseVersionMatch = tag.match(/^v(\d+)\.(\d+)\.(\d+)/);
  if (!baseVersionMatch) throw new Error(`Invalid tag format: ${tag}`);

  const [, major, minor, patch] = baseVersionMatch.map(Number);
  const prereleaseMatch = tag.match(/-(\w+)\.(\d+)$/);

  const prerelease = prereleaseMatch ? prereleaseMatch[1] : null;
  const prereleaseNumber = prereleaseMatch ? parseInt(prereleaseMatch[2], 10) : null;

  return { major, minor, patch, prerelease, prereleaseNumber };
}

function compareBaseVersions(versionA, versionB) {
  if (versionA.major !== versionB.major) {
    return versionA.major - versionB.major;
  }
  if (versionA.minor !== versionB.minor) {
    return versionA.minor - versionB.minor;
  }
  return versionA.patch - versionB.patch;
}

// Generate the next tag based on logic
function getNextTag(latestStableTag, latestPrereleaseTag, versionType) {
  const latestStable = latestStableTag ? parseVersion(latestStableTag) : null;
  const latestPre = latestPrereleaseTag ? parseVersion(latestPrereleaseTag) : null;

  if (!latestStable && !latestPre) {
    return `v0.1.0-${versionType}.1`;
  }

  if (latestPre && (!latestStable || compareBaseVersions(latestPre, latestStable) > 0)) {
    // Increment the prerelease number if the prerelease tag is already for a higher version
    const nextPrereleaseNumber = latestPre.prereleaseNumber + 1;
    return `v${latestPre.major}.${latestPre.minor}.${latestPre.patch}-${versionType}.${nextPrereleaseNumber}`;
  }

  if (latestStable) {
    // Increment the minor version from the latest stable tag and start the prerelease
    const nextMinor = latestStable.minor + 1;
    return `v${latestStable.major}.${nextMinor}.0-${versionType}.1`;
  }

  throw new Error("Unexpected case when calculating next tag.");
}

// Tag the repository
function tagRepository(newTag, tagRepo) {
  console.log(`Creating new tag: ${newTag}`);
  core.setOutput("new-version", newTag);

  if (tagRepo) {
    if (!SAFE_TAG_PATTERN.test(newTag)) {
      throw new Error(`Refusing to create invalid tag format: ${newTag}`);
    }
    safeExecSync(`git tag ${newTag}`);
    safeExecSync(`git push origin ${newTag}`);
    console.log(`Repository tagged with ${newTag}`);
  }
}

// Main function
async function run() {
  try {
    const versionType = core.getInput("version-type") || "alpha";
    if (!versionType || !/^\w+$/.test(versionType)) {
      throw new Error(
        `Invalid version-type: ${versionType}. It must be a non-empty word string (letters, digits, underscore).`
      );
    }

    const tagRepo = core.getInput("tag-repo") === "true";

    // Fetch all git tags
    fetchTags();

    // Get the latest tags
    const latestStableTag = getLatestStableTag();
    console.log(`Latest stable tag: ${latestStableTag || "None"}`);

    const latestPrereleaseTag = getLatestTag(versionType);
    console.log(`Latest prerelease tag used for ${versionType}: ${latestPrereleaseTag || "None"}`);

    // Generate the next tag
    const nextTag = getNextTag(latestStableTag, latestPrereleaseTag, versionType);
    console.log(`Next tag: ${nextTag}`);

    // Tag the repository
    tagRepository(nextTag, tagRepo);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();

module.exports = {
  parseVersion,
  getNextTag,
};
