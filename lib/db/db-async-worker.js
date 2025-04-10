const { parentPort } = require('worker_threads')
const {
  ARDENT_SYSTEMS_DB,
  ARDENT_LOCATIONS_DB,
  ARDENT_STATIONS_DB,
  ARDENT_TRADE_DB
} = require('../consts')

const options = { 
  readonly: false,
  /* verbose: console.log */
}

// This connection should replace the three seperate connections above, when
// I have time to do refactoring of all the existing API queries.
const sqlLiteDatabases = require('better-sqlite3')(':memory:', options)
sqlLiteDatabases.pragma('journal_mode = WAL')
sqlLiteDatabases.pragma('wal_autocheckpoint = 0')
sqlLiteDatabases.pragma('query_only = true')

sqlLiteDatabases.exec(`attach '${ARDENT_SYSTEMS_DB}' as systems;`)
sqlLiteDatabases.exec(`attach '${ARDENT_LOCATIONS_DB}' as locations;`)
sqlLiteDatabases.exec(`attach '${ARDENT_STATIONS_DB}' as stations;`)
sqlLiteDatabases.exec(`attach '${ARDENT_TRADE_DB}' as trade;`)

parentPort.on('message', ({ sql, parameters }) => {
  const result = sqlLiteDatabases.prepare(sql).all(parameters)
  parentPort.postMessage(result)
})
