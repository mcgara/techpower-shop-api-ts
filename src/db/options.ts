import { DatabaseType, DataSourceOptions } from 'typeorm'
import { Types, Type, Literal, array } from '../utils/env'

const credential: Record<string, Types> = {
  url: Literal,
  host: Literal,
  port: Number,
  username: Literal,
  password: Literal,
  database: Literal
}

/* const replication: Record<string> | object = {
  master: credential,
  slaves: credential,
  canRetry: Boolean,
  removeNodeErrorCount: Number,
  restoreNodeTimeout: Number,
  selector: ['RR', 'RANDOM', 'ORDER']
} */

// MySql, MariaDB, Aurora-MySql
const mysql: Record<string, Types | Types[]> = {
  ...credential,
  ssl: [Object, Literal],
  socketPath: Literal,
  charset: Literal,
  timezone: Literal,
  connectTimeout: Number,
  acquireTimeout: Number,
  insecureAuth: Boolean,
  supportBigNumbers: Boolean,
  bigNumberStrings: Boolean,
  dateStrings: [Boolean, array(String)], // bool | string[]
  debug: [Boolean, array(String)], // bool | string[]
  trace: Boolean,
  multipleStatements: Boolean,
  legacySpatialSupport: Boolean,
  flags: array(String), // string[]
  connectorPackage: ['mysql', 'mysql2'],
  replication: Object
}

// Postgres, CockRoachDB, Aurora-Postgres?
const postgres: Record<string, Types | Types[]> = {
  ...credential
}

export const dataBaseOptions: Record<DatabaseType, Record<string, Types | Types[]>> = {
  mysql,
  mariadb: mysql,
  'aurora-mysql': mysql,
  postgres,
  cockroachdb: postgres,
  oracle: { database: Literal },
  'aurora-postgres': postgres,
  sqlite: { database: Literal },
  'better-sqlite3': { database: Literal },
  capacitor: { database: Literal },
  cordova: { database: Literal },
  'react-native': { database: Literal },
  nativescript: { database: Literal },
  mssql: { ...credential },
  mongodb: { ...credential },
  sqljs: { database: Literal },
  expo: { database: Literal },
  spanner: { database: Literal },
  sap: { database: Literal }
}

export const dataBaseTypes = Object.keys(dataBaseOptions) as DatabaseType[]

export function isDataBaseType (value: string | DatabaseType): value is DatabaseType {
  return dataBaseTypes.includes(value as DatabaseType)
}

export const commonDataOptions: Record<keyof DataSourceOptions, Types | Types[]> = {
  name: Literal,
  type: dataBaseTypes,
  entities: array({ literal: '(EntitySchema: JSON | patterns to typeorm.[Entity | EntitySchema]: String)[]' }, JSON, String),
  entityPrefix: Literal,
  synchronize: Boolean,
  database: Literal,
  driver: new Type(Literal, { literal: '[module: driver database to connect]' }),
  typename: Literal,
  metadataTableName: Literal,
  logging: ['all', Boolean, array('query', 'schema', 'error', 'warn', 'info', 'log', 'migration')],
  logger: ['advanced-console', 'simple-console', 'file', 'debug'], // append?: new Type(Object, 'Object typeorm.[FileLogger | AdvancedConsoleLogger | SimpleConsoleLogger]')
  extra: Object,
  subscribers: array({ literal: '(Patterns to typeorm.EventSubscribers: String)[]' }, String),
  migrations: array({ literal: '(Patterns to typeorm.Migration: String)[]' }, String),
  maxQueryExecutionTime: Number,
  poolSize: Number,
  namingStrategy: new Type(Object, { literal: 'Object NamingStrategy' }),
  entitySkipConstructor: Boolean,
  dropSchema: Boolean,
  migrationsRun: Boolean,
  migrationsTableName: Literal,
  migrationsTransactionMode: ['all', 'none', 'each'],
  relationLoadStrategy: ['join', 'query'],
  cache: [Boolean, Object]
}

/* cache: {
  type: ['database', 'redis', 'ioredis', 'ioredis/cluster'],
  tableName: Literal,
  options: Object, // any?
  alwaysEnabled: Boolean,
  duration: Number,
  ignoreErrors: Boolean,
  provider: Function // Warning: Constructor Function use eval()...  type: (connection: DataSource) => QueryResultCache
} */

export type KeysDataSourceOptions = keyof DataSourceOptions

export const keysDataSourceOptions = new Set((Object.keys(commonDataOptions) as unknown[]) as KeysDataSourceOptions[])
Object.values(dataBaseOptions).forEach(item => {
  const keys = (Object.keys(item) as unknown[]) as KeysDataSourceOptions[]
  keys.forEach(key => {
    if (!keysDataSourceOptions.has(key)) keysDataSourceOptions.add(key)
  })
})

export function isKeyDataSourceOptions (value: string | KeysDataSourceOptions): value is KeysDataSourceOptions {
  return keysDataSourceOptions.has(value as KeysDataSourceOptions)
}
