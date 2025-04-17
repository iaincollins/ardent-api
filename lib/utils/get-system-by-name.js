const dbAsync = require('../db/db-async')

module.exports = async (systemName) => {
  const systems = await dbAsync.all('SELECT * FROM systems.systems WHERE systemName = @systemName COLLATE NOCASE', { systemName })
  if (systems?.length === 0) {
    return null // If no results return null
  } else if (systems?.length === 1) {
    return systems[0] // If exactly one result, return it
  } else {
    // If there are multiple matching systems (e.g. 'i_Carinae' or 'I Carinae')
    // attempt to match on exact case.
    for (const system of systems) {
      if (system.systemName === systemName) return system
    }
    // If there is no exact match just return the first result #YOLO
    return systems[0]
  }
}
