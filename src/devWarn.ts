const warned = new Set<string>()

/** Dev-only, once per message. The `process.env.NODE_ENV` expression is replaced by bundlers, so this is stripped in production. */
export const warnOnce = (message: string) => {
  let isDev = false
  try {
    isDev = process.env.NODE_ENV !== 'production'
  } catch {
    // `process` is not defined in an unbundled browser module.
  }
  if (!isDev || warned.has(message)) return
  warned.add(message)
  console.warn(`[iran-map-react] ${message}`)
}
