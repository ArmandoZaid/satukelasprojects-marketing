import { readFileSync } from "node:fs";

/** @param {Record<string, string | undefined>} [env] */
export function isDatabaseConfigured(env = process.env) {
  return Boolean(env.DATABASE_URL?.trim() || env.PGHOST?.trim());
}

/** Shared by the lazy application pool and standalone deployment scripts.
 * @param {Record<string, string | undefined>} [env]
 */
export function databasePoolConfig(env = process.env) {
  if (!isDatabaseConfigured(env)) throw new Error("PostgreSQL is not configured. Set DATABASE_URL or PGHOST.");
  const bounds = { max: 10, connectionTimeoutMillis: 5000 };
  let url;
  if (env.DATABASE_URL?.trim()) {
    try {
      url = new URL(env.DATABASE_URL.trim());
      if (!["postgres:", "postgresql:"].includes(url.protocol)) throw new Error();
    } catch {
      throw new Error("Invalid DATABASE_URL.");
    }
  }
  const mode = url?.searchParams.get("sslmode") || env.PGSSLMODE || (url?.searchParams.get("ssl") === "true" ? "require" : "disable");
  if (!["disable", "require", "verify-ca", "verify-full"].includes(mode)) {
    throw new Error("Unsupported PostgreSQL SSL mode. Use disable, require, verify-ca or verify-full.");
  }
  const readCertificate = (/** @type {string | undefined | null} */ filename) => {
    if (!filename) return undefined;
    try { return readFileSync(filename, "utf8"); }
    catch { throw new Error("Unable to read PostgreSQL TLS certificate file."); }
  };
  /** @type {false | import('node:tls').ConnectionOptions} */
  const ssl = mode === "disable" ? false : { rejectUnauthorized: true };
  if (ssl) {
    const ca = readCertificate(url?.searchParams.get("sslrootcert") || env.PGSSLROOTCERT);
    const cert = readCertificate(url?.searchParams.get("sslcert") || env.PGSSLCERT);
    const key = readCertificate(url?.searchParams.get("sslkey") || env.PGSSLKEY);
    if (ca) ssl.ca = ca;
    if (cert) ssl.cert = cert;
    if (key) ssl.key = key;
  }
  if (url) {
    // pg's connection-string parser otherwise overrides the verified TLS options.
    for (const key of ["ssl", "sslmode", "sslrootcert", "sslcert", "sslkey", "uselibpqcompat"]) url.searchParams.delete(key);
    return { connectionString: url.toString(), ssl, ...bounds };
  }
  const port = env.PGPORT ? Number(env.PGPORT) : 5432;
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PGPORT must be an integer between 1 and 65535.");
  return {
    host: env.PGHOST?.trim(), port, database: env.PGDATABASE,
    user: env.PGUSER, password: env.PGPASSWORD, ssl, ...bounds,
  };
}
