import { GetSpawn } from './types'
import { gte } from 'semver'

export class GitUtils {
  private _getSpawn: GetSpawn

  constructor(getSpawn: GetSpawn) {
    this._getSpawn = getSpawn
  }

  optimise = async (): Promise<boolean> => {
    const spawn = await this._getSpawn()
    if (!spawn) {
      return false
    }

    const [canOptimise, versionOrReason] = await this.meetsVersionRequirement(
      '2.29.0',
    )
    if (canOptimise) {
      console.info('Optimising repository for reading')

      // Basically git can manage an index which massively speeds up 'git log'.
      //  This is a massive difference in large repositories but may take some time to complete
      // https://git-scm.com/docs/git-commit-graph
      await spawn(['commit-graph', 'write', '--reachable', '--changed-paths'])
    } else {
      console.warn(
        'Cannot optimise repository for reading, version:',
        versionOrReason,
      )
    }

    return canOptimise
  }

  meetsVersionRequirement = async (
    minimumVersion: string,
  ): Promise<[ok: boolean, version: string]> => {
    const spawn = await this._getSpawn()
    if (!spawn) {
      return [false, 'unknown (no repository)']
    }

    const fullVersion = await spawn(['--version'])
    const versionRegex = /\d+\.\d+\.\d+/
    const matches = versionRegex.exec(fullVersion)
    if (!matches) {
      return [false, `unknown (version not found in '${fullVersion}')`]
    }

    const gitVersion = matches[0]

    return [gte(gitVersion, minimumVersion), gitVersion]
  }
}
