const dbAsync = require('../../lib/db/db-async')

module.exports = (router) => {
  router.get('/api/v1/search/system/name/:systemName', async (ctx, next) => {
    const { systemName } = ctx.params
    if (systemName.length < 3) {
      ctx.status = 406
      ctx.body = {
        error: 'System name too short',
        message: 'Searching for a system by name requires at least the first 3 characters of the name'
      }
      return null
    }
    const systems = await dbAsync.all('SELECT * FROM systems.systems WHERE systemName LIKE @systemName LIMIT 25', { systemName: `${systemName}%` })
    ctx.body = systems
  })
}
