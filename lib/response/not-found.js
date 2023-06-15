module.exports = (ctx, message = 'Not found') => {
  ctx.status = 404
  ctx.body = {
    error: 'Not Found',
    message
  }
  return null
}
