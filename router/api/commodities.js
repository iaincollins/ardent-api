const fs = require('fs')
const path = require('path')
const { paramAsBoolean, paramAsInt } = require('../../lib/utils/parse-query-params')
const dbAsync = require('../../lib/db/db-async')
const { ARDENT_CACHE_DIR, DEFAULT_MAX_RESULTS_AGE, ARDENT_MARKET_TICKER_CACHE } = require('../../lib/consts')
const NotFoundResponse = require('../../lib/response/not-found')
const { getISODate } = require('../../lib/utils/dates')

const COMMODITIES_REPORT = path.join(ARDENT_CACHE_DIR, 'commodities.json')
const MAX_COMMODITY_SORTED_RESULTS = 100
const MAX_COMMODITY_SEARCH_DISTANCE = 1000

module.exports = (router) => {
  router.get('/api/v1/commodities', async (ctx, next) => {    
    try {
      ctx.body = JSON.parse(fs.readFileSync(COMMODITIES_REPORT)).commodities
    } catch (e) {
      console.error(e)
      ctx.body = null
    }
  })

  router.get('/api/v1/commodity/name/:commodityName', async (ctx, next) => {
    let { commodityName } = ctx.params
    commodityName = commodityName.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '')
    const pathToFile = path.join(ARDENT_CACHE_DIR, 'commodities', `${commodityName}`, `${commodityName}.json`)
    if (!fs.existsSync(pathToFile)) return NotFoundResponse(ctx, 'Commodity not found')
    ctx.body = JSON.parse(fs.readFileSync(pathToFile))
  })

  router.get('/api/v1/commodity/name/:commodityName/imports', async (ctx, next) => {
    const { commodityName } = ctx.params
    let {
      minVolume = 1,
      minPrice = 1,
      fleetCarriers = null,
      maxDaysAgo = DEFAULT_MAX_RESULTS_AGE,
      systemName = null,
      maxDistance = null
    } = ctx.query

    const sqlQueryParams = {
      commodityName
    }

    const filters = [
      `AND (c.demand >= ${parseInt(minVolume)} OR c.demand = 0)`, // Zero is infinite demand
      `AND c.sellPrice >= ${parseInt(minPrice)}`,
      `AND c.updatedAtDay > '${getISODate(`-${maxDaysAgo}`)}'`
    ]

    if (systemName) {
      const system = await getSystemByName(systemName)
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

    if (paramAsBoolean(fleetCarriers) !== null) { filters.push(`AND c.fleetCarrier = ${paramAsInt(fleetCarriers)}`) }

    const commodities = await dbAsync.all(`
      SELECT
        c.commodityId,
        c.commodityName,
        c.marketId,
        c.stationName,
        s.stationType,
        s.distanceToArrival,
        s.maxLandingPadSize,
        s.bodyId,
        s.bodyName,
        c.systemName,
        c.systemX,
        c.systemY,
        c.systemZ,
        c.fleetCarrier,
        c.buyPrice,
        c.demand,
        c.demandBracket,
        c.meanPrice,
        c.sellPrice,
        c.stock,
        c.stockBracket,
        c.statusFlags,
        c.updatedAt
          ${systemName ? ', ROUND(SQRT(POWER(c.systemX-@systemX,2)+POWER(c.systemY-@systemY,2)+POWER(c.systemZ-@systemZ,2))) AS distance' : ''}
        FROM trade.commodities c 
          LEFT JOIN stations.stations s ON c.marketId = s.marketId
        WHERE c.commodityName = @commodityName COLLATE NOCASE
          ${filters.join(' ')}
          ${systemName && maxDistance ? ' AND distance <= @maxDistance' : ''}
        ORDER BY c.sellPrice DESC
          LIMIT ${MAX_COMMODITY_SORTED_RESULTS}`, sqlQueryParams)

    ctx.body = commodities
  })

  router.get('/api/v1/commodity/name/:commodityName/exports', async (ctx, next) => {
    const { commodityName } = ctx.params
    let {
      minVolume = 1,
      maxPrice = null,
      fleetCarriers = null,
      maxDaysAgo = DEFAULT_MAX_RESULTS_AGE,
      systemName = null,
      maxDistance = null
    } = ctx.query

    const sqlQueryParams = {
      commodityName
    }

    const filters = [
      `AND c.stock >= ${parseInt(minVolume)}`,
      `AND c.updatedAtDay > '${getISODate(`-${maxDaysAgo}`)}'`
    ]

    if (systemName) {
      const system = await getSystemByName(systemName)
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

    if (paramAsBoolean(fleetCarriers) !== null) { filters.push(`AND c.fleetCarrier = ${paramAsInt(fleetCarriers)}`) }

    const commodities = await dbAsync.all(`
      SELECT
        c.commodityId,
        c.commodityName,
        c.marketId,
        c.stationName,
        s.stationType,
        s.distanceToArrival,
        s.maxLandingPadSize,
        s.bodyId,
        s.bodyName,
        c.systemName,
        c.systemX,
        c.systemY,
        c.systemZ,
        c.fleetCarrier,
        c.buyPrice,
        c.demand,
        c.demandBracket,
        c.meanPrice,
        c.sellPrice,
        c.stock,
        c.stockBracket,
        c.statusFlags,
        c.updatedAt
          ${systemName ? ', ROUND(SQRT(POWER(c.systemX-@systemX,2)+POWER(c.systemY-@systemY,2)+POWER(c.systemZ-@systemZ,2))) AS distance' : ''}
        FROM trade.commodities c 
          LEFT JOIN stations.stations s ON c.marketId = s.marketId
        WHERE c.commodityName = @commodityName COLLATE NOCASE
          ${filters.join(' ')}
          ${systemName && maxDistance ? ' AND distance <= @maxDistance' : ''}
        ORDER BY c.buyPrice ASC
          LIMIT ${MAX_COMMODITY_SORTED_RESULTS}`, sqlQueryParams)

    ctx.body = commodities
  })
}

async function getSystemByName (systemName) {
  const system = await dbAsync.all('SELECT * FROM systems.systems WHERE systemName = @systemName COLLATE NOCASE', { systemName })
  // @FIXME Handle edge cases where there are multiple systems with same name
  // (This is a very small number and all are unhinhabited, so low priority)
  return system?.[0]
}
