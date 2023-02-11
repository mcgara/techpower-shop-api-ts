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
  constructor (message?: string, variable?: string, value?: string, type?: string) {
    const msg = 'cannot be parsed'
    if (type !== undefined && type !== '') {
      if (message === undefined || message === '') message = `${msg} type: '${type}'`
      else message = `${message} type: '${type}'`
    }
    super(message, variable, value, msg)
    this.type = type?.replace(/(\r|\n|\r\n)/gm, ' ').replace(/\s+/g, ' ') ?? ''
  }
}

export type Common = string | boolean | number | bigint | symbol | undefined | null
export type CommonConstructors = StringConstructor | BooleanConstructor | NumberConstructor | BigIntConstructor | SymbolConstructor
export type ObjectConstructors = ObjectConstructor | ArrayConstructor | JSON
export type Commons = Common | CommonConstructors | ObjectConstructors
export type CheckCommon<T> = T extends Common ? T : T extends CommonConstructors ? ReturnType<T> : T extends ObjectConstructors ? object : never

const common = ['string', 'boolean', 'number', 'bigint', 'symbol', 'undefined']
const commonConstructors = [String, Boolean, Number, BigInt, Symbol, null]
const objectConstructors = [Object, Array, JSON]

export function isCommon (value: unknown): value is Common {
  return common.includes(typeof value) || value === null
}
export function isCommonConstructors (value: unknown): value is CommonConstructors {
  return commonConstructors.includes(value as CommonConstructors)
}
export function isObjectConstructors (value: unknown): value is ObjectConstructors {
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
  variable?: string
  length?: number
}

type ErrParser = typeof ErrorParser
export interface IErrParser extends ErrParser {}
export type Custom<T> = ((value: string, err: IErrParser, options?: IOptions) => T)

export class Type<T> {
  readonly type: Commons
  readonly create: Custom<T>
  readonly literal: string

  constructor (type: T extends Commons ? T : never, literal?: string)
  constructor (create: (value: string, err: IErrParser, options?: IOptions) => T, literal?: string)
  constructor (type: Commons | Custom<T>, literal?: string) {
    if (isCommons(type)) this.type = type
    else if (typeof type === 'function') this.create = type
    else throw new EnvError('type not supported')
    this.literal = literal ?? allToString(type, 10)
  }

  toString (): string {
    return this.literal
  }

  static string: Type<StringConstructor>
  static boolean: Type<BooleanConstructor>
  static number: Type<NumberConstructor>
  static bigint: Type<BigIntConstructor>
  static symbol: Type<SymbolConstructor>
  static undefined: Type<undefined>
  static null: Type<null>

  static json: Type<JSON>
  static object: Type<ObjectConstructor>
  static array: {
    <T extends Types[]>(...types: T): Type<T extends Array<infer t> ? Array<CheckTypes<t>> : never>
    <T extends Types[]>(options: IOptions & { noEmpty?: boolean }, ...types: T): Type<T extends Array<infer t> ? Array<CheckTypes<t>> : never>
  }

  static noEmpty: Type<string>
  static default: <T>(item: T, literal?: string) => Type<T>
}

export type Types = Commons | Type<unknown>
export type CheckType<T> = T extends Type<infer t> ? (t extends Array<infer st> ? (Array<st extends Array<infer sst> ? Array<CheckCommon<sst>> : CheckCommon<st>>) : CheckCommon<t>) : never
export type CheckTypes<T> = T extends Commons ? CheckCommon<T> : CheckType<T>

export function isType<T> (value: unknown): value is Type<T> {
  return value instanceof Type
}

export function isIOptions (value: unknown): value is IOptions {
  return (typeof value === 'object' && (!isCommons(value) && !isType(value))
  )
}

export function ErrorParser (msg?: string, value?: string, options?: IOptions): EnvNotParsed
export function ErrorParser (msg?: string, value?: string, options?: IOptions, types?: Types | Types[]): EnvNotParsed
export function ErrorParser (msg?: string, value?: string, options?: IOptions, types?: Types | Types[]): EnvNotParsed {
  options ??= {}
  let literal = options?.literal
  const toLiteral = (Array.isArray(types) && types.length > 0) || types !== undefined
  if (toLiteral && [undefined, ''].includes(literal)) {
    const typeToString = (t: Types): string => typeof t === 'string' ? `"${t}"` : allToString(t, options?.length ?? 300)
    literal = Array.isArray(types)
      ? types.map(t => typeToString(t)).join(' | ')
      : typeToString(types as Types)
  }
  const variable = options?.variable
  return new EnvNotParsed(msg, variable, value, literal)
}

const checkCommon = {
  String,
  Boolean: (value: string): boolean | null => {
    return value === 'true' ? true : value === 'false' ? false : null
  },
  Number: (value: string): number | null => {
    const num = Number.parseInt(value)
    if (isNaN(num)) return null
    return num
  },
  BigInt: (value: string): bigint | null => {
    try { return BigInt(value) } catch { return null }
  },
  Symbol: (value: string): symbol | null => {
    const m = value.match(/^Symbol\((.+)\)$/)
    return m !== null ? m[1] !== undefined ? Symbol(m[1]) : null : null
  }
}

