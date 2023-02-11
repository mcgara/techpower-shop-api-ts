import { RouterExport } from '../utils/routers'
import * as Provider from '../controllers/provider'

export const provider: RouterExport[] = [
  ['get', Provider.all],
  ['get', '/:name', Provider.get],
  ['post', Provider.middlewareCreateProvider, Provider.post],
  ['put', '/:name', Provider.put],
  ['patch', '/:name', Provider.patch],
  ['delete', '/:name', Provider.del],
  ['/*', Provider.notFound]
]
