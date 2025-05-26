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

// Note: ARDENT_DOMAIN is not used when ARDENT_API_BASE_URL is explicitly set
const ARDENT_DOMAIN = process.env?.ARDENT_DOMAIN ?? 'ardent-insight.com'

const ARDENT_API_BASE_URL = process.env?.ARDENT_API_BASE_URL ?? `http://api.${ARDENT_DOMAIN}`
const ARDENT_API_LOCAL_PORT = process.env?.ARDENT_API_LOCAL_PORT ?? 3001
const ARDENT_API_DEFAULT_CACHE_CONTROL = `public, max-age=${60}, s-maxage=${60 * 5}, stale-while-revalidate=${60 * 5}, stale-if-error=${60 * 60 * 24}`
const ARDENT_DATA_DIR = process.env?.ARDENT_DATA_DIR ?? path.join(__dirname, '../../ardent-data')
const ARDENT_CACHE_DIR = process.env?.ARDENT_CACHE_DIR ?? path.join(ARDENT_DATA_DIR, 'cache')
const ARDENT_BACKUP_DIR = process.env?.ARDENT_BACKUP_DIR ?? path.join(__dirname, '../../ardent-backup')
const ARDENT_DOWNLOADS_DIR = process.env?.ARDENT_DOWNLOADS_DIR ?? path.join(__dirname, '../../ardent-downloads')

if (!fs.existsSync(ARDENT_CACHE_DIR)) fs.mkdirSync(ARDENT_CACHE_DIR, { recursive: true })

// Data in the Systems DB assumes these values and needs rebuilding if changes
const SYSTEM_GRID_SIZE = 100 // In light years
const SYSTEM_SECTOR_HASH_LENGTH = 8 // Enough to minimise sector ID collisions

const ARDENT_SYSTEMS_DB = path.join(ARDENT_DATA_DIR, '/systems.db')
const ARDENT_LOCATIONS_DB = path.join(ARDENT_DATA_DIR, '/locations.db')
const ARDENT_STATIONS_DB = path.join(ARDENT_DATA_DIR, '/stations.db')
const ARDENT_TRADE_DB = path.join(ARDENT_DATA_DIR, '/trade.db')

const DEFAULT_MAX_RESULTS_AGE = 90

const ARDENT_MARKET_TICKER_CACHE = `${ARDENT_CACHE_DIR}/commodity-ticker.json`
const ARDENT_GALNET_NEWS_CACHE = `${ARDENT_CACHE_DIR}/galnet-news.json`

const DEFAULT_NEARBY_SYSTEMS_DISTANCE = 100
const MAX_NEARBY_SYSTEMS_DISTANCE = 500 // Distance in Ly
const MAX_NEARBY_SYSTEMS_RESULTS = 1000
const MAX_NEARBY_CONTACTS_RESULTS = 20
const MAX_NEARBY_COMMODITY_RESULTS = 1000

const COMMODITY_EXPORT_SORT_OPTIONS = {
  price: 'c.buyPrice ASC',
  distance: 'distance ASC'
}
const COMMODITY_IMPORT_SORT_OPTIONS = {
  price: 'c.sellPrice DESC',
  distance: 'distance ASC'
}

module.exports = {
  ARDENT_API_BASE_URL,
  ARDENT_API_LOCAL_PORT,
  ARDENT_API_DEFAULT_CACHE_CONTROL,
  ARDENT_DATA_DIR,
  ARDENT_CACHE_DIR,
  ARDENT_BACKUP_DIR,
  ARDENT_DOWNLOADS_DIR,
  SYSTEM_GRID_SIZE,
  SYSTEM_SECTOR_HASH_LENGTH,
  ARDENT_SYSTEMS_DB,
  ARDENT_LOCATIONS_DB,
  ARDENT_STATIONS_DB,
  ARDENT_TRADE_DB,
  DEFAULT_MAX_RESULTS_AGE,
  ARDENT_MARKET_TICKER_CACHE,
  ARDENT_GALNET_NEWS_CACHE,
  DEFAULT_NEARBY_SYSTEMS_DISTANCE,
  MAX_NEARBY_SYSTEMS_DISTANCE,
  MAX_NEARBY_SYSTEMS_RESULTS,
  MAX_NEARBY_CONTACTS_RESULTS,
  MAX_NEARBY_COMMODITY_RESULTS,
  COMMODITY_EXPORT_SORT_OPTIONS,
  COMMODITY_IMPORT_SORT_OPTIONS
}
