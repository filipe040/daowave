import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Redireciona para a página canónica do bilhete com QR. */
export default async function AccountTicketRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/ticket/${id}`);
}
