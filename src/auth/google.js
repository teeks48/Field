/**
 * Field — Google Workspace Authentication
 *
 * Full production path:
 *   1. User enters email on the login screen
 *   2. This module validates the domain and initiates Google OAuth
 *   3. Google Workspace authenticates the user
 *   4. On callback, Field retrieves: name, profile photo, email, domain
 *   5. _normaliseUser() shapes the payload into Field's user object
 *   6. The user object is passed to App state and flows to every screen
 *
 * To enable real Google OAuth:
 *   1. Create a project at console.cloud.google.com
 *   2. Enable the Google Identity API, create an OAuth 2.0 client ID
 *   3. Add VITE_GOOGLE_CLIENT_ID=your-client-id to .env
 *   4. Add to index.html: <script src="https://accounts.google.com/gsi/client" async></script>
 *   5. Set WORKSPACE_DOMAIN below to your actual domain
 *   6. The real flow activates automatically — no other changes needed
 *
 * Scopes:
 *   openid   — identity confirmation
 *   email    — user's email address
 *   profile  — name + profile photo URL
 */

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || null
const WORKSPACE_DOMAIN = 'capecreative.co'

/**
 * Primary entry point called by the Login screen.
 *
 * @param {string} email - The email the user typed. Used as login_hint in
 *   production (pre-fills Google's account picker) and to derive a realistic
 *   simulated user in prototype mode.
 *
 * @returns {Promise<User>}
 *
 * @typedef {Object} User
 * @property {string}      name     - Full display name  ("Taylor Bennett")
 * @property {string}      email    - Work email         ("taylor@capecreative.co")
 * @property {string|null} avatar   - Profile photo URL, or null
 * @property {string}      initials - Two-letter initials ("TB")
 * @property {string}      domain   - Workspace domain   ("capecreative.co")
 */
export async function signInWithGoogle(email = '') {
  if (GOOGLE_CLIENT_ID) {
    return _realGoogleSignIn(email)
  }
  return _simulateSignIn(email)
}

/* ── Production: real Google Identity Services flow ─────── */
async function _realGoogleSignIn(email) {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts) {
      reject(new Error(
        'Google Identity Services not loaded. ' +
        'Add <script src="https://accounts.google.com/gsi/client" async></script> to index.html.'
      ))
      return
    }

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id:  GOOGLE_CLIENT_ID,
      scope:      'openid email profile',
      hd:         WORKSPACE_DOMAIN,   // Restricts picker to Workspace accounts
      login_hint: email,               // Pre-fills account if already signed into Google
      callback:   async (tokenResponse) => {
        if (tokenResponse.error) {
          reject(new Error(tokenResponse.error_description || tokenResponse.error))
          return
        }
        try {
          const res  = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
          })
          if (!res.ok) throw new Error('Failed to retrieve user profile.')
          const info = await res.json()

          // Enforce domain server-side as well — never trust only the hd param
          const userDomain = info.email?.split('@')[1] || ''
          if (userDomain !== WORKSPACE_DOMAIN) {
            reject(new Error(
              `Access is restricted to @${WORKSPACE_DOMAIN} accounts. ` +
              `Sign in with your Field company account.`
            ))
            return
          }

          resolve(_normaliseUser(info))
        } catch (err) {
          reject(err)
        }
      },
    })

    client.requestAccessToken()
  })
}

/* ── Prototype: simulate the OAuth round-trip ───────────── */
async function _simulateSignIn(email) {
  // Simulate realistic network latency for the OAuth round-trip
  await new Promise(r => setTimeout(r, 1100))

  // Derive a plausible name from whatever the user typed, so the
  // dashboard greeting reflects actual input rather than a hardcoded name.
  // e.g. "taylor.bennett@capecreative.co" → "Taylor Bennett"
  //      "tk@capecreative.co"             → "Tk"  (falls back gracefully)
  const localPart   = (email.split('@')[0] || 'field.user').replace(/[._-]+/g, ' ')
  const derivedName = localPart
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
    .trim() || 'Field User'

  return _normaliseUser({
    name:    derivedName,
    email:   email || `user@${WORKSPACE_DOMAIN}`,
    picture: null,
    hd:      WORKSPACE_DOMAIN,
  })
}

/* ── Shape a Google userinfo payload → Field User object ── */
function _normaliseUser(info) {
  const parts = (info.name || '').trim().split(/\s+/).filter(Boolean)

  let initials
  if (parts.length >= 2) {
    initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  } else if (parts.length === 1) {
    // Single-word names: first letter + next consonant ("Teeks" → "Tk"),
    // matching the display rule in UserBadge.
    const w = parts[0]
    const nextConsonant = [...w.slice(1)].find(c => /[a-z]/i.test(c) && !'aeiou'.includes(c.toLowerCase()))
    initials = w[0].toUpperCase() + (nextConsonant || w[1] || '').toLowerCase()
  } else {
    initials = '?'
  }

  return {
    name:     info.name    || 'Field User',
    email:    info.email   || '',
    avatar:   info.picture || null,   // URL string from Google, or null
    initials,
    domain:   info.hd || (info.email?.split('@')[1]) || WORKSPACE_DOMAIN,
  }
}

/** Clear tokens on sign-out. Call this if you add a sign-out button. */
export function signOut() {
  if (window.google?.accounts?.oauth2?.revoke) {
    window.google.accounts.oauth2.revoke()
  }
}
