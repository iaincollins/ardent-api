// @TODO Refactor API routes out into seperate service from collector
const path = require('path')
const fs = require('fs')
const KoaRouter = require('koa-router')
const addCommoditiesRoutes = require('./api/commodities')
const addSystemsRoutes = require('./api/systems')
const { ARDENT_API_HOSTNAME, ARDENT_DATA_DIR } = require('../lib/consts')

const router = new KoaRouter()

router.get('/api', async (ctx, next) => ctx.redirect(`${ARDENT_API_HOSTNAME}/v1/stats`))

router.get('/api/v1', async (ctx, next) => ctx.redirect(`${ARDENT_API_HOSTNAME}/v1/stats`))

router.get('/api/v1/stats', async (ctx, next) => {
  ctx.body = JSON.parse(fs.readFileSync(path.join(ARDENT_DATA_DIR, 'stats.json')))
})

router.get('/api/v1/backup', async (ctx, next) => {
  const backups = JSON.parse(fs.readFileSync(path.join(ARDENT_DATA_DIR, 'backup.json')))
  ctx.body = {
    started: backups.started,
    completed: backups.completed,
    databases: backups.databases
  }
})

addCommoditiesRoutes(router)

addSystemsRoutes(router)

module.exports = router
