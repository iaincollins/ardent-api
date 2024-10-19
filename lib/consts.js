const path = require('path')
const fs = require('fs')
const { randomBytes } = require('crypto')

// Valid config file locations
const ARDENT_CONFIG_LOCATIONS = [
  '/etc/ardent.config',
  path.join(__dirname, '../../ardent.config'),
  path.join(__dirname, '../ardent.config')
]

for (const path of ARDENT_CONFIG_LOCATIONS.reverse()) {
  if (fs.existsSync(path)) require('dotenv').config({ path })
}

const ARDENT_WEBSITE_HOSTNAME = process.env?.ARDENT_WEBSITE_HOSTNAME ?? 'www.ardent-industry.com'
const ARDENT_API_HOSTNAME = process.env?.ARDENT_API_HOSTNAME ?? 'api.ardent-industry.com'
const ARDENT_API_LOCAL_PORT = process.env?.ARDENT_API_LOCAL_PORT ?? 3001
// const ARDENT_API_DEFAULT_CACHE_CONTROL = `public, max-age=${60}, s-maxage=${60 * 5}, stale-while-revalidate=${60 * 60 * 24 * 30}, stale-if-error=${60 * 60 * 24 * 30}`
const ARDENT_API_DEFAULT_CACHE_CONTROL = `public, max-age=${60}, s-maxage=${60 * 5}, stale-while-revalidate=${60 * 5}, stale-if-error=${60 * 60 * 24}`
const ARDENT_DATA_DIR = process.env?.ARDENT_DATA_DIR ?? path.join(__dirname, '../../ardent-data')
const ARDENT_CACHE_DIR = process.env?.ARDENT_CACHE_DIR ?? path.join(ARDENT_DATA_DIR, 'cache')
const ARDENT_BACKUP_DIR = process.env?.ARDENT_BACKUP_DIR ?? path.join(__dirname, '../../ardent-backup')

// Data in the Systems DB assumes these values and needs rebuilding if changes
const SYSTEM_GRID_SIZE = 100 // In light years
const SYSTEM_SECTOR_HASH_LENGTH = 8 // Enough to minimise sector ID collisions

const ARDENT_SYSTEMS_DB = path.join(ARDENT_DATA_DIR, '/systems.db')
const ARDENT_LOCATIONS_DB = path.join(ARDENT_DATA_DIR, '/locations.db')
const ARDENT_STATIONS_DB = path.join(ARDENT_DATA_DIR, '/stations.db')
const ARDENT_TRADE_DB = path.join(ARDENT_DATA_DIR, '/trade.db')

const DEFAULT_MAX_RESULTS_AGE = 90

if (!process.env?.ARDENT_SESSION_SECRET) {
  console.warn('WARNING: ARDENT_SESSION_SECRET was not set, generating temporary secret (will change when server restarts)')
  process.env.ARDENT_SESSION_SECRET = randomBytes(64).toString('hex')
}
const SESSION_SECRET = process.env.ARDENT_SESSION_SECRET

if (!process.env?.ARDENT_AUTH_JWT_SECRET) {
  console.warn('WARNING: AUTH_JWT_SECRET was not set, generating temporary secret (will change when server restarts)')
  process.env.ARDENT_AUTH_JWT_SECRET = randomBytes(64).toString('hex')
}

const AUTH_JWT_SECRET = process.env.ARDENT_AUTH_JWT_SECRET
const AUTH_CLIENT_ID = process.env?.ARDENT_AUTH_CLIENT_ID ?? 'ff8a7f4a-ae23-401d-97b7-048a23c0fdb6'
const AUTH_COOKIE_DOMAIN = process.env?.ARDENT_AUTH_COOKIE_DOMAIN ?? '.ardent-industry.com'
const AUTH_CALLBACK_URL = `https://${ARDENT_API_HOSTNAME}/auth/callback`
const AUTH_SIGNED_IN_URL = `https://${ARDENT_WEBSITE_HOSTNAME}/auth/signed-in`
const AUTH_SIGNED_OUT_URL = `https://${ARDENT_WEBSITE_HOSTNAME}/auth/signed-out`
const AUTH_ERROR_URL = `https://${ARDENT_WEBSITE_HOSTNAME}/auth/error`

module.exports = {
  ARDENT_API_HOSTNAME,
  ARDENT_API_LOCAL_PORT,
  ARDENT_API_DEFAULT_CACHE_CONTROL,
  ARDENT_DATA_DIR,
  ARDENT_CACHE_DIR,
  ARDENT_BACKUP_DIR,
  SYSTEM_GRID_SIZE,
  SYSTEM_SECTOR_HASH_LENGTH,
  ARDENT_SYSTEMS_DB,
  ARDENT_LOCATIONS_DB,
  ARDENT_STATIONS_DB,
  ARDENT_TRADE_DB,
  DEFAULT_MAX_RESULTS_AGE,
  SESSION_SECRET,
  AUTH_JWT_SECRET,
  AUTH_CLIENT_ID,
  AUTH_CALLBACK_URL,
  AUTH_COOKIE_DOMAIN,
  AUTH_SIGNED_IN_URL,
  AUTH_SIGNED_OUT_URL,
  AUTH_ERROR_URL
}
