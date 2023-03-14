import {
  ConnectionOptionsReader,
  DataSource,
  EntityMetadata,
  EntityManager,
  EntityTarget,
  ObjectLiteral,
  Repository,
  TreeRepository,
  MongoRepository
} from 'typeorm'
import '../utils/env'
import { sync } from 'glob'
import { rootPath } from '../utils/tools'

const dataSources: DataSource[] = []
let ormConfig = process.env.ORMCONFIG_FILE
ormConfig ??= sync('ormconfig*', { cwd: __dirname, nodir: true, absolute: true })[0]

new ConnectionOptionsReader({ root: rootPath, configName: ormConfig }).all()
  .then(conns => {
    conns.forEach((conn) => {
      new DataSource(conn).initialize()
        .then((data) => dataSources.push(data))
        .catch((err) => console.error(err))
    })
  })
  .catch((err) => console.error(err))

export function length (): number {
  return dataSources.length
}

export function getDataSource (
  predicate: (data: DataSource, index: number) => boolean
): DataSource | undefined {
  return dataSources.find(predicate)
}

export function getEntityManager<Entity> (
  where: Partial<EntityMetadata> & {
    name?: string
    tableName?: string
    tablePath?: string
    tableNameWithoutPrefix?: string
    target?: EntityTarget<Entity>
  }
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

export function getRepository<Entity extends ObjectLiteral> (
  target: EntityTarget<Entity> | string | Function,
  where?: Partial<EntityMetadata>
): () => Repository<Entity> | undefined

export function getRepository<Entity extends ObjectLiteral> (
  target: EntityTarget<Entity> | string | Function,
  where?: Partial<EntityMetadata>,
  repo?: 'mongo' | 'tree'
): () => Repository<Entity> | TreeRepository<Entity> | MongoRepository<Entity> | undefined {
  where ??= {}
  where.target = typeof target === 'object' ? (target as { name?: string }).name : target
  const prop = repo === 'mongo' ? 'getMongoRepository' : repo === 'tree' ? 'getTreeRepository' : 'getRepository'
  const manager = getEntityManager(where)
  let data: Repository<Entity> | TreeRepository<Entity> | MongoRepository<Entity> | undefined
  return () => {
    if (data === undefined) {
      const em = manager()
      if (em !== undefined) data = em[prop](target)
    }
    return data
  }
}
