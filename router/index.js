const path = require('path')
const fs = require('fs')
const KoaRouter = require('koa-router')
const Package = require('../package.json')

const {
  ARDENT_API_BASE_URL,
  ARDENT_CACHE_DIR,
  ARDENT_BACKUP_DIR,
  ARDENT_DOWNLOADS_DIR
} = require('../lib/consts')

const routes = {
  news: require('./api/news'),
  commodities: require('./api/commodities'),
  systems: require('./api/systems'),
  markets: require('./api/markets'),
  search: require('./api/search')
}
const router = new KoaRouter()
const dbAsync = require('../lib/db/db-async')

router.get('/api/v1', (ctx, next) => ctx.redirect(`${ARDENT_API_BASE_URL}/v1/stats`))

router.get('/api/v1/version', (ctx, next) => {
  ctx.body = { version: Package.version }
})

router.get('/api/v1/stats', (ctx, next) => {
  try {
    ctx.body = JSON.parse(fs.readFileSync(path.join(ARDENT_CACHE_DIR, 'database-stats.json')))
  } catch (e) {
    console.error(e)
    ctx.body = null
  }
})

router.get('/api/v1/stats/stations/types', async (ctx, next) => {
  const stationTypes = await dbAsync.all(`
      SELECT stationType, COUNT(*) as count FROM stations
      GROUP By stationType
      ORDER BY stationType
    `)
  const result = {
    stationTypes: {},
    total: 0,
    timestamp: new Date().toISOString()
  }
  stationTypes.forEach(obj => {
    result.stationTypes[obj.stationType] = obj.count
    result.total += obj.count
  })
  ctx.body = result
})

router.get('/api/v1/stats/stations/economies', async (ctx, next) => {
  const primaryEconomies  = await dbAsync.all(`
      SELECT primaryEconomy, COUNT(*) as count FROM stations
        GROUP By primaryEconomy
        ORDER BY primaryEconomy
    `)
  const secondaryEconomies = await dbAsync.all(`
    SELECT secondaryEconomy, COUNT(*) as count FROM stations
      GROUP By secondaryEconomy
      ORDER BY secondaryEconomy
    `)
  const primary = {}
  primaryEconomies.forEach(result => primary[result['primaryEconomy']] = result['count'])
  const secondary = {}
  secondaryEconomies.forEach(result => secondary[result['secondaryEconomy']] = result['count'])
  const result = {
    primary,
    secondary,
    timestamp: new Date().toISOString()
  }
  ctx.body = result
})

router.get('/api/v1/backup', (ctx, next) => {
  const backups = JSON.parse(fs.readFileSync(path.join(ARDENT_BACKUP_DIR, 'backup.json')))
  const downloads = JSON.parse(fs.readFileSync(path.join(ARDENT_DOWNLOADS_DIR, 'downloads.json')))

  for (const database of backups.databases) {
    database.download = {
      url: downloads[database.name].url,
      updated: downloads[database.name].created,
      size: downloads[database.name].size,
      sha256: downloads[database.name].sha256
    }
  }

  ctx.body = {
    started: backups.started,
    completed: backups.completed,
    databases: backups.databases
  }
})

routes.news(router)
routes.commodities(router)
routes.systems(router)
routes.markets(router)
routes.search(router)

module.exports = router
