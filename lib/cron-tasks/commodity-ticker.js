const fs = require('fs')
const { getISOTimestamp } = require('../utils/dates')
const dbAsync = require('../db/db-async')
const { ARDENT_MARKET_TICKER_CACHE } = require('../consts')

module.exports = async () => {
  const stations = await dbAsync.all(`
    SELECT * FROM stations.stations AS s WHERE
      s.stationType != 'FleetCarrier'
      AND s.stationType IS NOT NULL
    GROUP BY s.stationName
    ORDER BY s.updatedAt DESC
    LIMIT 50`)

  const imports = []
  for (const station of stations) {
    const stationImport = await dbAsync.get(`
      SELECT * FROM trade.commodities as c
        WHERE c.marketId = @marketId
        AND (c.demand > 1000 OR c.demand = 0)
        AND c.demandBracket = 3
        AND c.updatedAt > '${getISOTimestamp('-1')}'
      ORDER BY c.sellPrice DESC
      LIMIT 5`, { marketId: station.marketId })
    if (stationImport) imports.push(stationImport)
  }

  const exports = []
  for (const station of stations) {
    const stationExport = await dbAsync.get(`
      SELECT * FROM trade.commodities as c
        WHERE c.marketId = @marketId
        AND c.stock > 1000
        AND c.stockBracket = 3
        AND c.updatedAt > '${getISOTimestamp('-1')}'
      ORDER BY c.buyPrice DESC
      LIMIT 5`, { marketId: station.marketId })
    if (stationExport) exports.push(stationExport)
  }

  const data = [
    ...imports,
    ...exports
  ]
    .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt)) // Sort results by recency
    .filter((obj1, i, arr) => arr.findIndex(obj2 => (obj2.marketId === obj1.marketId)) === i) // Filter so only one entry for each station

  fs.writeFileSync(ARDENT_MARKET_TICKER_CACHE, JSON.stringify(data, null, 2))
}
