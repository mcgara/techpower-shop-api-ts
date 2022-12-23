export interface EnvironmentDB {
  name: string
  type: string
  host: string
  port: number | undefined
  username: string
  password: string
  database: string
  entities?: any[]
  synchronize?: boolean
  logging?: boolean
}

export function get (key: string): string | undefined {
  return process.env[key]
}

export function exists (key: string): boolean {
  if (typeof get(key) === 'undefined') return false
  return true
}

export function isEmpty (key: string): boolean {
  if (get(key) === '') return true
  return false
}

export function getStrict (key: string): string {
  const value: string | undefined = get(key)
  if (isEmpty(key) || typeof value === 'undefined') {
    throw new Error(`No exists or no content environment var: ${key}`)
  }
  return value
}

export function checkBool (key: string): boolean | undefined {
  const value = get(key)
  return value === 'true' ? true : value === 'false' ? false : undefined
}

export function checkNumber (key: string): number | undefined {
  const value: any = get(key)
  if (isNaN(value)) return undefined
  return Number.parseInt(value)
}

export function checkArray (key: string): any[] | undefined {
  const value = get(key)
  try {
    if (typeof value !== 'undefined') {
      const obj = JSON.parse(value)
      if (Array.isArray(obj)) return obj
    }
  } catch (err) {
    return undefined
  }
}

export function connections (): EnvironmentDB[] {
  const connNames: string[] = []
  Object.keys(process.env)
    .filter(i => i.substring(0, 3) === 'DB_')
    .forEach(key => {
      const name = key.substring(3, key.lastIndexOf('_'))
      if (!connNames.includes(name)) connNames.push(name)
    })

  // Default
  const syn = checkBool('DB_SYNCHRONIZE') ?? true
  const log = checkBool('DB_LOGGING') ?? false

  const conns: EnvironmentDB[] = []
  connNames.forEach(name => {
    let key: string
    if (name !== '_') key = `DB_${name}`
    else {
      name = 'default'
      key = 'DB'
    }
    const entities: any[] = checkArray(`${key}_ENTITIES`) ?? []
    const conn: EnvironmentDB = {
      name,
      type: getStrict(`${key}_TYPE`),
      host: getStrict(`${key}_HOST`),
      port: checkNumber(`${key}_PORT`),
      username: getStrict(`${key}_USERNAME`),
      password: getStrict(`${key}_PASSWORD`),
      database: getStrict(`${key}_DATABASE`),
      entities,
      synchronize: checkBool(`${key}_SYNCHRONIZE`) ?? syn,
      logging: checkBool(`${key}_LOGGING`) ?? log
    }
    conns.push(conn)
  })
  return conns
}
