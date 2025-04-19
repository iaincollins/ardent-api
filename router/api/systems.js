const dbAsync = require('../../lib/db/db-async')
const { getNearbySystemSectors } = require('../../lib/system-sectors')
const { paramAsBoolean, paramAsInt } = require('../../lib/utils/parse-query-params')
const NotFoundResponse = require('../../lib/response/not-found')
const { getISODate } = require('../../lib/utils/dates')
const { DEFAULT_MAX_RESULTS_AGE } = require('../../lib/consts')
const getSystemByName = require('../../lib/utils/get-system-by-name')
const EDSM = require('../../lib/edsm')

const DEFAULT_NEARBY_SYSTEMS_DISTANCE = 100
const MAX_NEARBY_SYSTEMS_DISTANCE = 500 // Distance in Ly
const MAX_NEARBY_SYSTEMS_RESULTS = 1000
const MAX_NEARBY_COMMODITY_RESULTS = 1000
const MAX_NEARBY_CONTACTS_RESULTS = 20

// Note: The .filter(result => result.systemName === system.systemName) that is
// applied before returning results is to ensure we only return correct data
// for systems with case sensitive names like 'i_Carinae'/'I Carinae'.
// That's also why we use the systemAddress (id64) when querying EDSM.
module.exports = (router) => {
  router.get('/api/v1/system/name/:systemName', async (ctx, next) => {
    const { systemName } = ctx.params
    const system = await getSystemByName(systemName)
    if (!system) return NotFoundResponse(ctx, 'System not found')
    ctx.body = system
  })

  // This function is currently mostly a pass through to the EDSM API
  router.get('/api/v1/system/name/:systemName/status', async (ctx, next) => {
    const { systemName } = ctx.params
    const system = await getSystemByName(systemName)
    if (!system) return NotFoundResponse(ctx, 'System not found')
    const systemStatus = await EDSM.getSystemStatus(system.systemAddress)
    ctx.body = systemStatus
  })

  // This function is currently mostly a pass through to the EDSM API
  router.get('/api/v1/system/name/:systemName/bodies', async (ctx, next) => {
    const { systemName } = ctx.params
    const system = await getSystemByName(systemName)
    if (!system) return NotFoundResponse(ctx, 'System not found')
    const systemBodies = await EDSM.getSystemBodies(system.systemAddress)
    ctx.body = systemBodies
  })

  router.get('/api/v1/system/name/:systemName/markets', async (ctx, next) => {
    const { systemName } = ctx.params

    // Validate system name
    const system = await getSystemByName(systemName)
    if (!system) return NotFoundResponse(ctx, 'System not found')

    const stations = await dbAsync.all('SELECT marketId, stationName, systemName, fleetCarrier, updatedAt FROM trade.commodities WHERE systemName = @systemName GROUP BY marketId ORDER BY stationName', { systemName: system.systemName })

    ctx.body = stations.filter(result => result.systemName === system.systemName)
  })

  router.get('/api/v1/system/name/:systemName/stations', async (ctx, next) => {
    const { systemName } = ctx.params

    // Validate system name
    const system = await getSystemByName(systemName)
    if (!system) return NotFoundResponse(ctx, 'System not found')

    // An explicit list of all known dockable station types
    // This is the most liberal interpretation of 'station', but is still
    // explicit to avoid returning stations where the type is unknown/invalid
    const stations = await dbAsync.all(`
      SELECT * FROM stations.stations WHERE systemName = @systemName
      AND (
          stationType = 'AsteroidBase' OR
          stationType = 'Coriolis' OR 
          stationType = 'CraterPort' OR 
          stationType = 'CraterOutpost' OR 
          stationType = 'FleetCarrier' OR
          stationType = 'MegaShip' OR
          stationType = 'Ocellus' OR 
          stationType = 'OnFootSettlement' OR
          stationType = 'Orbis' OR
          stationType = 'Outpost' OR
          stationType = 'PlanetaryConstructionDepot' OR
          stationType = 'SpaceConstructionDepot' OR
          stationType = 'StrongholdCarrier' OR
          stationType = 'SurfaceStation'
        )
      ORDER BY stationName
    `, { systemName: system.systemName })
    ctx.body = stations.filter(result => result.systemName === system.systemName)
  })

  router.get('/api/v1/system/name/:systemName/stations/ports', async (ctx, next) => {
    const { systemName } = ctx.params

    // Validate system name
    const system = await getSystemByName(systemName)
    if (!system) return NotFoundResponse(ctx, 'System not found')

    const stations = await dbAsync.all(`
      SELECT * FROM stations.stations WHERE systemName = @systemName
        AND (
            stationType = 'AsteroidBase' OR
            stationType = 'Coriolis' OR 
            stationType = 'CraterPort' OR 
            stationType = 'Ocellus' OR 
            stationType = 'Orbis'
          )
        ORDER BY stationName
      `, { systemName: system.systemName })

    ctx.body = stations.filter(result => result.systemName === system.systemName)
  })

  router.get('/api/v1/system/name/:systemName/stations/outposts', async (ctx, next) => {
    const { systemName } = ctx.params

    // Validate system name
    const system = await getSystemByName(systemName)
    if (!system) return NotFoundResponse(ctx, 'System not found')

    const stations = await dbAsync.all(`
      SELECT * FROM stations.stations WHERE systemName = @systemName
        AND (stationType = 'Outpost' OR stationType = 'CraterOutpost')
        ORDER BY stationName
      `, { systemName: system.systemName })

    ctx.body = stations.filter(result => result.systemName === system.systemName)
  })

  router.get('/api/v1/system/name/:systemName/stations/settlements', async (ctx, next) => {
    const { systemName } = ctx.params

    // Validate system name
    const system = await getSystemByName(systemName)
    if (!system) return NotFoundResponse(ctx, 'System not found')

    const stations = await dbAsync.all(`
      SELECT * FROM stations.stations WHERE systemName = @systemName
        AND (stationType = 'OnFootSettlement')
        ORDER BY stationName
      `, { systemName: system.systemName })

    ctx.body = stations.filter(result => result.systemName === system.systemName)
  })

  router.get('/api/v1/system/name/:systemName/stations/megaships', async (ctx, next) => {
    const { systemName } = ctx.params

    // Validate system name
    const system = await getSystemByName(systemName)
    if (!system) return NotFoundResponse(ctx, 'System not found')

    const stations = await dbAsync.all(`
    SELECT * FROM stations.stations WHERE systemName = @systemName
      AND (stationType = 'MegaShip')
      ORDER BY stationName
    `, { systemName: system.systemName })

    ctx.body = stations.filter(result => result.systemName === system.systemName)
  })

  router.get('/api/v1/system/name/:systemName/stations/carriers', async (ctx, next) => {
    const { systemName } = ctx.params

    // Validate system name
    const system = await getSystemByName(systemName)
    if (!system) return NotFoundResponse(ctx, 'System not found')

    const stations = await dbAsync.all(`
      SELECT * FROM stations.stations WHERE systemName = @systemName
        AND (stationType = 'FleetCarrier' OR stationType = 'StrongholdCarrier')
        ORDER BY stationName
      `, { systemName: system.systemName })

    ctx.body = stations.filter(result => result.systemName === system.systemName)
  })

  router.get('/api/v1/carrier/ident/:carrierIdent', async (ctx, next) => {
    const { carrierIdent } = ctx.params

    const carrier = await dbAsync.get('SELECT * FROM stations.stations WHERE stationType = \'FleetCarrier\' AND stationName = @carrierIdent', { carrierIdent })
    if (!carrier) return NotFoundResponse(ctx, 'Carrier not found')

    ctx.body = carrier
  })

  router.get('/api/v1/carrier/ident/:carrierIdent/commodities', async (ctx, next) => {
    const { carrierIdent } = ctx.params

    const commodities = await dbAsync.all('SELECT * FROM trade.commodities WHERE fleetCarrier = 1 AND stationName = @carrierIdent COLLATE NOCASE ORDER BY commodityName ASC', { carrierIdent })
    if (commodities.length === 0) return NotFoundResponse(ctx, 'Carrier market not found')
    ctx.body = commodities
  })

  router.get('/api/v1/system/name/:systemName/market/name/:stationName/commodities', async (ctx, next) => {
    const { systemName, stationName } = ctx.params

    // Validate system name
    const system = await getSystemByName(systemName)
    if (!system) return NotFoundResponse(ctx, 'System not found')

    const commodities = await dbAsync.all('SELECT * FROM trade.commodities WHERE systemName = @systemName AND stationName = @stationName COLLATE NOCASE ORDER BY commodityName ASC', { systemName: system.systemName, stationName })
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
      FROM trade.commodities c
        LEFT JOIN stations.stations s ON c.marketId = s.marketId 
      WHERE c.systemName = @systemName
        ORDER BY commodityName ASC
    `, { systemName: system.systemName })
    ctx.body = commodities.filter(result => result.systemName === system.systemName)
  })

  router.get('/api/v1/system/name/:systemName/commodity/name/:commodityName', async (ctx, next) => {
    const {
      systemName,
      commodityName
    } = ctx.params
    const {
      maxDaysAgo = DEFAULT_MAX_RESULTS_AGE
    } = ctx.query

    // Validate system name
    const system = await getSystemByName(systemName)
    if (!system) return NotFoundResponse(ctx, 'System not found')

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
      FROM trade.commodities c
        LEFT JOIN stations.stations s ON c.marketId = s.marketId
      WHERE c.systemName = @systemName
        AND c.commodityName = @commodityName
        AND c.updatedAtDay > '${getISODate(`-${maxDaysAgo}`)}'
      ORDER BY c.stationName
      `, { systemName: system.systemName, commodityName })
    ctx.body = commodities.filter(result => result.systemName === system.systemName)
  })

  router.get('/api/v1/system/name/:systemName/commodities/imports', async (ctx, next) => {
    const { systemName } = ctx.params
    const {
      minVolume = 1,
      minPrice = 1,
      fleetCarriers = null,
      maxDaysAgo = DEFAULT_MAX_RESULTS_AGE
    } = ctx.query

    // Validate system name
    const system = await getSystemByName(systemName)
    if (!system) return NotFoundResponse(ctx, 'System not found')

    const filters = [
      `AND (c.demand >= ${parseInt(minVolume)} OR c.demand = 0)`, // Zero is infinite demand
      `AND c.sellPrice >= ${parseInt(minPrice)}`,
      `AND c.updatedAtDay > '${getISODate(`-${maxDaysAgo}`)}'`
    ]

    if (paramAsBoolean(fleetCarriers) !== null) {
      filters.push(`AND c.fleetCarrier = ${paramAsInt(fleetCarriers)}`)
    }

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
      FROM trade.commodities c
        LEFT JOIN stations.stations s ON c.marketId = s.marketId 
      WHERE c.systemName = @systemName
        ${filters.join(' ')}
      ORDER BY c.commodityName ASC
    `, { systemName: system.systemName })

    ctx.body = commodities
      ? commodities.filter(result => result.systemName === system.systemName)
      : 'No imported commodities'
  })

  router.get('/api/v1/system/name/:systemName/commodities/exports', async (ctx, next) => {
    const { systemName } = ctx.params
    const {
      minVolume = 1,
      maxPrice = null,
      fleetCarriers = null,
      maxDaysAgo = DEFAULT_MAX_RESULTS_AGE
    } = ctx.query

    // Validate system name
    const system = await getSystemByName(systemName)
    if (!system) return NotFoundResponse(ctx, 'System not found')

    const filters = [
      `AND c.stock >= ${parseInt(minVolume)}`,
      `AND c.updatedAtDay > '${getISODate(`-${maxDaysAgo}`)}'`
    ]

    if (maxPrice !== null) { filters.push(`AND c.buyPrice <= ${parseInt(maxPrice)}`) }

    if (paramAsBoolean(fleetCarriers) !== null) {
      filters.push(`AND c.fleetCarrier = ${paramAsInt(fleetCarriers)}`)
    }

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
      FROM trade.commodities c
        LEFT JOIN stations.stations s ON c.marketId = s.marketId 
      WHERE c.systemName = @systemName
        ${filters.join(' ')}
      ORDER BY c.commodityName ASC
    `, { systemName: system.systemName })

    ctx.body = commodities.filter(result => result.systemName === system.systemName)
  })

  router.get('/api/v1/system/name/:systemName/commodity/name/:commodityName/nearby/imports', async (ctx, next) => {
    const { systemName, commodityName } = ctx.params
    let {
      minVolume = 1,
      minPrice = 1,
      maxDistance = DEFAULT_NEARBY_SYSTEMS_DISTANCE,
      fleetCarriers = null,
      maxDaysAgo = DEFAULT_MAX_RESULTS_AGE
    } = ctx.query
    if (maxDistance > MAX_NEARBY_SYSTEMS_DISTANCE) { maxDistance = MAX_NEARBY_SYSTEMS_DISTANCE }
    maxDistance = parseInt(maxDistance)

    // Validate system name
    const system = await getSystemByName(systemName)
    if (!system) return NotFoundResponse(ctx, 'System not found')
    const { systemX, systemY, systemZ } = system

    const filters = [
      `AND (c.demand >= ${parseInt(minVolume)} OR c.demand = 0)`, // Zero is infinite demand
      `AND c.sellPrice >= ${parseInt(minPrice)}`
    ]

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
        c.updatedAt,
        ROUND(SQRT(POWER(c.systemX-@systemX,2)+POWER(c.systemY-@systemY,2)+POWER(c.systemZ-@systemZ,2))) AS distance
      FROM trade.commodities c 
        LEFT JOIN stations.stations s ON c.marketId = s.marketId 
      WHERE c.commodityName = @commodityName COLLATE NOCASE
        AND c.systemName != @systemName
        AND c.updatedAtDay > '${getISODate(`-${maxDaysAgo}`)}'
        AND distance <= @maxDistance
        ${filters.join(' ')}
      ORDER BY c.sellPrice DESC
        LIMIT ${MAX_NEARBY_COMMODITY_RESULTS}`, {
      commodityName,
      systemX,
      systemY,
      systemZ,
      systemName: system.systemName,
      maxDistance
    })

    ctx.body = commodities.filter(result => result.systemName === system.systemName)
  })

  router.get('/api/v1/system/name/:systemName/commodity/name/:commodityName/nearby/exports', async (ctx, next) => {
    const { systemName, commodityName } = ctx.params
    let {
      minVolume = 1,
      maxPrice = null,
      maxDistance = DEFAULT_NEARBY_SYSTEMS_DISTANCE,
      fleetCarriers = null,
      maxDaysAgo = DEFAULT_MAX_RESULTS_AGE
    } = ctx.query
    if (maxDistance > MAX_NEARBY_SYSTEMS_DISTANCE) { maxDistance = MAX_NEARBY_SYSTEMS_DISTANCE }
    maxDistance = parseInt(maxDistance)

    // Validate system name
    const system = await getSystemByName(systemName)
    if (!system) return NotFoundResponse(ctx, 'System not found')
    const { systemX, systemY, systemZ } = system

    const filters = [
      `AND c.stock >= ${parseInt(minVolume)}`
    ]

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
        c.updatedAt,
        ROUND(SQRT(POWER(c.systemX-@systemX,2)+POWER(c.systemY-@systemY,2)+POWER(c.systemZ-@systemZ,2))) AS distance
      FROM trade.commodities c 
        LEFT JOIN stations.stations s ON c.marketId = s.marketId 
      WHERE c.commodityName = @commodityName COLLATE NOCASE
        AND c.systemName != @systemName
        AND c.updatedAtDay > '${getISODate(`-${maxDaysAgo}`)}'
        AND distance <= @maxDistance
        ${filters.join(' ')}
      ORDER BY c.buyPrice ASC
        LIMIT ${MAX_NEARBY_COMMODITY_RESULTS}`, {
      commodityName,
      systemX,
      systemY,
      systemZ,
      systemName: system.systemName,
      maxDistance
    })

    ctx.body = commodities.filter(result => result.systemName === system.systemName)
  })

  router.get('/api/v1/system/name/:systemName/nearby', async (ctx, next) => {
    const { systemName } = ctx.params
    let {
      maxDistance = DEFAULT_NEARBY_SYSTEMS_DISTANCE
    } = ctx.query

    if (maxDistance > MAX_NEARBY_SYSTEMS_DISTANCE) { maxDistance = MAX_NEARBY_SYSTEMS_DISTANCE }
    maxDistance = parseInt(maxDistance)

    const system = await getSystemByName(systemName)
    if (!system) return NotFoundResponse(ctx, 'System not found')

    const { systemX, systemY, systemZ } = system

    const nearbySectors = getNearbySystemSectors(systemX, systemY, systemZ, maxDistance)
    ctx.body = await dbAsync.all(`
      SELECT
        *,
        ROUND(SQRT(POWER(systemX-@systemX,2)+POWER(systemY-@systemY,2)+POWER(systemZ-@systemZ,2))) AS distance
      FROM systems.systems
        WHERE systemSector IN ('${nearbySectors.join("', '")}')
        AND systemAddress != @systemAddress
        AND distance <= @maxDistance
      ORDER BY distance
        LIMIT ${MAX_NEARBY_SYSTEMS_RESULTS}`, {
      systemX,
      systemY,
      systemZ,
      systemAddress: system.systemAddress,
      maxDistance
    })
  })

  router.get('/api/v1/system/name/:systemName/nearest/:serviceType', async (ctx, next) => {
    const { systemName, serviceType } = ctx.params
    const {
      minLandingPadSize = 1
    } = ctx.query

    const serviceTypes = {
      'interstellar-factors': 'interstellarFactors',
      'material-trader': 'materialTrader',
      'technology-broker': 'technologyBroker',
      'black-market': 'blackMarket',
      'universal-cartographics': 'universalCartographics',
      refuel: 'refuel',
      repair: 'repair',
      shipyard: 'shipyard',
      outfitting: 'outfitting',
      'search-and-rescue': 'searchAndRescue'
    }
    if (!serviceTypes[serviceType]) return NotFoundResponse(ctx, 'Service unknown')

    const system = await getSystemByName(systemName)
    if (!system) return NotFoundResponse(ctx, 'System not found')

    const { systemX, systemY, systemZ } = system

    ctx.body = await dbAsync.all(`
      SELECT
        *,
        ROUND(SQRT(POWER(systemX-@systemX,2)+POWER(systemY-@systemY,2)+POWER(systemZ-@systemZ,2))) AS distance
      FROM stations.stations
        WHERE ${serviceTypes[serviceType]} = 1
          AND maxLandingPadSize >= ${minLandingPadSize}
          AND distance IS NOT NULL
      ORDER BY distance
        LIMIT ${MAX_NEARBY_CONTACTS_RESULTS}`, {
      systemX,
      systemY,
      systemZ
    })
  })
}
