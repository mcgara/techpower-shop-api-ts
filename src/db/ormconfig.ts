// import { DataSourceOptions } from 'typeorm'
import { connections } from './env.conns'

/*
const conn1: DataSourceOptions = {
  type: 'mysql',
  database: 'test',
}
*/

export default [
  // conn1,
  ...connections()
]
