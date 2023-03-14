import { allToString } from './tools'
import * as dotenv from 'dotenv'

dotenv.config()

export class EnvError extends Error {
  messageEnv = ''
  variable = ''
  value: string | undefined
  constructor (
    message?: string,
    variable?: string,
    value?: string,
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
    super(message, variable, '', 'is undefined')
  }
}

export class EnvRequired extends EnvError {
  constructor (message?: string, variable?: string) {
    super(message, variable, '', 'is required')
  }
}

export class EnvNotParsed extends EnvError {
  type = ''
  constructor (message?: string, variable?: string, value?: string, type?: string) {
    const msg = 'cannot be parsed'
    type = type?.replace(/(\r|\n|\r\n)/gm, ' ').replace(/\s+/g, ' ') ?? ''
    if (type !== undefined && type !== '') {
      if (message === undefined || message === '') message = `${msg}, type: '${type}'`
      else message = `${message}, type: '${type}'`
    }
    super(message, variable, value, msg)
    this.type = type
  }
}

export interface Literal {
  value: unknown
  length?: number | null
  toString: (length?: number | null) => string
}

export interface LiteralConstructor {
  new (value: unknown, length?: number | null): Literal
  (value: unknown, length?: number | null): string
  readonly property: Literal
}

export const Literal: LiteralConstructor = function (this: Literal, value: unknown, length?: number | null) { // eslint-disable-line
  if (!(this instanceof Literal)) return allToString(value, length)
  this.value = value
  this.length = length === undefined ? 500 : length
  this.toString = function (length?: number | null): string {
    return allToString(this.value, length ?? this.length)
  }
} as LiteralConstructor

type literal = Literal | string
type Common = literal | boolean | number | bigint | symbol | undefined
type CommonConstructors = LiteralConstructor | StringConstructor | BooleanConstructor | NumberConstructor | BigIntConstructor | SymbolConstructor
type ObjectConstructors = ObjectConstructor | ArrayConstructor | JSON | null
export type Commons = Common | CommonConstructors | ObjectConstructors
type CheckCommon<T> = T extends Common ? (T extends Literal ? string : T) : T extends CommonConstructors ? ReturnType<T> : T extends ObjectConstructors ? object : never

const common = ['string', 'boolean', 'number', 'bigint', 'symbol', 'undefined']
const commonConstructors = [Literal, String, Boolean, Number, BigInt, Symbol]
const objectConstructors = [Object, Array, JSON, null]

function isCommon (value: unknown): value is Common {
  return common.includes(typeof value) || value instanceof Literal
}
function isCommonConstructors (value: unknown): value is CommonConstructors {
  return commonConstructors.includes(value as CommonConstructors)
}
function isObjectConstructors (value: unknown): value is ObjectConstructors {
  return objectConstructors.includes(value as ObjectConstructors)
}
export function isCommons (value: unknown): value is Commons {
  return (
    isCommon(value) ||
    isCommonConstructors(value) ||
    isObjectConstructors(value)
  )
}

export interface IOptions {
  literal?: string
  length?: number | null
  variable?: string
  noEmpty?: boolean
}

type ErrParser = typeof ErrorParser
export interface IErrorParser extends ErrParser {}
export type Custom<T> = (value: literal, err: IErrorParser, options?: IOptions) => T

export class Type<T> {
  readonly type: Commons | Custom<unknown>
  readonly literal: string

  constructor (type: T extends Commons ? T : never, options?: IOptions)
  constructor (create: T & ((value: literal, err: IErrorParser, options?: IOptions) => T extends Custom<unknown> ? ReturnType<T> : never), options?: IOptions)
  constructor (item: Commons | Custom<unknown>, opts?: IOptions) {
    if (isCommons(item) || typeof item === 'function') this.type = item
    else throw new EnvError('type not supported')
    this.literal = opts?.literal ?? allToString(item, opts?.length)
  }

  toString (): string { return this.literal }
}

export type Types = Commons | Type<unknown>
type CheckType<T> = T extends Type<infer t> ? (t extends Commons ? CheckCommon<t> : t extends Custom<unknown> ? ReturnType<t> : never) : never
type CheckTypes<T> = T extends Commons ? CheckCommon<T> : CheckType<T>
type CheckUnionTypes<T> = T extends Array<infer t> ? CheckTypes<t> : CheckTypes<T>

function isType (value: unknown): value is Type<unknown> {
  return value instanceof Type
}

function isIOptions (value: unknown): value is IOptions {
  return (typeof value === 'object' && (!isCommons(value) && !isType(value)))
}

function typeToLiteral (type: Types, length?: number | null): string {
  if (typeof type === 'string') return `"${type}"`
  if (type === JSON) return 'JSON'
  if (isType(type)) return type.literal
  return allToString(type, length)
}

