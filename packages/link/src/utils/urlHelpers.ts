export const urlSearchParams = (url?: string) => {
  if (!url) return {}

  const regex = /[?&]([^=#]+)=([^&#]*)/g
  const params: Record<string, string> = {}
  let match

  while ((match = regex.exec(url))) {
    params[match[1]] = match[2]
  }

  return params
}
