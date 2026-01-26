"use client";

export function BetaBanner() {
  // Show banner automatically in staging, or if explicitly enabled
  const isStaging = process.env.NEXT_PUBLIC_NODE_ENV === "staging";
  const showBetaBanner = 
    isStaging || 
    process.env.NEXT_PUBLIC_SHOW_BETA_BANNER === "true";

  if (!showBetaBanner) {
    return null;
  }

  return (
    <div className="bg-yellow-500 text-black px-4 py-2 text-center text-sm font-medium sticky top-0 z-50">
      <span className="font-bold">BETA:</span> Esta é uma versão de teste. Algumas funcionalidades podem estar incompletas.
      {isStaging && (
        <span className="ml-2 text-xs">(Ambiente de Staging)</span>
      )}
    </div>
  );
}

