'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, User, Trash2, Star, CreditCard as Edit2, Save, X } from 'lucide-react';
import Link from 'next/link';

interface BirthProfile {
  id: string;
  name: string;
  nickname: string;
  birth_date: string;
  birth_time: string;
  birth_city: string;
  birth_country: string;
  is_primary: boolean;
}

export default function ProfilesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<BirthProfile[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    birth_date: '',
    birth_time: '',
    birth_city: '',
    birth_country: '',
    is_primary: false,
  });

  useEffect(() => {
    checkAuthAndLoadProfiles();
  }, []);

  const checkAuthAndLoadProfiles = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/');
        return;
      }

      await loadProfiles();
    } catch (error) {
      console.error('Error checking auth:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const loadProfiles = async () => {
    const { data, error } = await supabase
      .from('birth_profiles')
      .select('*')
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading profiles:', error);
      return;
    }

    setProfiles(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    if (editingId) {
      const { error } = await supabase
        .from('birth_profiles')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingId);

      if (error) {
        console.error('Error updating profile:', error);
        alert('Error al actualizar el perfil');
        return;
      }
    } else {
      const { error } = await supabase
        .from('birth_profiles')
        .insert({
          ...formData,
          user_id: session.user.id,
        });

      if (error) {
        console.error('Error creating profile:', error);
        alert('Error al crear el perfil');
        return;
      }
    }

    setFormData({
      name: '',
      nickname: '',
      birth_date: '',
      birth_time: '',
      birth_city: '',
      birth_country: '',
      is_primary: false,
    });
    setIsAdding(false);
    setEditingId(null);
    await loadProfiles();
  };

  const handleEdit = (profile: BirthProfile) => {
    setFormData({
      name: profile.name,
      nickname: profile.nickname || '',
      birth_date: profile.birth_date,
      birth_time: profile.birth_time,
      birth_city: profile.birth_city,
      birth_country: profile.birth_country,
      is_primary: profile.is_primary,
    });
    setEditingId(profile.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este perfil?')) return;

    const { error } = await supabase
      .from('birth_profiles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting profile:', error);
      alert('Error al eliminar el perfil');
      return;
    }

    await loadProfiles();
  };

  const handleSetPrimary = async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await supabase
      .from('birth_profiles')
      .update({ is_primary: false })
      .eq('user_id', session.user.id);

    await supabase
      .from('birth_profiles')
      .update({ is_primary: true })
      .eq('id', id);

    await loadProfiles();
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      name: '',
      nickname: '',
      birth_date: '',
      birth_time: '',
      birth_city: '',
      birth_country: '',
      is_primary: false,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-12">
      <div className="max-w-5xl mx-auto px-6">
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Mis Informes
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Mis Perfiles</h1>
              <p className="text-gray-400">Guarda perfiles para autocompletar formularios fácilmente</p>
            </div>
            {!isAdding && (
              <Button
                onClick={() => setIsAdding(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Perfil
              </Button>
            )}
          </div>
        </div>

        {isAdding && (
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">
                {editingId ? 'Editar Perfil' : 'Nuevo Perfil'}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name" className="text-white">Nombre Completo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    placeholder="Ej: Juan Pérez"
                  />
                </div>

                <div>
                  <Label htmlFor="nickname" className="text-white">Apodo (opcional)</Label>
                  <Input
                    id="nickname"
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    placeholder="Ej: Yo, Mi hijo, Pareja"
                  />
                </div>

                <div>
                  <Label htmlFor="birth_date" className="text-white">Fecha de Nacimiento *</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  />
                </div>

                <div>
                  <Label htmlFor="birth_time" className="text-white">Hora de Nacimiento *</Label>
                  <Input
                    id="birth_time"
                    type="time"
                    value={formData.birth_time}
                    onChange={(e) => setFormData({ ...formData, birth_time: e.target.value })}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  />
                </div>

                <div>
                  <Label htmlFor="birth_city" className="text-white">Ciudad de Nacimiento *</Label>
                  <Input
                    id="birth_city"
                    value={formData.birth_city}
                    onChange={(e) => setFormData({ ...formData, birth_city: e.target.value })}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    placeholder="Ej: Buenos Aires"
                  />
                </div>

                <div>
                  <Label htmlFor="birth_country" className="text-white">País de Nacimiento *</Label>
                  <Input
                    id="birth_country"
                    value={formData.birth_country}
                    onChange={(e) => setFormData({ ...formData, birth_country: e.target.value })}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    placeholder="Ej: Argentina"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_primary"
                  checked={formData.is_primary}
                  onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_primary" className="cursor-pointer text-white">
                  Usar como perfil principal (autocompletar por defecto)
                </Label>
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="bg-gradient-to-r from-blue-500 to-purple-600">
                  <Save className="w-4 h-4 mr-2" />
                  {editingId ? 'Guardar Cambios' : 'Crear Perfil'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancelar
                </Button>
              </div>
            </form>
          </Card>
        )}

        <div className="grid gap-4">
          {profiles.length === 0 ? (
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-12 text-center">
              <User className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <p className="text-gray-400 text-lg">No tienes perfiles guardados</p>
              <p className="text-gray-500 mt-2">Crea un perfil para autocompletar formularios rápidamente</p>
            </Card>
          ) : (
            profiles.map((profile) => (
              <Card key={profile.id} className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">{profile.name}</h3>
                        {profile.nickname && (
                          <p className="text-sm text-gray-400">({profile.nickname})</p>
                        )}
                      </div>
                      {profile.is_primary && (
                        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm text-yellow-400">Principal</span>
                        </div>
                      )}
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-400">
                      <div>
                        <span className="font-medium">Nacimiento:</span> {profile.birth_date}
                      </div>
                      <div>
                        <span className="font-medium">Hora:</span> {profile.birth_time}
                      </div>
                      <div>
                        <span className="font-medium">Lugar:</span> {profile.birth_city}, {profile.birth_country}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    {!profile.is_primary && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetPrimary(profile.id)}
                        title="Marcar como principal"
                      >
                        <Star className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(profile)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(profile.id)}
                      className="hover:bg-red-500/10 hover:border-red-500/30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
