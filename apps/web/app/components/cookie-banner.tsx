'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function CookieBanner() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const cookieConsent = localStorage.getItem('cookieConsent');
        if (!cookieConsent) {
            setIsVisible(true);
        }
    }, []);

    if (!isVisible) return null;

    const acceptCookies = () => {
        localStorage.setItem('cookieConsent', 'accepted');
        setIsVisible(false);
    };

    const rejectCookies = () => {
        localStorage.setItem('cookieConsent', 'rejected');
        setIsVisible(false);
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-6 pb-20 sm:pb-6 pointer-events-none flex justify-center">
            <div className="border border-white/10 bg-[#14141f]/95 backdrop-blur-md p-4 sm:p-6 rounded-2xl shadow-2xl max-w-4xl w-full pointer-events-auto flex flex-col md:flex-row items-start md:items-center gap-4 sm:gap-6">
                <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-base sm:text-lg mb-1.5">Privacidade e cookies</h3>
                    <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                        Utilizamos cookies necessários e analíticos para melhorar a experiência.
                        Consulta a{' '}
                        <Link href="/cookies" className="text-[#5ec8f8] hover:underline font-medium">
                            Política de Cookies
                        </Link>{' '}
                        e{' '}
                        <Link href="/privacy" className="text-[#5ec8f8] hover:underline font-medium">
                            Privacidade
                        </Link>
                        .
                    </p>
                </div>
                <div className="flex flex-col xs:flex-row gap-2 w-full md:w-auto shrink-0">
                    <Button
                        variant="outline"
                        onClick={rejectCookies}
                        className="w-full sm:w-auto border-white/15 bg-transparent text-zinc-300 hover:bg-white/5 hover:text-white"
                    >
                        Rejeitar
                    </Button>
                    <Button
                        onClick={acceptCookies}
                        className="w-full sm:w-auto bg-[#00a0e3] hover:bg-[#0090cc] text-white font-semibold"
                    >
                        Aceitar
                    </Button>
                </div>
            </div>
        </div>
    );
}
