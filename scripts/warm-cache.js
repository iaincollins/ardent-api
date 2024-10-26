const warmCache = require('../lib/warm-cache')
;(async () => {
  await warmCache({ debug: true })
  process.exit()
})()
