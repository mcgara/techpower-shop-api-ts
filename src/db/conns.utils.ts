import { DataSourceOptions } from 'typeorm'
import { setRootOnPattern } from '../utils/tools'

export function normalizeOpt<K extends keyof DataSourceOptions> (
  data: DataSourceOptions,
  opt: K,
  fn: (opt: DataSourceOptions[K]) => DataSourceOptions[K]
): DataSourceOptions {
  if (data[opt] !== undefined) {
    const valueOpt = fn(data[opt])
    if (valueOpt !== undefined) data[opt] = valueOpt
  }
  return data
}

export function normalizeOptPatterns (
  data: DataSourceOptions,
  opts: Array<keyof DataSourceOptions>
): DataSourceOptions {
  const setPattern = <T>(v: T): T => typeof v === 'string' ? (setRootOnPattern(v) as unknown) as T : v
  const fn = <T>(opt: T): T => Array.isArray(opt) ? (opt.map(v => setPattern(v)) as unknown) as T : opt
  opts.forEach(o => { (data = normalizeOpt(data, o, opt => fn(opt))) })
  return data
}

export function normalize (data: DataSourceOptions): DataSourceOptions {
  data = normalizeOptPatterns(data, ['entities', 'subscribers', 'migrations'])
  return data
}
