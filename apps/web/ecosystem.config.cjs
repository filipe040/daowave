/** PM2 — carrega .env e evita redirects para localhost em produção */
const fs = require("fs");
const path = require("path");

const webDir = __dirname;
const envPath = path.join(webDir, ".env");
const envFromFile = {};

if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    envFromFile[key] = val;
  }
}

const productionUrl =
  envFromFile.APP_URL ||
  envFromFile.NEXTAUTH_URL ||
  "https://daowave.pt";

module.exports = {
  apps: [
    {
      name: "daowave",
      cwd: webDir,
      script: path.join(webDir, "../../node_modules/.bin/next"),
      args: "start -p 3000 -H 127.0.0.1",
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      env: {
        NODE_ENV: "production",
        ...envFromFile,
        NEXTAUTH_URL: productionUrl,
        APP_URL: productionUrl,
        NEXT_PUBLIC_APP_URL: productionUrl,
        AUTH_TRUST_HOST: "true",
      },
    },
  ],
};
