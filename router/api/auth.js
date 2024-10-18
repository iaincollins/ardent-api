const { randomBytes, createHash } = require('crypto')
const jsonWebToken = require('jsonwebtoken')

const {
  AUTH_JWT_SECRET,
  AUTH_CLIENT_ID,
  AUTH_CALLBACK_URL,
  AUTH_COOKIE_DOMAIN,
  AUTH_SUCCESS_URL,
  AUTH_ERROR_URL,
  AUTH_SIGNOUT_URL
} = require('../../lib/consts')

const ACCESS_TOKEN_EXPIRES_GRACE_SECONDS = 60 * 5 // How many seconds before a token is due to expire do we treat it as expired

module.exports = (router) => {
  router.get('/api/auth/signin', async (ctx, next) => {
    const { codeVerifier, codeChallenge } = generateCodeVerifierAndChallenge()
    const state = generateUrlSafeBase64ByteString()

    // These are saved on client and read back from the client during callback,
    // this avoids having to track state server side.
    ctx.cookies.set('auth.state', state, { httpOnly: true, domain: AUTH_COOKIE_DOMAIN, signed: true })
    ctx.cookies.set('auth.codeVerifier', codeVerifier, { httpOnly: true, domain: AUTH_COOKIE_DOMAIN, signed: true })

    const url = `https://auth.frontierstore.net/auth?audience=frontier&scope=auth%20capi`
      + `&response_type=code`
      + `&client_id=${encodeURIComponent(AUTH_CLIENT_ID)}`
      + `&code_challenge=${encodeURIComponent(codeChallenge)}`
      + `&code_challenge_method=S256`
      + `&state=${encodeURIComponent(state)}`
      + `&redirect_uri=${encodeURIComponent(AUTH_CALLBACK_URL)}`

    ctx.redirect(url)
  })

  router.get('/api/auth/callback', async (ctx, next) => {
    const { code, state } = ctx.query
    const stateFromCookie = ctx.cookies.get('auth.state')
    const codeVerifier = ctx.cookies.get('auth.codeVerifier')

    try {
      if (stateFromCookie !== state) throw new Error('State mismatch')

      // Request tokens from fdev
      const response = await fetch('https://auth.frontierstore.net/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: formData({
          'client_id': AUTH_CLIENT_ID,
          'redirect_uri': AUTH_CALLBACK_URL,
          'grant_type': 'authorization_code',
          'code': code,
          'code_verifier': codeVerifier
        })
      })
      const responsePayload = await response.json()

      // Create JWT to store tokens
      const jwt = createJwt({
        tokenType: responsePayload['token_type'],
        accessToken: responsePayload['access_token'],
        accessTokenExpires: new Date((secondsSinceEpoch() + responsePayload['expires_in']) * 1000).toISOString(),
        refreshToken: responsePayload['refresh_token']
      })

      ctx.cookies.set('auth.jwt', jwt, { httpOnly: true, domain: AUTH_COOKIE_DOMAIN, maxAge: 1000 * (86400 * 25), signed: true })

      ctx.redirect(AUTH_SUCCESS_URL)
    } catch (e) {
      ctx.redirect(`${AUTH_ERROR_URL}?error=${encodeURIComponent(e?.toString())}`)
    }
  })

  router.get('/api/auth/token', async (ctx, next) => {
    try {
      const jwt = ctx.cookies.get('auth.jwt')
      if (!jwt) throw new Error('No JWT found')
      let jwtPayload = verifyJwt(jwt)

      // If Access Token has expired (or is about to...) then get a new one
      // and save it back to the existing JWT before returning a response
      if (jwtPayload?.accessTokenExpires < new Date((secondsSinceEpoch() - ACCESS_TOKEN_EXPIRES_GRACE_SECONDS) * 1000).toISOString()) {
        const newJwt = await refreshJwt(jwt)
        ctx.cookies.set('auth.jwt', newJwt, { httpOnly: true, domain: AUTH_COOKIE_DOMAIN, maxAge: 1000 * (86400 * 25), signed: true })
        jwtPayload = verifyJwt(newJwt)
      }

      ctx.body = {
        accessToken: jwtPayload.accessToken,
        expires: jwtPayload.accessTokenExpires
      }
    } catch (e) {
      ctx.status = 400
      ctx.body = {
        error: 'Failed to get token',
        message: e?.toString(),
      }
    }
  })

  // This is a really simple CSRF implementation, but this is very low stakes as
  // both the Ardent REST API and the Frontier REST API are read only and the
  // JWT is stored in an HTTP only cookie; this is only intended as simple
  // protection against being forceably signed out.
  router.get('/api/auth/csrftoken', async (ctx, next) => {
    let csrfToken = ctx.cookies.get('auth.csrfToken')
    if (csrfToken) {
      csrfToken = generateUrlSafeBase64ByteString()
      ctx.cookies.set('auth.csrfToken', csrfToken, { httpOnly: true, domain: AUTH_COOKIE_DOMAIN, signed: true })
    }
    ctx.body = { csrfToken }
  })

  router.post('/api/auth/signout', async (ctx, next) => {
    const { csrfToken } = ctx.query
    try {
      const csrfTokenFromCookie = ctx.cookies.get('auth.csrfToken')
      if (csrfToken !== csrfTokenFromCookie) throw new Error('CSRF token validation failed')
      ctx.cookies.set('auth.jwt', '')
      ctx.redirect(AUTH_SIGNOUT_URL)
    } catch (e) {
      ctx.redirect(`${AUTH_ERROR_URL}?error=${encodeURIComponent(e?.toString())}`)
      return
    }
  })
}

/*** Functions ***/

function generateCodeVerifierAndChallenge() {
  const codeVerifier = generateUrlSafeBase64ByteString()
  const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return {
    codeVerifier,
    codeChallenge
  }
}

function generateUrlSafeBase64ByteString(numberOfBytes = 32) {
  return randomBytes(numberOfBytes).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function secondsSinceEpoch() { return Math.floor(Date.now() / 1000) }

function formData(obj) { return Object.entries(obj).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&') }

function createJwt(payload) {
  return jsonWebToken.sign(payload, AUTH_JWT_SECRET, {
    expiresIn: '25 days' // fdev sessions only valid for 25 days from sign in
  })
}

function verifyJwt(jwt) {
  return jsonWebToken.verify(jwt, AUTH_JWT_SECRET)
}

async function refreshJwt(jwt) {
  const jwtPayload = verifyJwt(jwt)

  // Request new tokens from fdev, using refresh token
  const response = await fetch('https://auth.frontierstore.net/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: formData({
      'client_id': AUTH_CLIENT_ID,
      'redirect_uri': AUTH_CALLBACK_URL,
      'grant_type': 'refresh_token',
      'refresh_token': jwtPayload.refreshToken
    })
  })
  const responsePayload = await response.json()

  // Preserve any data in the old token (except properties below)
  const oldJwtPayload = { ...jwtPayload }
  delete oldJwtPayload.iat
  delete oldJwtPayload.exp

  // Create new JWT with updated tokens
  const newJwt = createJwt({
    ...oldJwtPayload,
    tokenType: responsePayload['token_type'],
    accessToken: responsePayload['access_token'],
    accessTokenExpires: new Date((secondsSinceEpoch() + responsePayload['expires_in']) * 1000).toISOString(),
    refreshToken: responsePayload['refresh_token']
  })

  return newJwt
}