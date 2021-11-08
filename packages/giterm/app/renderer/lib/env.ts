if (process.env.NODE_ENV == undefined) {
  process.env.NODE_ENV = 'production'
}

type Env = 'production' | 'development' | 'test'

export const NODE_ENV: Env = process.env.NODE_ENV as Env
