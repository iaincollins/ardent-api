const { systemsDbAsync, stationsDbAsync, tradeDbAsync, dbAsync } = require('../../lib/db/db-async')
const { getNearbySystemSectors } = require('../../lib/system-sectors')
const { paramAsBoolean, paramAsInt } = require('../../lib/utils/parse-query-params')
const NotFoundResponse = require('../../lib/response/not-found')

const DEFAULT_NEARBY_SYSTEMS_DISTANCE = 100
const MAX_NEARBY_SYSTEMS_DISTANCE = 500 // Distance in Ly
const MAX_NEARBY_SYSTEMS_RESULTS = 1000
const MAX_NEARBY_COMMODITY_RESULTS = 1000

module.exports = (router) => {
  router.get('/api/v1/system/name/:systemName', async (ctx, next) => {
    const { systemName } = ctx.params
    const system = await getSystemByName(systemName)
    if (!system) return NotFoundResponse(ctx, 'System not found')
    ctx.body = system
  })

  router.get('/api/v1/system/name/:systemName/markets', async (ctx, next) => {
    const { systemName } = ctx.params

    // Validate system name
    const system = await getSystemByName(systemName)
    if (!system) return NotFoundResponse(ctx, 'System not found')

    const stations = await tradeDbAsync.all('SELECT marketId, stationName, fleetCarrier, updatedAt FROM commodities WHERE systemName = @systemName COLLATE NOCASE GROUP BY marketId ORDER BY stationName', { systemName })
    ctx.body = stations
  })

  router.get('/api/v1/system/name/:systemName/stations', async (ctx, next) => {
    const { systemName } = ctx.params

    // Validate system name
    const system = await getSystemByName(systemName)
    if (!system) return NotFoundResponse(ctx, 'System not found')

    const stations = await stationsDbAsync.all('SELECT * FROM stations WHERE systemName = @systemName COLLATE NOCASE ORDER BY stationName', { systemName })
    ctx.body = stations
  })

  router.get('/api/v1/system/name/:systemName/stations/ports', async (ctx, next) => {
    const { systemName } = ctx.params

    // Validate system name
    const system = await getSystemByName(systemName)
    if (!system) return NotFoundResponse(ctx, 'System not found')

    const stations = await stationsDbAsync.all(
      'SELECT * FROM stations WHERE systemName = @systemName COLLATE NOCASE' +
      ' AND (stationType = \'Planetary Port\' OR stationType = \'Orbis Starport\' OR stationType = \'Coriolis Starport\' OR stationType = \'Ocellus Starport\' OR stationType = \'Asteroid base\')' +
      ' ORDER BY stationName',
      { systemName })
    ctx.body = stations
  })

  router.get('/api/v1/system/name/:systemName/stations/outposts', async (ctx, next) => {
    const { systemName } = ctx.params

    // Validate system name
    const system = await getSystemByName(systemName)
    if (!system) return NotFoundResponse(ctx, 'System not found')

    const stations = await stationsDbAsync.all(
      'SELECT * FROM stations WHERE systemName = @systemName COLLATE NOCASE' +
      ' AND (stationType = \'Outpost\' OR stationType = \'Planetary Outpost\')' +
      ' ORDER BY stationName',
      { systemName })
    ctx.body = stations
  })

  router.get('/api/v1/system/name/:systemName/stations/settlements', async (ctx, next) => {
    const { systemName } = ctx.params

    // Validate system name
    const system = await getSystemByName(systemName)
    if (!system) return NotFoundResponse(ctx, 'System not found')

    const stations = await stationsDbAsync.all(
      'SELECT * FROM stations WHERE systemName = @systemName COLLATE NOCASE' +
      ' AND stationType = \'Odyssey Settlement\'' +
      ' ORDER BY stationName',
      { systemName })
    ctx.body = stations
  })

  router.get('/api/v1/system/name/:systemName/stations/megaships', async (ctx, next) => {
    const { systemName } = ctx.params

    // Validate system name
    const system = await getSystemByName(systemName)
    if (!system) return NotFoundResponse(ctx, 'System not found')

    const stations = await stationsDbAsync.all(
      'SELECT * FROM stations WHERE systemName = @systemName COLLATE NOCASE' +
     ' AND stationType = \'Mega ship\'' +
     ' ORDER BY stationName',
      { systemName })
    ctx.body = stations
  })

  router.get('/api/v1/system/name/:systemName/stations/carriers', async (ctx, next) => {
    const { systemName } = ctx.params

    // Validate system name
    const system = await getSystemByName(systemName)
    if (!system) return NotFoundResponse(ctx, 'System not found')

    const stations = await stationsDbAsync.all(
      'SELECT * FROM stations WHERE systemName = @systemName COLLATE NOCASE' +
      ' AND stationType = \'Fleet Carrier\'' +
      ' ORDER BY stationName',
      { systemName })
    ctx.body = stations
  })

  router.get('/api/v1/carrier/ident/:carrierIdent', async (ctx, next) => {
    const { carrierIdent } = ctx.params

    const carrier = await stationsDbAsync.get('SELECT * FROM stations WHERE stationType = \'Fleet Carrier\' AND stationName = @carrierIdent', { carrierIdent })
    if (!carrier) return NotFoundResponse(ctx, 'Carrier not found')
    ctx.body = carrier
  })

  router.get('/api/v1/carrier/ident/:carrierIdent/commodities', async (ctx, next) => {
    const { carrierIdent } = ctx.params

    const commodities = await tradeDbAsync.all('SELECT * FROM commodities WHERE fleetCarrier = 1 AND stationName = @carrierIdent COLLATE NOCASE ORDER BY commodityName ASC', { carrierIdent })
    if (commodities.length === 0) return NotFoundResponse(ctx, 'Carrier market not found')
    ctx.body = commodities
  })

  router.get('/api/v1/system/name/:systemName/market/name/:stationName/commodities', async (ctx, next) => {
    const { systemName, stationName } = ctx.params

    // Validate system name
    const system = await getSystemByName(systemName)
    if (!system) return NotFoundResponse(ctx, 'System not found')

    const commodities = await tradeDbAsync.all('SELECT * FROM commodities WHERE systemName = @systemName AND stationName = @stationName COLLATE NOCASE ORDER BY commodityName ASC', { systemName, stationName })
    if (commodities.length === 0) return NotFoundResponse(ctx, 'Market not found')
    ctx.body = commodities
  })

  router.get('/api/v1/system/name/:systemName/commodities', async (ctx, next) => {
    const { systemName } = ctx.params

    // Validate system name
    const system = await getSystemByName(systemName)
    if (!system) return NotFoundResponse(ctx, 'System not found')

    const commodities = await dbAsync.all(`
      SELECT 
        c.commodityId,
        c.commodityName,
        c.stationName,
        s.stationType,
        s.distanceToArrival,
        s.maxLandingPadSize,
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
      FROM trade.commodities c
        LEFT JOIN stations.stations s ON c.marketId = s.marketId 
      WHERE c.systemName = @systemName COLLATE NOCASE
        ORDER BY commodityName ASC
    `, { systemName })
    ctx.body = commodities
  })

  router.get('/api/v1/system/name/:systemName/commodity/name/:commodityName', async (ctx, next) => {
    const { systemName, commodityName } = ctx.params

    // Validate system name
    const system = await getSystemByName(systemName)
    if (!system) return NotFoundResponse(ctx, 'System not found')

    const commodities = await tradeDbAsync.all('SELECT * FROM commodities WHERE systemName = @systemName COLLATE NOCASE AND commodityName = @commodityName COLLATE NOCASE', { systemName, commodityName })
    ctx.body = commodities
  })

  router.get('/api/v1/system/name/:systemName/commodities/imports', async (ctx, next) => {
    const { systemName } = ctx.params
    const {
      minVolume = 1,
      minPrice = 1,
      fleetCarriers = null
    } = ctx.query

    // Validate system name
    const system = await getSystemByName(systemName)
    if (!system) return NotFoundResponse(ctx, 'System not found')

    const filters = [
      `AND c.demand >= ${parseInt(minVolume)}`,
      `AND c.sellPrice >= ${parseInt(minPrice)}`
    ]

    if (paramAsBoolean(fleetCarriers) !== null) {
      filters.push(`AND c.fleetCarrier = ${paramAsInt(fleetCarriers)}`)
    }

    const commodities = await dbAsync.all(`
      SELECT 
        c.commodityId,
        c.commodityName,
        c.stationName,
        s.stationType,
        s.distanceToArrival,
        s.maxLandingPadSize,
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
      FROM trade.commodities c
        LEFT JOIN stations.stations s ON c.marketId = s.marketId 
      WHERE c.systemName = @systemName COLLATE NOCASE
        ${filters.join(' ')}
      ORDER BY c.commodityName ASC
    `, { systemName })

    ctx.body = commodities || 'No imported commodities'
  })

  router.get('/api/v1/system/name/:systemName/commodities/exports', async (ctx, next) => {
    const { systemName } = ctx.params
    const {
      minVolume = 1,
      maxPrice = null,
      fleetCarriers = null
    } = ctx.query

    // Validate system name
    const system = await getSystemByName(systemName)
    if (!system) return NotFoundResponse(ctx, 'System not found')

    const filters = [
      `AND c.stock >= ${parseInt(minVolume)}`
    ]

    if (maxPrice !== null) { filters.push(`AND c.buyPrice <= ${parseInt(maxPrice)}`) }

    if (paramAsBoolean(fleetCarriers) !== null) {
      filters.push(`AND c.fleetCarrier = ${paramAsInt(fleetCarriers)}`)
    }

    const commodities = await dbAsync.all(`
      SELECT
        c.commodityId,
        c.commodityName,
        c.stationName,
        s.stationType,
        s.distanceToArrival,
        s.maxLandingPadSize,
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
      FROM trade.commodities c
        LEFT JOIN stations.stations s ON c.marketId = s.marketId 
      WHERE c.systemName = @systemName COLLATE NOCASE
        ${filters.join(' ')}
      ORDER BY c.commodityName ASC
    `, { systemName })

    ctx.body = commodities
  })

  router.get('/api/v1/system/name/:systemName/commodity/name/:commodityName/nearby/imports', async (ctx, next) => {
    const { systemName, commodityName } = ctx.params
    let {
      minVolume = 1,
      minPrice = 1,
      maxDistance = DEFAULT_NEARBY_SYSTEMS_DISTANCE,
      fleetCarriers = null
    } = ctx.query
    if (maxDistance > MAX_NEARBY_SYSTEMS_DISTANCE) { maxDistance = MAX_NEARBY_SYSTEMS_DISTANCE }
    maxDistance = parseInt(maxDistance)

    const { systemAddress, systemX, systemY, systemZ } = await getSystemByName(systemName)
    if (!systemAddress) return NotFoundResponse(ctx, 'System not found')

    const filters = [
      `AND c.demand >= ${parseInt(minVolume)}`,
      `AND c.sellPrice >= ${parseInt(minPrice)}`
    ]

    if (paramAsBoolean(fleetCarriers) !== null) { filters.push(`AND c.fleetCarrier = ${paramAsInt(fleetCarriers)}`) }

      const commodities = await dbAsync.all(`
        SELECT
          c.commodityId,
          c.commodityName,
          c.stationName,
          s.stationType,
          s.distanceToArrival,
          s.maxLandingPadSize,
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
          c.updatedAt,
          ROUND(SQRT(POWER(c.systemX-@systemX,2)+POWER(c.systemY-@systemY,2)+POWER(c.systemZ-@systemZ,2))) AS distance
        FROM trade.commodities c 
          LEFT JOIN stations.stations s ON c.marketId = s.marketId 
        WHERE c.commodityName = @commodityName COLLATE NOCASE
          AND c.systemName != @systemName
          AND distance <= @maxDistance
          ${filters.join(' ')}
        ORDER BY c.sellPrice DESC
          LIMIT ${MAX_NEARBY_COMMODITY_RESULTS}`, {
        commodityName,
        systemX,
        systemY,
        systemZ,
        systemName,
        maxDistance
    })

    ctx.body = commodities
  })

  router.get('/api/v1/system/name/:systemName/commodity/name/:commodityName/nearby/exports', async (ctx, next) => {
    const { systemName, commodityName } = ctx.params
    let {
      minVolume = 1,
      maxPrice = null,
      maxDistance = DEFAULT_NEARBY_SYSTEMS_DISTANCE,
      fleetCarriers = null
    } = ctx.query
    if (maxDistance > MAX_NEARBY_SYSTEMS_DISTANCE) { maxDistance = MAX_NEARBY_SYSTEMS_DISTANCE }
    maxDistance = parseInt(maxDistance)

    const { systemAddress, systemX, systemY, systemZ } = await getSystemByName(systemName)
    if (!systemAddress) return NotFoundResponse(ctx, 'System not found')

    const filters = [
      `AND c.stock >= ${parseInt(minVolume)}`
    ]

    if (maxPrice !== null) { filters.push(`AND c.buyPrice <= ${parseInt(maxPrice)}`) }

    if (paramAsBoolean(fleetCarriers) !== null) { filters.push(`AND c.fleetCarrier = ${paramAsInt(fleetCarriers)}`) }

    const commodities = await dbAsync.all(`
      SELECT
        c.commodityId,
        c.commodityName,
        c.stationName,
        s.stationType,
        s.distanceToArrival,
        s.maxLandingPadSize,
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
        c.updatedAt,
        ROUND(SQRT(POWER(c.systemX-@systemX,2)+POWER(c.systemY-@systemY,2)+POWER(c.systemZ-@systemZ,2))) AS distance
      FROM trade.commodities c 
        LEFT JOIN stations.stations s ON c.marketId = s.marketId 
      WHERE c.commodityName = @commodityName COLLATE NOCASE
        AND c.systemName != @systemName
        AND distance <= @maxDistance
        ${filters.join(' ')}
      ORDER BY c.buyPrice ASC
        LIMIT ${MAX_NEARBY_COMMODITY_RESULTS}`, {
      commodityName,
      systemX,
      systemY,
      systemZ,
      systemName,
      maxDistance
    })

    ctx.body = commodities
  })

  router.get('/api/v1/system/name/:systemName/nearby', async (ctx, next) => {
    const { systemName } = ctx.params
    let {
      maxDistance = DEFAULT_NEARBY_SYSTEMS_DISTANCE
    } = ctx.query

    if (maxDistance > MAX_NEARBY_SYSTEMS_DISTANCE) { maxDistance = MAX_NEARBY_SYSTEMS_DISTANCE }
    maxDistance = parseInt(maxDistance)

    const { systemAddress, systemX, systemY, systemZ } = await getSystemByName(systemName)
    if (!systemAddress) return NotFoundResponse(ctx, 'System not found')

    const nearbySectors = getNearbySystemSectors(systemX, systemY, systemZ, maxDistance)
    const nearestSystems = await systemsDbAsync.all(`
      SELECT
        *,
        ROUND(SQRT(POWER(systemX-@systemX,2)+POWER(systemY-@systemY,2)+POWER(systemZ-@systemZ,2))) AS distance
      FROM systems
        WHERE systemSector IN ('${nearbySectors.join("', '")}')
        AND systemName != @systemName
        AND distance <= @maxDistance
      ORDER BY distance
        LIMIT ${MAX_NEARBY_SYSTEMS_RESULTS}`, {
      systemX,
      systemY,
      systemZ,
      systemName,
      maxDistance
    })

    ctx.body = nearestSystems
  })

  async function getSystemByName (systemName) {
    const system = await systemsDbAsync.all('SELECT * FROM systems WHERE systemName = @systemName COLLATE NOCASE', { systemName })
    // @FIXME Handle edge cases where there are multiple systems with same name
    // (This is a very small number and all are unhinhabited, so low priority)
    // if (system?.length === 1) return system
    return system[0]
  }
}
