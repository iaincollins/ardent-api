const dbAsync = require('../../lib/db/db-async')
const NotFoundResponse = require('../../lib/response/not-found')

module.exports = (router) => {
  router.get('/api/v1/market/:marketId/commodities', async (ctx, next) => {
    const { marketId } = ctx.params
    const commodities = await dbAsync.all('SELECT * FROM trade.commodities WHERE marketId = @marketId COLLATE NOCASE ORDER BY commodityName ASC', { marketId })
    if (commodities.length === 0) return NotFoundResponse(ctx, 'Market not found')
    ctx.body = commodities
  })

  router.get('/api/v1/market/:marketId/commodity/name/:commodityName', async (ctx, next) => {
    const { marketId, commodityName } = ctx.params
    const commodities = await dbAsync.get('SELECT * FROM trade.commodities WHERE marketId = @marketId COLLATE NOCASE AND commodityName = @commodityName COLLATE NOCASE', { marketId, commodityName })
    ctx.body = commodities
  })
}