// DB DataSource Env
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
