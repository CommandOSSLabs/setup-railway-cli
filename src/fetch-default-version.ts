const OFFICIAL_RAILWAY_LATEST_RELEASE_API =
  'https://api.github.com/repos/railwayapp/cli/releases/latest'

type GitHubRelease = {
  draft?: boolean
  prerelease?: boolean
  tag_name?: string
}

function buildGitHubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'setup-railway-cli',
  }

  const token = process.env.GITHUB_TOKEN
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

export async function fetchDefaultVersion(): Promise<string> {
  const response = await fetch(OFFICIAL_RAILWAY_LATEST_RELEASE_API, {
    headers: buildGitHubHeaders(),
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(
      `Failed to fetch latest Railway CLI version from railwayapp/cli: ${response.status} ${response.statusText}`
    )
  }

  const release = (await response.json()) as GitHubRelease
  if (release.draft || release.prerelease || !release.tag_name) {
    throw new Error('Latest Railway CLI release did not include a stable tag.')
  }

  return release.tag_name
}
