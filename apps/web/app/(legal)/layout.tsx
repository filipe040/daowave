import { ReactNode } from "react";

export default function LegalLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-background text-foreground pt-24 pb-16">
            <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                <div className="prose prose-neutral max-w-none">
                    {children}
                </div>
            </div>
        </div>
    );
}
