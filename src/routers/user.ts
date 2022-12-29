import { RouterExport, FullRouterExport } from '../utils/types'
import * as User from '../controllers/user'

export const UserGet: RouterExport[] = [
  ['get', '/', User.all],
  ['get', '/:username', User.get]
]

export const UserArray: RouterExport = ['get', '/array/all', User.all]
export const UserObj: RouterExport = {
  route: '/obj/all',
  method: 'get',
  handlers: [User.all]
}

export const UserCreateDelete: RouterExport[] = [
  {
    route: '/',
    method: 'post',
    handlers: [User.middlewareCreateUser, User.post]
  },
  {
    route: '/:username',
    method: 'delete',
    handlers: [User.del]
  }
]

/*
  if the prop 'path' is not specified, '/' is used by default or
  if the environment variable ROUTER_NAME_FILES is set to true, the file name is used as path.
*/

export const UserUpdate: FullRouterExport = {
  path: '/userPath',
  routers: [
    ['put', '/:username', User.put],
    {
      route: '/:username',
      method: 'patch',
      handlers: [User.patch]
    }
  ]
}
