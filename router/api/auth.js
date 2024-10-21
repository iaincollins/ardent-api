const { randomBytes, createHash } = require('crypto')
const jsonWebToken = require('jsonwebtoken')

const {
  AUTH_JWT_SECRET,
  AUTH_CLIENT_ID,
  AUTH_CALLBACK_URL,
  AUTH_COOKIE_DOMAIN,
  AUTH_SIGNED_IN_URL,
  AUTH_SIGNED_OUT_URL,
  AUTH_ERROR_URL
} = require('../../lib/consts')

const ACCESS_TOKEN_EXPIRES_GRACE_SECONDS = 60 * 5 // How long before a token is due to expire do we treat it as expired
const MAX_JWT_AGE_SECONDS = 86400 * 25 // Fdev sessions valid for 25 days max
const COOKIE_DEFAULT_OPTIONS = { httpOnly: true, domain: AUTH_COOKIE_DOMAIN, signed: true }
const JWT_COOKIE_OPTIONS = { ...COOKIE_DEFAULT_OPTIONS, maxAge: MAX_JWT_AGE_SECONDS * 1000 }
const FRONTIER_API_BASE_URL = 'https://companion.orerve.net'

module.exports = (router) => {
  router.get('/api/auth/signin', async (ctx, next) => {
    const state = generateUrlSafeBase64ByteString()
    const { codeVerifier, codeChallenge } = generateCodeVerifierAndChallenge()

    // These are re-geneated for every sign in attempt to avoid possibility of
    // reuse of stale tokens after a failed / previous login attempt
    ctx.cookies.set('auth.state', state, COOKIE_DEFAULT_OPTIONS)
    ctx.cookies.set('auth.codeVerifier', codeVerifier, COOKIE_DEFAULT_OPTIONS)

    const url = `https://auth.frontierstore.net/auth?audience=frontier&scope=auth%20capi`
      + `&response_type=code`
      + `&client_id=${AUTH_CLIENT_ID}`
      + `&code_challenge=${codeChallenge}`
      + `&code_challenge_method=S256`
      + `&state=${state}`
      + `&redirect_uri=${AUTH_CALLBACK_URL}`

    ctx.redirect(url)
  })

  router.get('/api/auth/callback', async (ctx, next) => {
    const { code, state } = ctx.query
    const stateFromCookie = ctx.cookies.get('auth.state')
    const codeVerifier = ctx.cookies.get('auth.codeVerifier')

    try {
      if (stateFromCookie !== state) throw new Error('Callback state check failed')

      // Request tokens from fdev
      const response = await fetch('https://auth.frontierstore.net/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData({
          'client_id': AUTH_CLIENT_ID,
          'redirect_uri': AUTH_CALLBACK_URL,
          'grant_type': 'authorization_code',
          'code': code,
          'code_verifier': codeVerifier
        })
      })
      const responsePayload = await response.json()

      if (!responsePayload?.['token_type']
        || !responsePayload?.['access_token']
        || !responsePayload?.['expires_in']
        || !responsePayload?.['refresh_token']) {
        console.error('Frontier API returned unexpected response to Sign In request', responsePayload)
        throw new Error('Frontier API returned unexpected response to Sign In request')
      }

      // Create JWT to store tokens
      const jwt = createJwt({
        tokenType: responsePayload['token_type'],
        accessToken: responsePayload['access_token'],
        accessTokenExpires: new Date((secondsSinceEpoch() + responsePayload['expires_in']) * 1000).toISOString(),
        refreshToken: responsePayload['refresh_token']
      })

      ctx.cookies.set('auth.jwt', jwt, JWT_COOKIE_OPTIONS)

      ctx.redirect(AUTH_SIGNED_IN_URL)
    } catch (e) {
      ctx.redirect(`${AUTH_ERROR_URL}?error=${encodeURIComponent(e?.toString())}`)
    }
  })

  router.get('/api/auth/token', async (ctx, next) => {
    try {
      const jwtPayload = await verifyAndRefreshJwt(ctx)
      ctx.body = {
        accessToken: jwtPayload.accessToken,
        expires: jwtPayload.accessTokenExpires
      }
    } catch (e) {
      ctx.status = 400
      ctx.body = {
        error: 'Failed to get Frontier API Access Token',
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
    if (!csrfToken) {
      csrfToken = generateUrlSafeBase64ByteString()
      ctx.cookies.set('auth.csrfToken', csrfToken, COOKIE_DEFAULT_OPTIONS)
    }
    ctx.body = { csrfToken }
  })

  router.post('/api/auth/signout', async (ctx, next) => {
    const { csrfToken } = ctx.request.body
    try {
      const csrfTokenFromCookie = ctx.cookies.get('auth.csrfToken')
      if (csrfToken !== csrfTokenFromCookie) throw new Error('CSRF token validation failed')
      // Matching options (other than expiry) are required for cookies to be unset
      ctx.cookies.set('auth.jwt', null, COOKIE_DEFAULT_OPTIONS)
      ctx.cookies.set('auth.state', null, COOKIE_DEFAULT_OPTIONS)
      ctx.cookies.set('auth.codeVerifier', null, COOKIE_DEFAULT_OPTIONS)
      ctx.cookies.set('auth.csrfToken', null, COOKIE_DEFAULT_OPTIONS)
      ctx.redirect(AUTH_SIGNED_OUT_URL)
    } catch (e) {
      ctx.redirect(`${AUTH_ERROR_URL}?error=${encodeURIComponent(e?.toString())}`)
      return
    }
  })

  // The root endpoint lists all the other endpoints supported by Frontier's API
  router.get('/api/auth/cmdr', async (ctx, next) => {
    try {
      const jwtPayload = await verifyAndRefreshJwt(ctx)
      const response = await fetch(FRONTIER_API_BASE_URL, {
        headers: { 'Authorization': `${jwtPayload.tokenType} ${jwtPayload.accessToken}` },
      })
      ctx.body = await response.json()
    } catch (e) {
      ctx.status = 500
      ctx.body = {
        error: 'Frontier API request failed',
        message: e?.toString(),
      }
    }
  })

  // TODO May explicitly list supported endpoints allowed in future, but
  // for now will allow requests with any valid token to be passed
  router.get('/api/auth/cmdr/:endpoint', async (ctx, next) => {
    try {
      const jwtPayload = await verifyAndRefreshJwt(ctx)
      const { endpoint } = ctx.params
      const response = await fetch(`${FRONTIER_API_BASE_URL}/${endpoint}`, {
        headers: { 'Authorization': `${jwtPayload.tokenType} ${jwtPayload.accessToken}` },
      })
      if (endpoint === 'journal') {
        ctx.body = await response.text()
      } else if (endpoint === 'visitedstars') {
        ctx.body = await response.blob()
      } else {
        ctx.body = await response.json()
      }
    } catch (e) {
      ctx.status = 500
      ctx.body = {
        error: 'Frontier API request failed',
        message: e?.toString(),
      }
    }
  })

  router.get('/api/auth/cmdr/journal/:year/:month/:day', async (ctx, next) => {
    try {
      const jwtPayload = await verifyAndRefreshJwt(ctx)
      const { year, month, day } = ctx.params
      const response = await fetch(`${FRONTIER_API_BASE_URL}/journal/${year}/${month}/${day}`, {
        headers: { 'Authorization': `${jwtPayload.tokenType} ${jwtPayload.accessToken}` },
      })
      ctx.body = await response.text()
    } catch (e) {
      ctx.status = 500
      ctx.body = {
        error: 'Frontier API request failed',
        message: e?.toString(),
      }
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
    expiresIn: MAX_JWT_AGE_SECONDS
  })
}

function verifyJwt(jwt) {
  return jsonWebToken.verify(jwt, AUTH_JWT_SECRET)
}

async function verifyAndRefreshJwt(ctx) {
  const { forceRefresh = false } = ctx.query
  const jwt = ctx.cookies.get('auth.jwt')
  if (!jwt) throw new Error('No JWT found. Not signed in.')

  // Conditionally update token if the current access token has expired
  // (or will soon expire, before it is used).
  let jwtPayload = verifyJwt(jwt) // Call verify to check is valid and get payload
  if (forceRefresh === 'true' || (jwtPayload?.accessTokenExpires < new Date((secondsSinceEpoch() + ACCESS_TOKEN_EXPIRES_GRACE_SECONDS) * 1000).toISOString())) {
    const newJwt = await refreshJwt(jwtPayload) // Use Refresh Token to get new Access Token (will also be given a new Refresh Token)
    ctx.cookies.set('auth.jwt', newJwt, JWT_COOKIE_OPTIONS)
    jwtPayload = verifyJwt(newJwt) // Call verify again to get payload
  }

  return jwtPayload
}

async function refreshJwt(jwtPayload) {
  // Request new tokens from Frontier using a Refresh Token
  const response = await fetch('https://auth.frontierstore.net/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData({
      'client_id': AUTH_CLIENT_ID,
      'grant_type': 'refresh_token',
      'refresh_token': jwtPayload.refreshToken
    })
  })
  const responsePayload = await response.json()

  if (responsePayload?.error) {
    if (responsePayload?.error === 'invalid_token') {
      // The Access Token is valid for 4 hours, you can get a new one using a
      // Refresh Token. When the Refresh Token itself has expired the Frontier
      // API returns an invalid_token error.
      throw new Error('Frontier API Refresh Token has expired')
    } else {
      console.error('Error response returned by Frontier API while refreshing Access Token', responsePayload)
      throw new Error(`Error response returned by Frontier API while refreshing Access Token: ${responsePayload?.error}, ${responsePayload?.error_description}`)
    }
  } else if (!responsePayload['token_type']) {
    console.error('Unexpected response returned by Frontier API while refreshing Access Token', responsePayload)
    throw new Error('Unexpected response returned by Frontier API while refreshing Access Token')
  }

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