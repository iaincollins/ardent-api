# Ardent API

The Ardent API powers [ardent-industry.com](https://ardent-industry.com)

The API is considered stable and no breaking changes are anticipated, but
expansion of parameters that be passed and enrichment of responses is planned.

## About this software

The Ardent API provides access to data submitted to the Elite Dangerous Data 
Network and is stored by the 
[Ardent Collector](https://github.com/iaincollins/ardent-collector/).

The API provides access to information for over 100,000,000 star systems and
tracks millions of buy and sell orders for trade commodities sold in stations,
ports and on carriers throughout the galaxy.

The Ardent API provides access to the data and automatically generated trade
reports via a REST API via a global Content Distribution Network.

## REST API

The folllowing is a summary of supported API endpoints and a description of 
the behaviour and options supported.

Notes:

* The `fleetCarriers` boolean option supported on some of the endpoints is `null` 
by default. If set to `true` or `1` the response will only include results for 
fleet carriers, if set to `false` or `0`  the response will exclude results for 
fleet carriers. If not specified, or set to any other value, the response will 
include results for all stations (including from, but not limited to, fleet 
carriers).

* The `maxDistance` option is light years (`ly`) and is used to filter results 
from other systems based on the distance of that systems main star from the 
main star of the system the result is relative to. You cannot specify a 
fractional value in light seconds (`ls`) to filter results within a system; 
although the approximate distance to the main star for each station is 
displayed (when known) it is not taken into account.

* As of API version `3.0.0` the commodity `import` and `export` endpoints
support a `maxDaysAgo` option that defaults to `90` days. This filters out data 
older than 90 days from results by default, which makes results more relevant
and improves response times. You can still request to include older data by
explicitly specifying a greater value. Records are updated when newer 
information is submitted, but older entries never expire.

### Get version

Get Ardent API software version.

* https://api.ardent-industry.com/v1/version

### Get statistics

Get statistics for the current databases (updated every 15 minutes).

* https://api.ardent-industry.com/v1/stats

```
    Star systems: 102,694,411
    Trade systems: 16,419
    Trade stations: 42,695
    Trade carriers: 5,360
    Trade orders: 10,773,236
    Trade updates in last 24 hours: 563,215
    Trade updates in last 7 days: 2,475,140
    Trade updates in last 30 days: 7,234,476
```

### Get trade reports

Trade reports have analysis and details about bulk commodities being traded in
systems in and around the Core Systems (aka The Bubble) and near Colonia.

The 'Core Systems 1000' and the 'Colonia Systems 1000' reports intentionally 
exclude market data from Fleet Carriers to avoid skewing the summaries with 
volitile data. The reports only include trade orders where supply or demand 
for a given commodity is at least 1000T.

* https://api.ardent-industry.com/v1/commodities/core-systems-1000
* https://api.ardent-industry.com/v1/commodities/colonia-systems-1000

### Get commodities reports

The Commodities report includes all known traded commodities, their price
ranges (min/max/avg) and the total supply and demand for each commodity.

The commodity report intentionally excludes market data from Fleet Carriers to 
avoid skewing reports with unreliable data.

* https://api.ardent-industry.com/v1/commodities

#### Example commodities report

    [ ... {
      "commodityName": "gold",
      "maxBuyPrice": 59797,
      "minBuyPrice": 3979,
      "avgBuyPrice": 44441,
      "totalStock": 73016533,
      "maxSellPrice": 70761,
      "minSellPrice": 3978,
      "avgSellPrice": 48259,
      "totalDemand": 1899662825
    } ... ]

### Commodity information

#### Get information for a commodity

Get summary report for a commodity.

* https://api.ardent-industry.com/v1/commodity/name/{commodityName}

e.g. https://api.ardent-industry.com/v1/commodity/name/gold

#### Get importers for a commodity

Get a list of places importing a commodity - places you can sell you - ordered 
by the highest price they are willing to pay. Returns best 100 matching results.

* https://api.ardent-industry.com/v1/commodity/name/{commodityName}/imports

e.g. https://api.ardent-industry.com/v1/commodity/name/gold/imports

##### Supported query parameters

* minVolume (int); default 1
* minPrice (int); default 1
* fleetCarriers (bool); default null
* maxDaysAgo (int); default 90

#### Get exporters for a commodity

Get a list of exports of a commodity - places where you can buy from - ordered 
by the lowest price you can buy it for. Returns best 100 matching results.

* https://api.ardent-industry.com/v1/commodity/name/{commodityName}/exports

e.g. https://api.ardent-industry.com/v1/commodity/name/gold/exports

##### Supported query parameters

 * minVolume (int); default 1
 * maxPrice (int); default null
 * fleetCarriers (bool); default null
 * maxDaysAgo (int); default 90

#### Get trade reports for a commodity

Ardent Trade Reports for a commodity are updated daily and list recommended
places to buy and sell commodities from, based on price, supply and location.

The 'Core Systems 1000' and the 'Colonia Systems 1000' reports intentionally 
exclude market data from Fleet Carriers to avoid skewing the summaries with 
volitile data. The reports only include trade orders where supply or demand 
for a given commodity is at least 1000T.

* https://api.ardent-industry.com/v1/commodity/name/{commodityName}/core-systems-1000
* https://api.ardent-industry.com/v1/commodity/name/{commodityName}/colonia-systems-1000

e.g. 

* https://api.ardent-industry.com/v1/commodity/name/gold/core-systems-1000
* https://api.ardent-industry.com/v1/commodity/name/gold/colonia-systems-1000

### System information

#### Get information for a system 

Get information about a system.

* https://api.ardent-industry.com/v1/system/name/{systemName}

e.g. https://api.ardent-industry.com/v1/system/name/Sol

#### Get a list of nearby systems

Returns a list of up to 1000 nearby systems, ordered by distance.

* https://api.ardent-industry.com/v1/system/name/{systemName}/nearby

e.g. https://api.ardent-industry.com/v1/system/name/Sol/nearby

##### Supported query parameters

* maxDistance (int); default 100, max 500

#### Get commodities traded in a system

Returns a list of all known trade orders in a system.

* https://api.ardent-industry.com/v1/system/name/{systemName}/commodities

e.g. https://api.ardent-industry.com/v1/system/name/Sol/commodities

#### Get commodities imported by a system

Returns a list of all known commodities imported by a system - places where you 
can sell to - ordered by name of the commodity.

* https://api.ardent-industry.com/v1/system/name/{systemName}/commodities/imports

e.g. https://api.ardent-industry.com/v1/system/name/Sol/commodities/imports

##### Supported query parameters

* minVolume (int); default 1
* minPrice (int); default 1
* fleetCarriers (bool); default null

#### Get commodities exported by a system

Returns a list of all known commodities exported by a system - places where you 
can buy from - ordered by name of the commodity.

* https://api.ardent-industry.com/v1/system/name/{systemName}/commodities/exports

e.g. https://api.ardent-industry.com/v1/system/name/Sol/commodities/exports

##### Supported query parameters

* minVolume (int); default 1
* maxPrice (int); default null
* fleetCarriers (bool); default null

#### Get trade data for a commodity in a system

Get all buy/sell orders for a commodity in a system.

* https://api.ardent-industry.com/v1/system/name/{systemName}/commodity/name/{commodityName}

e.g. https://api.ardent-industry.com/v1/system/name/Sol/commodity/name/gold

#### Get a list of nearby importers of a commodity

Get a list of nearby places that importing a commodity close to the specified 
system. Returns the first 1000 results, ordered by the highest price they are 
willing to pay.

* https://api.ardent-industry.com/v1/system/name/{systemName}/commodity/name/{commodityName}/nearby/imports

e.g. https://api.ardent-industry.com/v1/system/name/Sol/commodity/name/gold/nearby/imports

##### Supported query parameters

* minVolume (int); default 1
* minPrice (int); default 1
* fleetCarriers (bool); default null
* maxDistance (int); default 100, max 500
* maxDaysAgo (int); default 90

#### Get a list of nearby exporters of a commodity

Get a list of nearby places that importing a commodity close to the specified 
system. Returns the first 1000 results, ordered by the lowest price you can buy
it for.

* https://api.ardent-industry.com/v1/system/name/{systemName}/commodity/name/{commodityName}/nearby/exports

e.g. https://api.ardent-industry.com/v1/system/name/Sol/commodity/name/gold/nearby/exports

##### Supported query parameters

* minVolume (int); default 1
* maxPrice (int); default null
* fleetCarriers (bool); default null
* maxDistance (int); default 100, max 500
* maxDaysAgo (int); default 90

#### Get trade data for a commodity in a specific market

Get information about commodity for a specific market.

This was added to support providing information about rare goods, which are 
typically only avalible from a single known market

Support for additional queries by market ID may be added in future.

* https://api.ardent-industry.com/v1/market/{marketId}/commodity/name/{commodityName}

e.g. https://api.ardent-industry.com/v1/market/128106744/commodity/name/lavianbrandy

## Authentication

Experimental support for authentication with Frontier Accounts has been added.

This is not used for anything yet but the goal is to leverage Frontier's API to
enable additional functionality.

https://github.com/EDCD/FDevIDs/tree/master/Frontier%20API

## Credits

_This software would not be possible without work from dozens of enthusiasts 
and hundreds of open source contributors._

Special thanks to Elite Dangerous Community Developers members, Elite 
Dangerous Data Network maintainers, Anthor (Elite Dangerous Star Map) 
and Gareth Harper (Spansh).

Thank you to all those who have created and supported libraries on which this 
software depends and to Frontier Developments plc for supporting third party 
tools.

## Legal

Copyright Iain Collins, 2024.

This software has been released under the GNU Affero General Public License.

Elite Dangerous is copyright Frontier Developments plc. This software is 
not endorsed by nor reflects the views or opinions of Frontier Developments and 
no employee of Frontier Developments was involved in the making of it.
