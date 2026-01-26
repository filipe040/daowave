/**
 * Email Verification Page
 * Shows verification status and allows resending
 */

'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      if (error === 'expired_token') {
        setStatus('expired');
        setMessage('O link de verificação expirou. Por favor, solicite um novo.');
      } else {
        setStatus('error');
        setMessage('Link de verificação inválido.');
      }
      return;
    }

    if (token) {
      verifyEmail(token);
    } else {
      setStatus('error');
      setMessage('Token de verificação não encontrado');
    }
  }, [token, searchParams]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const res = await fetch(`/api/auth/verify-email?token=${verificationToken}`, {
        redirect: 'manual', // Don't follow redirects automatically
      });
      
      // Check if response is a redirect
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location');
        if (location) {
          const url = new URL(location, window.location.origin);
          const error = url.searchParams.get('error');
          const verified = url.searchParams.get('verified');
          
          if (verified === 'true') {
            setStatus('success');
            setMessage('Email verificado com sucesso!');
            setTimeout(() => {
              router.push('/auth/signin?verified=true');
            }, 2000);
          } else if (error === 'expired_token') {
            setStatus('expired');
            setMessage('O link de verificação expirou. Por favor, solicite um novo.');
          } else if (error === 'invalid_token') {
            setStatus('error');
            setMessage('Link de verificação inválido. Verifique se copiou o link completo do email.');
          } else if (error === 'verification_failed') {
            setStatus('error');
            setMessage('Erro ao verificar email. Por favor, tente novamente ou contacte o suporte.');
          } else {
            setStatus('error');
            setMessage('Erro desconhecido ao verificar email.');
          }
        } else {
          setStatus('error');
          setMessage('Resposta inválida do servidor.');
        }
      } else if (res.ok) {
        setStatus('success');
        setMessage('Email verificado com sucesso!');
        setTimeout(() => {
          router.push('/auth/signin?verified=true');
        }, 2000);
      } else {
        setStatus('error');
        setMessage(`Erro ao verificar email (${res.status}). Tente novamente.`);
      }
    } catch (error: any) {
      console.error('Error verifying email:', error);
      setStatus('error');
      setMessage(`Erro ao verificar email: ${error.message || 'Erro desconhecido'}. Tente novamente.`);
    }
  };

  const handleResend = async () => {
    // TODO: Implement resend verification email
    setMessage('Funcionalidade de reenvio em breve...');
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-20">
      <div className="mx-auto max-w-md">
        <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl border border-zinc-700/50 p-8 md:p-10 lg:p-12 shadow-xl text-center">
          {status === 'loading' && (
            <>
              <div className="text-6xl mb-6">⏳</div>
              <h1 className="text-2xl md:text-3xl font-bold mb-4 text-zinc-300">
                A verificar email...
              </h1>
              <p className="text-zinc-400">Por favor, aguarde.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="text-6xl mb-6">✅</div>
              <h1 className="text-2xl md:text-3xl font-bold mb-4 text-green-400">
                Email verificado!
              </h1>
              <p className="text-zinc-300 mb-6">{message}</p>
              <p className="text-sm text-zinc-400">A redirecionar para o login...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="text-6xl mb-6">❌</div>
              <h1 className="text-2xl md:text-3xl font-bold mb-4 text-red-400">
                Erro na verificação
              </h1>
              <p className="text-zinc-300 mb-6">{message}</p>
              <Link
                href="/auth/signin"
                className="inline-block text-purple-400 hover:text-purple-300 font-semibold transition-colors"
              >
                Ir para login
              </Link>
            </>
          )}

          {status === 'expired' && (
            <>
              <div className="text-6xl mb-6">⏰</div>
              <h1 className="text-2xl md:text-3xl font-bold mb-4 text-yellow-400">
                Link expirado
              </h1>
              <p className="text-zinc-300 mb-6">{message}</p>
              <button
                onClick={handleResend}
                className="mb-4 w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-6 md:px-8 py-4 md:py-5 text-base md:text-lg font-bold text-white shadow-lg shadow-purple-500/30 transition-all hover:scale-105"
              >
                Reenviar email de verificação
              </button>
              <Link
                href="/auth/signin"
                className="inline-block text-purple-400 hover:text-purple-300 font-semibold transition-colors"
              >
                Ir para login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
