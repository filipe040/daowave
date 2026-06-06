"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AlertTriangle } from "lucide-react";

function CustomerInfoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const orderId = searchParams.get("order");
  const eventId = searchParams.get("eventId");

  const [formData, setFormData] = useState({
    buyerName: "",
    buyerEmail: session?.user?.email || "",
    buyerPhone: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) {
      router.push(`/auth/signin?from=${encodeURIComponent(window.location.href)}`);
      return;
    }

    if (!orderId || !eventId) {
      router.push("/events");
      return;
    }
  }, [session, orderId, eventId, router]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.buyerName.trim()) {
      newErrors.buyerName = "Nome é obrigatório";
    }

    if (!formData.buyerEmail.trim()) {
      newErrors.buyerEmail = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.buyerEmail)) {
      newErrors.buyerEmail = "Email inválido";
    }

    if (!formData.buyerPhone.trim()) {
      newErrors.buyerPhone = "Número de telemóvel é obrigatório";
    } else if (!/^(\+351|00351|351)?[9][0-9]{8}$/.test(formData.buyerPhone.replace(/\s/g, ""))) {
      // Portuguese mobile format: 9XXXXXXXX or +351 9XXXXXXXX
      newErrors.buyerPhone = "Número de telemóvel inválido (formato: 9XXXXXXXX ou +351 9XXXXXXXX)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      // Update order with buyer information
      const res = await fetch(`/api/checkout/${orderId}/customer-info`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        setErrors({ submit: error.error || "Erro ao guardar informações" });
        setLoading(false);
        return;
      }

      // Check if it's a mock payment
      const paymentIntent = searchParams.get("payment_intent");
      if (paymentIntent?.includes("_mock_")) {
        router.push(`/checkout/mock?order=${orderId}`);
      } else {
        router.push(`/checkout?payment_intent=${paymentIntent}&order=${orderId}`);
      }
    } catch (error) {
      console.error("Error:", error);
      setErrors({ submit: "Erro ao processar. Tente novamente." });
      setLoading(false);
    }
  };

  if (!orderId || !eventId) {
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-0 animate-fade-in">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900">Informação de Compra</h1>
        <p className="text-base text-neutral-500">Preencha os seus dados para continuar para o pagamento</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-md shadow-md space-y-6">
        {errors.submit && (
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-600">
            {errors.submit}
          </div>
        )}

        <div>
          <label className="public-label normal-case tracking-normal mb-2">
            Nome completo <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={formData.buyerName}
            onChange={(e) => handleChange("buyerName", e.target.value)}
            className="public-input sm:py-3.5 text-[14px] sm:text-[15px]"
            placeholder="O teu nome"
            required
          />
          {errors.buyerName && (
            <p className="text-red-600 text-xs sm:text-sm mt-1.5 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 shrink-0" /> {errors.buyerName}
            </p>
          )}
        </div>

        <div>
          <label className="public-label normal-case tracking-normal mb-2">
            Email <span className="text-red-600">*</span>
          </label>
          <input
            type="email"
            value={formData.buyerEmail}
            onChange={(e) => handleChange("buyerEmail", e.target.value)}
            className="public-input sm:py-3.5 text-[14px] sm:text-[15px]"
            placeholder="exemplo@email.com"
            required
          />
          {errors.buyerEmail && (
            <p className="text-red-600 text-xs sm:text-sm mt-1.5 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 shrink-0" /> {errors.buyerEmail}
            </p>
          )}
        </div>

        <div>
          <label className="public-label normal-case tracking-normal mb-2">
            Telemóvel (Portugal) <span className="text-red-600">*</span>
          </label>
          <input
            type="tel"
            value={formData.buyerPhone}
            onChange={(e) => handleChange("buyerPhone", e.target.value)}
            className="public-input sm:py-3.5 text-[14px] sm:text-[15px]"
            placeholder="912 345 678"
            required
          />
          {errors.buyerPhone && (
            <p className="text-red-600 text-xs sm:text-sm mt-1.5 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 shrink-0" /> {errors.buyerPhone}
            </p>
          )}
          <p className="text-neutral-500 text-[12px] mt-1.5 pl-1.5">
            Formato exigido: 9XXXXXXXX ou +351 9XXXXXXXX
          </p>
        </div>

        <div className="pt-4 border-t border-neutral-200">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-violet-600 px-6 py-4 sm:py-4 mt-2 text-[15px] font-bold text-neutral-900 shadow-md transition-all hover:bg-violet-700 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                A processar…
              </span>
            ) : (
              "Continuar para Pagamento"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function CustomerInfoPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-2xl px-4 sm:px-0 animate-fade-in mt-12 text-center">
        <h1 className="text-3xl font-bold text-neutral-900">Informação de Compra</h1>
        <p className="mt-2 text-sm text-neutral-500">A carregar segurança...</p>
      </div>
    }>
      <CustomerInfoContent />
    </Suspense>
  );
}