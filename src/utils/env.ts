import * as dotenv from 'dotenv'

dotenv.config()

export class EnvError extends Error {
  messageEnv = ''
  variable = ''
  value: string | undefined
  constructor (
    message?: string,
    value?: string,
    variable?: string,
    msgEnvErr?: string
  ) {
    const defaultVar = 'Some variable'
    if (msgEnvErr === undefined || msgEnvErr === '') msgEnvErr = 'produce error'
    variable ??= defaultVar
    message ??= msgEnvErr
    let msg = variable === '' ? `${defaultVar} ` : `${variable} `
    msg += `${message !== '' ? message : msgEnvErr}`
    super(msg)
    this.messageEnv = msgEnvErr
    this.value = value?.replace(/(\r|\n|\r\n)/gm, ' ').replace(/\s+/g, ' ')
    this.variable = variable
  }
}

export class EnvNotExists extends EnvError {
  constructor (message?: string, variable?: string) {
    super(message, variable, '', 'not exists')
  }
}

export class EnvRequired extends EnvError {
  constructor (message?: string, variable?: string) {
    super(message, variable, '', 'is required')
  }
}

export class EnvNotParsed extends EnvError {
  type = ''
  constructor (message?: string, value?: string, variable?: string, type?: string) {
    const msg = 'cannot be parsed'
    if (type !== undefined && type !== '') {
      if (message === undefined || message === '') message = `${msg} type: '${type}'`
      else message = `${message} type: '${type}'`
    }
    super(message, value, variable, msg)
    this.type = type?.replace(/(\r|\n|\r\n)/gm, ' ').replace(/\s+/g, ' ') ?? ''
  }
}

export function allToString (value: any, limit?: number): string {
  limit ??= 30
  if (['function', 'object'].includes(typeof value)) {
    let str = value?.toString() ?? JSON.stringify(value)
    if (typeof value === 'function' && ![undefined, 'anonymous'].includes(value?.name)) str = value.name
    if (str === undefined || str.length > limit) str = String(value)
    return str
  } else return String(value)
}

export interface IOptions {
  literal?: string
  variable?: string
  noRules?: boolean
  strict?: boolean
}
export type ObjectConstructors = ObjectConstructor | JSON | ArrayConstructor
export type ConstructorsTypes = StringConstructor | SymbolConstructor | NumberConstructor | BigIntConstructor | BooleanConstructor | ObjectConstructors
export type Types = string | boolean | number | bigint | symbol | undefined | null | ConstructorsTypes | Type
export type ErrParser = (msg?: string, value?: string, variable?: string, literal?: string, type?: Types | Types[]) => EnvNotParsed
export type CustomType = ((value: string, err: ErrParser, opts?: IOptions) => unknown)

export class Type {
  type: Types | CustomType
  literal: string

  constructor (type: Types, literal?: string)
  constructor (type: ((value: string, err: ErrParser, opts?: IOptions) => unknown), literal?: string)
  constructor (type: Types | CustomType, literal?: string) {
    this.type = type
    this.literal = literal ?? allToString(type)
  }

  toString (): string {
    return this.literal
  }
}

export const ErrParsed: ErrParser = (msg, value, variable, literal, type) => {
  literal ??= Array.isArray(type) ? type.map(t => allToString(t)).join(' | ') : allToString(type)
  return new EnvNotParsed(msg, value, variable, literal)
}

export function isObjectConstructor (value: any): value is ObjectConstructors {
  return [Object, Array, JSON].includes(value)
}

export const commonTypes = ['string', 'number', 'boolean', 'symbol', 'bigint', 'undefined']

export function isTypes (value: any): value is Types {
  return (
    commonTypes.includes(typeof value) ||
    [String, Boolean, Number, BigInt, Symbol].includes(value) ||
    isObjectConstructor(value)
  )
}

export function parserType<T> (value: string, type: Types, opts?: IOptions): T {
  opts ??= {}
  opts.noRules ??= false
  if (type instanceof Type) {
    opts.literal = type?.literal
    if (isTypes(type.type)) type = type.type
    else {
      try {
        return type.type(value, ErrParsed, opts) as T
      } catch (err) { if (err instanceof EnvError) throw err }
    }
  }
  if (isObjectConstructor(type)) {
    try {
      const data = JSON.parse(value)
      if (type !== Array || Array.isArray(data)) return data as T
    } catch {}
  } else if (commonTypes.includes(typeof type) && value === allToString(type)) {
    return (type as unknown) as T
  } else if (typeof type === 'function') {
    try {
      const parsed = type(value)
      let pass = true
      if (
        (opts?.noRules === undefined || !opts.noRules) &&
        (
          (type === Number && Number.isNaN(parsed)) ||
          (type === Boolean && !['true', 'false'].includes(value))
        )
      ) pass = false
      if (pass) return (parsed as unknown) as T
    } catch {}
  }
  throw ErrParsed('', value, opts.variable, opts.literal, type)
}

function setTypes (types: Types[]): Types[] {
  const setTypes = new Set<Types>(types)
  if (setTypes.delete(String)) setTypes.add(String)
  const arrTypes: Types[] = []
  setTypes.forEach(t => arrTypes.push(t))
  return arrTypes
}

export function parserArrayOfTypes<T> (value: string, types: Types[], opts?: IOptions): T {
  opts ??= {}
  types = setTypes(types)
  for (const t of types) {
    try { return parserType(value, t, opts) } catch {}
  }
  opts.literal = types.map(t => allToString(t)).join(' | ')
  throw ErrParsed('', value, opts.variable, opts.literal)
}

// TODO: parser sub array types??? and parserObjectOfTypes

export function parser<T> (value: string, type: Types | Types[], opts?: IOptions): T {
  if (Array.isArray(type)) return parserArrayOfTypes(value, type, opts)
  else return parserType(value, type, opts)
}

export function get (variable: string): string | undefined
export function get<T> (variable: string, type: Types | Types[], options?: IOptions): T
export function get<T> (variable: string, type?: Types | Types[], opts?: IOptions): T | string | undefined {
  const value = process.env[variable]
  if (value === undefined) return value
  if (type === undefined) {
    if (value === 'undefined') return type
    else return value
  }
  opts ??= {}
  opts.variable = variable
  return parser(value, type, opts)
}

// Library of Types

export const Lib = {
  default: (value: unknown) => new Type(() => value),

  NoEmpty: new Type((value, err, opts) => {
    if (value !== '') return value
    throw err('value cannot be empty', '', opts?.variable, opts?.literal, String)
  }),

  Array: (items: Types[], literal?: string, checkEmpty?: boolean) => {
    if ([undefined, ''].includes(literal)) literal = JSON.stringify(items)
    return new Type((value, err, opts) => {
      opts ??= {}
      opts.literal = literal
      const arr: any[] = parser(value, Array, opts)
      if (checkEmpty === true && (items.length === 0 && arr.length !== 0)) {
        throw err('array cannot be empty', value, opts?.variable, opts?.literal)
      }
      arr.forEach(v => parserArrayOfTypes(allToString(v), items, opts))
      return arr
    }, literal)
  }
}
