// Get ISO timestamp in future or past, by number of days
// e.g. -30 for 30 days ago, or 1 for tomorrow
function getISOTimestamp (numberOfDays) {
  if (numberOfDays > 0) {
    return new Date(new Date().setDate(new Date().getDate() + numberOfDays)).toISOString()
  } else {
    return new Date(new Date().setDate(new Date().getDate() - Math.abs(numberOfDays))).toISOString()
  }
}

function timeBetweenTimestamps (minTimestamp, maxTimestamp) {
  const d1 = new Date(minTimestamp)
  const d2 = new Date(maxTimestamp)
  const diffInSeconds = (d2 - d1) / 1000
  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds`
  } else if (diffInSeconds < 60 * 60) {
    return `${Math.floor(diffInSeconds / 60)} minutes`
  } else if (diffInSeconds < 60 * 60 * 24) {
    return `${Math.floor(diffInSeconds / (60 * 60))} hours`
  } else {
    return `${Math.floor(diffInSeconds / (60 * 60 * 24))} days`
  }
}

module.exports = {
  getISOTimestamp,
  timeBetweenTimestamps
}
