'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, User, Mail, Loader as Loader2, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/');
        return;
      }

      setUser(session.user);
    } catch (error) {
      console.error('Error checking auth:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="stars-small" />
        <div className="stars-medium" />
        <div className="stars-large" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Dashboard
          </Link>
          <h1 className="text-4xl font-bold mb-2">Mi Perfil</h1>
          <p className="text-gray-400">Gestiona tu información personal</p>
        </div>

        <div className="grid gap-6">
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <User className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">Información de Cuenta</h2>
                <p className="text-gray-400">Tus datos de registro</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <div className="mt-2 flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-300">ID de Usuario</Label>
                <div className="mt-2">
                  <Input
                    value={user?.id || ''}
                    disabled
                    className="bg-white/5 border-white/10 text-white font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-300">Miembro desde</Label>
                <div className="mt-2">
                  <Input
                    value={user?.created_at ? new Date(user.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : ''}
                    disabled
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-8">
            <h3 className="text-xl font-semibold mb-4">Gestión de Sesión</h3>
            <p className="text-gray-400 mb-6">
              Puedes cerrar sesión cuando lo necesites. Tu información quedará guardada de forma segura.
            </p>
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="border-gray-600 hover:bg-white/10 hover:border-gray-500"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </Card>
        </div>
      </div>

      <style jsx>{`
        .stars-small {
          width: 1px;
          height: 1px;
          background: transparent;
          box-shadow: ${Array.from({ length: 200 }, () =>
            `${Math.random() * 2000}px ${Math.random() * 2000}px #FFF`
          ).join(',')};
          animation: animateStars 50s linear infinite;
        }

        .stars-medium {
          width: 2px;
          height: 2px;
          background: transparent;
          box-shadow: ${Array.from({ length: 100 }, () =>
            `${Math.random() * 2000}px ${Math.random() * 2000}px #FFF`
          ).join(',')};
          animation: animateStars 100s linear infinite;
        }

        .stars-large {
          width: 3px;
          height: 3px;
          background: transparent;
          box-shadow: ${Array.from({ length: 50 }, () =>
            `${Math.random() * 2000}px ${Math.random() * 2000}px #FFF`
          ).join(',')};
          animation: animateStars 150s linear infinite;
        }

        @keyframes animateStars {
          from { transform: translateY(0); }
          to { transform: translateY(-2000px); }
        }
      `}</style>
    </div>
  );
}
