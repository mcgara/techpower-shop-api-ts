import { DatabaseType, DataSourceOptions } from 'typeorm'
import { get, EnvError } from '../utils/env'
import {
  commonDataOptions,
  dataBaseOptions,
  dataBaseTypes,
  isDataBaseType,
  isKeyDataSourceOptions
} from './options'

export function toCamelCase (value: string, separator: string | RegExp): string {
  return value.toLowerCase().split(separator).map((v, i) => {
    if (i === 0) return v
    return v.charAt(0).toUpperCase() + v.substring(1)
  }).join('')
}

export type UnlockDataSourceOptions = {
  -readonly [Property in keyof DataSourceOptions]: DataSourceOptions[Property]
}

export interface DataSourceOptionsEnv extends Record<string, UnlockDataSourceOptions> {}

export function connections (): DataSourceOptions[] {
  const failedConns: string[] = []
  const connsEnv: DataSourceOptionsEnv = {}
  for (const variable of Object.keys(process.env).filter(i => i.substring(0, 3) === 'DB_')) {
    const varSplit = variable.split('_')
    let name = varSplit[1].toLowerCase()
    let prop = toCamelCase(varSplit.slice(2).join('_'), '_')
    if (!isKeyDataSourceOptions(prop)) {
      prop = toCamelCase(varSplit.slice(1).join('_'), '_')
      name = 'default'
    }
    if (failedConns.includes(name) || !isKeyDataSourceOptions(prop)) continue
    try {
      if (connsEnv[name] === undefined) {
        let variable = `DB_${name.toUpperCase()}_TYPE`
        if (process.env[variable] === undefined) variable = 'DB_TYPE'
        const type: DatabaseType = get(variable, dataBaseTypes)
        if (isDataBaseType(type)) connsEnv[name] = { type }
      }
      const type = connsEnv[name].type
      const typesEnv = dataBaseOptions[type][prop] ?? commonDataOptions[prop]
      if (typesEnv === undefined) {
        const msg = `Option '${prop}' not supported in DatabaseType '${type}'`
        throw new EnvError(msg, '', variable)
      }
      connsEnv[name][prop] = get<unknown>(variable, typesEnv)
    } catch (err) {
      failedConns.push(name)
      console.error(err)
    }
  }
  const conns: DataSourceOptions[] = []
  for (const name in connsEnv) {
    // Notes: Rules for add connection
    // if failed some type not parsed
    if (failedConns.includes(name)) continue
    conns.push(connsEnv[name] as DataSourceOptions)
  }
  console.log(conns)
  return conns
}
