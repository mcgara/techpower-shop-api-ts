import 'reflect-metadata'
import { ConnectionOptionsReader, DataSource } from 'typeorm'
import * as dotenv from 'dotenv'

dotenv.config()
const appDataSources: DataSource[] = []
const conns = new ConnectionOptionsReader({ configName: './src/db.ts' }).all()
conns.then(data => {
  data.forEach(conn => {
    const appData = new DataSource(conn)
    appDataSources.push(appData)
  })
  console.log(appDataSources)
}).catch(err => {
  throw err
})
