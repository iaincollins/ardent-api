const dbAsync = require('../../lib/db/db-async')
const NotFoundResponse = require('../../lib/response/not-found')

module.exports = (router) => {
  // Get buy/sell orders for commodities at a specific market
  router.get('/api/v1/market/:marketId/commodities', async (ctx, next) => {
    const { marketId } = ctx.params
    const commodities = await dbAsync.all('SELECT * FROM trade.commodities WHERE marketId = @marketId ORDER BY commodityName ASC', { marketId })
    if (commodities.length === 0) return NotFoundResponse(ctx, 'Market not found')
    ctx.body = commodities
  })

  // Get buy/sell orders for a specific commodity at a specific market
  router.get('/api/v1/market/:marketId/commodity/name/:commodityName', async (ctx, next) => {
    const { marketId, commodityName } = ctx.params
    const commodity = await dbAsync.get('SELECT * FROM trade.commodities WHERE marketId = @marketId AND commodityName = @commodityName COLLATE NOCASE', { marketId, commodityName })
    if (!commodity) return NotFoundResponse(ctx, 'Market and/or commodity not found')
    ctx.body = commodity
  })
}
