const dbAsync = require('../../lib/db/db-async')
const NotFoundResponse = require('../../lib/response/not-found')

module.exports = (router) => {
  // Added to support providing information about rare goods, which are
  // typically only avalible from a single specific market.
  router.get('/api/v1/market/:marketId/commodity/name/:commodityName', async (ctx, next) => {
    const { marketId, commodityName } = ctx.params
    const commodity = await dbAsync.get('SELECT * FROM trade.commodities WHERE marketId = @marketId AND commodityName = @commodityName COLLATE NOCASE', { marketId, commodityName })
    if (!commodity) return NotFoundResponse(ctx, 'Market and/or commodity not found')
    ctx.body = commodity
  })
}
