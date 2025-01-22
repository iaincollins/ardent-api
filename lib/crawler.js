// This script was originally written to force cache warming, but with that
// code having been refactored am now using it for performance testing.
const dbAsync = require('./db/db-async')
const { ARDENT_API_HOSTNAME } = require('./consts')

module.exports = async (debug = true) => {
  console.time('Crawl commodities')
  try {
    const commodities = await dbAsync.all('SELECT DISTINCT(commodityName) FROM commodities')
    if (debug === true) console.log(`Warming cache for ${ARDENT_API_HOSTNAME}`)
    for (let i = 0; i < commodities.length; i++) {
      const { commodityName } = commodities[i]
      const url = `https://${ARDENT_API_HOSTNAME}/v1/commodity/name/${commodityName}/imports`
      if (debug === true) console.time(`${i+1} of ${commodities.length} ${commodityName}`)
      const res = await fetch(url)
      if (!res.ok) console.error(`Crawler error fetching: ${url}`)
      if (debug === true) console.timeEnd(`${i+1} of ${commodities.length} ${commodityName}`)
    }
  } catch (e) {
    return console.error('Crawler failed:', e)
  }
  console.timeEnd('Crawl commodities')
}