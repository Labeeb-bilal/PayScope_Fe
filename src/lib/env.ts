export function parseApiUrl(raw: string | undefined): string {
  const value = raw?.trim() ?? '';
  if (value === '') return '';

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`NEXT_PUBLIC_API_URL must be an absolute URL such as https://api.example.com (got "${value}")`);
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`NEXT_PUBLIC_API_URL must use http or https (got "${url.protocol}")`);
  }
  if (url.search || url.hash) {
    throw new Error('NEXT_PUBLIC_API_URL must not contain a query string or fragment');
  }
  return value.replace(/\/+$/, '');
}

export const env = {
  apiUrl: parseApiUrl(process.env.NEXT_PUBLIC_API_URL),
} as const;
