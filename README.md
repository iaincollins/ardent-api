# Ardent API

## About this software

The Ardent API provides access to data submitted to the Elite Dangerous Data 
Network (EDDN) and saved by the Ardent Collector service.

The Ardent Data store contains details for over 100,000,000 star systems and
millions of buy and sell orders for trade commodities sold in stations, ports
and on carriers throughout the galaxy.

The Ardent API provides read-only access to the data and automatically trade
reports via a REST API via a global Content Distribution Network.

## REST API

The folllowing is a summary of supported API endpoints and a description of 
the behaviour and options supported.

### Get statistics

Get statistics for the current databases (updated hourly).

* https://api.ardent-industry.com/v1/stats
`
    Star systems: 102,281,852
    Trade systems: 14,044
    Trade stations: 31,110
    Trade carriers: 4,155
    Trade orders: 7,594,059
    Trade updates in last 24 hours: 490
    Trade updates in last 7 days: 367,632
    Trade updates in last 30 days: 5,942,089
    Unique commodities: 385
`
### Get trade reports

Trade reports have analysis and details about bulk commodities being traded in
systems in and around the Core Systems (aka The Bubble) and near Colonia.

These reports intentionally exclude market data from Fleet Carriers to avoid 
skewing reports with unreliable data and only includes values for systems where 
supply or demand for a given commodity is at least 1000T.

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

### Get commodity information

#### Information for a specific commodity

Get summary report for a specific commodity.

* https://api.ardent-industry.com/v1/commodity/name/{commodityName}

e.g. https://api.ardent-industry.com/v1/commodity/name/gold

#### Get importers for a specific commodity

Get a list of places importing a commodity - places you can sell you - ordered 
by the highest price they are willing to pay. Returns best 100 matching results.

* https://api.ardent-industry.com/v1/commodity/name/{commodityName}/imports

e.g. https://api.ardent-industry.com/v1/commodity/name/gold/imports

##### Supported query parameters

* minVolume (int); default 1
* minPrice (int); default 1
* fleetCarriers (bool); default null

#### Get exporters for a specific commodity

Get a list of exports of a commodity - places where you can buy from - ordered 
by the lowest price you can buy it for. Returns best 100 matching results.

* https://api.ardent-industry.com/v1/commodity/name/{commodityName}/exports

e.g. https://api.ardent-industry.com/v1/commodity/name/gold/exports

##### Supported query parameters

 * minVolume (int); default 1
 * maxPrice (int); default null
 * fleetCarriers (bool); default null

### System information

#### Get information for a system 

Get information about a system.

* https://api.ardent-industry.com/v1/system/name/{systemName}

e.g. https://api.ardent-industry.com/v1/system/name/Sol

#### Get a list of nearby systems

Returns a list of up to 1000 of the nearest systems for any given known system.

* https://api.ardent-industry.com/v1/system/name/{systemName}/nearest

e.g. https://api.ardent-industry.com/v1/system/name/Sol/nearest

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

#### Get trade data for a specific commodity in a system

Get all buy/sell orders for a specific commodity in a system.

* https://api.ardent-industry.com/v1/system/name/{systemName}/commodity/name/{commodityName}

e.g. https://api.ardent-industry.com/v1/system/name/Sol/commodity/name/gold

#### Get a list of the nearest importers of a commodity

Get a list of nearby places that importing a commodity close to the specified 
system. Returns the first 1000 results, ordered by the highest price they are 
willing to pay.

* https://api.ardent-industry.com/v1/system/name/{systemName}/commodity/name/{commodityName}/nearest/imports

e.g. https://api.ardent-industry.com/v1/system/name/Sol/commodity/name/gold/nearest/imports

##### Supported query parameters

* minVolume (int); default 1
* minPrice (int); default 1
* fleetCarriers (bool); default null
* maxDistance (int); default 100, max 500

#### Get a list of the nearest exporters of a commodity

Get a list of nearby places that importing a commodity close to the specified 
system. Returns the first 1000 results, ordered by the lowest price you can buy
it for.

* https://api.ardent-industry.com/v1/system/name/{systemName}/commodity/name/{commodityName}/nearest/exports

e.g. https://api.ardent-industry.com/v1/system/name/Sol/commodity/name/gold/nearest/exports

##### Supported query parameters

* minVolume (int); default 1
* maxPrice (int); default null
* fleetCarriers (bool); default null
* maxDistance (int); default 100, max 500
