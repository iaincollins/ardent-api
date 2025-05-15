const dbAsync = require('../../lib/db/db-async')

module.exports = (router) => {
  router.get('/api/v2/search/system/name/:systemName', async (ctx, next) => {
    const { systemName } = ctx.params
    if (systemName.length < 1) {
      ctx.status = 406
      ctx.body = {
        error: 'System name too short',
        message: 'Searching for a system by name requires at least 1 character'
      }
      return null
    }
    const systems = await dbAsync.all('SELECT * FROM systems.systems WHERE systemName LIKE @systemName LIMIT 25', { systemName: `${systemName}%` })

    // If there are other systems with the same name, flag that in the response
    for (const system of systems) {
      const similarlyNamedSystems = await dbAsync
        .all('SELECT * FROM systems.systems WHERE systemName = @systemName COLLATE NOCASE AND systemAddress != @systemAddress', {
          systemName: system.systemName,
          systemAddress: system.systemAddress
        })
      if (similarlyNamedSystems?.length > 0) {
        system.ambiguous = true
      }
    }

    ctx.body = systems
  })

  router.get('/api/v2/search/station/name/:stationName', async (ctx, next) => {
    const { stationName } = ctx.params
    if (stationName.length < 1) {
      ctx.status = 406
      ctx.body = {
        error: 'Station name too short',
        message: 'Searching by station name requires at least 1 character'
      }
      return null
    }
    const stations = await dbAsync.all('SELECT * FROM stations.stations WHERE stationType IS NOT NULL AND stationName LIKE @stationName LIMIT 25', { stationName: `${stationName}%` })
    ctx.body = stations
  })
}
