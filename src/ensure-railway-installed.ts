import { access, readdir } from 'node:fs/promises'
import path from 'node:path'
import * as cache from '@actions/cache'
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as io from '@actions/io'
import * as tc from '@actions/tool-cache'
import {
  buildReleaseArchiveName,
  normalizeRunnerOs,
  resolvePlatformSpec,
} from './platform.ts'
import { runCommand } from './run-command.ts'

function extractSemver(value: string): string | null {
  const match = value.match(/\d+\.\d+\.\d+/)
  return match ? match[0] : null
}

async function pathExists(candidatePath: string): Promise<boolean> {
  try {
    await access(candidatePath)
    return true
  } catch {
    return false
  }
}

async function findExtractedBinary(
  extractedPath: string,
  binaryName: string
): Promise<string> {
  const directPath = path.join(extractedPath, binaryName)
  if (await pathExists(directPath)) {
    return directPath
  }

  const entries = await readdir(extractedPath, {
    recursive: true,
    withFileTypes: true,
  })
  const match = entries.find(
    (entry) => entry.isFile() && entry.name === binaryName
  )
  if (match?.parentPath) {
    return path.join(match.parentPath, match.name)
  }

  throw new Error(
    `Could not find ${binaryName} in extracted Railway CLI archive.`
  )
}

export async function ensureRailwayInstalled(
  version: string,
  installDir: string,
  railwayBinPath: string
): Promise<void> {
  const runnerOs = process.env.RUNNER_OS || process.platform
  const runnerArch = process.env.RUNNER_ARCH || process.arch
  const cacheKey = `railway-cli-${runnerOs}-${runnerArch}-${version}`

  try {
    await cache.restoreCache([railwayBinPath], cacheKey)
    core.info(`Checked cache for key ${cacheKey}`)
  } catch (error) {
    core.warning(
      `Cache restore failed: ${error instanceof Error ? error.message : String(error)}`
    )
  }

  let shouldInstall = true
  try {
    const { stdout } = await runCommand(railwayBinPath, ['--version'])
    const installedSemver = extractSemver(stdout)
    const requestedSemver = extractSemver(version)
    const isRequestedVersionInstalled =
      stdout.includes(version) ||
      (installedSemver !== null &&
        requestedSemver !== null &&
        installedSemver === requestedSemver)

    if (isRequestedVersionInstalled) {
      core.info(`Using existing Railway CLI ${version}`)
      core.info(stdout)
      shouldInstall = false
    } else {
      core.info(
        `Cached Railway CLI version mismatch. requested=${version} detected=${stdout.trim()}`
      )
    }
  } catch (error) {
    core.warning(
      `Failed to execute cached Railway CLI: ${error instanceof Error ? error.message : String(error)}`
    )
    shouldInstall = true
  }

  if (shouldInstall) {
    core.info(`Installing Railway CLI ${version}...`)
    const { binaryName } = resolvePlatformSpec()
    const archiveName = buildReleaseArchiveName(version)
    const url = `https://github.com/railwayapp/cli/releases/download/${version}/${archiveName}`
    core.info(`Downloading release archive: ${url}`)

    const archivePath = await tc.downloadTool(url)
    const extractedPath = await tc.extractTar(archivePath)
    const downloadedRailwayPath = await findExtractedBinary(
      extractedPath,
      binaryName
    )

    await io.mkdirP(installDir)
    await io.cp(downloadedRailwayPath, railwayBinPath, { force: true })

    if (normalizeRunnerOs() !== 'windows') {
      await exec.exec('chmod', ['0755', railwayBinPath], { silent: true })
    }

    try {
      const cacheId = await cache.saveCache([railwayBinPath], cacheKey)
      if (cacheId === -1) {
        core.info(`Skipped saving Railway CLI to cache key ${cacheKey}`)
      } else {
        core.info(`Saved Railway CLI to cache key ${cacheKey}`)
      }
    } catch (error) {
      core.warning(
        `Cache save skipped: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  await runCommand('railway', ['--version'])
}
