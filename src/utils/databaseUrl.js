export function withConnectionLimit(databaseUrl, connectionLimit = 20) {
  const url = new URL(databaseUrl);
  if (!url.searchParams.has('connectionLimit')) {
    url.searchParams.set('connectionLimit', String(connectionLimit));
  }
  return url.toString();
}