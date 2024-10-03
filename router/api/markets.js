const dbAsync = require('../../lib/db/db-async')
const NotFoundResponse = require('../../lib/response/not-found')

module.exports = (router) => {
  // Added to support providing information about rare goods, which are
  // typically only avalible from a single specific market.
  //
  // To support more general queries based on marketId, indexing of the marketId 
  // would be required, as unlike commodityName, systemName and stationName,
  // marketId is not currently indexed - but this query still works because
  // commodityName is, and that's good enough for decent performance for now.
  router.get('/api/v1/market/:marketId/commodity/name/:commodityName', async (ctx, next) => {
    const { marketId, commodityName } = ctx.params
    const commodity = await dbAsync.get('SELECT * FROM trade.commodities WHERE marketId = @marketId COLLATE NOCASE AND commodityName = @commodityName COLLATE NOCASE', { marketId, commodityName })
    if (!commodity) return NotFoundResponse(ctx, 'Market / Commodity not found')
    ctx.body = commodity
  })
}