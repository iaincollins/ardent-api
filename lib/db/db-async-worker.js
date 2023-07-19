const { parentPort } = require('worker_threads')
const {
  ARDENT_SYSTEMS_DB,
  ARDENT_STATIONS_DB,
  ARDENT_TRADE_DB,
  SYSTEMS_DB_REF,
  STATIONS_DB_REF,
  TRADE_DB_REF,
  DB_REF
} = require('../consts')

const options = { readonly: true /*, verbose: console.log */ }

const systemsDb = require('better-sqlite3')(ARDENT_SYSTEMS_DB, options)
const stationsDb = require('better-sqlite3')(ARDENT_STATIONS_DB, options)
const tradeDb = require('better-sqlite3')(ARDENT_TRADE_DB, options)

// This connection should replace the three seperate connections above, when
// I have time to do refactoring of all the existing API queries.
const sqlLiteDatabases = require('better-sqlite3')(':memory:')
sqlLiteDatabases.exec(`attach '${ARDENT_SYSTEMS_DB}' as systems;`)
sqlLiteDatabases.exec(`attach '${ARDENT_STATIONS_DB}' as stations;`)
sqlLiteDatabases.exec(`attach '${ARDENT_TRADE_DB}' as trade;`)

parentPort.on('message', ({ dbRef, sql, parameters }) => {
  if (dbRef === SYSTEMS_DB_REF) {
    const result = systemsDb.prepare(sql).all(parameters)
    parentPort.postMessage(result)
  }
  if (dbRef === STATIONS_DB_REF) {
    const result = stationsDb.prepare(sql).all(parameters)
    parentPort.postMessage(result)
  }
  if (dbRef === TRADE_DB_REF) {
    const result = tradeDb.prepare(sql).all(parameters)
    parentPort.postMessage(result)
  }
  if (dbRef === DB_REF) {
    const result = sqlLiteDatabases.prepare(sql).all(parameters)
    parentPort.postMessage(result)
  }
})
