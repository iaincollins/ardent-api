const Package = require('./package.json')
console.log(`Ardent Collector v${Package.version} starting`)

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
const Koa = require('koa')
const koaBodyParser = require('koa-bodyparser')

console.log('Loading libraries …')
const router = require('./router')

;(async () => {
  // Start web service
  console.log('Starting web service')
  const app = new Koa()
  app.use(koaBodyParser())

  // Set default cache headers
  app.use((ctx, next) => {
    ctx.set('Cache-Control', ARDENT_API_DEFAULT_CACHE_CONTROL)
    ctx.set('Ardent-API-Version', `${Package.version}`)
    ctx.set('Access-Control-Allow-Origin', '*')
    return next()
  })

  router.get('/', (ctx) => { ctx.body = printStats() })
  router.get('/api', (ctx) => { ctx.body = printStats() })
  app.use(router.routes())

  app.listen(ARDENT_API_LOCAL_PORT)
  console.log('Web service online')

  console.log(printStats())
  console.log('Ardent API ready!')
})()

process.on('exit', () => console.log('Shutting down'))

process.on('uncaughtException', (e) => console.log('Uncaught exception:', e))

function printStats () {
  const stats = JSON.parse(fs.readFileSync(path.join(ARDENT_CACHE_DIR, 'database-stats.json')))

  return `Ardent API v${Package.version} Online\n` +
    '--------------------------\n' +
    ((stats)
      ? `Star systems: ${stats.systems.toLocaleString()}\n` +
        `Trade systems: ${stats.trade.systems.toLocaleString()}\n` +
        `Trade stations: ${stats.trade.stations.toLocaleString()}\n` +
        `Trade carriers: ${stats.trade.fleetCarriers.toLocaleString()}\n` +
        `Trade orders: ${stats.trade.tradeOrders.toLocaleString()}\n` +
        `Trade updates in last 24 hours: ${stats.trade.updatedInLast24Hours.toLocaleString()}\n` +
        `Trade updates in last 7 days: ${stats.trade.updatedInLast7Days.toLocaleString()}\n` +
        `Trade updates in last 30 days: ${stats.trade.updatedInLast30Days.toLocaleString()}\n` +
        `Unique commodities: ${stats.trade.uniqueCommodities.toLocaleString()}\n` +
        `Stats last updated: ${stats.timestamp} (updated every 15 minutes)`
      : 'Stats not generated yet')
}
