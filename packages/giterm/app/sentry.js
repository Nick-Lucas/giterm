import * as Sentry from '@sentry/electron'

Sentry.init({
  dsn:
    'https://f29419b8f8224777921536665dca82e7@o137374.ingest.sentry.io/5412064',
  enabled: process.env.NODE_ENV !== 'development' || !!process.env.FORCE_SENTRY,
})
