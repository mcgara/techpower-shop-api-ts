import 'reflect-metadata'
import { ConnectionOptionsReader, DataSource } from 'typeorm'
import * as dotenv from 'dotenv'

dotenv.config()
const appDataSources: DataSource[] = []
const fileConns = './src/db.ts'
const conns = new ConnectionOptionsReader({ configName: fileConns }).all()
conns.then(data => {
  data.forEach(conn => {
    const appData = new DataSource(conn)
    appData.initialize().catch(err => { throw err })
    appDataSources.push(appData)
  })
  console.log(appDataSources)
}).catch(err => {
  throw err
})
