const fs = require('fs')
const { ARDENT_GALNET_NEWS_CACHE, ARDENT_MARKET_TICKER_CACHE } = require('../../lib/consts')

module.exports = (router) => {
  router.get('/api/v1/news/galnet', async (ctx, next) => {
    ctx.body = JSON.parse(fs.readFileSync(ARDENT_GALNET_NEWS_CACHE))
  })
  router.get('/api/v1/news/commodities', async (ctx, next) => {
    ctx.body = JSON.parse(fs.readFileSync(ARDENT_MARKET_TICKER_CACHE))
  })
}
