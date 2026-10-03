import type { MigrationConfig } from "drizzle-orm/migrator";


process.loadEnvFile()


function envOrThrow(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
}


export type APIConfig = { fileserverHits: number; port: number, platform: string, polkaUpgradeKey: string };
export type DBConfig = { url: string; migrationConfig: MigrationConfig };
export type JWTConfig = { secret: string };
export type Config = { api: APIConfig; db: DBConfig; jwt: JWTConfig };


export const config: Config = {
  api: { fileserverHits: 0, port: Number(envOrThrow("PORT")), platform: envOrThrow("PLATFORM"), polkaUpgradeKey: envOrThrow("POLKA_UPGRADE_KEY") },
  db: {
    url: envOrThrow("DB_URL"),
    migrationConfig: { migrationsFolder: "./src/db/migrations" },
  },
  jwt: { secret: envOrThrow("JWT_SECRET")}
};