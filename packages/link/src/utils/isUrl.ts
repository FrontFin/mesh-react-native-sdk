export const isValidUrl = (urlStr: string | null) => {
  if (typeof urlStr !== 'string' || !urlStr.length) {
    return false
  }

  return urlStr.startsWith('https://') || urlStr.startsWith('http://')
}
