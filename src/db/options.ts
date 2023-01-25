import { DatabaseType, DataSourceOptions } from 'typeorm'
import { Type, Types, Lib } from '../utils/env'

const credential: Record<string, Types> = {
  url: String,
  host: String,
  port: Number,
  username: String,
  password: String,
  database: String
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
  ssl: [Object, String],
  socketPath: String,
  charset: String,
  timezone: String,
  connectTimeout: Number,
  acquireTimeout: Number,
  insecureAuth: Boolean,
  supportBigNumbers: Boolean,
  bigNumberStrings: Boolean,
  dateStrings: [Boolean, Lib.Array([String])], // bool | string[]
  debug: [Boolean, Lib.Array([String])], // bool | string[]
  trace: Boolean,
  multipleStatements: Boolean,
  legacySpatialSupport: Boolean,
  flags: Lib.Array([String]), // string[]
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
  oracle: { database: String },
  'aurora-postgres': postgres,
  sqlite: { database: String },
  'better-sqlite3': { database: String },
  capacitor: { database: String },
  cordova: { database: String },
  'react-native': { database: String },
  nativescript: { database: String },
  mssql: { ...credential },
  mongodb: { ...credential },
  sqljs: { database: String },
  expo: { database: String },
  spanner: { database: String },
  sap: { database: String }
}

export const dataBaseTypes = Object.keys(dataBaseOptions) as DatabaseType[]

export function isDataBaseType (value: string | DatabaseType): value is DatabaseType {
  return dataBaseTypes.includes(value as DatabaseType)
}

export const commonDataOptions: Record<keyof DataSourceOptions, Types | Types[]> = {
  name: String,
  type: dataBaseTypes,
  entities: Lib.Array([JSON, String], '(EntitySchema: JSON | Glob patterns to typeorm.[Entity | EntitySchema]: String)[]'),
  entityPrefix: String,
  synchronize: Boolean,
  database: String,
  driver: new Type(String, '[module: driver database to connect]'),
  typename: String,
  metadataTableName: String,
  logging: ['all', Boolean, Lib.Array(['query', 'schema', 'error', 'warn', 'info', 'log', 'migration'])],
  logger: ['advanced-console', 'simple-console', 'file', 'debug'], // append?: new Type(Object, 'Object typeorm.[FileLogger | AdvancedConsoleLogger | SimpleConsoleLogger]')
  extra: Object,
  subscribers: Lib.Array([String], '(Glob Patterns to typeorm.EventSubscribers: String)[]'),
  migrations: Lib.Array([String], '(Glob Patterns to typeorm.Migration: String)[]'),
  maxQueryExecutionTime: Number,
  poolSize: Number,
  namingStrategy: new Type(Object, 'Object NamingStrategy'),
  entitySkipConstructor: Boolean,
  dropSchema: Boolean,
  migrationsRun: Boolean,
  migrationsTableName: String,
  migrationsTransactionMode: ['all', 'none', 'each'],
  relationLoadStrategy: ['join', 'query'],
  cache: [Boolean, Object]
}

/* cache: {
  type: ['database', 'redis', 'ioredis', 'ioredis/cluster'],
  tableName: String,
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
