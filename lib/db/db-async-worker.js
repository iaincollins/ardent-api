const { parentPort } = require('worker_threads')
const {
  ARDENT_SYSTEMS_DB,
  ARDENT_STATIONS_DB,
  ARDENT_TRADE_DB,
  SYSTEMS_DB_REF,
  STATIONS_DB_REF,
  TRADE_DB_REF
} = require('../consts')

const options = { readonly: true /*, verbose: console.log */ }
const systemsDb = require('better-sqlite3')(ARDENT_SYSTEMS_DB, options)
const stationsDb = require('better-sqlite3')(ARDENT_STATIONS_DB, options)
const tradeDb = require('better-sqlite3')(ARDENT_TRADE_DB, options)

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
})
