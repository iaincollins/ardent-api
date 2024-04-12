const warmCache = require('../lib/warm-cache')
;(async () => {
  await warmCache()
  process.exit()
})()