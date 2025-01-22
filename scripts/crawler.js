const crawler = require('../lib/crawler')
;(async () => {
  const baseUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001/api' : undefined
  await crawler(baseUrl)
  process.exit()
})()
