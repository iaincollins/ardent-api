const path = require('path')
const fs = require('fs')
const KoaRouter = require('koa-router')
const Package = require('../package.json')
const { ARDENT_API_HOSTNAME, ARDENT_CACHE_DIR, ARDENT_BACKUP_DIR } = require('../lib/consts')
const routes = {
  news: require('./api/news'),
  commodities: require('./api/commodities'),
  systems: require('./api/systems'),
  markets: require('./api/markets'),
  search: require('./api/search')
}
const router = new KoaRouter()
const dbAsync = require('../lib/db/db-async')

router.get('/api/v1', (ctx, next) => ctx.redirect(`https://${ARDENT_API_HOSTNAME}/v1/stats`))

router.get('/api/v1/version', (ctx, next) => {
  ctx.body = { version: Package.version }
})

router.get('/api/v1/stats', (ctx, next) => {
  ctx.body = JSON.parse(fs.readFileSync(path.join(ARDENT_CACHE_DIR, 'database-stats.json')))
})

router.get('/api/v1/stats/stations/types', async (ctx, next) => {
  const stationTypes = await dbAsync.all(`
      SELECT stationType, COUNT(*) as count FROM stations
      GROUP By stationType
      ORDER BY stationType
    `)
  const response = {}
  stationTypes.map(obj => {
    response[obj.stationType] = obj.count
  })
  response.timestamp = new Date().toISOString()
  ctx.body = response
})

router.get('/api/v1/backup', (ctx, next) => {
  const backups = JSON.parse(fs.readFileSync(path.join(ARDENT_BACKUP_DIR, 'backup.json')))
  const downloads = JSON.parse(fs.readFileSync(path.join(ARDENT_BACKUP_DIR, 'backup-downloads.json')))

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
