const path = require('path')
const fs = require('fs')

// Valid config file locations
const ARDENT_CONFIG_LOCATIONS = [
  '/etc/ardent.config',
  path.join(__dirname, '../../ardent.config'),
  path.join(__dirname, '../ardent.config')
]

for (const path of ARDENT_CONFIG_LOCATIONS.reverse()) {
  if (fs.existsSync(path)) require('dotenv').config({ path })
}

const ARDENT_API_HOSTNAME = process.env?.ARDENT_API_HOSTNAME ?? 'api.ardent-industry.com'
const ARDENT_API_LOCAL_PORT = process.env?.ARDENT_API_LOCAL_PORT ?? 3001
// const ARDENT_API_DEFAULT_CACHE_CONTROL = `public, max-age=${60}, s-maxage=${60 * 5}, stale-while-revalidate=${60 * 60 * 24 * 30}, stale-if-error=${60 * 60 * 24 * 30}`
const ARDENT_API_DEFAULT_CACHE_CONTROL = `public, max-age=${60}, s-maxage=${60 * 5}, stale-while-revalidate=${60 * 5}, stale-if-error=${60 * 60 * 24}`
const ARDENT_DATA_DIR = process.env?.ARDENT_DATA_DIR ?? path.join(__dirname, '../../ardent-data')
const ARDENT_CACHE_DIR = process.env?.ARDENT_CACHE_DIR ?? path.join(ARDENT_DATA_DIR, 'cache')

// Data in the Systems DB assumes these values and needs rebuilding if changes
const SYSTEM_GRID_SIZE = 100 // In light years
const SYSTEM_SECTOR_HASH_LENGTH = 8 // Enough to minimise sector ID collisions

const ARDENT_SYSTEMS_DB = path.join(ARDENT_DATA_DIR, '/systems.db')
const ARDENT_LOCATIONS_DB = path.join(ARDENT_DATA_DIR, '/locations.db')
const ARDENT_STATIONS_DB = path.join(ARDENT_DATA_DIR, '/stations.db')
const ARDENT_TRADE_DB = path.join(ARDENT_DATA_DIR, '/trade.db')

const DEFAULT_MAX_RESULTS_AGE = 90

module.exports = {
  ARDENT_API_HOSTNAME,
  ARDENT_API_LOCAL_PORT,
  ARDENT_API_DEFAULT_CACHE_CONTROL,
  ARDENT_DATA_DIR,
  ARDENT_CACHE_DIR,
  SYSTEM_GRID_SIZE,
  SYSTEM_SECTOR_HASH_LENGTH,
  ARDENT_SYSTEMS_DB,
  ARDENT_LOCATIONS_DB,
  ARDENT_STATIONS_DB,
  ARDENT_TRADE_DB,
  DEFAULT_MAX_RESULTS_AGE
}
