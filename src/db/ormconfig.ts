import { DataSourceOptions } from 'typeorm'
import { getDataSourceOptionsOfEnv } from './conns.env'
import { normalize } from './conns.utils'

/*
const conn1: DataSourceOptions = {
  type: 'mysql',
  database: 'test',
}
*/

const conns: DataSourceOptions[] = [
  // conn1,
  ...getDataSourceOptionsOfEnv()
]

export default conns.map(conn => normalize(conn))
