# setup-railway-cli

Install a specific Railway CLI release.

## What Is Railway CLI?

Railway CLI is the official command-line tool for interacting with the [Railway platform](https://railway.app). It is used to manage projects, environments, and deployments.

## Inputs

| Input     | Default | Description                         |
| --------- | ------- | ----------------------------------- |
| `version` | -       | Railway CLI version tag to install. |

If `version` is omitted, the action fetches the latest release tag from the official [Railway CLI](https://github.com/railwayapp/cli/releases) repository.

## Outputs

- `version`: Resolved Railway CLI version.

## Supported Platforms

| OS      | Architecture |
| ------- | ------------ |
| Linux   | x64          |
| Linux   | arm64        |
| macOS   | x64          |
| macOS   | arm64        |
| Windows | x64          |

## Examples

Install only:

```yaml
- name: 📦 Setup Railway CLI
  uses: CommandOSSLabs/setup-railway-cli@v1
```
Install a specific version:

```yaml
- name: 📦 Setup Railway CLI
  uses: CommandOSSLabs/setup-railway-cli@v1
  with:
    version: v2.0.0
```

## License

This project is licensed under the [Apache License 2.0](LICENSE).
