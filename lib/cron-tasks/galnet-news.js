const fs = require('fs')
const { ARDENT_GALNET_NEWS_CACHE } = require('../consts')

const GALNET_NEWS_FEED = 'https://cms.zaonce.net/en-GB/jsonapi/node/galnet_article'

module.exports = async () => {
  try {
    const req = await fetch(GALNET_NEWS_FEED)
    const json = await req.json()

    const data = json?.data.map(item => ({
      published: new Date(item.attributes.published_at).toISOString(),
      date: item.attributes['field_galnet_date'],
      title: item.attributes.title,
      text: item.attributes.body.value.replace(/\r/g, ''),
      slug: item.attributes.field_slug,
      url: `https://community.elitedangerous.com/galnet/uid/${item.attributes.field_galnet_guid}`
    }))

    fs.writeFileSync(ARDENT_GALNET_NEWS_CACHE, JSON.stringify(data, null, 2))
  } catch (e) {
    console.error('Failed to fetch galnet news', e)
  }
}