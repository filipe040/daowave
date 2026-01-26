"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

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
        <h1 className="text-3xl sm:text-4xl font-bold">Informações do Comprador</h1>
        <p className="text-base text-zinc-400">Preencha os seus dados para continuar com o pagamento</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8 backdrop-blur-sm shadow-2xl shadow-black/50 space-y-6">
        {errors.submit && (
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-400">
            {errors.submit}
          </div>
        )}

        <div>
          <label className="block text-sm sm:text-base font-semibold mb-2 text-zinc-200">
            Nome Completo <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={formData.buyerName}
            onChange={(e) => handleChange("buyerName", e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all hover:border-zinc-600"
            placeholder="João Silva"
            required
          />
          {errors.buyerName && (
            <p className="text-red-400 text-xs sm:text-sm mt-1.5 flex items-center gap-1">
              <span>⚠</span> {errors.buyerName}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm sm:text-base font-semibold mb-2 text-zinc-200">
            Email <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            value={formData.buyerEmail}
            onChange={(e) => handleChange("buyerEmail", e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all hover:border-zinc-600"
            placeholder="joao@exemplo.pt"
            required
          />
          {errors.buyerEmail && (
            <p className="text-red-400 text-xs sm:text-sm mt-1.5 flex items-center gap-1">
              <span>⚠</span> {errors.buyerEmail}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm sm:text-base font-semibold mb-2 text-zinc-200">
            Número de Telemóvel <span className="text-red-400">*</span>
          </label>
          <input
            type="tel"
            value={formData.buyerPhone}
            onChange={(e) => handleChange("buyerPhone", e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all hover:border-zinc-600"
            placeholder="912 345 678 ou +351 912 345 678"
            required
          />
          {errors.buyerPhone && (
            <p className="text-red-400 text-xs sm:text-sm mt-1.5 flex items-center gap-1">
              <span>⚠</span> {errors.buyerPhone}
            </p>
          )}
          <p className="text-zinc-500 text-xs mt-1.5">
            Formato: 9XXXXXXXX ou +351 9XXXXXXXX
          </p>
        </div>

        <div className="pt-4 border-t border-zinc-800">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-blue-500/50 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 active:scale-95"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                A processar...
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
      <div className="mx-auto max-w-2xl px-4 sm:px-0 animate-fade-in">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold">Informações do Comprador</h1>
          <p className="text-base text-zinc-400">A carregar...</p>
        </div>
      </div>
    }>
      <CustomerInfoContent />
    </Suspense>
  );
}