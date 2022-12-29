import { Stats } from 'fs'
import { RequestHandler } from 'express'
import { Path } from 'typescript'

// DB DataSource Env
export interface EnvironmentDB {
  name: string
  type: string
  host: string
  port: number | undefined
  username: string
  password: string
  database: string
  entities?: any[]
  synchronize?: boolean
  logging?: boolean
}

// Imports

export type MultiReg = string | RegExp | string[] | RegExp[] | Array<string | RegExp>
export interface ImportType<T> extends Record<string, T> {}
export interface ImportStats<T> {
  name: string
  extname: string
  stats: Stats
  content: ImportType<T> | Array<ImportStats<T>> | undefined
}

// Routers
export type RouterMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'all' | 'head' | 'copy' | 'use'
export type RouterHandlers = RequestHandler[]
export type Route = `/${Path | string}`
export type RouterArray = [...[...[RouterMethod, Route] | [RouterMethod | Route], ...RouterHandlers] | RouterHandlers]
export interface RouterObj {
  route?: Route
  method?: RouterMethod
  handlers: RouterHandlers
}

export type RouterExport = RouterArray | RouterObj
export interface FullRouterExport {
  path?: Route
  routers: RouterExport[]
}
