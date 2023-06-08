const { tradeDbAsync, systemsDbAsync } = require('../../lib/db/db-async')
const { getNearbySystemSectors } = require('../../lib/system-sectors')
const { paramAsBoolean, paramAsInt } = require('../../lib/utils/parse-query-params')

const DEFAULT_NEAREST_SYSTEMS_DISTANCE = 100
const MAX_NEAREST_SYSTEMS_DISTANCE = 500 // Distance in Ly
const MAX_NEAREST_SYSTEMS_RESULTS = 1000
const MAX_NEAREST_COMMODITY_RESULTS = 1000

module.exports = (router) => {
  router.get('/api/v1/system/name/:systemName', async (ctx, next) => {
    const { systemName } = ctx.params
    const system = await getSystemByName(systemName)
    if (!system) {
      ctx.status = 404
      ctx.body = 'System not found'
      return
    }
    ctx.body = system
  })

  router.get('/api/v1/system/name/:systemName/commodities', async (ctx, next) => {
    const { systemName } = ctx.params
    const commodities = await tradeDbAsync.all('SELECT * FROM commodities WHERE systemName = @systemName COLLATE NOCASE', { systemName })
    ctx.body = commodities || 'No commodities found in system'
  })

  router.get('/api/v1/system/name/:systemName/commodity/name/:commodityName', async (ctx, next) => {
    const { systemName, commodityName } = ctx.params
    const commodities = await tradeDbAsync.all('SELECT * FROM commodities WHERE systemName = @systemName COLLATE NOCASE AND commodityName = @commodityName COLLATE NOCASE', { systemName, commodityName })
    ctx.body = commodities || 'No instances of commodity found in system'
  })

  router.get('/api/v1/system/name/:systemName/commodities/imports', async (ctx, next) => {
    const { systemName } = ctx.params
    const {
      minVolume = 1,
      minPrice = 1,
      fleetCarriers = null
    } = ctx.query

    const filters = [
      `AND demand >= ${parseInt(minVolume)}`,
      `AND sellPrice >= ${parseInt(minPrice)}`
    ]
    if (paramAsBoolean(fleetCarriers) !== null) {
      filters.push(`AND fleetCarrier = ${paramAsInt(fleetCarriers)}`)
    }

    const commodities = await tradeDbAsync.all(`
      SELECT * FROM commodities WHERE
        systemName = @systemName COLLATE NOCASE
        ${filters.join(' ')}
      ORDER BY commodityName ASC
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

    const filters = [
      `AND stock >= ${parseInt(minVolume)}`
    ]
    if (maxPrice !== null) { filters.push(`AND buyPrice <= ${parseInt(maxPrice)}`) }
    if (paramAsBoolean(fleetCarriers) !== null) {
      filters.push(`AND fleetCarrier = ${paramAsInt(fleetCarriers)}`)
    }

    const commodities = await tradeDbAsync.all(`
      SELECT *FROM commodities WHERE
        systemName = @systemName COLLATE NOCASE
        ${filters.join(' ')}
      ORDER BY commodityName ASC
    `, { systemName })
    ctx.body = commodities || 'No imported commodities'
  })

  router.get('/api/v1/system/name/:systemName/commodity/name/:commodityName/nearest/imports', async (ctx, next) => {
    const { systemName, commodityName } = ctx.params
    let {
      minVolume = 1,
      minPrice = 1,
      maxDistance = DEFAULT_NEAREST_SYSTEMS_DISTANCE,
      fleetCarriers = null
    } = ctx.query
    if (maxDistance > MAX_NEAREST_SYSTEMS_DISTANCE) { maxDistance = MAX_NEAREST_SYSTEMS_DISTANCE }

    const { systemAddress, systemX, systemY, systemZ } = await getSystemByName(systemName)

    if (!systemAddress) {
      ctx.status = 404
      ctx.body = 'System not found'
      return
    }

    const filters = [
      `AND demand >= ${parseInt(minVolume)}`,
      `AND sellPrice >= ${parseInt(minPrice)}`
    ]
    if (paramAsBoolean(fleetCarriers) !== null) { filters.push(`AND fleetCarrier = ${paramAsInt(fleetCarriers)}`) }

    const commodities = await tradeDbAsync.all(`
      SELECT
        *,
        ROUND(SQRT(POWER(systemX-@systemX,2)+POWER(systemY-@systemY,2)+POWER(systemZ-@systemZ,2))) AS distance
      FROM commodities WHERE
        commodityName = @commodityName COLLATE NOCASE
        ${filters.join(' ')}
      ORDER BY sellPrice DESC
        LIMIT ${MAX_NEAREST_COMMODITY_RESULTS}`, {
      commodityName,
      systemX,
      systemY,
      systemZ,
      maxDistance: parseInt(maxDistance)
    })

    ctx.body = commodities || 'Commodity not found'
  })

  router.get('/api/v1/system/name/:systemName/commodity/name/:commodityName/nearest/exports', async (ctx, next) => {
    const { systemName, commodityName } = ctx.params
    let {
      minVolume = 1,
      maxPrice = null,
      maxDistance = DEFAULT_NEAREST_SYSTEMS_DISTANCE,
      fleetCarriers = null
    } = ctx.query
    if (maxDistance > MAX_NEAREST_SYSTEMS_DISTANCE) { maxDistance = MAX_NEAREST_SYSTEMS_DISTANCE }
    maxDistance = parseInt(maxDistance)

    const { systemAddress, systemX, systemY, systemZ } = await getSystemByName(systemName)

    if (!systemAddress) {
      ctx.status = 404
      ctx.body = 'System not found'
      return
    }

    const filters = [
      `AND stock >= ${parseInt(minVolume)}`
    ]

    if (maxPrice !== null) { filters.push(`AND buyPrice <= ${parseInt(maxPrice)}`) }

    if (paramAsBoolean(fleetCarriers) !== null) { filters.push(`AND fleetCarrier = ${paramAsInt(fleetCarriers)}`) }

    const commodities = await tradeDbAsync.all(`
      SELECT
        *,
        ROUND(SQRT(POWER(systemX-@systemX,2)+POWER(systemY-@systemY,2)+POWER(systemZ-@systemZ,2))) AS distance
      FROM commodities WHERE
        commodityName = @commodityName COLLATE NOCASE
        ${filters.join(' ')}
      ORDER BY buyPrice ASC
        LIMIT ${MAX_NEAREST_COMMODITY_RESULTS}`, {
      commodityName,
      systemX,
      systemY,
      systemZ,
      maxDistance
    })

    ctx.body = commodities || 'Commodity not found'
  })

  router.get('/api/v1/system/name/:systemName/nearest', async (ctx, next) => {
    const { systemName } = ctx.params
    let {
      maxDistance = DEFAULT_NEAREST_SYSTEMS_DISTANCE
    } = ctx.query

    if (maxDistance > MAX_NEAREST_SYSTEMS_DISTANCE) { maxDistance = MAX_NEAREST_SYSTEMS_DISTANCE }
    maxDistance = parseInt(maxDistance)

    const { systemAddress, systemX, systemY, systemZ } = await getSystemByName(systemName)

    if (!systemAddress) {
      ctx.status = 404
      ctx.body = 'System not found'
      return
    }

    const nearbySectors = getNearbySystemSectors(systemX, systemY, systemZ, maxDistance)
    const nearestSystems = await systemsDbAsync.all(`
      SELECT
        *,
        ROUND(SQRT(POWER(systemX-@systemX,2)+POWER(systemY-@systemY,2)+POWER(systemZ-@systemZ,2))) AS distance FROM systems
      WHERE systemSector IN ('${nearbySectors.join("', '")}')
        AND SQRT(POWER(systemX-@systemX,2)+POWER(systemY-@systemY,2)+POWER(systemZ-@systemZ,2)) < @maxDistance
      ORDER BY distance
      LIMIT ${MAX_NEAREST_SYSTEMS_RESULTS + 1}
      `, {
      systemX,
      systemY,
      systemZ,
      maxDistance
    })

    nearestSystems.shift() // Remove first result as it === system

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
