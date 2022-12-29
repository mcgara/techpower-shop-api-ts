import { Request, Response, NextFunction } from 'express'
import { Product } from '../models/product'

export function all (req: Request, res: Response): void {
  Product.find().then(data => {
    res.json(data)
  }).catch(err => { throw err })
}

export function get (req: Request, res: Response): void {
  Product.findOneBy(req.params).then(data => {
    if (typeof data === 'undefined' || data === null) {
      res.status(404).json({ error: 'not found' })
    } else {
      res.json(data)
    }
  }).catch(err => { throw err })
}

export function middlewareCreateProduct (req: Request, res: Response, next: NextFunction): void {
  const date = Date.now()
  console.log(`Product has bee created with date: ${date}`)
  next()
}

export function post (req: Request, res: Response): void {
  const user = Product.create(req.body)
  Product.save(user).then(data => res.json(data)).catch(err => {
    res.status(500).json({ error: 'server error' })
    throw err
  })
}

export function put (req: Request, res: Response): void {
  Product.findOneBy(req.params).then(data => {
    const user = { id: data?.id, ...req.body }
    Product.save(user).then(data => res.json(data)).catch(err => {
      res.status(500).json({ error: 'server error' })
      throw err
    })
  }).catch(err => {
    res.status(500).json({ error: 'server error' })
    throw err
  })
}

export function patch (req: Request, res: Response): void {
  put(req, res)
}

export function del (req: Request, res: Response): void {
  Product.findOneBy(req.params).then(data => {
    data?.remove().then(() => res.sendStatus(200)).catch(err => {
      res.status(500).json({ error: 'server error' })
      throw err
    })
  }).catch(err => {
    res.status(500).json({ error: 'server error' })
    throw err
  })
}

export function notFound (req: Request, res: Response, next: NextFunction): void {
  res.status(404).json({ error: 'Product Not Found' })
  next()
}
