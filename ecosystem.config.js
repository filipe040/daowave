module.exports = {
  apps: [
    {
      name: "daowave",
      cwd: "/var/www/daowave/daowave",
      script: "npm",
      args: "--workspace apps/web run start",
      env: {
        NODE_ENV: "production",
        DATABASE_URL: "mysql://Santos:Santos-2008@127.0.0.1:3306/ticketing",
        NEXTAUTH_URL: "https://tickets.daowave.pt",
        NEXT_PUBLIC_APP_URL: "https://tickets.daowave.pt",
        APP_URL: "https://tickets.daowave.pt"
      }
    }
  ]
}
