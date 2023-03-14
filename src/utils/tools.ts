import path from 'path'
import glob, { IOptions } from 'glob'

export const rootPath = path.resolve(__dirname, '..')
export const rootName = path.basename(rootPath)

export function setRootOnPattern (pattern: string, options?: IOptions): string {
  const p = path.join(rootName, pattern).replaceAll('\\', '/')
  return glob.sync(p, options).length > 0 ? p : pattern
}

export function allToString (value: unknown, length?: number | null): string {
  if (length === undefined) length = 30
  let str = 'object'
  if (Array.isArray(value)) str = JSON.stringify(value)
  else if (typeof value === 'function' || typeof value === 'object') {
    str = JSON.stringify(value) ?? value?.toString()
    if (typeof value === 'function' && ![undefined, 'anonymous'].includes(value?.name)) str = value.name
  } else str = String(value)
  if (length !== null && str.length > length) str = str.substring(0, length)
  return str
}

export function toCamelCase (value: string, firstUpper?: boolean): string {
  return value.replace(/^([A-Z])|[-_\s](\w)/g, (_, s1, s2, i) => {
    if (i === 0 && firstUpper === true) return s1 as string
    if (typeof s2 === 'string') return s2.toUpperCase()
    return (s1 as string).toLowerCase()
  })
}
