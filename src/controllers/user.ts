import { Request, Response, NextFunction } from 'express'
import { User } from '../models/user'
import { getEntityManager } from '../db'

const getManager = getEntityManager({ target: User })
// TODO: Refactor code all controllers
// TODO: improve performance with DataMapper

export function all (req: Request, res: Response): void {
  const manager = getManager()
  if (manager === undefined) { res.sendStatus(500); return }
  manager.find(User).then(data => {
    res.json(data)
  }).catch(err => { throw err })
}

export function get (req: Request, res: Response): void {
  const manager = getManager()
  if (manager === undefined) { res.sendStatus(500); return }
  manager.findOneBy(User, req.params).then(data => {
    if (typeof data === 'undefined' || data === null) {
      res.status(404).json({ error: 'not found' })
    } else {
      res.json(data)
    }
  }).catch(err => { throw err })
}

export function middlewareCreateUser (req: Request, res: Response, next: NextFunction): void {
  const date = Date.now()
  console.log(`User has bee created with date: ${date}`)
  next()
}

export function post (req: Request, res: Response): void {
  const manager = getManager()
  if (manager === undefined) { res.sendStatus(500); return }
  const user = manager.create<User>(User, req.body)
  manager.save(user).then(data => res.json(data)).catch(err => {
    res.status(500).json({ error: 'server error' })
    throw err
  })
}

export function put (req: Request, res: Response): void {
  const manager = getManager()
  if (manager === undefined) { res.sendStatus(500); return }
  manager.findOneBy(User, req.params).then(data => {
    if (data !== null) {
      Object.defineProperties<User>(data, Object.getOwnPropertyDescriptors<User>(req.body))
      manager.save<User>(data).then(u => res.json(u)).catch(err => {
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
  const manager = getManager()
  if (manager === undefined) { res.sendStatus(500); return }
  manager.findOneBy(User, req.params).then(data => {
    manager.remove(data).then(() => res.sendStatus(204)).catch(err => {
      res.status(500).json({ error: 'server error' })
      throw err
    })
  }).catch(err => {
    res.status(500).json({ error: 'server error' })
    throw err
  })
}
