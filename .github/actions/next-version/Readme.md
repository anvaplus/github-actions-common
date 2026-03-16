# Next Version GitHub Action

This GitHub Action determines the next version for your project from existing Git tags.
It always produces prerelease tags in the format `v{major}.{minor}.{patch}-{suffix}.{N}`.

## Inputs

| Name | Description | Required | Default |
|------|-------------|----------|---------|
| `version-type` | Prerelease suffix. Any non-empty word string is accepted (`/^\w+$/`), for example `alpha`, `beta`, `rc`, `snapshot`, `nightly`. | true | `alpha` |
| `tag-repo` | When `true`, creates and pushes the generated tag. | false | `false` |

## Outputs

| Name | Description |
|------|-------------|
| `new-version` | The next calculated version tag. |

## Version Rules

- If no tags exist, starts at `v0.1.0-<type>.1`.
- If latest prerelease base version is ahead of the latest stable version, increments prerelease number.
- Otherwise, bumps stable minor and starts new prerelease at `.1`.

### Examples

**New Project**
- No tags + `version-type: alpha` -> `v0.1.0-alpha.1`
- No tags + `version-type: snapshot` -> `v0.1.0-snapshot.1`

**Starting a New Prerelease Series**
- Stable `v1.2.0` + `version-type: alpha` -> `v1.3.0-alpha.1`
- Stable `v1.2.0` + `version-type: nightly` -> `v1.3.0-nightly.1`
- Stable `v4.0.0` + `version-type: beta` -> `v4.1.0-beta.1`

**Continuing an Existing Prerelease Series**
- Latest is `v1.3.0-alpha.5` + `version-type: alpha` -> `v1.3.0-alpha.6`
- Latest is `v1.3.0-beta.4` + `version-type: beta` -> `v1.3.0-beta.5`
- Stable is `v2.0.0`, Latest prerelease is `v2.1.0-rc.2` + `version-type: rc` -> `v2.1.0-rc.3`

**Mixing Prerelease Types**
- Stable is `v1.2.0`, Latest alpha is `v1.3.0-alpha.2`, but requested `version-type: beta` -> `v1.3.0-beta.1`
*(Note: Each `version-type` tracks its own increment based on base version, meaning beta starts from `.1` because there are no betas for `v1.3.0`.)*

## Usage

### Basic Usage

You can compute the next version without tagging the repository. This is useful when you want to use the version in earlier steps of your CI pipeline (e.g. naming an artifact).

```yaml
- name: Compute next RC version
  id: next_version
  uses: ./.github/actions/next-version
  with:
    version-type: rc
    tag-repo: 'false'

- name: Use version
  run: echo "Calculated version: ${{ steps.next_version.outputs.new-version }}"
```

### Full Workflow Example with Tagging

When `tag-repo` is `true`, the action will also create a new Git tag and push it to the remote repository.

```yaml
name: Generate Next Version

on:
  push:
    branches:
      - master
      - develop

jobs:
  version:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Important: Fetch all history and tags!

      - name: Calculate and Push Alpha Tag
        id: version
        uses: ./.github/actions/next-version
        with:
          version-type: 'alpha'
          tag-repo: 'true'

      - name: Display New Version
        run: echo "Successfully pushed new tag: ${{ steps.version.outputs.new-version }}"
```

## Development

If you make any changes to the source code (`index.js`), you must compile the changes into the `dist/index.js` bundle. GitHub Actions runs the bundled code directly without running `npm install` first.

1. Install dependencies:
```bash
npm install
```

2. Run the tests to ensure everything still passes:
```bash
npm test
```

3. Generate the distribution bundle:
```bash
npm run package
```

**⚠️ Important:** Always commit the updated `dist/index.js` along with your `index.js` changes to keep the action working!