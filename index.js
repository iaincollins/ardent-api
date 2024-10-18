const Package = require('./package.json')
console.log(`Ardent Collector v${Package.version} starting`)

// Initalise default value for env vars before other imports
console.log('Configuring environment …')
const {
  ARDENT_CACHE_DIR,
  ARDENT_API_DEFAULT_CACHE_CONTROL,
  ARDENT_API_LOCAL_PORT,
  SESSION_SECRET
} = require('./lib/consts')

console.log('Loading dependancies …')
const process = require('process')
const path = require('path')
const fs = require('fs')
const Koa = require('koa')
const koaBodyParser = require('koa-bodyparser')
const cron = require('node-cron')
const KeyGrip = require('keygrip')

console.log('Loading libraries …')
const router = require('./router')
const warmCache = require('./lib/warm-cache')

;(async () => {
  // Start web service
  console.log('Starting web service')
  const app = new Koa()
  app.use(koaBodyParser())
  app.keys = new KeyGrip([SESSION_SECRET], 'sha256') // Used to sign cookies

  // Set default headers
  app.use((ctx, next) => {
    // Don't use cache control headers on auth routes 
    if (!ctx.url.startsWith('/api/auth/') && !ctx.url.startsWith('/auth/')) {
      ctx.set('Cache-Control', ARDENT_API_DEFAULT_CACHE_CONTROL)
    }
    ctx.set('Ardent-API-Version', `${Package.version}`)
    ctx.set('Access-Control-Allow-Origin', '*')
    ctx.cookies.secure = true // Enables secure cookies when behind HTTP proxy
    return next()
  })

  router.get('/', (ctx) => { ctx.body = printStats() })
  router.get('/api', (ctx) => { ctx.body = printStats() })
  app.use(router.routes())

  app.listen(ARDENT_API_LOCAL_PORT)
  console.log('Web service online')

  // Run task to warm up the cache every 15 minutes
  if (process?.env?.NODE_ENV == 'development') {
    console.log("Cache warming disabled")
  } else {
    // Experimented with disabling cache warming after the system upgrade, but
    // it still makes an appreciable difference to request times and keeps
    // request times under 1 second, so leaving it on. It takes a bit under
    // 3 minutes to complete, runnign every 15 minutes seems frequent enough.
    console.log("Cache warming enabled")
    cron.schedule('0 */15 * * * *', () => warmCache())
  }

  console.log(printStats())
  console.log('Ardent API ready!')
})()

process.on('exit', () => console.log('Shutting down'))

process.on('uncaughtException', (e) => console.log('Uncaught exception:', e))

function printStats() {
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
