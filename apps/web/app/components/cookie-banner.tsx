'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function CookieBanner() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Verifica se já aceitou ou rejeitou
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
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 pb-20 sm:pb-6 pointer-events-none flex justify-center">
            <div className="bg-white border border-neutral-200 p-6 rounded-2xl shadow-sm max-w-4xl w-full pointer-events-auto flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="flex-1">
                    <h3 className="text-neutral-900 font-bold text-lg mb-2">Valorizamos a tua privacidade</h3>
                    <p className="text-neutral-600 text-sm leading-relaxed">
                        Utilizamos cookies estritamente necessários para o funcionamento técnico do website, e cookies analíticos para melhorar a tua experiência de navegação.
                        Ao clicar em &quot;Aceitar Todos&quot;, concordas com a utilização de todos os cookies. Podes rever as tuas opções a qualquer momento.
                        Sabe mais na nossa <Link href="/cookies" className="text-violet-600 hover:underline font-medium">Política de Cookies</Link> e <Link href="/privacy" className="text-violet-600 hover:underline font-medium">Política de Privacidade</Link>.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
                    <Button
                        variant="outline"
                        onClick={rejectCookies}
                        className="w-full sm:w-auto bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                    >
                        Rejeitar Não Essenciais
                    </Button>
                    <Button
                        onClick={acceptCookies}
                        className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:opacity-95 text-white font-medium"
                    >
                        Aceitar Todos
                    </Button>
                </div>
            </div>
        </div>
    );
}
