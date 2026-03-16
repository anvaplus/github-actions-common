# GitHub Actions Common

Reusable GitHub Actions and supporting documentation for a unified CI/CD semantic versioning workflow.

This repository centralizes shared versioning automation used across pipelines, including generation of new prerelease versions and promotion of versions across release stages.

## Available Actions

### 1. Next Version

Path: `/.github/actions/next-version`

Calculates the next semantic prerelease version from existing Git tags (for example, `alpha`, `beta`, `rc`) and can optionally tag the repository.

- Action README: [.github/actions/next-version/Readme.md](.github/actions/next-version/Readme.md)

### 2. Promote Version

Path: `/.github/actions/promote-version`

Promotes an existing semantic version between prerelease channels (for example, `alpha` -> `beta`, `beta` -> `rc`) or to a stable release, with optional repository tagging.

- Action README: [.github/actions/promote-version/Readme.md](.github/actions/promote-version/Readme.md)

## Versioning Strategy

This repository follows a structured multi-environment semantic versioning model for CI/CD promotion flow.

- Strategy documentation: [VERSIONING_STRATEGY.md](VERSIONING_STRATEGY.md)

