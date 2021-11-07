import { rebuild } from './rebuild'

export default async () => {
  if (!process.env.SKIP_BUILD) {
    await rebuild()
  }
}
