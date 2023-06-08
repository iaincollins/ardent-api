const path = require('path')
const { parentPort } = require('worker_threads')
const { ARDENT_DATA_DIR, SYSTEMS_DB_REF, TRADE_DB_REF } = require('../consts')

const ARDENT_TRADE_DB = path.join(ARDENT_DATA_DIR, '/trade.db')
const ARDENT_SYSTEMS_DB = path.join(ARDENT_DATA_DIR, '/systems.db')

const options = { readonly: true /*, verbose: console.log */ }
const tradeDb = require('better-sqlite3')(ARDENT_TRADE_DB, options)
const systemsDb = require('better-sqlite3')(ARDENT_SYSTEMS_DB, options)

parentPort.on('message', ({ dbRef, sql, parameters }) => {
  if (dbRef === TRADE_DB_REF) {
    const result = tradeDb.prepare(sql).all(parameters)
    parentPort.postMessage(result)
  }
  if (dbRef === SYSTEMS_DB_REF) {
    const result = systemsDb.prepare(sql).all(parameters)
    parentPort.postMessage(result)
  }
})
