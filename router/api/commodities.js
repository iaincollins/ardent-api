const fs = require('fs')
const path = require('path')
const { paramAsBoolean } = require('../../lib/utils/parse-query-params')
const dbAsync = require('../../lib/db/db-async')
const { ARDENT_CACHE_DIR, DEFAULT_MAX_RESULTS_AGE } = require('../../lib/consts')
const NotFoundResponse = require('../../lib/response/not-found')
const { getISODate } = require('../../lib/utils/dates')
const { getSystem } = require('../../lib/utils/get-system')

const COMMODITIES_REPORT = path.join(ARDENT_CACHE_DIR, 'commodities.json')
const MAX_COMMODITY_SORTED_RESULTS = 100
const MAX_COMMODITY_SEARCH_DISTANCE = 1000

module.exports = (router) => {
  router.get('/api/v2/commodities', async (ctx, next) => {
    try {
      ctx.body = JSON.parse(fs.readFileSync(COMMODITIES_REPORT)).commodities
    } catch (e) {
      console.error(e)
      ctx.body = null
    }
  })

  router.get('/api/v2/commodity/name/:commodityName', async (ctx, next) => {
    let { commodityName } = ctx.params
    commodityName = commodityName.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '')
    const pathToFile = path.join(ARDENT_CACHE_DIR, 'commodities', `${commodityName}`, `${commodityName}.json`)
    if (!fs.existsSync(pathToFile)) return NotFoundResponse(ctx, 'Commodity not found')
    ctx.body = JSON.parse(fs.readFileSync(pathToFile))
  })

  router.get('/api/v2/commodity/name/:commodityName/imports', async (ctx, next) => {
    const { commodityName } = ctx.params
    let {
      minVolume = 1,
      minPrice = 1,
      fleetCarriers = null,
      maxDaysAgo = DEFAULT_MAX_RESULTS_AGE,
      systemAddress = null,
      systemName = null,
      maxDistance = null
    } = ctx.query

    const sqlQueryParams = {
      commodityName: commodityName.toLowerCase()
    }

    const filters = [
      `AND (c.demand >= ${parseInt(minVolume)} OR c.demand = 0)`, // Zero is infinite demand
      `AND c.sellPrice >= ${parseInt(minPrice)}`,
      `AND c.updatedAtDay > '${getISODate(`-${maxDaysAgo}`)}'`
    ]

    const systemSpecified = (systemAddress || systemName)
    if (systemSpecified) {
      const systemIdentifer = systemAddress ?? systemName
      const systemIdentiferType = systemAddress ? 'address' : 'name'
      const system = await getSystem(systemIdentifer, systemIdentiferType)
      if (!system) return NotFoundResponse(ctx, 'System not found')
      sqlQueryParams.systemX = system.systemX
      sqlQueryParams.systemY = system.systemY
      sqlQueryParams.systemZ = system.systemZ
      if (maxDistance) {
        if (maxDistance > MAX_COMMODITY_SEARCH_DISTANCE) { maxDistance = MAX_COMMODITY_SEARCH_DISTANCE }
        maxDistance = parseInt(maxDistance)
        sqlQueryParams.maxDistance = maxDistance
      }
    }

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
          ${systemSpecified ? ', ROUND(SQRT(POWER(s.systemX-@systemX,2)+POWER(s.systemY-@systemY,2)+POWER(s.systemZ-@systemZ,2))) AS distance' : ''}
        FROM trade.commodities c 
          LEFT JOIN stations.stations s ON c.marketId = s.marketId
        WHERE c.commodityName = @commodityName
          AND s.systemAddress IS NOT NULL
          ${filters.join(' ')}
          ${systemSpecified && maxDistance ? ' AND distance <= @maxDistance' : ''}
        ORDER BY c.sellPrice DESC
          LIMIT ${MAX_COMMODITY_SORTED_RESULTS}`, sqlQueryParams)

    ctx.body = commodities
  })

  router.get('/api/v2/commodity/name/:commodityName/exports', async (ctx, next) => {
    const { commodityName } = ctx.params
    let {
      minVolume = 1,
      maxPrice = null,
      fleetCarriers = null,
      maxDaysAgo = DEFAULT_MAX_RESULTS_AGE,
      systemAddress = null,
      systemName = null,
      maxDistance = null
    } = ctx.query

    const sqlQueryParams = {
      commodityName: commodityName.toLowerCase()
    }

    const filters = [
      `AND c.stock >= ${parseInt(minVolume)}`,
      `AND c.updatedAtDay > '${getISODate(`-${maxDaysAgo}`)}'`
    ]

    const systemSpecified = (systemAddress || systemName)
    if (systemSpecified) {
      const systemIdentifer = systemAddress ?? systemName
      const systemIdentiferType = systemAddress ? 'address' : 'name'
      const system = await getSystem(systemIdentifer, systemIdentiferType)
      if (!system) return NotFoundResponse(ctx, 'System not found')
      sqlQueryParams.systemX = system.systemX
      sqlQueryParams.systemY = system.systemY
      sqlQueryParams.systemZ = system.systemZ
      if (maxDistance) {
        if (maxDistance > MAX_COMMODITY_SEARCH_DISTANCE) { maxDistance = MAX_COMMODITY_SEARCH_DISTANCE }
        maxDistance = parseInt(maxDistance)
        sqlQueryParams.maxDistance = maxDistance
      }
    }

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
          ${systemSpecified ? ', ROUND(SQRT(POWER(s.systemX-@systemX,2)+POWER(s.systemY-@systemY,2)+POWER(s.systemZ-@systemZ,2))) AS distance' : ''}
        FROM trade.commodities c 
          LEFT JOIN stations.stations s ON c.marketId = s.marketId
        WHERE c.commodityName = @commodityName
          AND s.systemAddress IS NOT NULL
          ${filters.join(' ')}
          ${systemSpecified && maxDistance ? ' AND distance <= @maxDistance' : ''}
        ORDER BY c.buyPrice ASC
          LIMIT ${MAX_COMMODITY_SORTED_RESULTS}`, sqlQueryParams)

    ctx.body = commodities
  })
}
