import { Router, RequestHandler } from 'express'
import { Path } from 'typescript'
import { PathLike } from 'fs'
import { checkBool } from './env'
import { imports } from './imports'
import {
  ImportStats,
  ImportType,
  MultiReg,
  FullRouterExport,
  RouterExport,
  Route,
  RouterHandlers,
  RouterMethod,
  RouterArray
} from './types'

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

export function getRouterExport (items: RouterExport[]): Router {
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

export function getRouters (routers: ImportRouter[]): Router {
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
    router.use(path, getRouterExport(data))
  })
  return router
}

const routeDir: boolean = checkBool('ROUTER_NAME_DIRECTORIES') ?? false
const routeFile: boolean = checkBool('ROUTER_NAME_FILES') ?? false

export function getStatsRouters (data: Array<ImportStats<ImportRouter>>): Router {
  const router = Router()
  data.forEach(items => {
    let path: Route = '/'
    if (items.stats.isFile()) {
      if (routeFile) path += items.name
      router.use(path, getRouters(Object.values(items.content as ImportType<ImportRouter>)))
    } else if (items.stats.isDirectory()) {
      if (routeDir) path += items.name
      router.use(path, getStatsRouters(items.content as Array<ImportStats<ImportRouter>>))
    }
  })
  return router
}

export default function Routers (
  path: Path | PathLike,
  options?: {
    excludes?: MultiReg
    tree?: boolean
    limit?: number
  }
): Router {
  if (typeof options === 'undefined') options = {}
  if (typeof options?.limit === 'undefined') options.limit = -1
  return getStatsRouters(imports<ImportRouter>(path, options))
}
