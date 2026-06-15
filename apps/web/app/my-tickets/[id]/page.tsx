import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Legado — redireciona para a página canónica de bilhete com QR. */
export default async function LegacyMyTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/ticket/${id}`);
}
