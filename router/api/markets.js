const dbAsync = require('../../lib/db/db-async')
const NotFoundResponse = require('../../lib/response/not-found')

module.exports = (router) => {
  // Get buy/sell orders for commodities at a specific market
  router.get('/api/v2/market/:marketId/commodities', async (ctx, next) => {
    const { marketId } = ctx.params
    const commodities = await dbAsync.all(`
      SELECT
        c.commodityName,
        c.marketId,
        c.buyPrice,
        c.demand,
        c.demandBracket,
        c.meanPrice,
        c.sellPrice,
        c.stock,
        c.stockBracket,
        c.updatedAt
      FROM trade.commodities c 
        LEFT JOIN stations.stations s ON c.marketId = s.marketId 
        WHERE c.marketId = @marketId
      `, { marketId }
    )
    if (commodities.length === 0) return NotFoundResponse(ctx, 'Market not found')
    ctx.body = commodities
  })

  // Get buy/sell orders for a specific commodity at a specific market
  router.get('/api/v2/market/:marketId/commodity/name/:commodityName', async (ctx, next) => {
    const { marketId, commodityName } = ctx.params

    const commodity = await dbAsync.get(`
      SELECT
        c.commodityName,
        c.marketId,
        c.buyPrice,
        c.demand,
        c.demandBracket,
        c.meanPrice,
        c.sellPrice,
        c.stock,
        c.stockBracket,
        c.updatedAt
      FROM trade.commodities c 
        LEFT JOIN stations.stations s ON c.marketId = s.marketId 
        WHERE c.marketId = @marketId
        AND c.commodityName = @commodityName
      `, { marketId, commodityName: commodityName.toLowerCase() }
    )

    if (!commodity) return NotFoundResponse(ctx, 'Market and/or commodity not found')
    ctx.body = commodity
  })
}
