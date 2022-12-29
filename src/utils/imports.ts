import { readdirSync, PathLike, statSync } from 'fs'
import { ImportStats, ImportType, MultiReg } from './types'
import { Path } from 'typescript'
import pathLib from 'path'

// TODO: best way to compare Paths, the files
export function multiTestReg (
  value: string,
  reg: MultiReg
): boolean {
  let items: Array<string | RegExp>
  if (typeof reg === 'string' || reg instanceof RegExp) items = [reg]
  else if (Object.values(reg).length === 0) return false
  else items = reg
  return items.every(item => {
    if (typeof item === 'string') return new RegExp(item).test(value)
    else if (item instanceof RegExp) return item.test(value)
    else return false
  })
}

export function readDir (
  path: PathLike,
  excludes?: MultiReg,
  options?:
  | {
    encoding: BufferEncoding | null
    withFileTypes?: false | undefined
  }
  | BufferEncoding
  | null
): string[] {
  const dir: string[] = []
  readdirSync(path, options).forEach(item => {
    if (typeof excludes === 'undefined' || !multiTestReg(item, excludes)) dir.push(item)
  })
  return dir
}

export const ImportExtFiles = ['js', 'ts', 'json']

export function imports<T> (
  path: Path | PathLike,
  options?: {
    excludes?: MultiReg
    tree?: boolean
    limit?: number
  }
): Array<ImportStats<T>> {
  let data: Array<ImportStats<T>> = []
  readDir(path, options?.excludes).forEach(item => {
    const pathI = pathLib.resolve(path as string, item)
    let extname = pathLib.extname(item).substring(1)
    if (extname === item) extname = ''
    const stats = statSync(pathI)
    const isImport = ImportExtFiles.includes(extname)
    if (typeof options === 'undefined') options = {}
    const tree = typeof options.tree !== 'undefined' ? options.tree : true
    let file: ImportType<T> | undefined
    let dir: Array<ImportStats<T>> | undefined = []
    if (stats.isFile() && isImport) {
      file = require(pathI)
    } else if (stats.isDirectory()) {
      if (typeof options.limit === 'undefined') options.limit = 0
      const limit = options.limit - 1
      if ((options.limit > 0 || options.limit < 0) && limit > -12) {
        dir = imports<T>(pathI, { excludes: options.excludes, limit, tree })
      }
    }
    if (dir.length > 0 && !tree) data = [...data, ...dir]
    else {
      const content = stats.isFile() ? file : stats.isDirectory() ? dir : undefined
      const subData: ImportStats<T> = {
        name: item.replace(`.${extname}`, ''),
        extname,
        stats,
        content
      }
      data.push(subData)
    }
  })
  return data
}
