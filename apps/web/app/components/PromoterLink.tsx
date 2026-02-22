"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

interface PromoterLinkProps {
    className?: string;
    children: React.ReactNode;
}

/**
 * Smart promoter link:
 * - Authenticated → /promotor (their dashboard)
 * - Not authenticated → /auth/signin?from=/promotor
 */
export default function PromoterLink({ className, children }: PromoterLinkProps) {
    const { data: session, status } = useSession();

    const href =
        status === "authenticated"
            ? "/promotor"
            : "/auth/signin?from=/promotor";

    return (
        <Link href={href} className={className}>
            {children}
        </Link>
    );
}