export function parserType<T extends Types> (value: string, type: T, options?: IOptions): CheckTypes<T> {
  options ??= {}
  if (isType(type)) {
    options.literal = type?.literal
    if (typeof type.create === 'function' && type.type === undefined) {
      try {
        return type.create(value, ErrorParser, options) as CheckTypes<T>
      } catch (err) {
        if (err instanceof EnvError) throw err
      }
    } else type = type.type as T
  }
  if (isCommon(type)) {
    if (value === allToString(type, options.length ?? 300)) return type as CheckTypes<T>
  } else if (isCommonConstructors(type)) {
    const fn = checkCommon[type.name as keyof typeof checkCommon]
    const data = fn(value)
    if (data !== null) return data as CheckTypes<T>
  } else if (isObjectConstructors(type)) {
    try {
      const data = JSON.parse(value) as T
      if (type !== Array || Array.isArray(data)) return data as CheckTypes<T>
    } catch {}
    // IDEA(Warning): create objects use 'eval' (no recommended) and Function (implies eval).
  }
  throw ErrorParser('', value, options, type)
}

export function normalize<T extends Types[]> (types: T, toTheLast?: Types[]): T {
  toTheLast ??= []
  const set = new Set(types)
  toTheLast.forEach(lt => set.delete(lt) ? set.add(lt) : null)
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

const msgEmpty = 'parameter cannot be empty'

export function parserUnion<T extends Types[]> (value: string, ...types: T): T extends Array<infer t> ? CheckTypes<t> : never
export function parserUnion<T extends Types[]> (value: string, options: IOptions, ...types: T): T extends Array<infer t> ? CheckTypes<t> : never
export function parserUnion (value: string, options: IOptions | Types, ...items: Types[]): Common | object {
  let [opts, types] = sepOptsOfTypes(options, items)
  types = normalize(types, [String])
  for (const t of types) { try { return parserType(value, t, opts) } catch {} }
  opts.literal = ''
  const msg = types.length === 0 ? `'types' ${msgEmpty}` : ''
  throw ErrorParser(msg, value, opts, types)
}

export function parser<T extends Types> (value: string, type: T): CheckTypes<T>
export function parser<T extends Types> (value: string, options: IOptions, type: T): CheckTypes<T>
export function parser<T extends Types[]> (value: string, ...types: T): T extends Array<infer t> ? CheckTypes<t> : never
export function parser<T extends Types[]> (value: string, options: IOptions, ...types: T): T extends Array<infer t> ? CheckTypes<t> : never
export function parser (value: string, options: IOptions | Types, ...items: Types[]): Common | object {
  const [opts, types] = sepOptsOfTypes(options, items)
  const msg = types.length === 0 ? `'types | types' ${msgEmpty}` : ''
  if (types.length > 1) return parserUnion(value, opts, ...types)
  else if (types.length === 1) return parserType(value, types[0], opts)
  throw ErrorParser(msg, value, opts, types)
}

export function get (variable: string): string | undefined
export function get<T extends Types> (variable: string, type: T): CheckTypes<T>
export function get<T extends Types> (variable: string, options: IOptions, type: T): CheckTypes<T>
export function get<T extends Types[]> (variable: string, ...types: T): T extends Array<infer t> ? CheckTypes<t> : never
export function get<T extends Types[]> (variable: string, options: IOptions, ...types: T): T extends Array<infer t> ? CheckTypes<t> : never
export function get (variable: string, options?: IOptions | Types, ...items: Types[]): Common | object {
  const value = process.env[variable]
  const [opts, types] = sepOptsOfTypes(options, items)
  if (value === undefined) {
    if (types.includes(undefined)) return undefined
    throw new EnvNotExists('', variable)
  }
  if (types.length === 1 && types[0] === undefined) {
    if (value === 'undefined') return undefined
    else return value
  }
  opts.variable = variable
  return parser(value, opts, ...types)
}

export function parserToBeType<V, T extends Types[] | Types> (
  value: V, types: T,
  options?: IOptions & { value?: string }
): V {
  let type: unknown[] = []
  if (!Array.isArray(types)) type = [types]
  else type = types

  if (type.includes(value)) return value
  options ??= {}
  options.value ??= allToString(value, options.length ?? 300)
  parser(options.value, options, ...type as Types[])
  return value
}

// All Types

export const string = new Type(String)
export const boolean = new Type(Boolean)
export const number = new Type(Number)
export const bigint = new Type(BigInt)
export const symbol = new Type(Symbol)
export const Undefined = new Type(undefined)
export const Null = new Type(null)
export const json = new Type(JSON)
export const object = new Type(Object)
export const Default: typeof Type['default'] = (value, literal) => new Type(() => value, literal)
export const noEmpty = new Type((value, err, opts) => {
  if (value !== '') return value
  throw err('variable cannot be empty', '', opts)
})

export const array: typeof Type['array'] = <T extends Types[]>(
  options: IOptions & { noEmpty?: boolean } | Types,
  ...items: T
) => {
  const [opts, types] = sepOptsOfTypes(options, items)
  opts.literal ??= JSON.stringify(types).replaceAll(',', ' | ')
  const noEmpty = (opts as { noEmpty?: boolean }).noEmpty ?? false
  return new Type((value, err, tOpts) => {
    opts.variable = tOpts?.variable
    const arr = parser(value, opts, Array) as T extends Array<infer t> ? Array<CheckTypes<t>> : never
    if (noEmpty && (arr.length === 0 && types.length !== 0)) {
      throw err('array cannot be empty', value, opts)
    }
    arr.forEach(v => parserToBeType(v, types, opts))
    return arr
  }, opts.literal)
}

Type.string = string
Type.boolean = boolean
Type.number = number
Type.bigint = bigint
Type.symbol = symbol
Type.undefined = Undefined
Type.null = Null
Type.json = json
Type.object = object
Type.default = Default
Type.noEmpty = noEmpty
Type.array = array

// IDEA: create 'class Literal' as main scope and 'String | string' is "'`string"'` on environment.
// ❌ normalize(types, [String]) ✅ normalize(types, [Literal]) and all string literal on 'type | types' parameters
