'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, LogIn, UserPlus, LayoutDashboard, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export function Header() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    checkUser();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const redirectTo = typeof window !== 'undefined'
          ? `${window.location.origin}/dashboard`
          : 'https://astralevolution.com/dashboard';
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectTo },
        });
        if (error) throw error;
        alert('Te enviamos un email de confirmación. Revisá tu bandeja de entrada.');
        setIsAuthOpen(false);
        setEmail('');
        setPassword('');
        return;
      }
      setIsAuthOpen(false);
      setEmail('');
      setPassword('');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) { alert('Ingresá tu email primero.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) { alert(error.message); return; }
    setResetSent(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative">
                <Sparkles className="h-6 w-6 text-blue-400 group-hover:text-blue-300 transition-colors" />
                <div className="absolute inset-0 blur-lg bg-blue-400/20 group-hover:bg-blue-300/30 transition-all" />
              </div>
              <span className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Astral Evolution
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <Link
                href="/productos/lectura-esencial"
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Lectura Esencial
              </Link>
              <Link
                href="/productos/consulta-evolutiva"
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Consulta Evolutiva
              </Link>
              <Link
                href="/productos/especial-parejas"
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Especial Parejas
              </Link>
            </nav>

            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all inline-flex items-center gap-2"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Mis Informes
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors inline-flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Salir
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setIsLogin(true);
                    setIsAuthOpen(true);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all inline-flex items-center gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  Iniciar sesión
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
        <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              {isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {isLogin
                ? 'Ingresa tus credenciales para acceder a tu cuenta'
                : 'Crea una cuenta para guardar tus informes astrológicos'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="tu@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="••••••••"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              {loading ? 'Procesando...' : isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
            </Button>
            {resetSent && (
              <p className="text-sm text-green-400 text-center">
                Te enviamos un link para restablecer tu contraseña. Revisá tu email.
              </p>
            )}
            <div className="flex flex-col items-center gap-2">
              {isLogin && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              )}
              <button
                type="button"
                onClick={() => { setIsLogin(!isLogin); setResetSent(false); }}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
