import { DataSourceOptions, DatabaseType } from 'typeorm'
import { Types, get, EnvError, ErrorParser } from '../utils/env.type'
import { toCamelCase } from '../utils/tools'
import {
  commonDataOptions,
  dataBaseOptions,
  dataBaseTypes,
  isKeyDataSourceOptions,
  KeysDataSourceOptions
} from './options'

export type UnlockDataSourceOptions = {
  -readonly [Property in keyof DataSourceOptions]: DataSourceOptions[Property]
}

export interface DataSourceOptionsEnv extends Record<string, UnlockDataSourceOptions> {}

export interface IConnsOptions {
  prefix?: string
  sep?: string
  nameDefault?: string
  nameToLowerCase?: boolean
  nameOnDataSource?: boolean // deprecated name of DataSourceOptions
}

export function defaultOptions (options?: IConnsOptions): Required<IConnsOptions> {
  options ??= {}
  options.sep ??= '_' // snake_case
  options.prefix ??= 'DB'
  options.nameDefault ??= 'default'
  options.nameToLowerCase ??= true
  options.nameOnDataSource ??= false
  return options as Required<IConnsOptions>
}

function getNameAndProp (variable: string, options: Required<IConnsOptions>): [string, string] {
  const sep = options.sep
  const split = variable.split(sep)
  let name = split.slice(1, 2).join(sep)
  let prop = toCamelCase(split.slice(2).join(sep).toLowerCase())
  if (!isKeyDataSourceOptions(prop)) {
    prop = toCamelCase(split.slice(1).join(sep).toLowerCase())
    name = options.nameDefault
  }
  return [name, prop]
}

function findDatabaseType (name: string, options: Required<IConnsOptions>): DatabaseType {
  const sep = options.sep
  const env = Object.keys(process.env).join(' ')
  const m1 = env.match(new RegExp(`\\b(${options.prefix}${sep}${name}${sep}type)\\b`, 'i'))
  if (typeof m1?.[1] === 'string') return get(m1[1], ...dataBaseTypes)
  const err = ErrorParser('', m1 !== null ? m1[1] : '', {}, dataBaseTypes)
  if (name !== options.nameDefault) throw err
  const m2 = env.match(new RegExp(`\\b(${options.prefix}${sep}type)\\b`, 'i'))
  if (typeof m2?.[1] === 'string') return get(m2[1], ...dataBaseTypes)
  throw err
}

function getEnvTypes (dbType: DatabaseType, prop: KeysDataSourceOptions): Types[] {
  const typesCM = commonDataOptions[prop]
  const typesDB = dataBaseOptions[dbType][prop]
  const types: Types[] = []
  if (Array.isArray(typesCM)) types.push(...typesCM)
  else if (prop in commonDataOptions) types.push(typesCM)
  // common types overloaded db types
  // TODO: options to avoid this overload
  if (Array.isArray(typesDB)) types.push(...typesDB)
  else if (prop in dataBaseOptions[dbType]) types.push(typesDB)
  return types
}

export function getDataSourceOptionsOfEnv (options?: IConnsOptions): DataSourceOptions[] {
  const opts = defaultOptions(options)
  const failed: string[] = []
  const data: DataSourceOptionsEnv = {}
  const env = Object.keys(process.env).filter(v => v.substring(0, opts.prefix.length) === opts.prefix)
  for (const variable of env) {
    const [name, prop] = getNameAndProp(variable, opts)
    if (failed.includes(name) || !isKeyDataSourceOptions(prop)) continue
    try {
      if (data[name] === undefined) data[name] = { type: findDatabaseType(name, opts) }
      if (opts.nameOnDataSource) data[name].name = opts.nameToLowerCase ? name.toLowerCase() : name
      const types = getEnvTypes(data[name].type, prop)
      if (types.length === 0) {
        const msg = `the option '${prop}' not supported in DatabaseType '${data[name].type}'`
        throw new EnvError(msg, variable, '')
      }
      data[name][prop] = get(variable, ...types)
    } catch (err) {
      failed.push(name)
      console.error(err)
    }
  }
  const conns: DataSourceOptions[] = []
  for (const name in data) {
    // Note: Rules for add connection
    // if failed some type not parsed
    if (failed.includes(name)) continue
    conns.push(data[name] as DataSourceOptions)
  }
  console.log(conns)
  return conns
}
