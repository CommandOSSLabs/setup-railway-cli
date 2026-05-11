import os from 'node:os'
import path from 'node:path'
import * as core from '@actions/core'
import * as io from '@actions/io'
import { ensureRailwayInstalled } from './ensure-railway-installed.ts'
import { fetchDefaultVersion } from './fetch-default-version.ts'
import { resolvePlatformSpec } from './platform.ts'

async function main(): Promise<void> {
  const version = core.getInput('version') || (await fetchDefaultVersion())

  const installDir = path.join(os.homedir(), '.local', 'bin')
  const { binaryName } = resolvePlatformSpec()
  const railwayBinPath = path.join(installDir, binaryName)

  await io.mkdirP(installDir)
  core.addPath(installDir)

  await ensureRailwayInstalled(version, installDir, railwayBinPath)
  core.setOutput('version', version)
}

try {
  await main()
} catch (error) {
  core.setFailed(error instanceof Error ? error.message : String(error))
}
