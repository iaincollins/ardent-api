const axios = require('axios')

const UNKNOWN_VALUE = undefined

// Documentation: https://www.edsm.net/en_GB/api-v1
const baseUrl = 'https://www.edsm.net/'

class EDSM {
  static async getSystemStatus (systemId64) {
    const resSystem = await axios.get(`${baseUrl}api-v1/system?systemId64=${encodeURIComponent(systemId64)}&showInformation=1&showCoordinates=1&showId=1&showPermit=1`)
    if (!resSystem?.data?.name) return null
    return {
      systemAddress: systemId64,
      systemName: resSystem?.data?.name ?? UNKNOWN_VALUE,
      allegiance: resSystem?.data?.information?.allegiance ?? UNKNOWN_VALUE,
      government: resSystem?.data?.information?.government ?? UNKNOWN_VALUE,
      security: resSystem?.data?.information?.security ? resSystem.data.information.security : UNKNOWN_VALUE,
      state: resSystem?.data?.information?.factionState ?? UNKNOWN_VALUE,
      economy: {
        primary: resSystem?.data?.information?.economy ?? UNKNOWN_VALUE,
        secondary: resSystem?.data?.information?.secondEconomy ?? UNKNOWN_VALUE
      },
      population: resSystem?.data?.information?.population ?? UNKNOWN_VALUE,
      faction: resSystem?.data?.information?.faction ?? UNKNOWN_VALUE
    }
  }

  static async getSystemBodies (systemId64) {
    const res = await axios.get(`${baseUrl}api-system-v1/bodies?systemId64=${encodeURIComponent(systemId64)}`)
    if (!res?.data?.bodies) return null
    return res?.data?.bodies.map(body => {
      return {
        systemAddress: systemId64,
        id: body?.id ?? UNKNOWN_VALUE, // In game unique ID
        id64: body?.id64 ?? UNKNOWN_VALUE, // In game unique ID, 64-bit version
        bodyId: body?.bodyId ?? UNKNOWN_VALUE, // In game unique ID within system
        bodyName: body?.name ?? UNKNOWN_VALUE,
        bodyType: body?.type ?? UNKNOWN_VALUE,
        subType: body?.subType ?? UNKNOWN_VALUE,
        parents: body?.parents ?? UNKNOWN_VALUE,
        distanceToArrival: body?.distanceToArrival ?? UNKNOWN_VALUE,
        isMainStar: body?.isMainStar ?? UNKNOWN_VALUE,
        isScoopable: body?.isScoopable ?? UNKNOWN_VALUE,
        age: body?.age ?? UNKNOWN_VALUE,
        spectralClass: body?.spectralClass ?? UNKNOWN_VALUE,
        luminosity: body?.luminosity ?? UNKNOWN_VALUE,
        absoluteMagnitude: body?.absoluteMagnitude ?? UNKNOWN_VALUE,
        solarMasses: body?.solarMasses ?? UNKNOWN_VALUE,
        solarRadius: body?.solarRadius ?? UNKNOWN_VALUE,
        surfaceTemperature: body?.surfaceTemperature ?? UNKNOWN_VALUE,
        semiMajorAxis: body?.semiMajorAxis ?? UNKNOWN_VALUE,
        orbitalEccentricity: body?.orbitalEccentricity ?? UNKNOWN_VALUE,
        orbitalInclination: body?.orbitalInclination ?? UNKNOWN_VALUE,
        argOfPeriapsis: body?.argOfPeriapsis ?? UNKNOWN_VALUE,
        rotationalPeriod: body?.rotationalPeriod ?? UNKNOWN_VALUE,
        rotationalPeriodTidallyLocked: body?.rotationalPeriodTidallyLocked ?? UNKNOWN_VALUE,
        axialTilt: body?.axialTilt ?? UNKNOWN_VALUE,
        belts: body?.belts ?? UNKNOWN_VALUE,
        isLandable: body?.isLandable ?? UNKNOWN_VALUE,
        gravity: body?.gravity ?? UNKNOWN_VALUE,
        earthMasses: body?.earthMasses ?? UNKNOWN_VALUE,
        radius: body?.radius ?? UNKNOWN_VALUE,
        surfacePressure: body?.surfacePressure ?? UNKNOWN_VALUE,
        volcanismType: body?.volcanismType ?? UNKNOWN_VALUE,
        atmosphereType: body?.atmosphereType ?? UNKNOWN_VALUE,
        atmosphereComposition: body?.atmosphereComposition ?? UNKNOWN_VALUE,
        solidComposition: body?.solidComposition ?? UNKNOWN_VALUE,
        terraformingState: body?.terraformingState ?? UNKNOWN_VALUE,
        orbitalPeriod: body?.orbitalPeriod ?? UNKNOWN_VALUE,
        materials: body?.materials ?? UNKNOWN_VALUE,
        rings: body?.rings ?? UNKNOWN_VALUE,
        reserveLevel: body?.reserveLevel ?? UNKNOWN_VALUE
      }
    })
  }

  static async getSystemStations (systemId64) {
    const res = await axios.get(`${baseUrl}api-system-v1/stations?systemId64=${encodeURIComponent(systemId64)}`)
    return res?.data?.stations ?? null
  }
}

module.exports = EDSM
