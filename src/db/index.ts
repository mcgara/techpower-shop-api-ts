import {
  ConnectionOptionsReader,
  DataSource,
  EntityMetadata,
  EntityManager,
  EntityTarget
} from 'typeorm'
import '../utils/env'

const dataSources: DataSource[] = []
let ormConfig = process.env.ORMCONFIG_FILE
ormConfig ??= process.env.NODE_ENV === 'production' ? './dist/db/ormconfig.js' : './src/db/ormconfig.ts'

new ConnectionOptionsReader({ configName: ormConfig }).all()
  .then(conns => {
    conns.forEach((conn) => {
      new DataSource(conn).initialize()
        .then((data) => dataSources.push(data))
        .catch((err) => { throw err })
    })
  })
  .catch((err) => { throw err })

export function length (): number {
  return dataSources.length
}

export function getDataSource (
  predicate: (data: DataSource, index: number) => boolean
): DataSource | undefined {
  return dataSources.find(predicate)
}

export function getEntityManager<Entity> (
  where: {
    name?: string
    tableName?: string
    tablePath?: string
    tableNameWithoutPrefix?: string
    target?: EntityTarget<Entity>
  } & Partial<EntityMetadata>
): () => EntityManager | undefined

export function getEntityManager (where: Partial<EntityMetadata>): () => EntityManager | undefined {
  const keys = (Object.keys(where) as unknown) as Array<keyof EntityMetadata>
  let data: EntityManager | undefined
  return () => {
    if (data === undefined && length() > 0) {
      data = getDataSource(data =>
        data.entityMetadatas.some(em => keys.every(k => where[k] === em[k]))
      )?.manager
    }
    return data
  }
}
