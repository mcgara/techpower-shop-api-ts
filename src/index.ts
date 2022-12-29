import 'reflect-metadata'
import { ConnectionOptionsReader, DataSource } from 'typeorm'
import express from 'express'
import cors from 'cors'
import { checkNumber } from './utils/env'
import Routers from './utils/routers'

const fileConns = './src/db.ts'
// const appDataSources: DataSource[] = []
const conns = new ConnectionOptionsReader({ configName: fileConns }).all()
conns.then(data => {
  data.forEach(conn => {
    const appData = new DataSource(conn)
    appData.initialize().catch(err => { throw err })
    // appDataSources.push(appData)
  })
  // console.log(appDataSources)
}).catch(err => {
  throw err
})

const app = express()
app.use(express.json())
app.use(cors())

app.use('/', Routers('./src/routers'))

const port = checkNumber('PORT') ?? 0
app.listen(port, () => {
  console.log(`Server running 🚀 in port: ${port}`)
})
