const path = require('path')
const fs = require('fs')
const KoaRouter = require('koa-router')
const Package = require('../package.json')
const { ARDENT_API_HOSTNAME, ARDENT_DATA_DIR, ARDENT_CACHE_DIR, ARDENT_BACKUP_DIR } = require('../lib/consts')
const routes = {
  commodities: require('./api/commodities'),
  systems: require('./api/systems')
  // locations: require('./api/locations') // TODO
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

// Disabled as causes errors in Google Search Console (despite what docs say)
// Note: Path is served as '/robots.txt' in production
// router.get('/api/robots.txt', (ctx, next) => {
//   ctx.body = `User-agent: *\nDisallow: /`
// })

routes.commodities(router)
routes.systems(router)

module.exports = router
