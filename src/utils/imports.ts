import { Stats, statSync } from 'fs'
import pathLib from 'path'
import glob, { IOptions } from 'glob'

export type ImportType<T> = Record<string, T>
export interface ImportStats<T> {
  name: string
  extname: string
  stats: Stats
  content: ImportType<T> | Array<ImportStats<T>> | undefined
}

export type ImportDirStats<T> = Array<ImportStats<T>>

export function multiPatterns (patterns: string | string[], options?: IOptions): string[] {
  if (!Array.isArray(patterns)) patterns = [patterns]
  return patterns.reduce<string[]>((p, v) => p.concat(glob.sync(v, options)), [])
}

export const ImportExtFiles = ['.js', '.ts', '.json']

function importFromDir<T> (paths: string[], opts: { tree: boolean }): ImportDirStats<T> {
  // Warning: the order of the paths is important, first the path of the folder then paths its files.
  // TODO: use glob pattern option 'stats' for load which stats of folders and files and set order paths.
  let data: ImportDirStats<T> = []
  for (let i = 0; i < paths.length; i) {
    const item = paths[i]
    const path = pathLib.resolve(item)
    let extname = pathLib.extname(item)
    if (extname === item) extname = ''
    const name = pathLib.basename(path).replace(extname, '')
    const stats = statSync(path)
    const subData: ImportStats<T> = {
      name,
      extname,
      stats,
      content: undefined
    }
    if (stats.isFile() && ImportExtFiles.includes(extname)) {
      subData.content = require(path) as ImportType<T> // eslint-disable-line
      data.push(subData)
    } else if (stats.isDirectory()) {
      const subPaths = paths.filter(p => p.includes(item) && p !== item)
      paths = paths.filter(p => !subPaths.includes(p))
      const dir = importFromDir<T>(subPaths, opts)
      if (opts.tree) {
        subData.content = dir
        data.push(subData)
      } else data = [...data, ...dir]
    }
    paths.splice(i, 1)
  }
  return data
}

export function imports<T> (
  patterns: string | string[],
  options?: IOptions & { tree?: boolean }
): ImportDirStats<T> {
  options ??= {}
  options.tree ??= false
  options.absolute ??= true

  const paths = multiPatterns(patterns, options)
  return importFromDir(paths, { tree: options.tree })
}
