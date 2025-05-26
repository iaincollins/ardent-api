const dbAsync = require('../../../lib/db/db-async')
const { paramAsBoolean } = require('../../../lib/utils/parse-query-params')
const NotFoundResponse = require('../../../lib/response/not-found')
const { getISODate } = require('../../../lib/utils/dates')
const {
  DEFAULT_MAX_RESULTS_AGE,
  DEFAULT_NEARBY_SYSTEMS_DISTANCE,
  MAX_NEARBY_SYSTEMS_DISTANCE,
  MAX_NEARBY_COMMODITY_RESULTS,
  COMMODITY_EXPORT_SORT_OPTIONS,
  COMMODITY_IMPORT_SORT_OPTIONS
} = require('../../../lib/consts')
const { getSystem } = require('../../../lib/utils/get-system')

module.exports = (router) => {
  router.get('/api/v2/system/:systemIdentiferType/:systemIdentifer/commodity/name/:commodityName', async (ctx, next) => {
    const { systemIdentiferType, systemIdentifer, commodityName } = ctx.params
    const system = await getSystem(systemIdentifer, systemIdentiferType)
    if (!system) return NotFoundResponse(ctx, 'System not found')

    const {
      maxDaysAgo = DEFAULT_MAX_RESULTS_AGE
    } = ctx.query

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
        AND c.commodityName = @commodityName
        AND c.updatedAtDay > '${getISODate(`-${maxDaysAgo}`)}'
      ORDER BY s.stationName
      `, { systemAddress: system.systemAddress, commodityName: commodityName.toLowerCase() })
    ctx.body = commodities
  })

  router.get('/api/v2/system/:systemIdentiferType/:systemIdentifer/commodity/name/:commodityName/nearby/imports', async (ctx, next) => {
    const { systemIdentiferType, systemIdentifer, commodityName } = ctx.params
    const system = await getSystem(systemIdentifer, systemIdentiferType)
    if (!system) return NotFoundResponse(ctx, 'System not found')
    const { systemX, systemY, systemZ } = system

    let {
      minVolume = 1,
      minPrice = 1,
      maxDistance = DEFAULT_NEARBY_SYSTEMS_DISTANCE,
      fleetCarriers = null,
      maxDaysAgo = DEFAULT_MAX_RESULTS_AGE,
      sort = null
    } = ctx.query

    if (maxDistance > MAX_NEARBY_SYSTEMS_DISTANCE) { maxDistance = MAX_NEARBY_SYSTEMS_DISTANCE }
    maxDistance = parseInt(maxDistance)

    const orderBy = COMMODITY_IMPORT_SORT_OPTIONS[sort] ? COMMODITY_IMPORT_SORT_OPTIONS[sort] : COMMODITY_IMPORT_SORT_OPTIONS.price

    const filters = [
      `AND (c.demand >= ${parseInt(minVolume)} OR c.demand = 0)`, // Zero is infinite demand
      `AND c.sellPrice >= ${parseInt(minPrice)}`
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
        c.updatedAt,
        ROUND(SQRT(POWER(s.systemX-@systemX,2)+POWER(s.systemY-@systemY,2)+POWER(s.systemZ-@systemZ,2))) AS distance
      FROM stations.stations s 
        LEFT JOIN trade.commodities c ON c.marketId = s.marketId 
      WHERE c.commodityName = @commodityName
        AND s.systemAddress != @systemAddress
        AND c.updatedAtDay > '${getISODate(`-${maxDaysAgo}`)}'
        AND distance <= @maxDistance
        ${filters.join(' ')}
      ORDER BY ${orderBy}
        LIMIT ${MAX_NEARBY_COMMODITY_RESULTS}`, {
      commodityName: commodityName.toLowerCase(),
      systemX,
      systemY,
      systemZ,
      systemAddress: system.systemAddress,
      maxDistance
    })

    ctx.body = commodities
  })

  router.get('/api/v2/system/:systemIdentiferType/:systemIdentifer/commodity/name/:commodityName/nearby/exports', async (ctx, next) => {
    const { systemIdentiferType, systemIdentifer, commodityName } = ctx.params
    const system = await getSystem(systemIdentifer, systemIdentiferType)
    if (!system) return NotFoundResponse(ctx, 'System not found')
    const { systemX, systemY, systemZ } = system

    let {
      minVolume = 1,
      maxPrice = null,
      maxDistance = DEFAULT_NEARBY_SYSTEMS_DISTANCE,
      fleetCarriers = null,
      maxDaysAgo = DEFAULT_MAX_RESULTS_AGE,
      sort = null
    } = ctx.query

    if (maxDistance > MAX_NEARBY_SYSTEMS_DISTANCE) { maxDistance = MAX_NEARBY_SYSTEMS_DISTANCE }
    maxDistance = parseInt(maxDistance)

    const orderBy = COMMODITY_EXPORT_SORT_OPTIONS[sort] ? COMMODITY_EXPORT_SORT_OPTIONS[sort] : COMMODITY_EXPORT_SORT_OPTIONS.price

    const filters = [
      `AND c.stock >= ${parseInt(minVolume)}`
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
        c.updatedAt,
        ROUND(SQRT(POWER(s.systemX-@systemX,2)+POWER(s.systemY-@systemY,2)+POWER(s.systemZ-@systemZ,2))) AS distance
      FROM stations.stations s 
        LEFT JOIN trade.commodities c ON c.marketId = s.marketId 
      WHERE c.commodityName = @commodityName
        AND s.systemAddress != @systemAddress
        AND c.updatedAtDay > '${getISODate(`-${maxDaysAgo}`)}'
        AND distance <= @maxDistance
        ${filters.join(' ')}
      ORDER BY ${orderBy}
        LIMIT ${MAX_NEARBY_COMMODITY_RESULTS}`, {
      commodityName: commodityName.toLowerCase(),
      systemX,
      systemY,
      systemZ,
      systemAddress: system.systemAddress,
      maxDistance
    })

    ctx.body = commodities
  })
}
