import { Router, RequestHandler } from 'express'
import { IOptions } from 'glob'
import { ImportType, ImportDirStats, imports } from './imports'
import { get } from './env'

export type RouterMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'all' | 'head' | 'copy' | 'use'
export type RouterHandlers = RequestHandler[]
export type Route = `/${string}`
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
export type ImportRouter = RouterExport | RouterExport[] | FullRouterExport

export function isRoute (route: Route | RouterMethod | RequestHandler): route is Route {
  return (route as Route).charAt(0) === '/'
}

export function isFullRouterExport (router: ImportRouter): router is FullRouterExport {
  return typeof (router as FullRouterExport).routers !== 'undefined'
}

export function isRouterExport (router: RouterExport | RouterExport[]): router is RouterExport {
  if (Array.isArray(router)) {
    return (typeof (router as RouterArray)[0] === 'string' && !(Array.isArray((router as RouterArray)[0])))
  } else {
    return typeof router.handlers !== 'undefined'
  }
}

export function getRouterOfExport (items: RouterExport[]): Router {
  const router = Router()
  items.forEach(item => {
    if (typeof item === 'object') {
      let route: Route = '/'
      let method: RouterMethod = 'use'
      let handlers: RouterHandlers = []
      if (!Array.isArray(item)) {
        if (typeof item.method !== 'undefined') method = item.method
        if (typeof item.route !== 'undefined') route = item.route
        handlers = item.handlers
      } else {
        const [m, r, ...h] = item
        h.forEach(fn => { if (fn instanceof Function) handlers.push(fn) })
        if (typeof r === 'string' && isRoute(r)) route = r
        else handlers.unshift(r)
        if (typeof m === 'string' && !isRoute(m)) method = m
        else if (m instanceof Function) handlers.unshift(m)
      }
      router[method](route, ...handlers)
    }
  })
  return router
}

export function getRoutersOfImport (routers: ImportRouter[]): Router {
  const router = Router()
  routers.forEach(item => {
    let path: Route = '/'
    let data: RouterExport[]
    if (isFullRouterExport(item)) {
      if (typeof item.path !== 'undefined') path = item.path
      data = item.routers
    } else if (isRouterExport(item)) {
      data = [item]
    } else {
      data = item
    }
    router.use(path, getRouterOfExport(data))
  })
  return router
}

const routeDir = get<boolean | undefined>('ROUTER_NAME_DIRECTORIES', Boolean) ?? false
const routeFile = get<boolean | undefined>('ROUTER_NAME_FILES', Boolean) ?? false

export function getRoutersOfStats (content: ImportDirStats<ImportRouter>): Router {
  const router = Router()
  content.forEach(items => {
    let path: Route = '/'
    const isFile = items.stats.isFile()
    const pass = isFile || items.stats.isDirectory()
    if (pass) {
      if (routeFile || routeDir) path += items.name
      let routers: Router
      if (isFile) routers = getRoutersOfImport(Object.values(items.content as ImportType<ImportRouter>))
      else routers = getRoutersOfStats(items.content as ImportDirStats<ImportRouter>)
      router.use(path, routers)
    }
  })
  return router
}

export default function routers (
  patterns: string | string[],
  options?: IOptions & { tree?: boolean }
): Router {
  options ??= {}
  options.tree ??= true
  return getRoutersOfStats(imports<ImportRouter>(patterns, options))
}
