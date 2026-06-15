/**
 * Dados legais da empresa — configurar via variáveis de ambiente.
 */
export function getCompanyInfo() {
  const name = process.env.COMPANY_NAME || "LivePass";
  const nif = process.env.COMPANY_NIF || "";
  const address = process.env.COMPANY_ADDRESS || "";
  const email =
    process.env.SUPPORT_EMAIL ||
    process.env.EMAIL_REPLY_TO ||
    "suporte@livepass.pt";
  const website =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "https://livepass.pt";

  return { name, nif, address, email, website };
}

export function getAppBaseUrl(): string {
  return (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}
