const dbAsync = require('../../../lib/db/db-async')
const { paramAsBoolean } = require('../../../lib/utils/parse-query-params')
const NotFoundResponse = require('../../../lib/response/not-found')
const { getISODate } = require('../../../lib/utils/dates')
const { DEFAULT_MAX_RESULTS_AGE } = require('../../../lib/consts')
const { getSystem } = require('../../../lib/utils/get-system')

module.exports = (router) => {
  router.get('/api/v2/system/:systemIdentiferType/:systemIdentifer/commodities', async (ctx, next) => {
    const { systemIdentiferType, systemIdentifer } = ctx.params
    const system = await getSystem(systemIdentifer, systemIdentiferType)
    if (!system) return NotFoundResponse(ctx, 'System not found')

    const commodities = await dbAsync.all(`
      SELECT 
        c.commodityName,
        c.marketId,
        s.stationName,
        s.stationType,
        s.distanceToArrival,
        s.maxLandingPadSize,
        s.bodyId,
        s.bodyName,
        s.systemAddress,
        s.systemName,
        s.systemX,
        s.systemY,
        s.systemZ,
        c.buyPrice,
        c.demand,
        c.demandBracket,
        c.meanPrice,
        c.sellPrice,
        c.stock,
        c.stockBracket,
        c.updatedAt
      FROM stations.stations s
        LEFT JOIN trade.commodities c ON s.marketId = c.marketId 
      WHERE s.systemAddress = @systemAddress
        ORDER BY commodityName ASC
    `, { systemAddress: system.systemAddress })
    ctx.body = commodities
  })

  router.get('/api/v2/system/:systemIdentiferType/:systemIdentifer/commodities/imports', async (ctx, next) => {
    const { systemIdentiferType, systemIdentifer } = ctx.params
    const system = await getSystem(systemIdentifer, systemIdentiferType)
    if (!system) return NotFoundResponse(ctx, 'System not found')

    const {
      minVolume = 1,
      minPrice = 1,
      fleetCarriers = null,
      maxDaysAgo = DEFAULT_MAX_RESULTS_AGE
    } = ctx.query

    const filters = [
      `AND (c.demand >= ${parseInt(minVolume)} OR c.demand = 0)`, // Zero is infinite demand
      `AND c.sellPrice >= ${parseInt(minPrice)}`,
      `AND c.updatedAtDay > '${getISODate(`-${maxDaysAgo}`)}'`
    ]

    if (fleetCarriers !== null) {
      if (paramAsBoolean(fleetCarriers) === true) { filters.push('AND s.stationType = \'FleetCarrier\'') }
      if (paramAsBoolean(fleetCarriers) === false) { filters.push('AND s.stationType != \'FleetCarrier\'') }
    }

    const commodities = await dbAsync.all(`
      SELECT
        c.commodityName,
        c.marketId,
        s.stationName,
        s.stationType,
        s.distanceToArrival,
        s.maxLandingPadSize,
        s.bodyId,
        s.bodyName,
        s.systemAddress,
        s.systemName,
        s.systemX,
        s.systemY,
        s.systemZ,
        c.buyPrice,
        c.demand,
        c.demandBracket,
        c.meanPrice,
        c.sellPrice,
        c.stock,
        c.stockBracket,
        c.updatedAt
      FROM stations.stations s 
        LEFT JOIN trade.commodities c ON c.marketId = s.marketId 
      WHERE s.systemAddress = @systemAddress
        ${filters.join(' ')}
    `, { systemAddress: system.systemAddress })

    ctx.body = commodities || 'No imported commodities'
  })

  router.get('/api/v2/system/:systemIdentiferType/:systemIdentifer/commodities/exports', async (ctx, next) => {
    const { systemIdentiferType, systemIdentifer } = ctx.params
    const system = await getSystem(systemIdentifer, systemIdentiferType)
    if (!system) return NotFoundResponse(ctx, 'System not found')

    const {
      minVolume = 1,
      maxPrice = null,
      fleetCarriers = null,
      maxDaysAgo = DEFAULT_MAX_RESULTS_AGE
    } = ctx.query

    const filters = [
      `AND c.stock >= ${parseInt(minVolume)}`,
      `AND c.updatedAtDay > '${getISODate(`-${maxDaysAgo}`)}'`
    ]

    if (maxPrice !== null) { filters.push(`AND c.buyPrice <= ${parseInt(maxPrice)}`) }

    if (fleetCarriers !== null) {
      if (paramAsBoolean(fleetCarriers) === true) { filters.push('AND s.stationType = \'FleetCarrier\'') }
      if (paramAsBoolean(fleetCarriers) === false) { filters.push('AND s.stationType != \'FleetCarrier\'') }
    }

    const commodities = await dbAsync.all(`
    SELECT 
    c.commodityName,
    c.marketId,
    s.stationName,
    s.stationType,
    s.distanceToArrival,
    s.maxLandingPadSize,
    s.bodyId,
    s.bodyName,
    s.systemAddress,
    s.systemName,
    s.systemX,
    s.systemY,
    s.systemZ,
    c.buyPrice,
    c.demand,
    c.demandBracket,
    c.meanPrice,
    c.sellPrice,
    c.stock,
    c.stockBracket,
    c.updatedAt
  FROM stations.stations s 
    LEFT JOIN trade.commodities c ON c.marketId = s.marketId 
  WHERE s.systemAddress = @systemAddress
        ${filters.join(' ')}
    `, { systemAddress: system.systemAddress })

    ctx.body = commodities || 'No exported commodities'
  })
}
