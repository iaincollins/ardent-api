const dbAsync = require('./db/db-async')
const { ARDENT_API_HOSTNAME } = require('./consts')

// Warms the cache by hitting the 'import' stats endpoint for every commodity.
// This has the knock-on effect of ensuring that all the commodity data is in 
// memory and so getting export data for commodities is also equally fast.
//
// This script was created because low traffic volumes seems to lead to data in 
// SQLite being unloaded from memory, resulting in queries taking 10-20 seconds 
// instead of being sub-second.
//
// I was unable to resolve the issue through changes to SQLite cache behaviour.
// The database for star systems is much larger (over 100 million entries) but
// does not have any performance problems, I suspect the much greater volume of
// writes to the trade database and/or RAM constraints on the production server
// are underlying factors triggering the performance issue for commodities.
//
// Queries are performed sequentially to avoid unnecessary load on the server.
// 
// This task takes ~15 minutes to run when the cache is cold and ~3 minutes when
// the cache warmed up - the goal is to keep it always warm.
module.exports = async () => {
  //console.time('Time warm cache')
  try {
    const commodities = await dbAsync.all(`SELECT DISTINCT(commodityName) FROM commodities`)
    for(let i = 0; i< commodities.length; i++){
      const { commodityName } = commodities[i]
      const url = `https://${ARDENT_API_HOSTNAME}/v1/commodity/name/${commodityName}/imports`
      //console.time(`Time to fetch ${commodityName}`)
      const res = await fetch(url)
      if (!res.ok) console.error(`Cache warm error fetching: ${url}`)
      //console.timeEnd(`Time to fetch ${commodityName}`)
    }
  } catch (e) {
    return console.error('Cache warm failed:', e)
  }
  //console.timeEnd('Time warm cache')
}
