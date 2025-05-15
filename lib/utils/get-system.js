const dbAsync = require('../db/db-async')

function getSystem (systemIdentifer, systemIdentiferType = 'address') {
  if (systemIdentiferType === 'address') {
    return getSystemByAddress(systemIdentifer)
  } else if (systemIdentiferType === 'name') {
    return getSystemByName(systemIdentifer)
  } else {
    return null
  }
}

async function getSystemByName (systemName) {
  const systems = await dbAsync.all('SELECT * FROM systems.systems WHERE systemName = @systemName COLLATE NOCASE', { systemName })
  let system = systems[0] // Default behaviour, use first result
  if (systems?.length === 1) {
    return system // If exactly one result, return it
  } else if (systems?.length > 1) {
    // If there are multiple matching systems (e.g. 'i_Carinae' or 'I Carinae')
    // attempt to match on exact case.
    for (const s of systems) {
      if (s.systemName === systemName) {
        system = s // If there is an exact case match, return it
        break
      }
    }
    // Return other systems with the same name in the property 'disambiguation'
    // if there is more than one possible case-insensitive match
    system.disambiguation = systems.filter(s => s.systemAddress !== system.systemAddress)
  }
  return system
}

async function getSystemByAddress (systemAddress) {
  const system = await dbAsync.get('SELECT * FROM systems.systems WHERE systemAddress = @systemAddress', { systemAddress })
  if (system) {
    const similarlyNamedSystems = await dbAsync
      .all('SELECT * FROM systems.systems WHERE systemName = @systemName COLLATE NOCASE AND systemAddress != @systemAddress', {
        systemName: system.systemName,
        systemAddress: system.systemAddress
      })
    if (similarlyNamedSystems?.length > 0) {
      system.disambiguation = similarlyNamedSystems
    }
  }
  return system
}

module.exports = {
  getSystem,
  getSystemByName,
  getSystemByAddress
}