function typesToLiteral (types: Types | Types[], options?: IOptions): string | undefined {
  let literal = options?.literal
  const toLiteral = (Array.isArray(types) && types.length > 0) || types !== undefined
  if (toLiteral && [undefined, ''].includes(literal)) {
    literal = Array.isArray(types)
      ? types.map(t => typeToLiteral(t)).join(' | ')
      : typeToLiteral(types as Types)
  }
  return literal
}

export function ErrorParser (msg?: string, value?: literal, options?: IOptions): EnvNotParsed
export function ErrorParser (msg?: string, value?: literal, options?: IOptions, types?: Types | Types[]): EnvNotParsed
export function ErrorParser (msg?: string, value?: literal, options?: IOptions, types?: Types | Types[]): EnvNotParsed {
  options ??= {}
  const literal = options.literal ?? typesToLiteral(types, options)
  const variable = options?.variable
  value = value?.toString(options?.length)
  return new EnvNotParsed(msg, variable, value, literal)
}

const checkType = {
  string: (value: string): string | null => {
    const m = value.match(/^\s*(['"`])(.*)(['"`])\s*$/s)
    return m !== null ? (m[2] !== undefined && m[1] === m[3] ? m[2] : null) : null
  },
  boolean: (value: string): boolean | null => {
    return value === 'true' ? true : value === 'false' ? false : null
  },
  number: (value: string): number | null => {
    const num = Number.parseInt(value)
    if (isNaN(num)) return null
    return num
  },
  bigint: (value: string): bigint | null => {
    try { return BigInt(value) } catch { return null }
  },
  symbol: (value: string): symbol | null => {
    const m = value.match(/^Symbol\((.*)\)$/)
    return m !== null ? (m[1] !== undefined ? Symbol(m[1]) : null) : null
  },
  object: (value: string): object | null => {
    const m = value.match(/^\s*([{[]).*([}\]])\s*$/s)
    if (m === null || !['[]', '{}'].includes(m[1] + m[2])) return null
    try { return JSON.parse(value) } catch { return null }
  },
  undefined: (value: string): undefined | null => {
    if (value !== 'undefined') return null
    return undefined
  }
}

export function parserType<T extends Types> (value: literal, type: T, options?: IOptions): CheckTypes<T> {
  options ??= {}
  if (isType(type)) {
    options.literal = type?.literal
    if (!isCommons(type.type)) {
      try {
        return type.type(value, ErrorParser, options) as CheckTypes<T>
      } catch (err) {
        if (err instanceof EnvNotParsed) err.type = options.literal
        throw err
      }
    } else type = type.type as T
  }
  if (
    (value instanceof Literal && value.value === type) ||
    (typeof type === 'string' && value === type)
  ) return type as CheckTypes<T>
  value = value.toString(options.length)
  if (
    type === Literal ||
    (type instanceof Literal && value === type.toString(options.length))
  ) return value as CheckTypes<T>
  if (isCommons(type)) {
    const typeName = (typeof type === 'function'
      ? type.name.toLowerCase()
      : typeof type) as keyof typeof checkType
    const check = checkType[typeName] ?? checkType.object
    const data = check(value)
    if (
      (isCommon(type) && data === type) ||
      (
        (value === 'null' && type === null) ||
        (data !== null && (type !== Array || Array.isArray(data)))
      )
    ) return data as CheckTypes<T>
  }
  // IDEA(Warning): create objects use 'eval' (no recommended) and Functions (implies eval).
  let msg = ''
  if (value === '' && (options.noEmpty ?? false)) msg = 'value cannot be empty'
  throw ErrorParser(msg, value, options, type)
}

export function normalize<T extends Types[]> (types: T, typesToEnd?: Types[]): T {
  typesToEnd ??= []
  const set = new Set(types)
  typesToEnd.forEach(lt => set.delete(lt) ? set.add(lt) : null)
  return Array.from(set) as T
}

function sepOptsOfTypes (
  options: IOptions | Types,
  types: Types[]
): [IOptions, Types[]] {
  let opts: IOptions = {}
  if (isIOptions(options)) opts = options
  else types.unshift(options)
  return [opts, types]
}

const msgErrEmpty = 'parameter cannot be empty'

export function parserUnion<T extends Types[]> (value: literal, ...type: T): CheckUnionTypes<T>
export function parserUnion<T extends Types[]> (value: literal, options: IOptions, ...type: T): CheckUnionTypes<T>
export function parserUnion (value: literal, options: IOptions | Types, ...items: Types[]): Common | object {
  let [opts, types] = sepOptsOfTypes(options, items)
  types = normalize(types, [Literal])
  for (const t of types) { try { return parserType(value, t, opts) } catch {} }
  opts.literal = ''
  const msg = types.length === 0 ? `'types' ${msgErrEmpty}` : ''
  throw ErrorParser(msg, value, opts, types)
}

export function parser<T extends Types> (value: literal, type: T): CheckTypes<T>
export function parser<T extends Types> (value: literal, options: IOptions, type: T): CheckTypes<T>
export function parser<T extends Types[]> (value: literal, ...type: T): CheckUnionTypes<T>
export function parser<T extends Types[]> (value: literal, options: IOptions, ...type: T): CheckUnionTypes<T>
export function parser (value: literal, options: IOptions | Types, ...items: Types[]): Common | object {
  const [opts, types] = sepOptsOfTypes(options, items)
  const msg = types.length === 0 ? `'types | types' ${msgErrEmpty}` : ''
  if (types.length > 1) return parserUnion(value, opts, ...types)
  else if (types.length === 1) return parserType(value, types[0], opts)
  throw ErrorParser(msg, value, opts, types)
}

export function get (variable: string): string | undefined
export function get<T extends Types> (variable: string, type: T): CheckTypes<T>
export function get<T extends Types> (variable: string, options: IOptions & { exists?: boolean }, type: T): CheckTypes<T>
export function get<T extends Types[]> (variable: string, ...type: T): CheckUnionTypes<T>
export function get<T extends Types[]> (variable: string, options: IOptions & { exists?: boolean }, ...type: T): CheckUnionTypes<T>
export function get (variable: string, options?: IOptions & { exists?: boolean } | Types, ...items: Types[]): Common | object {
  const value = process.env[variable]
  const [opts, types] = sepOptsOfTypes(options, items) as [IOptions & { exists?: boolean }, Types[]]
  if (value === undefined) {
    if (!(opts.exists ?? true) && types.includes(undefined)) return undefined
    throw new EnvNotExists('', variable)
  }
  if (types.length === 1 && types[0] === undefined) {
    if (value === 'undefined') return undefined
    else return value
  }
  opts.variable = variable
  return parser(value, opts, ...types)
}

// new types

export const Default = <T>(value: T, options?: IOptions): Type<() => T> => new Type(() => value, options)

interface ITypeGeneric {
  <T extends Types[]>(...type: T): Type<Custom<CheckUnionTypes<T>>>
  <T extends Types[]>(options: IOptions, ...type: T): Type<Custom<CheckUnionTypes<T>>>
}

export const NoEmpty: ITypeGeneric = <T extends Types[]>(options: IOptions | Types, ...type: T) => {
  const [opts, types] = sepOptsOfTypes(options, type)
  opts.literal = typesToLiteral(types, opts)
  return new Type((value, err, tOpts): T => {
    opts.variable = tOpts?.variable
    if (value.toString(opts.length) === '') throw err('variable cannot be empty', '', opts)
    return parser(value, opts, ...types) as T
  }, opts)
}

interface ITypeArray {
  <T extends Types[]>(...type: T): Type<Custom<Array<CheckUnionTypes<T>>>>
  <T extends Types[]>(options: IOptions, ...type: T): Type<Custom<Array<CheckUnionTypes<T>>>>
}

export const array: ITypeArray = <T extends Types[]>(
  options: IOptions | Types,
  ...type: T
) => {
  let [opts, types] = sepOptsOfTypes(options, type)
  types = types.map(t => t === Literal ? String : t)
  opts.literal = `(${typesToLiteral(types, opts) ?? ''})[]`
  const noEmpty = (opts as { noEmpty?: boolean }).noEmpty ?? false
  return new Type((value, err, tOpts) => {
    opts.variable = tOpts?.variable
    const arr = parser(value, opts, Array) as Array<CheckUnionTypes<T>>
    if (noEmpty && (arr.length === 0 && types.length !== 0)) {
      throw err('array cannot be empty', value, opts)
    }
    arr.forEach(v => parser(new Literal(typeof v === 'string' ? `'${v}'` : v, opts.length), opts, ...types))
    return arr
  }, opts)
}

// type TypesOfJSON = string | boolean | number | bigint | null | StringConstructor | BooleanConstructor | NumberConstructor | BigIntConstructor | Type<unknown>
// type CheckJSON<T> = T extends Array<infer t> ? Array<CheckUnionTypes<t>> : T extends object ? { [P in keyof T]: T[P] extends TypesOfJSON ? CheckUnionTypes<T[P]> : never } : never
// interface ITypeJSON {
//   <T extends { [P in keyof T]: T[P] extends TypesOfJSON ? T[P] : never }>(type: T, options?: IOptions & { strict?: boolean }): Type<Custom<CheckJSON<T>>>
//   <T extends TypesOfJSON[]>(type: T, options?: IOptions & { strict?: boolean }): Type<Custom<CheckJSON<T>>>
// }
// const json: ITypeJSON = <T>(obj: T, options?: IOptions & { strict?: boolean }): Type<() => CheckJSON<T>> => {
//   const strict = options?.strict ?? false
//   let msg = ''
//   return new Type((value, err, opts) => {
//     const data = parser(value, JSON) as CheckJSON<T>

//     if (strict && Object.keys(obj).length !== Object.keys(data).length) msg = 'no equal count properties'
//   }, options)
// }
