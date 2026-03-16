# Promote Version GitHub Action

Promotes a semantic version tag between prerelease channels (for example, `alpha` to `beta`) or to a stable tag (no suffix), and can optionally create and push the resulting Git tag.

## Inputs

| Name | Description | Required | Default |
| --- | --- | --- | --- |
| `version` | The version to promote (for example, `v1.2.3-alpha.4`). | `true` | n/a |
| `promote-type` | The target prerelease suffix (for example, `beta`, `rc`). Any non-empty word string is accepted. Ignored when `is-stable` is `true`. | `true` | n/a |
| `is-stable` | When `true`, promotes to a stable version (no suffix). Overrides `promote-type`. | `false` | `false` |
| `tag-repo` | When `true`, creates and pushes the promoted tag. | `false` | `false` |

## Outputs

| Name | Description |
| --- | --- |
| `promoted-version` | The computed promoted version/tag. |

## Promotion Rules

1. Input tags must start with `v` and follow semantic version format, optionally with prerelease suffix: `vX.Y.Z` or `vX.Y.Z-suffix.N`.
2. Prerelease promotion (`is-stable: 'false'`) requires `promote-type` to be a non-empty word string.
3. For prerelease promotion:
   - If no existing tag matches `vX.Y.Z-<promote-type>.*`, output is `vX.Y.Z-<promote-type>.1`.
   - If matching tags exist, the numeric suffix is incremented from the latest tag.
4. Stable promotion (`is-stable: 'true'`) always returns `vX.Y.Z` and ignores `promote-type`.

## Examples

1. `v1.2.3-alpha.3` to `beta` with no existing beta tag -> `v1.2.3-beta.1`
2. `v1.2.3-alpha.3` to `beta` with existing `v1.2.3-beta.2` -> `v1.2.3-beta.3`
3. `v1.2.3-rc.1` to stable (`is-stable: 'true'`) -> `v1.2.3`
4. `v1.2.3-alpha.3` to custom suffix `snapshot` -> `v1.2.3-snapshot.1`

## Basic Usage

```yaml
name: Promote Version

on:
  workflow_dispatch:

jobs:
  promote:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Promote prerelease
        id: promote
        uses: anvaplus/github-actions-common/promote-version@main
        with:
          version: v1.2.3-alpha.3
          promote-type: beta
          is-stable: 'false'
          tag-repo: 'false'

      - name: Show result
        run: echo "Promoted version: ${{ steps.promote.outputs.promoted-version }}"
```

## Full Workflow Example

```yaml
name: Promote And Tag

on:
  workflow_dispatch:
    inputs:
      version:
        description: Version to promote
        required: true
      promote_type:
        description: Target prerelease suffix (ignored when stable)
        required: false
        default: beta
      is_stable:
        description: Promote to stable version
        required: false
        default: 'false'

jobs:
  promote:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Promote version and tag repo
        id: promote
        uses: anvaplus/github-actions-common/promote-version@main
        with:
          version: ${{ github.event.inputs.version }}
          promote-type: ${{ github.event.inputs.promote_type }}
          is-stable: ${{ github.event.inputs.is_stable }}
          tag-repo: 'true'

      - name: Print promoted version
        run: echo "New tag: ${{ steps.promote.outputs.promoted-version }}"
```

## Development

Run the action tests and package build locally:

```bash
npm install
npm test
npm run package
```