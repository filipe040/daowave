import { ReactNode } from "react";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="public-shell min-h-screen">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
        <article className="prose prose-invert prose-zinc max-w-none prose-headings:text-white prose-a:text-[#5ec8f8] prose-strong:text-white">
          {children}
        </article>
      </div>
    </div>
  );
}
