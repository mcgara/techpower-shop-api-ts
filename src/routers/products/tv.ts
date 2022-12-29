import { RouterExport } from '../../utils/types'
import * as Product from '../../controllers/product'

export const tv: RouterExport[] = [
  ['get', Product.all],
  ['get', '/:name', Product.get],
  ['post', Product.middlewareCreateProduct, Product.post],
  ['put', '/:name', Product.put],
  ['patch', '/:name', Product.patch],
  ['delete', '/:name', Product.del],
  ['/*', Product.notFound]
]
