import { getSiweToken } from './helpers'

let fetchPatched = false

export function patchFetch() {
  if (!fetchPatched) {
    const token = getSiweToken()
    const originalFetch = window.fetch

    window.fetch = (url, options = {}) => {
      const headers = new Headers(options.headers || {})
      headers.set('Authorization', `Bearer ${token}`)
      return originalFetch(url, {
        ...options,
        headers,
      })
    }

    fetchPatched = true
  }
}
