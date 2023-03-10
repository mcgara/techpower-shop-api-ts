import 'reflect-metadata'
import './db'
import express from 'express'
import cors from 'cors'
import { get } from './utils/env'
import routers from './utils/routers'
import { AddressInfo } from 'net'

const app = express()

// settings
app.set('PORT', get('PORT', Number, undefined) ?? 0)

// main middleware
app.use(express.json())
app.use(cors())

// routers
app.use('/', routers('routers/**/*', { cwd: __dirname }))

const server = app.listen(app.get('PORT'), () => {
  const address = server.address() as AddressInfo
  if (address?.port !== undefined) app.set('PORT', address.port)
  console.log(`Server running in port: ${(app.get('PORT') as number).toString()}`)
})
