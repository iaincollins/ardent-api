const Package = require('./package.json')
console.log(`Ardent API v${Package.version} starting`)

// Initalise default value for env vars before other imports
console.log('Configuring environment …')
const {
  ARDENT_CACHE_DIR,
  ARDENT_API_DEFAULT_CACHE_CONTROL,
  ARDENT_API_LOCAL_PORT
} = require('./lib/consts')

console.log('Loading dependancies …')
const process = require('process')
const path = require('path')
const fs = require('fs')
const cron = require('node-cron')
const { Z_SYNC_FLUSH } = require('zlib').constants
const Koa = require('koa')
const koaBodyParser = require('koa-bodyparser')
const koaCompress = require('koa-compress')

console.log('Loading libraries …')
const router = require('./router')
const warmCache = require('./lib/warm-cache')
const updateCommodityTicker = require('./lib/cron-tasks/commodity-ticker')
const updateGalnetNews = require('./lib/cron-tasks/galnet-news')

;(async () => {
  // Start web service
  console.log('Starting Ardent API service')
  const app = new Koa()
  app.use(koaBodyParser())
  app.proxy = true // Proxy headers should be passed through

  // Set default headers
  app.use((ctx, next) => {
    ctx.set('Ardent-API-Version', `${Package.version}`)

    // Cache headers encourage caching, but with a short period (and use of state-while-revalidate)
    ctx.set('Cache-Control', ARDENT_API_DEFAULT_CACHE_CONTROL)

    // Headers required to support requests with credentials (i.e. auth tokens)
    // while still supporting API requests from any domain
    ctx.set('Access-Control-Allow-Origin', ctx.request.header.origin)
    ctx.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    ctx.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    ctx.set('Vary', 'Origin')
    return next()
  })

  // Enable content compression
  app.use(koaCompress())

  router.get('/', (ctx) => { ctx.body = printStats() })
  router.get('/api', (ctx) => { ctx.body = printStats() })
  app.use(router.routes())

  updateCommodityTicker()
  cron.schedule('0 */5 * * * *', async () => updateCommodityTicker())

  updateGalnetNews()
  cron.schedule('0 */20 * * * *', async () => updateGalnetNews())

  app.listen(ARDENT_API_LOCAL_PORT)
  console.log(printStats())

  // Schedule task to try to keep the cache warm
  if (process?.env?.NODE_ENV === 'development') {
    console.log('Cache warming disabled')
  } else {
    console.log('Cache warming enabled')
    // Ensure this happens at startup without forcing the server to wait for it
    warmCache()
    // Schedule cache warming to re-run every couple of minutes. This results in
    // performance very similar to a pure RAM disk most of the time (because
    // the data _is_ in RAM) but withotu the complexity of having to deal with
    // actually syncing an in-memory database to disk, because the OS will
    // handle it. A physical disk parition for this data in a RAID 1 array with
    // a RAM drive would be ideal, but this is lower effort on my part.
    cron.schedule('0 */2 * * * *', () => warmCache())
  }

  console.log('Ardent API service started!')
})()

process.on('exit', () => console.log('Shutting down'))

process.on('uncaughtException', (e) => console.log('Uncaught exception:', e))

function printStats () {
  const stats = JSON.parse(fs.readFileSync(path.join(ARDENT_CACHE_DIR, 'database-stats.json')))

  try {
    return `Ardent API v${Package.version} Online\n` +
      '--------------------------\n' +
      ((stats)
        ? 'Locations:\n' +
        `* Star systems: ${stats.systems.toLocaleString()}\n` +
        `* Points of interest: ${stats.pointsOfInterest.toLocaleString()}\n` +
        'Stations:\n' +
        `* Stations: ${stats.stations.stations.toLocaleString()}\n` +
        `* Fleet Carriers: ${stats.stations.carriers.toLocaleString()}\n` +
        `* Station updates in last hour: ${stats.stations.updatedInLastHour.toLocaleString()}\n` +
        `* Station updates in last 24 hours: ${stats.stations.updatedInLast24Hours.toLocaleString()}\n` +
        `* Station updates in last 7 days: ${stats.stations.updatedInLast7Days.toLocaleString()}\n` +
        `* Station updates in last 30 days: ${stats.stations.updatedInLast30Days.toLocaleString()}\n` +
        'Trade:\n' +
        `* Station Markets: ${stats.trade.stations.toLocaleString()}\n` +
        `* Fleet Carrier Markets: ${stats.trade.carriers.toLocaleString()}\n` +
        `* Trade systems: ${stats.trade.systems.toLocaleString()}\n` +
        `* Trade orders: ${stats.trade.tradeOrders.toLocaleString()}\n` +
        `* Trade updates in last hour: ${stats.trade.updatedInLastHour.toLocaleString()}\n` +
        `* Trade updates in last 24 hours: ${stats.trade.updatedInLast24Hours.toLocaleString()}\n` +
        `* Trade updates in last 7 days: ${stats.trade.updatedInLast7Days.toLocaleString()}\n` +
        `* Trade updates in last 30 days: ${stats.trade.updatedInLast30Days.toLocaleString()}\n` +
        `* Unique commodities: ${stats.trade.uniqueCommodities.toLocaleString()}\n` +
        `Stats last updated: ${stats.timestamp}`
        : 'Stats not generated yet')
  } catch (e) {
    return 'Error: Could not load stats'
  }
}
