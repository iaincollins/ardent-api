const fs = require('fs')
const path = require('path')
const { paramAsBoolean, paramAsInt } = require('../../lib/utils/parse-query-params')
const { tradeDbAsync } = require('../../lib/db/db-async')
const { ARDENT_CACHE_DIR } = require('../../lib/consts')
const NotFoundResponse = require('../../lib/response/not-found')

const COMMODITIES_REPORT = path.join(ARDENT_CACHE_DIR, 'commodities.json')
const CORE_SYSTEMS_1000_REPORT = path.join(ARDENT_CACHE_DIR, 'core-systems-1000.json')
const COLONIA_SYSTEMS_1000_REPORT = path.join(ARDENT_CACHE_DIR, 'colonia-systems-1000.json')
const MAX_COMMODITY_SORTED_RESULTS = 100

module.exports = (router) => {
  router.get('/api/v1/commodities', async (ctx, next) => {
    ctx.body = JSON.parse(fs.readFileSync(COMMODITIES_REPORT)).commodities
  })

  router.get('/api/v1/commodities/core-systems-1000', async (ctx, next) => {
    ctx.body = JSON.parse(fs.readFileSync(CORE_SYSTEMS_1000_REPORT))
  })

  router.get('/api/v1/commodities/colonia-systems-1000', async (ctx, next) => {
    ctx.body = JSON.parse(fs.readFileSync(COLONIA_SYSTEMS_1000_REPORT))
  })

  router.get('/api/v1/commodity/name/:commodityName', async (ctx, next) => {
    let { commodityName } = ctx.params
    commodityName = commodityName.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '')
    const pathToFile = path.join(ARDENT_CACHE_DIR, 'commodities', `${commodityName}`, `${commodityName}.json`)
    if (!fs.existsSync(pathToFile)) return NotFoundResponse(ctx, 'Commodity not found')
    ctx.body = JSON.parse(fs.readFileSync(pathToFile))
  })

  router.get('/api/v1/commodity/name/:commodityName/core-systems-1000', async (ctx, next) => {
    let { commodityName } = ctx.params
    commodityName = commodityName.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '')
    const pathToFile = path.join(ARDENT_CACHE_DIR, 'commodities', `${commodityName}`, 'core-systems-1000.json')
    if (!fs.existsSync(pathToFile)) return NotFoundResponse(ctx, 'Commodity not found')
    ctx.body = JSON.parse(fs.readFileSync(pathToFile))
  })

  router.get('/api/v1/commodity/name/:commodityName/colonia-systems-1000', async (ctx, next) => {
    let { commodityName } = ctx.params
    commodityName = commodityName.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '')
    const pathToFile = path.join(ARDENT_CACHE_DIR, 'commodities', `${commodityName}`, 'colonia-systems-1000.json')
    if (!fs.existsSync(pathToFile)) return NotFoundResponse(ctx, 'Commodity not found')
    ctx.body = JSON.parse(fs.readFileSync(pathToFile))
  })

  router.get('/api/v1/commodity/name/:commodityName/imports', async (ctx, next) => {
    const { commodityName } = ctx.params
    const {
      minVolume = 0, // 0 === infinite demand (but *usually* indicates saturation / low prices)
      minPrice = 1,
      fleetCarriers = null
    } = ctx.query
    const filters = [
      `AND demand >= ${parseInt(minVolume)}`,
      `AND sellPrice >= ${parseInt(minPrice)}`
    ]
    if (paramAsBoolean(fleetCarriers) !== null) { filters.push(`AND fleetCarrier = ${paramAsInt(fleetCarriers)}`) }

    const commodities = await tradeDbAsync.all(`
      SELECT * FROM commodities WHERE
        commodityName = @commodityName COLLATE NOCASE
        ${filters.join(' ')}
      ORDER BY sellPrice DESC
        LIMIT ${MAX_COMMODITY_SORTED_RESULTS}`, {
      commodityName
    })

    ctx.body = commodities
  })

  router.get('/api/v1/commodity/name/:commodityName/exports', async (ctx, next) => {
    const { commodityName } = ctx.params
    const {
      minVolume = 1,
      maxPrice = null,
      fleetCarriers = null
    } = ctx.query
    const filters = [
      `AND stock >= ${parseInt(minVolume)}`
    ]

    if (maxPrice !== null) { filters.push(`AND buyPrice <= ${parseInt(maxPrice)}`) }

    if (paramAsBoolean(fleetCarriers) !== null) { filters.push(`AND fleetCarrier = ${paramAsInt(fleetCarriers)}`) }

    const commodities = await tradeDbAsync.all(`
      SELECT * FROM commodities WHERE
        commodityName = @commodityName COLLATE NOCASE
        ${filters.join(' ')}
      ORDER BY buyPrice ASC
        LIMIT ${MAX_COMMODITY_SORTED_RESULTS}`, {
      commodityName
    })

    ctx.body = commodities
  })
}
