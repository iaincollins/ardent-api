const path = require('path')
const fs = require('fs')
const KoaRouter = require('koa-router')
const Package = require('../package.json')
const { ARDENT_API_HOSTNAME, ARDENT_DATA_DIR, ARDENT_CACHE_DIR } = require('../lib/consts')
const routes = {
  commodities: require('./api/commodities'),
  systems: require('./api/systems')
  // locations: require('./api/locations')
}
const router = new KoaRouter()

router.get('/api/v1', (ctx, next) => ctx.redirect(`https://${ARDENT_API_HOSTNAME}/v1/stats`))

router.get('/api/v1/version', (ctx, next) => {
  ctx.body = { version: Package.version }
})

router.get('/api/v1/stats', (ctx, next) => {
  ctx.body = JSON.parse(fs.readFileSync(path.join(ARDENT_CACHE_DIR, 'database-stats.json')))
})

router.get('/api/v1/backup', (ctx, next) => {
  const backups = JSON.parse(fs.readFileSync(path.join(ARDENT_DATA_DIR, 'backup.json')))
  ctx.body = {
    started: backups.started,
    completed: backups.completed,
    databases: backups.databases
  }
})

routes.commodities(router)
routes.systems(router)
// routes.locations(router)

module.exports = router
