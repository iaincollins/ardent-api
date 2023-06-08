function paramAsBoolean (param) {
  if (!param) return null
  if (param.trim().toLowerCase() === 'true') return true
  if (param.trim() === '1') return true
  if (param.trim().toLowerCase() === 'false') return false
  if (param.trim() === '0') return false
  return null
}

function paramAsInt (param) {
  return paramAsBoolean(param) === true ? 1 : 0
}

module.exports = {
  paramAsBoolean,
  paramAsInt
}
