export interface EnvironmentDB {
  name: string
  type: string
  host: string
  port: number | undefined
  username: string
  password: string
  database: string
  synchronize?: boolean
  logging?: boolean
}

export function checkBool (value: string | undefined): boolean | undefined {
  return value === 'true' ? true : value === 'false' ? false : undefined
}

export function checkNumber (value: any): number | undefined {
  if (isNaN(value)) return undefined
  return Number.parseInt(value)
}

export function checkEnv (key: string): string {
  const value = process.env[key]
  if (typeof value === 'undefined') {
    throw new Error(`Not content or no exist the environment var: ${key}`)
  }
  return value
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
  const syn = checkBool(process.env.DB_SYNCHRONIZE) ?? true
  const log = checkBool(process.env.DB_LOGGING) ?? false

  const conns: EnvironmentDB[] = []
  connNames.forEach(name => {
    let key: string
    if (name === '_') {
      name = 'default'
      key = 'DB'
    } else key = `DB_${name}`
    const conn: EnvironmentDB = {
      name,
      type: checkEnv(`${key}_TYPE`),
      host: checkEnv(`${key}_HOST`),
      port: checkNumber(process.env[`${key}_PORT`]),
      username: checkEnv(`${key}_USERNAME`),
      password: checkEnv(`${key}_PASSWORD`),
      database: checkEnv(`${key}_DATABASE`),
      synchronize: checkBool(process.env[`${key}_SYNCHRONIZE`]) ?? syn,
      logging: checkBool(process.env[`${key}_LOGGING`]) ?? log
    }
    conns.push(conn)
  })
  return conns
}
