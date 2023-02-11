import { Request, Response, NextFunction } from 'express'
import { getRepository } from '../db'
import { Provider } from '../models/provider'

const repository = getRepository(Provider)

export function all (req: Request, res: Response): void {
  const provider = repository()
  if (provider === undefined) { res.sendStatus(500); return }
  provider.find().then(data => res.json(data)).catch(err => { throw err })
}

export function get (req: Request, res: Response): void {
  const provider = repository()
  if (provider === undefined) { res.sendStatus(500); return }
  provider.findOneBy(req.params).then(data => {
    if (typeof data === 'undefined' || data === null) {
      res.status(404).json({ error: 'not found' })
    } else {
      res.json(data)
    }
  }).catch(err => { throw err })
}

export function middlewareCreateProvider (req: Request, res: Response, next: NextFunction): void {
  const date = Date.now()
  console.log(`Provider has bee created with date: ${date}`)
  next()
}

export function post (req: Request, res: Response): void {
  const provider = repository()
  if (provider === undefined) { res.sendStatus(500); return }
  const prod = provider.create(req.body)
  provider.save(prod).then(data => res.json(data)).catch(err => {
    res.status(500).json({ error: 'server error' })
    throw err
  })
}

export function put (req: Request, res: Response): void {
  const provider = repository()
  if (provider === undefined) { res.sendStatus(500); return }
  provider.findOneBy(req.params).then(data => {
    if (data !== null) {
      Object.defineProperties<Provider>(data, Object.getOwnPropertyDescriptors<Provider>(req.body))
      provider.save<Provider>(data).then(u => res.json(u)).catch(err => {
        res.status(500).json({ error: 'server error' })
        throw err
      })
    } else res.sendStatus(404)
  }).catch(err => {
    res.status(500).json({ error: 'server error' })
    throw err
  })
}

export function patch (req: Request, res: Response): void {
  put(req, res)
}

export function del (req: Request, res: Response): void {
  const provider = repository()
  if (provider === undefined) { res.sendStatus(500); return }
  provider.findOneBy(req.params).then(data => {
    if (data !== null) {
      provider.remove(data).then(() => res.sendStatus(200)).catch(err => {
        res.status(500).json({ error: 'server error' })
        throw err
      })
    }
  }).catch(err => {
    res.status(500).json({ error: 'server error' })
    throw err
  })
}

export function notFound (req: Request, res: Response, next: NextFunction): void {
  res.status(404).json({ error: 'Provider Not Found' })
  next()
}
