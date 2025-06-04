let fetchPatched = false
export function patchFetch() {
  if (!fetchPatched) {
    const originalFetch = window.fetch

    window.fetch = (url, options = {}) => {
      return originalFetch(url, {
        ...options,
        credentials: url.toString().includes('user-op-reverse-proxy') ? 'include' : undefined,
      })
    }

    fetchPatched = true
  }
}
