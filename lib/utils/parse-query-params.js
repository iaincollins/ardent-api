function paramAsBoolean (param) {
  if (param === true) return true
  if (param.trim().toLowerCase() === 'true') return true
  if (param === 1) return true
  if (param.trim() === '1') return true
  return false
}

module.exports = {
  paramAsBoolean
}
