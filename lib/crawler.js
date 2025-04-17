// This script was originally written to force cache warming, but with that
// code having been refactored am now using it for performance testing.
const dbAsync = require('./db/db-async')
const { ARDENT_API_BASE_URL } = require('./consts')

module.exports = async (baseUrl = ARDENT_API_BASE_URL) => {
  console.time('Crawl commodities')
  try {
    const commodities = await dbAsync.all('SELECT DISTINCT(commodityName) FROM commodities')
    console.log(`Fetching commodity imports from ${baseUrl}`)
    for (let i = 0; i < commodities.length; i++) {
      const { commodityName } = commodities[i]
      const url = `${baseUrl}/v1/commodity/name/${commodityName}/imports`
      console.time(`${i + 1} of ${commodities.length} ${commodityName}`)
      const res = await fetch(url)
      if (!res.ok) console.error(`Crawler error fetching: ${url}`)
      console.timeEnd(`${i + 1} of ${commodities.length} ${commodityName}`)
    }
  } catch (e) {
    return console.error('Crawler failed:', e)
  }
  console.timeEnd('Crawl commodities')
}
